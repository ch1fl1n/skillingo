import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.0.0';
import { z } from 'https://esm.sh/zod@3.22.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Validación de entrada
const PerfEventSchema = z.object({
  id: z.string(),
  name: z.string().max(100),
  duration: z.number().positive().max(60000), // Max 60s
  startTime: z.number(),
  metadata: z.record(z.any()),
  timestamp: z.number(),
  userAgent: z.string().optional(),
  userId: z.string().uuid().optional(),
});

const RequestSchema = z.object({
  events: z.array(PerfEventSchema).max(100), // Max 100 eventos por request
});

interface PerfEvent {
  id: string;
  name: string;
  duration: number;
  startTime: number;
  metadata: Record<string, unknown>;
  timestamp: number;
  userAgent?: string;
  userId?: string;
}

/**
 * Edge Function para escribir eventos de performance.
 * Rate-limited, validado, y escrito con RLS del usuario.
 */
serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('OK', {
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  }

  // Solo POST
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // Obtener token del header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response('Unauthorized', { status: 401 });
    }

    const token = authHeader.substring(7);

    // Crear cliente con token del usuario
    const userSupabase = createClient(supabaseUrl, token);

    // Verificar sesión
    const {
      data: { user },
      error: userError,
    } = await userSupabase.auth.getUser();

    if (userError || !user) {
      return new Response('Invalid token', { status: 401 });
    }

    // Parsear y validar body
    const body = await req.json();
    const validated = RequestSchema.parse(body);

    // Rate limiting simple: máx 1000 eventos por día por usuario
    const today = new Date().toISOString().split('T')[0];
    const { count } = await supabase
      .from('perf_events')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .gte('created_at', `${today}T00:00:00Z`)
      .lte('created_at', `${today}T23:59:59Z`);

    if ((count || 0) + validated.events.length > 1000) {
      return new Response('Rate limit exceeded', { status: 429 });
    }

    // Transformar y insertar eventos
    const eventsToInsert = validated.events.map((evt: PerfEvent) => ({
      user_id: user.id,
      event_name: evt.name,
      duration_ms: evt.duration,
      metadata: evt.metadata,
      device_info: {
        userAgent: evt.userAgent,
        timestamp: evt.timestamp,
      },
    }));

    const { error: insertError } = await supabase
      .from('perf_events')
      .insert(eventsToInsert);

    if (insertError) {
      console.error('[perf-write] Insert error:', insertError);
      return new Response('Failed to store events', { status: 500 });
    }

    console.log(
      `[perf-write] Stored ${validated.events.length} events for user ${user.id}`
    );

    return new Response(JSON.stringify({ success: true, stored: validated.events.length }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    console.error('[perf-write] Error:', err);

    if (err instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: err.errors }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response('Internal error', { status: 500 });
  }
});
