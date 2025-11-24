// File: supabase/functions/moderation-check/index.ts
// Stub: Moderation Edge Function (profane/spam heuristic + rate limit)
// TODO: Implement real dictionary + external service integration.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const BodySchema = z.object({
  post_id: z.number().int().positive(),
  user_id: z.string().uuid(),
  content: z.string().min(1).max(5000),
});

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Very naive profanity list placeholder
const BAD_WORDS = ['spamword', 'ofensa'];

function containsBadWord(content: string): boolean {
  const lower = content.toLowerCase();
  return BAD_WORDS.some(w => lower.includes(w));
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  try {
    const body = await req.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'invalid payload', details: parsed.error.flatten() }), { status: 400 });
    }

    const { post_id, user_id, content } = parsed.data;

    // Basic rate limit (in-memory). NOTE: Not stable across deployments; use Deno KV or external.
    // TODO: Replace with KV bucket algorithm.

    const flagged = containsBadWord(content) ? 'rejected' : 'approved';

    // Update post status + optional moderation_queue insert
    const { error: updateErr } = await supabaseAdmin
      .from('community_posts')
      .update({ status: flagged })
      .eq('id', post_id)
      .eq('user_id', user_id);
    if (updateErr) throw updateErr;

    return new Response(JSON.stringify({ status: flagged }), { status: 200 });
  } catch (e) {
    console.error('moderation-check error', e);
    return new Response(JSON.stringify({ error: 'internal error' }), { status: 500 });
  }
}
