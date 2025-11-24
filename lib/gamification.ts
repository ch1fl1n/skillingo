// 🎮 GAMIFICATION UTILITY FUNCTIONS 🎮


import type { CompetencyCategory } from '@/types/gamification.types';

/**
 * Calculate user level from total XP
 * 
 * Formula: Level = floor(sqrt(totalXP / 100))
 * 
 * Examples:
 * - 0 XP = Level 1
 * - 100 XP = Level 1
 * - 400 XP = Level 2
 * - 900 XP = Level 3
 * - 2500 XP = Level 5
 */
export const calculateLevelFromXP = (totalXP: number): number => {
  // Ensure valid input
  if (totalXP < 0) return 1;
  
  const level = Math.floor(Math.sqrt(totalXP / 100));
  return Math.max(1, level); // Minimum level is 1
};

/**
 * Calculate XP needed to reach next level
 * 
 * Returns how much more XP is needed to level up!
 * Used for progress bar displays!
 */
export const calculateXPToNextLevel = (totalXP: number): number => {
  const currentLevel = calculateLevelFromXP(totalXP);
  const nextLevelXP = (currentLevel + 1) * (currentLevel + 1) * 100;
  
  const remaining = nextLevelXP - totalXP;
  return Math.max(0, remaining);
};

/**
 * Calculate percentage progress to next level
 * 
 * Returns 0-100 for UI progress bars!
 */
export const calculateLevelProgress = (totalXP: number): number => {
  const currentLevel = calculateLevelFromXP(totalXP);
  const currentLevelXP = currentLevel * currentLevel * 100;
  const nextLevelXP = (currentLevel + 1) * (currentLevel + 1) * 100;
  
  const currentProgress = totalXP - currentLevelXP;
  const maxProgress = nextLevelXP - currentLevelXP;
  
  if (maxProgress === 0) return 0;
  return Math.floor((currentProgress / maxProgress) * 100);
};

/**
 * Format XP for display
 * 
 * Shows "1.2K" instead of "1200" for cleaner UI!
 */
export const formatXP = (xp: number): string => {
  if (xp >= 1000000) return `${(xp / 1000000).toFixed(1)}M`;
  if (xp >= 1000) return `${(xp / 1000).toFixed(1)}K`;
  return xp.toString();
};

/**
 * Get color for level indicator
 * 
 * Makes levels visually distinctive!
 * Higher levels get "cooler" colors!
 */
export const getLevelColor = (level: number): string => {
  if (level <= 5) return '#A78BFA'; // Purple
  if (level <= 10) return '#60A5FA'; // Blue
  if (level <= 20) return '#34D399'; // Green
  if (level <= 30) return '#FBBF24'; // Amber
  return '#F87171'; // Red (legend!)
};

// ===== 🔥 STREAK CALCULATIONS =====

/**
 * Check if streak should continue
 * 
 * A streak continues if:
 * 1. User completed a lesson today, OR
 * 2. It's been 1 day since last completion (streak alive but needs action today)
 * 
 * A streak breaks if:
 * - It's been 2+ days since last completion
 */
