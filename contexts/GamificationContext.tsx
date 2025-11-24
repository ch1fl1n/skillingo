/**
 * 🎮 GAMIFICATION CONTEXT HOOK 🎮
 * 
 * This hook manages all gamification state and provides functions to interact with:
 * - Daily streaks and friend streaks
 * - XP and leveling systems
 * - Achievements and unlocks
 * - League rankings and competition
 * - Smart notifications with adaptive timing
 * - Competency tracking based on CCR framework
 * 
 * This is the HEART of our gamification system! ❤️
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type {
  DailyStreak,
  UserXP,
  UserAchievement,
  UserGamificationStats,
  LeagueMembership,
  NotificationPreferences,
  UserCompetencyProgress,
} from '@/types/gamification.types';

/**
 * Gamification Context Type Definition
 * 
 * Provides all the data and functions needed for gamification features!
 * Includes state management, data fetching, and action methods!
 */
interface GamificationContextType {
  // State
  dailyStreak: DailyStreak | null;
  userXP: UserXP | null;
  achievements: UserAchievement[];
  currentLeague: LeagueMembership | null;
  gamificationStats: UserGamificationStats | null;
  notificationPreferences: NotificationPreferences | null;
  competencies: UserCompetencyProgress[];
  loading: boolean;
  error: string | null;

  // Actions
  completeLesson: (lessonId: string, score: number, xpReward: number) => Promise<void>;
  addXP: (amount: number, source: string, reason: string) => Promise<void>;
  checkDailyStreak: () => Promise<boolean>; // Returns true if streak maintained
  checkAchievements: () => Promise<void>; // Check and unlock eligible achievements
  updateNotificationPreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>;
  getOptimalNotificationTime: () => Promise<string>; // Returns optimal time for notification
  getLeaderboard: (leagueId: string) => Promise<LeagueMembership[]>;
  refetchStats: () => Promise<void>; // Manual refresh
}

// Create context with default values
const GamificationContext = createContext<GamificationContextType>({
  dailyStreak: null,
  userXP: null,
  achievements: [],
  currentLeague: null,
  gamificationStats: null,
  notificationPreferences: null,
  competencies: [],
  loading: true,
  error: null,
  completeLesson: async () => {},
  addXP: async () => {},
  checkDailyStreak: async () => false,
  checkAchievements: async () => {},
  updateNotificationPreferences: async () => {},
  getOptimalNotificationTime: async () => '',
  getLeaderboard: async () => [],
  refetchStats: async () => {},
});

/**
 * Custom hook to use Gamification Context
 * 
 * Throws error if used outside of GamificationProvider!
 * Provides type-safe access to all gamification features!
 */
export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
};

/**
 * Gamification Provider Component
 * 
 * Wraps your app and provides gamification context to all children!
 * Initialize this at the root of your app!
 */
interface GamificationProviderProps {
  children: React.ReactNode;
}

