import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.0.0';

/**
 * ============================================================================
 * Edge Function: refresh-materialized-views
 * ============================================================================
 * Scheduled: Runs every 1 hour (via Supabase Cron)
 * Purpose: Refresh cached views (popular_wiki_articles, top_contributors, user_stats_cache)
 * Risk Mitigation: RSK-003 (Performance) - Precompute heavy aggregations
 */

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    console.log('[refresh-materialized-views] Starting refresh');

    const views = [
      'popular_wiki_articles',
      'top_contributors',
      'user_stats_cache',
    ];

    const results: Record<string, { success: boolean; error?: string }> = {};

    for (const view of views) {
      try {
        // Use REFRESH MATERIALIZED VIEW CONCURRENTLY to avoid locking reads
        const { error } = await supabase.rpc('refresh_materialized_view', {
          p_view_name: view,
        });

        if (error) throw error;

        results[view] = { success: true };
        console.log(`[refresh-materialized-views] ✓ ${view}`);
      } catch (err) {
        results[view] = { success: false, error: String(err) };
        console.warn(`[refresh-materialized-views] ✗ ${view}:`, err);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[refresh-materialized-views] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * SQL Procedure (deploy separately or inline):
 * 
 * CREATE OR REPLACE FUNCTION refresh_materialized_view(p_view_name TEXT)
 * RETURNS VOID AS $$
 * BEGIN
 *   EXECUTE 'REFRESH MATERIALIZED VIEW CONCURRENTLY ' || p_view_name;
 * END;
 * $$ LANGUAGE plpgsql;
 */