export const checkStreakStatus = (
  lastCompletedDate: Date,
  currentDate: Date = new Date()
): 'active' | 'at_risk' | 'broken' => {
  const daysSinceCompletion = Math.floor(
    (currentDate.getTime() - lastCompletedDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceCompletion === 0) return 'active'; // Completed today!
  if (daysSinceCompletion === 1) return 'at_risk'; // Need to complete today
  return 'broken'; // 2+ days without completion
};

/**
 * Calculate streak bonus XP
 * 
 * Rewards users for maintaining streaks!
 * Formula: baseXP = 10 * streakLength
 * 
 * Examples:
 * - 1-day streak: 10 XP bonus
 * - 7-day streak: 70 XP bonus
 * - 30-day streak: 300 XP bonus
 * 
 * This incentivizes daily engagement! 🔥
 */
export const calculateStreakBonusXP = (streakLength: number): number => {
  const baseBonus = 10 * streakLength;
  
  // Milestone bonuses for special streak lengths!
  if (streakLength === 7) return baseBonus + 50; // Week milestone!
  if (streakLength === 30) return baseBonus + 200; // Month milestone!
  if (streakLength === 100) return baseBonus + 500; // Century milestone!
  
  return baseBonus;
};

/**
 * Get motivational message based on streak
 * 
 * Different messages for different milestones!
 * Keeps users engaged and motivated! 💪
 */
export const getStreakMotivation = (streakLength: number): string => {
  if (streakLength === 0) return "🚀 Start your streak today!";
  if (streakLength === 1) return "✨ You're off to a great start!";
  if (streakLength === 3) return "🌟 You're building momentum!";
  if (streakLength === 7) return "🔥 A full week! Amazing!";
  if (streakLength === 14) return "🎉 Two weeks! You're unstoppable!";
  if (streakLength === 30) return "👑 One month! You're a legend!";
  if (streakLength === 100) return "💎 100 DAYS! You're INCREDIBLE!";
  
  return `🔥 ${streakLength}-day streak! Keep it up!`;
};

/**
 * Get fire emoji count for visual representation
 * 
 * Makes streak visible through emoji count!
 * 5 fires for long streaks, 1 for short streaks!
 */
export const getFireCount = (streakLength: number): number => {
  if (streakLength === 0) return 0;
  if (streakLength < 7) return 1;
  if (streakLength < 14) return 2;
  if (streakLength < 30) return 3;
  if (streakLength < 100) return 4;
  return 5; // Maximum fire! 🔥🔥🔥🔥🔥
};

// ===== 🏆 ACHIEVEMENT CALCULATIONS =====

/**
 * Determine achievement rarity color
 * 
 * Rare achievements get special colors!
 */
export const getRarityColor = (rarity: string): string => {
  switch (rarity) {
    case 'common':
      return '#D1D5DB'; // Gray
    case 'uncommon':
      return '#10B981'; // Green
    case 'rare':
      return '#3B82F6'; // Blue
    case 'epic':
      return '#8B5CF6'; // Purple
    case 'legendary':
      return '#F59E0B'; // Gold
    default:
      return '#6B7280'; // Default gray
  }
};

/**
 * Get achievement unlock message
 * 
 * Celebratory messages for unlocking achievements!
 */
export const getAchievementUnlockMessage = (
  achievementName: string,
  rarity: string
): string => {
  const rarityLevel = {
    common: 'Unlocked',
    uncommon: 'Great job unlocking',
    rare: '🎉 You unlocked',
    epic: '🌟 EPIC! You unlocked',
    legendary: '👑 LEGENDARY! You unlocked',
  };

  return `${rarityLevel[rarity as keyof typeof rarityLevel]} ${achievementName}!`;
};

// ===== ⚔️ LEAGUE CALCULATIONS =====

/**
 * Calculate promotion/demotion between leagues
 * 
 * Top performers in bronze move to silver, etc.
 * Bottom performers in higher leagues drop down!
 */
export const calculateLeaguePromotion = (
  currentRank: number,
  leagueSize: number,
  userPoints: number,
  averagePoints: number
): boolean => {
  // Top 20% of league gets promoted!
  const promotionThreshold = Math.ceil(leagueSize * 0.2);
  
  if (currentRank <= promotionThreshold && userPoints > averagePoints) {
    return true; // Promote! 🎉
  }

  return false;
};

/**
 * Get league tier color
 * 
 * Visual distinction for each league tier!
 */
export const getLeagueTierColor = (tier: string): [string, string] => {
  switch (tier) {
    case 'bronze':
      return ['#CD7F32', '#8B4513'];
    case 'silver':
      return ['#C0C0C0', '#808080'];
    case 'gold':
      return ['#FFD700', '#FFA500'];
    case 'platinum':
      return ['#E5E4E2', '#B4B4B4'];
    case 'diamond':
      return ['#B9F2FF', '#00CED1'];
    default:
      return ['#6366F1', '#8B5CF6'];
  }
};

/**
 * Format league rank with medal emoji
 * 
 * Makes rankings visually exciting!
 */
export const formatLeagueRank = (rank: number): string => {
  if (rank === 1) return '🥇 #1';
  if (rank === 2) return '🥈 #2';
  if (rank === 3) return '🥉 #3';
  return `#${rank}`;
};

// ===== 📊 COMPETENCY CALCULATIONS =====

/**
 * Calculate competency progress from lessons completed
 * 
 * As users complete lessons, competencies improve!
 * Each lesson contributes to multiple competencies!
 */
export const calculateCompetencyProgress = (
  lessonsCompleted: number,
  targetLessons: number = 20
): number => {
  const progress = (lessonsCompleted / targetLessons) * 100;
  return Math.min(100, Math.floor(progress)); // Cap at 100%
};

/**
 * Calculate competency level based on progress
 * 
 * Levels: 1-5
 * Level 1: 0-20%
 * Level 2: 20-40%
 * Level 3: 40-60%
 * Level 4: 60-80%
 * Level 5: 80-100%
 */
export const calculateCompetencyLevel = (progressPercent: number): number => {
  if (progressPercent >= 80) return 5;
  if (progressPercent >= 60) return 4;
  if (progressPercent >= 40) return 3;
  if (progressPercent >= 20) return 2;
  return 1;
};

/**
 * Get competency description by category
 * 
 * Helps users understand what they're developing!
 */
export const getCompetencyDescription = (
  competency: string,
  category: CompetencyCategory
): string => {
  const descriptions: Record<string, Record<string, string>> = {
    skills: {
      creativity: 'Develop new ideas and think outside the box',
      critical_thinking: 'Analyze problems and make informed decisions',
      communication: 'Express your ideas clearly to any audience',
      collaboration: 'Work effectively with others to reach goals',
    },
    character: {
      curiosity: 'Stay eager to explore and discover new things',
      courage: 'Face challenges and take meaningful risks',
      resilience: 'Bounce back from setbacks and adapt to change',
      ethics: 'Make principled choices aligned with your values',
    },
    'meta-learning': {
      metacognition: 'Understand how you think and learn',
      metaemotion: 'Manage your emotions effectively',
    },
  };

  return descriptions[category]?.[competency] || 'Develop this competency';
};

// ===== 🔔 NOTIFICATION TIMING =====

/**
 * Calculate optimal notification send time using bandit algorithm
 * 
 * Similar to Duolingo's approach!
 * Learns when user is most likely to engage!
 */
export const calculateOptimalNotificationTime = (
  userTimezone: string,
  historicalInteractions: Array<{ hour: number; clicked: boolean }>,
  quietHoursStart: number,
  quietHoursEnd: number
): number => {
  // Calculate click-through rate for each hour
  const hourStats: Record<number, { total: number; clicked: number }> = {};

  for (let i = 0; i < 24; i++) {
    hourStats[i] = { total: 0, clicked: 0 };
  }

  historicalInteractions.forEach(({ hour, clicked }) => {
    hourStats[hour].total += 1;
    if (clicked) hourStats[hour].clicked += 1;
  });

  // Find hour with best click-through rate (excluding quiet hours)
  let bestHour = 9; // Default to 9 AM
  let bestCTR = 0;

  for (const [hour, stats] of Object.entries(hourStats)) {
    const hourNum = parseInt(hour);
    const isInQuietHours =
      hourNum >= quietHoursStart || hourNum < quietHoursEnd;

    if (!isInQuietHours && stats.total > 0) {
      const ctr = stats.clicked / stats.total;
      if (ctr > bestCTR) {
        bestCTR = ctr;
        bestHour = hourNum;
      }
    }
  }

  return bestHour;
};

/**
 * Schedule notification with jitter
 * 
 * Adds randomness to avoid all notifications at exact same time!
 * Prevents notification fatigue!
 */
export const scheduleNotificationWithJitter = (
  preferredHour: number,
  jitterMinutes: number = 30
): Date => {
  const scheduledTime = new Date();
  scheduledTime.setHours(preferredHour);
  scheduledTime.setMinutes(Math.random() * jitterMinutes);
  scheduledTime.setSeconds(Math.floor(Math.random() * 60));

  // If time is in the past today, schedule for tomorrow
  if (scheduledTime < new Date()) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }

  return scheduledTime;
};

