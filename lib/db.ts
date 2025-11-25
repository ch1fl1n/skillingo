import { supabase } from '@/lib/supabase'
import type { Tables, TablesInsert } from '@/types/database.types'
import type { 
  Skill, 
  Lesson, 
  LessonWithCompletion, 
  SkillWithProgress, 
  Difficulty,
  LessonContent // <--- AGREGADO: Necesario para el casting
} from '@/types/lesson.types'
import { getPublicUrlForPath } from '@/lib/storage';

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
  try {
    const userId = await requireAuthUserId()
    console.log('Creating post for user:', userId)

    const payload: TablesInsert<'community_posts'> = {
      title: input.title,
      content: input.content,
      category: input.category ?? null,
      user_id: userId,
      status: 'approved',
      approved_at: new Date().toISOString(),
    }

    console.log('Insert payload:', payload)

    const { data, error } = await supabase
      .from('community_posts')
      .insert(payload)
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      throw new Error(`Database error: ${error.message}`)
    }
    
    console.log('Post created successfully:', data)
    return data;
  } catch (err) {
    console.error('Error in createCommunityPost:', err)
    throw err
  }
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
  return data || [];
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

export async function getCommunityPostById(postId: number) {
  const { data, error } = await supabase
    .from('community_posts')
    .select('*')
    .eq('id', postId)
    .single()

  if (error) throw error
  return data
}

export async function getMyPostRating(postId: number) {
  try {
    const userId = await requireAuthUserId()
    const { data, error } = await supabase
      .from('post_ratings')
      .select('rating')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle()

    if (error) throw error
    return data?.rating || null
  } catch {
    return null
  }
}

export async function listPendingPosts(params?: {
  limit?: number
  offset?: number
}) {
  const { limit = 20, offset = 0 } = params || {}
  const { data, error } = await supabase
    .from('community_posts')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) throw error
  return data || []
}

// -----------------------------
// Skills
// -----------------------------
export async function getSkills(): Promise<SkillWithProgress[]> {
  const userId = await requireAuthUserId()
  
  const { data: skills, error } = await supabase
    .from('skills')
    .select('id, name, description')
    .order('id', { ascending: true })
  
  if (error) throw error
  
  // Fetch user progress for all skills
  const { data: progressData } = await supabase
    .from('user_progress')
    .select('skill_id, progress_percent')
    .eq('user_id', userId)
  
  const progressMap = new Map(
    progressData?.map(p => [p.skill_id, p.progress_percent]) || []
  )
  
  return skills.map(skill => ({
    ...skill,
    progress_percent: progressMap.get(skill.id) || 0
  }))
}

export async function getSkillById(skillId: number): Promise<Skill> {
  const { data, error } = await supabase
    .from('skills')
    .select('id, name, description')
    .eq('id', skillId)
    .single()
  
  if (error) throw error
  return data
}

// -----------------------------
// Lessons & Progress
// -----------------------------
export async function getLessonsBySkillId(skillId: number): Promise<LessonWithCompletion[]> {
  const userId = await requireAuthUserId()
  
  const { data: lessons, error } = await supabase
    .from('lessons')
    .select('id, skill_id, title, difficulty, xp_reward, content, created_at')
    .eq('skill_id', skillId)
    .order('id', { ascending: true })
  
  if (error) throw error
  
  // Fetch user's completed lessons
  const { data: attempts } = await supabase
    .from('lesson_attempts')
    .select('lesson_id, completed, score')
    .eq('user_id', userId)
    .eq('completed', true)
  
  const attemptsMap = new Map(
    attempts?.map(a => [a.lesson_id, { completed: a.completed, score: a.score }]) || []
  )
  
  return lessons
    .filter(lesson => lesson.skill_id !== null)
    .map(lesson => ({
      ...lesson,
      skill_id: lesson.skill_id as number, 
      difficulty: (lesson.difficulty as Difficulty) || 'easy', 
      xp_reward: lesson.xp_reward ?? 0,
      completed: attemptsMap.get(lesson.id)?.completed || false,
      user_score: attemptsMap.get(lesson.id)?.score || null,
      // CORRECCION 1: Casteamos el Json genérico al tipo específico LessonContent
      content: lesson.content as unknown as LessonContent 
    }))
}

