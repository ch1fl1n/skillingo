// File: supabase/functions/achievements-awarder/index.ts
// Stub: Awards achievements based on XP thresholds & skill milestones.
// TODO: Extend with dynamic rules + caching.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const BodySchema = z.object({ user_id: z.string().uuid() });

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const THRESHOLDS = [100, 500, 1000]; // XP milestones

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  try {
    const json = await req.json();
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) return new Response(JSON.stringify({ error: 'invalid payload' }), { status: 400 });

    const { user_id } = parsed.data;
    const { data: user, error: userErr } = await supabaseAdmin
      .from('users')
      .select('total_xp')
      .eq('id', user_id)
      .single();
    if (userErr) throw userErr;

    const xp = user?.total_xp || 0;

    // Fetch existing achievement codes for user
    const { data: existing, error: achErr } = await supabaseAdmin
      .from('user_achievements')
      .select('achievements(code)')
      .eq('user_id', user_id);
    if (achErr) throw achErr;
    const codes = new Set((existing || []).map(r => r.achievements?.code));

    const toAward: string[] = [];
    for (const t of THRESHOLDS) {
      const code = `xp_${t}`;
      if (xp >= t && !codes.has(code)) toAward.push(code);
    }

    for (const code of toAward) {
      const { data: ach } = await supabaseAdmin
        .from('achievements')
        .select('id')
        .eq('code', code)
        .maybeSingle();
      if (ach?.id) {
        await supabaseAdmin.from('user_achievements').insert({
          user_id,
          achievement_id: ach.id,
          achieved_at: new Date().toISOString(),
        });
      }
    }

    return new Response(JSON.stringify({ awarded: toAward }), { status: 200 });
  } catch (e) {
    console.error('achievements-awarder error', e);
    return new Response(JSON.stringify({ error: 'internal error' }), { status: 500 });
  }
}