// ===== 📈 ANALYTICS & INSIGHTS =====

/**
 * Calculate user engagement score (0-100)
 * 
 * Takes into account:
 * - Daily streak (max 30 points)
 * - XP earned this week (max 40 points)
 * - Achievement completion (max 20 points)
 * - Lesson completion rate (max 10 points)
 */
export const calculateEngagementScore = (
  currentStreak: number,
  xpThisWeek: number,
  achievementsUnlocked: number,
  lessonsCompleted: number
): number => {
  let score = 0;

  // Streak contribution (max 30)
  score += Math.min(30, (currentStreak / 30) * 30);

  // XP contribution (max 40)
  score += Math.min(40, (xpThisWeek / 500) * 40);

  // Achievement contribution (max 20)
  score += Math.min(20, (achievementsUnlocked / 10) * 20);

  // Lesson contribution (max 10)
  score += Math.min(10, (lessonsCompleted / 50) * 10);

  return Math.round(score);
};

/**
 * Get engagement level description
 * 
 * Feedback based on engagement score!
 */
export const getEngagementLevel = (score: number): string => {
  if (score >= 80) return 'Legendary Learner! 👑';
  if (score >= 60) return 'Star Student! ⭐';
  if (score >= 40) return 'Solid Progress! 💪';
  if (score >= 20) return 'Getting Started! 🚀';
  return 'Welcome to Learning! 👋';
};