export async function getLessonById(lessonId: number): Promise<Lesson> {
  const { data, error } = await supabase
    .from('lessons')
    .select('id, skill_id, title, difficulty, xp_reward, content, created_at')
    .eq('id', lessonId)
    .single()
  
  if (error) throw error

  // CORRECCION 2: Reconstruimos el objeto casteando content
  return {
    ...data,
    skill_id: data.skill_id as number,
    difficulty: (data.difficulty as Difficulty) || 'easy',
    xp_reward: data.xp_reward ?? 0,
    content: data.content as unknown as LessonContent
  };
}

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

export async function awardXP(xpAmount: number): Promise<number> {
  return await addUserXp(xpAmount) || 0
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
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = (sessionData as { session?: { user?: { id: string } } })?.session?.user?.id ?? null;
  if (!userId) return null;

  const { data, error } = await supabase
    .from('users')
    .select('id, username, avatar_url, avatar_path, level, total_xp, email')
    .eq('id', userId)
    .single();

  if (error) {
    console.warn('getCurrentUserProfile supabase error', error);
    return null;
  }

  const row = data;
  if (!row) return null;

  // resolver avatar: prefer avatar_url, sino convertir avatar_path a public url si bucket público
  let avatar = row.avatar_url ?? null;
  if (!avatar && row.avatar_path) {
    avatar = getPublicUrlForPath('Profile_image', row.avatar_path);
  }

  return {
    id: row.id,
    username: row.username,
    email: row.email,
    level: row.level,
    total_xp: row.total_xp,
    avatar_url: avatar,
    avatar_path: row.avatar_path,
  };
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

// 🎓 CATEGORY-BASED UTILITIES
export async function getSkillsByCategory(category: string) {
  const { data, error } = await supabase
    .from('skills')
    .select('id, name, description, category')
    .eq('category', category)
    .order('name', { ascending: true })
  
  if (error) throw error
  return data
}

/**
 * 💯 Obtener estadísticas de progreso por categoría específica
 */
export async function getCategoryStats(userId: string, category: string) {
  const { data: categorySkills, error: skillsError } = await supabase
    .from('skills')
    .select('id')
    .eq('category', category)
  
  if (skillsError) throw skillsError
  
  const skillIds = categorySkills?.map(s => s.id) || []
  const totalSkills = skillIds.length
  
  if (totalSkills === 0) {
    return {
      category,
      total_skills: 0,
      completed_skills: 0,
      average_progress: 0,
      category_mastered: false,
    }
  }
  
  const { data: userProgress, error: progressError } = await supabase
    .from('user_progress')
    .select('progress_percent')
    .eq('user_id', userId)
    .in('skill_id', skillIds)
  
  if (progressError && !progressError.message.includes('No rows')) throw progressError
  
  const progressList = userProgress?.map(p => p.progress_percent) || []
  const completedCount = progressList.filter(p => (p ?? 0) >= 100).length
  const avgProgress = progressList.length > 0
    ? Math.round((progressList?.reduce((a, b) => (a ?? 0) + (b ?? 0), 0) || 0) / (progressList?.length || 1))
    : 0
  
  return {
    category,
    total_skills: totalSkills,
    completed_skills: completedCount,
    average_progress: avgProgress,
    category_mastered: completedCount === totalSkills && totalSkills > 0,
  }
}

/**
 * 🌟 Obtener progreso en TODAS las categorías de una vez
 */
export async function getAllCategoryStats(userId: string) {
  const categories = ['Skills', 'Character', 'Meta-Learning']
  const stats = []
  
  for (const category of categories) {
    const categoryStat = await getCategoryStats(userId, category)
    stats.push(categoryStat)
  }
  
  return stats
}

/**
 * 🎯 Sugerir próxima habilidad a aprender basada en categoría débil
 */
export async function suggestNextSkillByCategory(userId: string) {
  const allStats = await getAllCategoryStats(userId)
  
  const weakestCategory = allStats.reduce((prev, current) =>
    prev.average_progress < current.average_progress ? prev : current
  )
  
  if (weakestCategory.average_progress >= 100) {
    return { suggestion: 'Todas las categorías dominadas!', category: null }
  }
  
  const { data: incompleteLessons, error } = await supabase
    .from('skills')
    .select('id, name')
    .eq('category', weakestCategory.category)
    .order('name', { ascending: true })
    .limit(1)
  
  if (error) throw error
  
  return {
    suggestion: `Enfócate en ${weakestCategory.category}`,
    category: weakestCategory.category,
    recommended_skill: incompleteLessons?.[0] || null,
  }
}

/**
 * 📊 Obtener resumen educativo: ¿Cuál es la fortaleza del estudiante?
 */
export async function getStudentStrength(userId: string) {
  const allStats = await getAllCategoryStats(userId)
  
  const strongest = allStats.reduce((prev, current) =>
    prev.average_progress > current.average_progress ? prev : current
  )
  
  return {
    strength_category: strongest.category,
    mastery_level: strongest.average_progress,
    is_mastered: strongest.category_mastered,
    strength_summary: `${strongest.category}: ${strongest.completed_skills}/${strongest.total_skills} completadas`,
  }
}

// -----------------------------
// Post Likes
// -----------------------------

export async function likePost(postId: number) {
  const userId = await requireAuthUserId()
  
  const { data, error } = await supabase
    .from('post_likes')
    .insert({ post_id: postId, user_id: userId })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function unlikePost(postId: number) {
  const userId = await requireAuthUserId()
  
  const { error } = await supabase
    .from('post_likes')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', userId)

  if (error) throw error
}

export async function getPostLikes(postId: number) {
  const { data, error } = await supabase
    .from('post_likes')
    .select('id, user_id, created_at')
    .eq('post_id', postId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function isPostLikedByMe(postId: number) {
  try {
    const userId = await requireAuthUserId()
    const { data, error } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle()

    if (error) throw error
    return !!data
  } catch {
    return false
  }
}

// -----------------------------
// Post Comments
// -----------------------------

export async function createComment(input: {
  postId: number
  content: string
  parentCommentId?: number | null
}) {
  const userId = await requireAuthUserId()
  
  const payload: TablesInsert<'post_comments'> = {
    post_id: input.postId,
    user_id: userId,
    content: input.content,
    parent_comment_id: input.parentCommentId ?? null,
  }

  const { data, error } = await supabase
    .from('post_comments')
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getPostComments(postId: number) {
  const { data, error } = await supabase
    .from('post_comments')
    .select('*')
    .eq('post_id', postId)
    .is('parent_comment_id', null)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching comments:', error)
    throw error
  }
  
  if (!data) return []
  
  // Fetch user info separately for each comment
  const commentsWithUsers = await Promise.all(
    data.map(async (comment) => {
      const { data: userData } = await supabase
        .from('users')
        .select('username, avatar_url, level')
        .eq('id', comment.user_id)
        .single()
      
      return {
        ...comment,
        users: userData || null
      }
    })
  )
  
  return commentsWithUsers
}

export async function getCommentReplies(parentCommentId: number) {
  const { data, error } = await supabase
    .from('post_comments')
    .select('*')
    .eq('parent_comment_id', parentCommentId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching comment replies:', error)
    throw error
  }
  
  if (!data) return []
  
  // Fetch user info separately for each comment
  const repliesWithUsers = await Promise.all(
    data.map(async (comment) => {
      const { data: userData } = await supabase
        .from('users')
        .select('username, avatar_url, level')
        .eq('id', comment.user_id)
        .single()
      
      return {
        ...comment,
        users: userData || null
      }
    })
  )
  
  return repliesWithUsers
}

export async function updateComment(commentId: number, content: string) {
  const userId = await requireAuthUserId()
  
  const { data, error } = await supabase
    .from('post_comments')
    .update({ content })
    .eq('id', commentId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteComment(commentId: number) {
  const userId = await requireAuthUserId()
  
  const { error } = await supabase
    .from('post_comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', userId)

  if (error) throw error
}

// -----------------------------
// Comment Likes
// -----------------------------

export async function likeComment(commentId: number) {
  const userId = await requireAuthUserId()
  
  const { data, error } = await supabase
    .from('comment_likes')
    .insert({ comment_id: commentId, user_id: userId })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function unlikeComment(commentId: number) {
  const userId = await requireAuthUserId()
  
  const { error } = await supabase
    .from('comment_likes')
    .delete()
    .eq('comment_id', commentId)
    .eq('user_id', userId)

  if (error) throw error
}

export async function getCommentLikesCount(commentId: number) {
  const { count, error } = await supabase
    .from('comment_likes')
    .select('*', { count: 'exact', head: true })
    .eq('comment_id', commentId)

  if (error) throw error
  return count || 0
}

export async function isCommentLikedByMe(commentId: number) {
  try {
    const userId = await requireAuthUserId()
    const { data, error } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .maybeSingle()

    if (error) throw error
    return !!data
  } catch {
    return false
  }
}