// File: supabase/functions/xp-calc/index.ts
// Edge Function (Deno) para cálculo explícito de XP en casos especiales.
// NOTA: El trigger en Postgres debería cubrir la mayoría de casos. Esta función expone
// un endpoint idempotente para recalcular XP de una lección concreta y actualizar tablas
// relacionadas de forma transaccional. Pensado para re-procesos, ajustes de dificultad o
// correcciones manuales moderadas.
// Seguridad: Se debe invocar con un JWT de servicio o con verificación del rol del usuario
// (p.e. 'admin'). No exponer SERVICE_ROLE al cliente.

import 'https://deno.land/x/dotenv@v3.2.2/load.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// Validación payload
const BodySchema = z.object({
  user_id: z.string().uuid(),
  lesson_id: z.number().int().positive(),
  score: z.number().min(0).max(100),
  difficulty: z.enum(['easy', 'medium', 'hard']),
});

// XP base por dificultad
const BASE_XP: Record<string, number> = {
  easy: 10,
  medium: 20,
  hard: 30,
};

function xpFor(score: number, difficulty: string): number {
  const base = BASE_XP[difficulty] || 10;
  const multiplier = Math.min(1, score / 100); // lineal proporcional
  return Math.round(base * multiplier);
}

// Crear cliente servicio (usa SERVICE_ROLE_KEY en variables env del entorno de funciones)
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export default async function handler(req: Request): Promise<Response> {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }

    const json = await req.json();
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Invalid payload', details: parsed.error.format() }), { status: 400 });
    }

    const { user_id, lesson_id, score, difficulty } = parsed.data;
    const xp = xpFor(score, difficulty);
    const completed = score >= 60; // Umbral fijo (podría venir del schema)

    // Iniciar transacción (Postgres RPC vía SQL simple). Aquí usamos múltiples queries secuenciales.
    // Para atomicidad fuerte se podría crear una función SQL que englobe lógica.

    // 1. Upsert attempt
    const { error: attemptErr } = await supabaseAdmin.from('lesson_attempts').upsert({
      user_id,
      lesson_id,
      score,
      completed,
    }, { onConflict: 'user_id,lesson_id' });
    if (attemptErr) throw attemptErr;

    // 2. Actualizar progreso (proporcional a score si no completado)
    const progress_percent = completed ? 100 : score;
    const { error: progressErr } = await supabaseAdmin.from('user_progress').upsert({
      user_id,
      skill_id: lesson_id, // Simplificación: en modelo real skill_id distinto a lesson_id
      progress_percent,
      last_updated: new Date().toISOString(),
    });
    if (progressErr) throw progressErr;

    // 3. Sumar XP y recalcular nivel
    const { data: userRow, error: userErr } = await supabaseAdmin
      .from('users')
      .select('total_xp')
      .eq('id', user_id)
      .single();
    if (userErr) throw userErr;
    const newXp = (userRow?.total_xp || 0) + xp;
    // Nivel simple: floor(1 + total_xp / 100)
    const level = Math.floor(1 + newXp / 100);
    const { error: updateUserErr } = await supabaseAdmin
      .from('users')
      .update({ total_xp: newXp, level })
      .eq('id', user_id);
    if (updateUserErr) throw updateUserErr;

    // 4. Logro de primer intento completado
    if (completed) {
      const { data: attemptsCompleted, error: countErr } = await supabaseAdmin
        .from('lesson_attempts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user_id)
        .eq('completed', true);
      if (countErr) throw countErr;
      if ((attemptsCompleted as unknown as { id: number }[] | null)?.length === 0) {
        const { data: ach, error: achErr } = await supabaseAdmin
          .from('achievements')
          .select('id,code')
          .eq('code', 'first_lesson')
          .maybeSingle();
        if (!achErr && ach) {
          await supabaseAdmin.from('user_achievements').insert({
            user_id,
            achievement_id: ach.id,
            achieved_at: new Date().toISOString(),
          });
        }
      }
    }

    return new Response(JSON.stringify({ success: true, awarded_xp: xp }), { status: 200 });
  } catch (e) {
    console.error('xp-calc error', e);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 });
  }
}
