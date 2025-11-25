import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.0.0';

/**
 * ============================================================================
 * Edge Function: monitor-anomalies
 * ============================================================================
 * Scheduled: Runs every 15 min (via Supabase Cron)
 * Purpose: Detect vandalism patterns (high revert rates), flag content
 * Risk Mitigation: RSK-001 (Data Integrity) - Alert on content attacks
 */

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const webhookUrl = Deno.env.get('SLACK_WEBHOOK_URL'); // Optional Slack alert

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    console.log('[monitor-anomalies] Checking for content anomalies');

    // Fetch unresolved high-severity anomalies
    const { data: anomalies, error } = await supabase
      .from('wiki_anomalies')
      .select('*')
      .eq('resolved', false)
      .eq('severity', 'high')
      .or('severity.eq.critical');

    if (error) throw error;

    let alertCount = 0;

    for (const anomaly of anomalies || []) {
      console.log(`[monitor-anomalies] Detected ${anomaly.anomaly_type}: page_id=${anomaly.page_id}, severity=${anomaly.severity}`);

      // Get page details for context
      const { data: page } = await supabase
        .from('wiki_pages')
        .select('slug, title')
        .eq('id', anomaly.page_id)
        .single();

      // Send Slack alert if webhook configured
      if (webhookUrl) {
        try {
          const slackMsg = {
            text: `🚨 Wiki Content Alert: ${anomaly.anomaly_type}`,
            blocks: [
              {
                type: 'header',
                text: {
                  type: 'plain_text',
                  text: `⚠️ ${anomaly.anomaly_type}`,
                },
              },
              {
                type: 'section',
                fields: [
                  {
                    type: 'mrkdwn',
                    text: `*Page:*\n${page?.title || 'Unknown'}`,
                  },
                  {
                    type: 'mrkdwn',
                    text: `*Severity:*\n${anomaly.severity}`,
                  },
                  {
                    type: 'mrkdwn',
                    text: `*Type:*\n${anomaly.anomaly_type}`,
                  },
                  {
                    type: 'mrkdwn',
                    text: `*Count:*\n${anomaly.count}`,
                  },
                ],
              },
            ],
          };

          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(slackMsg),
          });

          alertCount++;
        } catch (slackErr) {
          console.warn('[monitor-anomalies] Slack send failed:', slackErr);
        }
      }

      // Mark anomaly as resolved (or escalate if critical)
      if (anomaly.severity === 'critical') {
        // Create an alert task in another table or send to admin dashboard
        // For now, just log
        console.log('[monitor-anomalies] CRITICAL anomaly - manual review required');
      }
    }

    console.log(`[monitor-anomalies] Complete: ${alertCount} alerts sent`);

    return new Response(
      JSON.stringify({
        success: true,
        alertsSent: alertCount,
        anomaliesFound: anomalies?.length || 0,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[monitor-anomalies] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
