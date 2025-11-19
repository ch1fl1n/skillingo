import { supabase } from '@/lib/supabase'
import type { Tables, TablesInsert } from '@/types/database.types'

// Utility: get current authenticated user id
async function requireAuthUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) {
    throw new Error('Not authenticated')
  }
  return data.user.id
}

// -----------------------------
// Community Posts
// -----------------------------
export async function createCommunityPost(input: {
  title: string
  content: string
  category?: string | null
}) {
  const userId = await requireAuthUserId()

  const payload: TablesInsert<'community_posts'> = {
    title: input.title,
    content: input.content,
    category: input.category ?? null,
    user_id: userId,
    status: 'pending',
  }

  const { data, error } = await supabase
    .from('community_posts')
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function listCommunityPosts(params?: {
  category?: string
  limit?: number
  offset?: number
}) {
  const { category, limit = 20, offset = 0 } = params || {}
  let q = supabase
    .from('community_posts')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (category) q = q.eq('category', category)

  const { data, error } = await q
  if (error) throw error
  return data
}

export async function moderatePost(postId: number, action: 'approve' | 'reject') {
  // RLS requires current user to be moderator/admin to update
  const updates: Partial<Tables<'community_posts'>> =
    action === 'approve'
      ? { status: 'approved', approved_at: new Date().toISOString() }
      : { status: 'rejected', approved_at: null }

  const { data, error } = await supabase
    .from('community_posts')
    .update(updates)
    .eq('id', postId)
    .select()
    .single()

  if (error) throw error

  // Optionally, record the moderation action
  const moderatorId = await requireAuthUserId()
  await supabase.from('moderation_queue').insert({
    post_id: postId,
    moderator_id: moderatorId,
    status: updates.status as string,
    reviewed_at: new Date().toISOString(),
  })

  return data
}

export async function ratePost(postId: number, rating: number) {
  const userId = await requireAuthUserId()
  const payload: TablesInsert<'post_ratings'> = {
    post_id: postId,
    user_id: userId,
    rating,
  }

  const { data, error } = await supabase
    .from('post_ratings')
    .upsert(payload, { onConflict: 'post_id,user_id' })
    .select()
    .single()

  if (error) throw error
  return data
}

// -----------------------------
// Lessons & Progress
// -----------------------------
export async function trackLessonAttempt(input: {
  lesson_id: number
  score?: number | null
  completed?: boolean
}) {
  const userId = await requireAuthUserId()
  const payload: TablesInsert<'lesson_attempts'> = {
    user_id: userId,
    lesson_id: input.lesson_id,
    score: input.score ?? null,
    completed: input.completed ?? false,
  }

  const { data, error } = await supabase
    .from('lesson_attempts')
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function upsertUserProgress(input: {
  skill_id: number
  progress_percent: number
}) {
  const userId = await requireAuthUserId()
  const payload: TablesInsert<'user_progress'> = {
    user_id: userId,
    skill_id: input.skill_id,
    progress_percent: input.progress_percent,
    last_updated: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('user_progress')
    .upsert(payload, { onConflict: 'user_id,skill_id' })
    .select()
    .single()

  if (error) throw error
  return data
}

// -----------------------------
// Achievements & XP
// -----------------------------
async function addUserXp(xpDelta: number) {
  if (!xpDelta) return null
  const userId = await requireAuthUserId()
  // Fetch current total
  const { data: user, error: userErr } = await supabase
    .from('users')
    .select('total_xp')
    .eq('id', userId)
    .single()
  if (userErr) throw userErr
  const total_xp = (user?.total_xp || 0) + xpDelta
  const { error: updErr } = await supabase
    .from('users')
    .update({ total_xp })
    .eq('id', userId)
  if (updErr) throw updErr
  return total_xp
}

export async function awardAchievementByCode(code: string) {
  const userId = await requireAuthUserId()
  const { data: achievement, error: aErr } = await supabase
    .from('achievements')
    .select('id, xp_reward')
    .eq('code', code)
    .single()
  if (aErr) throw aErr

  // Insert if not exists
  const insertPayload: TablesInsert<'user_achievements'> = {
    user_id: userId,
    achievement_id: achievement.id,
    achieved_at: new Date().toISOString(),
  }
  const { error: uaErr } = await supabase
    .from('user_achievements')
    .insert(insertPayload)
  if (uaErr && !uaErr.message.includes('duplicate key')) throw uaErr

  // Add XP
  await addUserXp(achievement.xp_reward || 0)

  return { ok: true }
}

export async function getUserAchievements() {
  const userId = await requireAuthUserId()
  const { data, error } = await supabase
    .from('user_achievements')
    .select('id, achieved_at, achievements(id, code, name, description, xp_reward)')
    .eq('user_id', userId)
    .order('achieved_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getUserProgress() {
  const userId = await requireAuthUserId()
  const { data, error } = await supabase
    .from('user_progress')
    .select('id, skill_id, progress_percent, last_updated, skills(name)')
    .eq('user_id', userId)
    .order('last_updated', { ascending: false })
  if (error) throw error
  return data
}

export async function getCurrentUserProfile() {
  const userId = await requireAuthUserId()
  const { data, error } = await supabase
    .from('users')
    .select('id, username, email, avatar_url, level, total_xp, role, created_at')
    .eq('id', userId)
    .single()
  
  if (error) {
    console.error('Error fetching user profile:', error)
    throw new Error(`Failed to fetch profile: ${error.message}`)
  }
  
  return data
}

/**
 * Calculate user's current learning streak in days
 * Counts consecutive days with at least one lesson attempt
 */
export async function getUserStreak(): Promise<number> {
  const userId = await requireAuthUserId()
  
  const { data, error } = await supabase
    .from('lesson_attempts')
    .select('attempted_at')
    .eq('user_id', userId)
    .order('attempted_at', { ascending: false })
    .limit(100) // Look at last 100 attempts
  
  if (error) throw error
  if (!data || data.length === 0) return 0

  // Convert to dates and remove time component
  const attemptDates = data.map(attempt => {
    const date = new Date(attempt.attempted_at || '')
    date.setHours(0, 0, 0, 0)
    return date.getTime()
  })

  // Remove duplicates and sort descending
  const uniqueDates = Array.from(new Set(attemptDates)).sort((a, b) => b - a)
  
  if (uniqueDates.length === 0) return 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayTime = today.getTime()

  // Check if most recent attempt was today or yesterday
  const mostRecentDate = uniqueDates[0]
  const oneDayMs = 24 * 60 * 60 * 1000
  
  if (mostRecentDate < todayTime - oneDayMs) {
    // Most recent attempt was more than 1 day ago, streak is broken
    return 0
  }

  // Count consecutive days
  let streak = 0
  let expectedDate = todayTime

  for (const attemptDate of uniqueDates) {
    if (attemptDate === expectedDate || attemptDate === expectedDate - oneDayMs) {
      streak++
      expectedDate = attemptDate - oneDayMs
    } else {
      break
    }
  }

  return streak
}