export const GamificationProvider: React.FC<GamificationProviderProps> = ({ children }) => {
  const { user } = useAuth();

  // ===== STATE MANAGEMENT =====
  const [dailyStreak, setDailyStreak] = useState<DailyStreak | null>(null);
  const [userXP, setUserXP] = useState<UserXP | null>(null);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [currentLeague, setCurrentLeague] = useState<LeagueMembership | null>(null);
  const [gamificationStats, setGamificationStats] = useState<UserGamificationStats | null>(null);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences | null>(null);
  const [competencies, setCompetencies] = useState<UserCompetencyProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * 📊 FETCH ALL GAMIFICATION DATA
   * 
   * Called on mount and when user changes!
   * This is the main data loading function!
   */
  const fetchGamificationData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch daily streak! 🔥
      const { data: streakData, error: streakError } = await supabase
        .from('daily_streaks')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (streakError && streakError.code !== 'PGRST116') throw streakError;
      setDailyStreak(streakData);

      // Fetch XP data! ⭐
      const { data: xpData, error: xpError } = await supabase
        .from('user_xp')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (xpError && xpError.code !== 'PGRST116') throw xpError;
      setUserXP(xpData);

      // Fetch achievements! 🏆
      const { data: achievementData, error: achievementError } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user.id);

      if (achievementError) throw achievementError;
      setAchievements(achievementData || []);

      // Fetch current league! ⚔️
      const { data: leagueData, error: leagueError } = await supabase
        .from('league_memberships')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (leagueError && leagueError.code !== 'PGRST116') throw leagueError;
      setCurrentLeague(leagueData);

      // Fetch notification preferences! 🔔
      const { data: notifPrefData, error: notifPrefError } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (notifPrefError && notifPrefError.code !== 'PGRST116') throw notifPrefError;
      setNotificationPreferences(notifPrefData);

      // Fetch competency progress! 📈
      const { data: competencyData, error: competencyError } = await supabase
        .from('user_competency_progress')
        .select('*')
        .eq('user_id', user.id);

      if (competencyError) throw competencyError;
      setCompetencies(competencyData || []);

      // Build gamification stats from all data! 🎮
      if (streakData && xpData && achievementData) {
        const stats: UserGamificationStats = {
          user_id: user.id,
          current_level: calculateLevel(xpData.total_xp),
          total_xp: xpData.total_xp,
          xp_to_next_level: calculateXPToNextLevel(xpData.total_xp),
          current_streak: streakData.current_streak,
          longest_streak: streakData.longest_streak,
          league_id: leagueData?.league_id,
          league_rank: leagueData?.rank,
          league_points: leagueData?.points,
          achievements_unlocked: achievementData.length,
          total_achievements: 0, // Would fetch from achievements table
          friend_streak_count: 0, // Would calculate from friend_streaks table
          competencies_by_category: {
            skills: competencyData?.filter(c => c.competency_id?.includes('skill')) || [],
            character: competencyData?.filter(c => c.competency_id?.includes('character')) || [],
            'meta-learning': competencyData?.filter(c => c.competency_id?.includes('meta')) || [],
          },
          updated_at: new Date().toISOString(),
        };
        setGamificationStats(stats);
      }
    } catch (err) {
      console.error('Error fetching gamification data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  /**
   * 🚀 COMPLETE LESSON - Main engagement action!
   * 
   * When user completes a lesson:
   * 1. Add XP reward
   * 2. Check/update daily streak
   * 3. Check for achievement unlocks
   * 4. Update competency progress
   * 5. Check league rank updates
   */
  const completeLesson = useCallback(
    async (lessonId: string, score: number, xpReward: number) => {
      if (!user?.id) return;

      try {
        // 1️⃣ Add XP from lesson! ⭐
        await addXP(xpReward, 'lesson_completion', `Completed lesson ${lessonId}`);

        // 2️⃣ Bonus XP for perfect score! 💯
        if (score >= 95) {
          await addXP(Math.floor(xpReward * 0.1), 'quiz_perfect_score', 'Perfect score bonus!');
        }

        // 3️⃣ Update daily streak! 🔥
        await checkDailyStreak();

        // 4️⃣ Check for achievements! 🏆
        await checkAchievements();

        // 5️⃣ Refresh all data!
        await fetchGamificationData();
      } catch (err) {
        console.error('Error completing lesson:', err);
        throw err;
      }
    },
    [user?.id, addXP, checkDailyStreak, checkAchievements, fetchGamificationData]
  );

  /**
   * ⭐ ADD XP - Flexible XP addition system!
   * 
   * This function is used throughout the app to award points for various actions!
   * Creates an XP transaction for audit trail and analytics!
   */
  const addXP = useCallback(
    async (amount: number, source: string, reason: string) => {
      if (!user?.id) return;

      try {
        // Create XP transaction record! 📊
        const { error: txError } = await supabase.from('xp_transactions').insert([
          {
            user_id: user.id,
            amount,
            source,
            reason,
            created_at: new Date().toISOString(),
          },
        ]);

        if (txError) throw txError;

        // Update user XP! ⬆️
        if (userXP) {
          const newTotal = userXP.total_xp + amount;
          const { error: updateError } = await supabase
            .from('user_xp')
            .update({
              total_xp: newTotal,
              current_level: calculateLevel(newTotal),
              xp_to_next_level: calculateXPToNextLevel(newTotal),
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.id);

          if (updateError) throw updateError;

          // Update local state! 
          setUserXP(prev => prev ? {
            ...prev,
            total_xp: newTotal,
            current_level: calculateLevel(newTotal),
            xp_to_next_level: calculateXPToNextLevel(newTotal),
          } : null);
        }
      } catch (err) {
        console.error('Error adding XP:', err);
        throw err;
      }
    },
    [user?.id, userXP]
  );

  /**
   * 🔥 CHECK DAILY STREAK - Maintain the fire!
   * 
   * Checks if user has completed a lesson today!
   * If yes, updates streak count
   * If no but streak is recent, resets it
   * If streak broken, offers recovery option
   */
  const checkDailyStreak = useCallback(async (): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      if (!dailyStreak) {
        // First streak! Create it! 🎉
        const { data, error } = await supabase
          .from('daily_streaks')
          .insert([
            {
              user_id: user.id,
              current_streak: 1,
              longest_streak: 1,
              last_completed_date: today,
              fire_count: 1,
              is_active_today: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ])
          .select()
          .single();

        if (error) throw error;
        setDailyStreak(data);
        return true;
      }

      const lastDate = new Date(dailyStreak.last_completed_date).toISOString().split('T')[0];

      // Check if completed today already
      if (lastDate === today) {
        return true; // Already completed today!
      }

      // Check if streak is continuous
      if (lastDate === yesterday) {
        // 🔥 STREAK CONTINUES! 🔥
        const newStreak = dailyStreak.current_streak + 1;
        const newLongest = Math.max(dailyStreak.longest_streak, newStreak);

        const { data, error } = await supabase
          .from('daily_streaks')
          .update({
            current_streak: newStreak,
            longest_streak: newLongest,
            last_completed_date: today,
            fire_count: newStreak, // Visual indicator!
            is_active_today: true,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;
        setDailyStreak(data);

        // 🎉 BONUS XP for maintaining streak!
        await addXP(10 * dailyStreak.current_streak, 'daily_streak', `Streak bonus for ${newStreak} days!`);

        return true;
      } else {
        // ❌ STREAK BROKEN! But we can recover! 💪
        const { error } = await supabase
          .from('daily_streaks')
          .update({
            current_streak: 0,
            fire_count: 0,
            is_active_today: false,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        if (error) throw error;

        // Offer recovery notification! 🆘
        // In a real app, send a smart notification here!

        return false; // Streak was broken
      }
    } catch (err) {
      console.error('Error checking daily streak:', err);
      throw err;
    }
  }, [user?.id, dailyStreak, addXP]);

  /**
   * 🏆 CHECK ACHIEVEMENTS - Unlock awesome badges!
   * 
   * This function checks all achievement conditions and unlocks
   * any that the user has now satisfied!
   * 
   * Includes achievement types from our system:
   * - Lesson count milestones
   * - Streak milestones
   * - Score thresholds
   * - Skill mastery
   * - XP milestones
   * - League rankings
   * - Social sharing
   */
  const checkAchievements = useCallback(async () => {
    if (!user?.id || !userXP || !dailyStreak) return;

    try {
      // Fetch all achievements from database
      const { data: allAchievements, error: fetchError } = await supabase
        .from('achievements')
        .select('*');

      if (fetchError) throw fetchError;

      // Check which ones user has already unlocked
      const unlockedIds = achievements.map(a => a.achievement_id);

      // For each locked achievement, check conditions
      for (const achievement of allAchievements || []) {
        if (unlockedIds.includes(achievement.id)) continue; // Skip unlocked

        const shouldUnlock = checkAchievementCondition(
          achievement.unlock_condition,
          {
            userXP,
            dailyStreak,
            currentLeague,
            competencies,
          }
        );

        if (shouldUnlock) {
          // 🎉 UNLOCK ACHIEVEMENT! 🎉
          const { error: unlockError } = await supabase
            .from('user_achievements')
            .insert([
              {
                user_id: user.id,
                achievement_id: achievement.id,
                unlocked_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
              },
            ]);

          if (unlockError) throw unlockError;

          // Bonus XP for achievement! 🎁
          await addXP(
            achievement.xp_reward || 0,
            'achievement_unlock',
            `Unlocked achievement: ${achievement.name}`
          );
        }
      }

      // Refresh achievements!
      await fetchGamificationData();
    } catch (err) {
      console.error('Error checking achievements:', err);
      throw err;
    }
  }, [user?.id, userXP, dailyStreak, achievements, currentLeague, competencies, addXP, fetchGamificationData]);

  /**
   * 🔔 UPDATE NOTIFICATION PREFERENCES - Respect user choice!
   * 
   * Users have FULL CONTROL over their notifications!
   * This respects the design principle: 19% of users uninstall due to
   * excessive notifications!
   */
  const updateNotificationPreferences = useCallback(
    async (prefs: Partial<NotificationPreferences>) => {
      if (!user?.id) return;

      try {
        if (notificationPreferences) {
          // Update existing
          const { error } = await supabase
            .from('notification_preferences')
            .update({
              ...prefs,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.id);

          if (error) throw error;
        } else {
          // Create new
          const { error } = await supabase
            .from('notification_preferences')
            .insert([
              {
                user_id: user.id,
                ...prefs,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ]);

          if (error) throw error;
        }

        await fetchGamificationData();
      } catch (err) {
        console.error('Error updating notification preferences:', err);
        throw err;
      }
    },
    [user?.id, notificationPreferences, fetchGamificationData]
  );

  /**
   * 🤖 GET OPTIMAL NOTIFICATION TIME - Adaptive timing!
   * 
   * Uses a bandit algorithm approach (like Duolingo!) to determine
   * the BEST time to send notifications to maximize engagement!
   * 
   * Takes into account:
   * - User's timezone
   * - Historical interaction patterns
   * - Quiet hours preferences
   * - Current streak state
   */
  const getOptimalNotificationTime = useCallback(async (): Promise<string> => {
    if (!user?.id || !notificationPreferences) return new Date().toISOString();

    try {
      // Get user's historical notification interactions
      const { data: interactions, error } = await supabase
        .from('smart_notifications')
        .select('sent_at, interacted_at')
        .eq('user_id', user.id)
        .not('interacted_at', 'is', null)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;

      // Simple algorithm: Find most common interaction hour
      const hourCounts: Record<number, number> = {};
      interactions?.forEach(interaction => {
        if (interaction.interacted_at) {
          const hour = new Date(interaction.interacted_at).getHours();
          hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        }
      });

      // Find best hour, avoiding quiet hours
      let bestHour = notificationPreferences.daily_reminder_hour || 9; // Default to 9 AM
      let maxInteractions = 0;

      for (const [hour, count] of Object.entries(hourCounts)) {
        const hourNum = parseInt(hour);
        const isInQuietHours =
          hourNum >= notificationPreferences.quiet_hours_start ||
          hourNum < notificationPreferences.quiet_hours_end;

        if (!isInQuietHours && count > maxInteractions) {
          maxInteractions = count;
          bestHour = hourNum;
        }
      }

      // Calculate time for today at that hour
      const optimalTime = new Date();
      optimalTime.setHours(bestHour, Math.random() * 60, 0, 0); // Add randomness!

      return optimalTime.toISOString();
    } catch (err) {
      console.error('Error calculating optimal notification time:', err);
      return new Date().toISOString();
    }
  }, [user?.id, notificationPreferences]);

  /**
   * 📊 GET LEADERBOARD - See the competition!
   * 
   * Fetch all users in a league ranked by points!
   * Great for building competitive features!
   */
  const getLeaderboard = useCallback(
    async (leagueId: string): Promise<LeagueMembership[]> => {
      try {
        const { data, error } = await supabase
          .from('league_memberships')
          .select('*')
          .eq('league_id', leagueId)
          .order('rank', { ascending: true });

        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        return [];
      }
    },
    []
  );

  /**
   * 🔄 REFETCH STATS - Manual refresh!
   * 
   * Call this when you need to manually refresh gamification data!
   */
  const refetchStats = useCallback(async () => {
    await fetchGamificationData();
  }, [fetchGamificationData]);

  // Load data on mount and when user changes
  useEffect(() => {
    fetchGamificationData();
  }, [user?.id, fetchGamificationData]);

  // ===== CONTEXT VALUE =====
  const value: GamificationContextType = {
    dailyStreak,
    userXP,
    achievements,
    currentLeague,
    gamificationStats,
    notificationPreferences,
    competencies,
    loading,
    error,
    completeLesson,
    addXP,
    checkDailyStreak,
    checkAchievements,
    updateNotificationPreferences,
    getOptimalNotificationTime,
    getLeaderboard,
    refetchStats,
  };

  return (
    <GamificationContext.Provider value={value}>
      {children}
    </GamificationContext.Provider>
  );
};

// ===== HELPER FUNCTIONS =====

/**
 * Calculate user level based on total XP
 * 
 * Formula: Level = floor(sqrt(totalXP / 100))
 * Exponential growth keeps progression meaningful!
 */
function calculateLevel(totalXP: number): number {
  return Math.floor(Math.sqrt(totalXP / 100));
}

/**
 * Calculate XP needed to reach next level
 * 
 * Used to show progress bars!
 */
function calculateXPToNextLevel(totalXP: number): number {
  const currentLevel = calculateLevel(totalXP);
  const nextLevelXP = (currentLevel + 1) * (currentLevel + 1) * 100;
  return nextLevelXP - totalXP;
}

/**
 * Check if achievement condition is met
 * 
 * This is where we verify if an achievement should be unlocked!
 */
interface AchievementCheckContext {
  userXP: UserXP;
  dailyStreak: DailyStreak;
  currentLeague: LeagueMembership | null;
  competencies: UserCompetencyProgress[];
}

/**
 * Achievement unlock condition types
 */
type AchievementCondition =
  | { type: 'lesson_count'; count: number }
  | { type: 'consecutive_days'; days: number }
  | { type: 'score_threshold'; threshold: number }
  | { type: 'skill_mastery' }
  | { type: 'xp_milestone'; xp_amount: number }
  | { type: 'league_rank'; rank: number };

function checkAchievementCondition(condition: AchievementCondition, context: AchievementCheckContext): boolean {
  switch (condition.type) {
    case 'lesson_count':
      // Would need lesson count from user progress
      return false; // Placeholder

    case 'consecutive_days':
      return context.dailyStreak.current_streak >= condition.days;

    case 'score_threshold':
      // Would need score info
      return false; // Placeholder

    case 'skill_mastery':
      return context.competencies.some(c => c.progress_percent >= 100);

    case 'xp_milestone':
      return context.userXP.total_xp >= condition.xp_amount;

    case 'league_rank':
      return context.currentLeague?.rank ? context.currentLeague.rank <= condition.rank : false;

    default:
      return false;
  }
}
