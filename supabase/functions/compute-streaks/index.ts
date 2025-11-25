import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.0.0';

/**
 * ============================================================================
 * Edge Function: compute-streaks
 * ============================================================================
 * Scheduled: Runs daily (via Supabase Cron) to compute and award streaks
 * Purpose: Update user_streaks, log daily activity, queue notifications
 * Risk Mitigation: RSK-002 (Low Engagement) - Sustain streak engagement
 */

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    console.log('[compute-streaks] Starting daily streak computation');

    // Get all active users with activity in past 24h
    const { data: activeUsers, error: usersError } = await supabase
      .from('user_daily_activity')
      .select('user_id')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .distinct();

    if (usersError) throw usersError;

    let streaksSaved = 0;
    let notificationQueued = 0;

    for (const { user_id } of activeUsers || []) {
      // Invoke PL/pgSQL function to update streak
      const { data: streakResult, error: streakError } = await supabase
        .rpc('update_user_streak', {
          p_user_id: user_id,
        });

      if (streakError) {
        console.warn(`[compute-streaks] Error for user ${user_id}:`, streakError);
        continue;
      }

      const [{ new_streak_length, streak_saved, should_notify }] = streakResult || [];

      if (streak_saved) {
        streaksSaved++;

        // If streak was saved and should notify, queue notification
        if (should_notify && new_streak_length > 0) {
          // Check user notification preference
          const { data: settings } = await supabase
            .from('user_notification_settings')
            .select('enable_streak_notifications, quiet_hours_start, quiet_hours_end')
            .eq('user_id', user_id)
            .single();

          if (settings?.enable_streak_notifications) {
            const now = new Date();
            const currentHour = now.getHours();
            const quietStart = settings.quiet_hours_start ? parseInt(settings.quiet_hours_start.split(':')[0]) : 22;
            const quietEnd = settings.quiet_hours_end ? parseInt(settings.quiet_hours_end.split(':')[0]) : 8;

            // Check quiet hours (simple check; assumes quiet hours don't wrap midnight for now)
            const isQuietHour = quietStart < quietEnd 
              ? currentHour >= quietStart || currentHour < quietEnd 
              : currentHour >= quietStart || currentHour < quietEnd;

            if (!isQuietHour) {
              const { error: notifError } = await supabase
                .from('notification_queue')
                .insert({
                  user_id,
                  notification_type: 'streak_save',
                  title: `🔥 Streak Saved!`,
                  body: `You're on a ${new_streak_length}-day streak. Keep it up!`,
                  data: { streak_length: new_streak_length },
                });

              if (!notifError) notificationQueued++;
            }
          }
        }
      }
    }

    console.log(`[compute-streaks] Complete: ${streaksSaved} streaks saved, ${notificationQueued} notifications queued`);

    return new Response(
      JSON.stringify({
        success: true,
        streaksSaved,
        notificationsQueued: notificationQueued,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[compute-streaks] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