// ===== 🎯 VALIDATION & SAFETY =====

/**
 * Validate XP amount
 * 
 * Ensures reasonable XP values!
 * Prevents negative XP, absurdly large XP, etc.
 */
export const validateXPAmount = (xp: number): boolean => {
  // XP must be:
  // - A number
  // - Between 0 and 100,000 (per transaction)
  // - An integer
  return Number.isInteger(xp) && xp >= 0 && xp <= 100000;
};

/**
 * Validate streak count
 * 
 * Ensures realistic streak values!
 */
export const validateStreakCount = (streak: number): boolean => {
  // Streak must be:
  // - A non-negative integer
  // - Reasonable (less than 1000 days)
  return Number.isInteger(streak) && streak >= 0 && streak < 1000;
};

/**
 * Validate league rank
 * 
 * Ensures rank is within valid range!
 */
export const validateLeagueRank = (rank: number, leagueSize: number = 30): boolean => {
  return Number.isInteger(rank) && rank > 0 && rank <= leagueSize;
};

export default {
  // Level calculations
  calculateLevelFromXP,
  calculateXPToNextLevel,
  calculateLevelProgress,
  formatXP,
  getLevelColor,

  // Streak calculations
  checkStreakStatus,
  calculateStreakBonusXP,
  getStreakMotivation,
  getFireCount,

  // Achievement calculations
  getRarityColor,
  getAchievementUnlockMessage,

  // League calculations
  calculateLeaguePromotion,
  getLeagueTierColor,
  formatLeagueRank,

  // Competency calculations
  calculateCompetencyProgress,
  calculateCompetencyLevel,
  getCompetencyDescription,

  // Notification timing
  calculateOptimalNotificationTime,
  scheduleNotificationWithJitter,

  // Analytics
  calculateEngagementScore,
  getEngagementLevel,

  // Validation
  validateXPAmount,
  validateStreakCount,
  validateLeagueRank,
};
