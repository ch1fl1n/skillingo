import { useState, useEffect, useCallback } from 'react';
import { supabase, currentUserId } from '@/lib/supabase';

export interface RecentActivity {
  type: 'lesson_completed' | 'skill_progressed' | 'level_up' | 'achievement';
  skillId?: number;
  skillName?: string;
  xpGained?: number;
  timestamp: number;
  message: string;
}

export const useRecentActivity = () => {
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRecentActivity = useCallback(async () => {
    try {
      setLoading(true);
      const userId = await currentUserId();
      if (!userId) return;

      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

      const { data: recentAttempts, error } = await supabase
        .from('lesson_attempts')
        .select('id,attempted_at,score,completed,lessons(id,title,skill_id,skills(id,name))')
        .eq('user_id', userId)
        .eq('completed', true)
        .gte('attempted_at', twoHoursAgo)
        .order('attempted_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('[ACTIVITY] Error fetching recent activity:', error);
        return;
      }

      if (!recentAttempts) {
        setActivities([]);
        return;
      }

      const newActivities: RecentActivity[] = recentAttempts
        .map((attempt: any) => {
          const lesson = attempt.lessons;
          const skill = lesson?.skills || {};
          const xpGained = Math.round((attempt.score / 100) * (lesson?.difficulty === 'hard' ? 30 : lesson?.difficulty === 'medium' ? 20 : 10));

          return {
            type: 'lesson_completed',
            skillId: skill?.id,
            skillName: skill?.name,
            xpGained,
            timestamp: new Date(attempt.attempted_at).getTime(),
            message: `Completed "${lesson?.title}" in ${skill?.name}`,
          };
        });

      setActivities(newActivities);
      console.log('[ACTIVITY] Loaded recent activities:', newActivities.length);
    } catch (err) {
      console.error('[ACTIVITY] Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecentActivity();
    const interval = setInterval(fetchRecentActivity, 30000);
    return () => clearInterval(interval);
  }, [fetchRecentActivity]);

  return {
    activities,
    loading,
    refresh: fetchRecentActivity,
  };
};
