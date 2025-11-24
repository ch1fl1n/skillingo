import { z } from 'zod';
import { supabase, currentUserId } from '@/lib/supabase';

// Schemas for validation
export const createPostSchema = z.object({
  title: z.string().min(3).max(120),
  content: z.string().min(10).max(5000),
  category: z.string().optional(),
});

export async function createCommunityPost(input: z.infer<typeof createPostSchema>) {
  const parsed = createPostSchema.parse(input);
  const uid = await currentUserId();
  if (!uid) throw new Error('No autenticado');
  const { error } = await supabase.from('community_posts').insert({
    user_id: uid,
    title: parsed.title,
    content: parsed.content,
    category: parsed.category,
    status: 'pending',
  });
  if (error) throw error;
}

export async function listApprovedPosts(limit = 20, from = 0) {
  const { data, error } = await supabase
    .from('community_posts')
    .select('id,title,content,created_at,user_id')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1);
  if (error) throw error;
  return data;
}

export const ratePostSchema = z.object({ postId: z.number().int(), rating: z.number().int().min(1).max(5) });
export async function ratePost(input: z.infer<typeof ratePostSchema>) {
  const { postId, rating } = ratePostSchema.parse(input);
  const uid = await currentUserId();
  if (!uid) throw new Error('No autenticado');
  // Upsert rating (one per user/post)
  const { error } = await supabase.from('post_ratings').upsert({
    post_id: postId,
    user_id: uid,
    rating,
  }, { onConflict: 'post_id,user_id' });
  if (error) throw error;
}

export async function averageRating(postId: number): Promise<number> {
  const { data, error } = await supabase
    .from('post_ratings')
    .select('rating')
    .eq('post_id', postId);
  if (error) throw error;
  if (!data || data.length === 0) return 0;
  return data.reduce((acc, r) => acc + (r.rating || 0), 0) / data.length;
}

// Moderator actions (client side gate; server must enforce via RLS / RPC)
export async function approvePost(postId: number) {
  await changePostStatus(postId, 'approved');
}
export async function rejectPost(postId: number) {
  await changePostStatus(postId, 'rejected');
}

async function changePostStatus(postId: number, status: 'approved' | 'rejected') {
  const uid = await currentUserId();
  if (!uid) throw new Error('No autenticado');
  // Check role
  const { data: user, error: uErr } = await supabase.from('users').select('role').eq('id', uid).single();
  if (uErr) throw uErr;
  if (!user || !['moderator', 'admin'].includes(user.role)) throw new Error('Permisos insuficientes');
  const { error } = await supabase.from('community_posts').update({ status, approved_at: new Date().toISOString() }).eq('id', postId).eq('status', 'pending');
  if (error) throw error;
}
