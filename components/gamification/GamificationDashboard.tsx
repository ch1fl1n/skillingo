// GAMIFICATION DASHBOARD COMPONENT 🎮

import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useGamification } from '@/contexts/GamificationContext';
import type { DailyStreak, UserXP, UserAchievement, LeagueMembership, UserGamificationStats, UserCompetencyProgress } from '@/types/gamification.types';

const CARD_MARGIN = 16;

/**
 * Main Dashboard Component
 * 
 * Renders all gamification stats and quick actions!
 * This is where users see their progress at a glance! 👀
 */
export const GamificationDashboard: React.FC<{ onNavigateToLeague?: () => void }> = ({
  onNavigateToLeague,
}) => {
  const { gamificationStats, dailyStreak, userXP, achievements, currentLeague, loading, error } =
    useGamification();

  const [animatedStreak] = useState(new Animated.Value(0));

  // Animate streak on load! ✨
  useEffect(() => {
    if (dailyStreak) {
      Animated.spring(animatedStreak, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }
  }, [dailyStreak, animatedStreak]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading your progress...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* ===== HEADER ===== */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Progress</Text>
        <Text style={styles.headerSubtitle}>Keep up the amazing work! 🚀</Text>
      </View>

      {/* ===== DAILY STREAK - THE FIRE! 🔥 ===== */}
      {dailyStreak && <DailyStreakCard streak={dailyStreak} />}

      {/* ===== LEVEL & XP SECTION - FEEL THE GROWTH! ⭐ ===== */}
      {userXP && <LevelProgressCard xp={userXP} />}

      {/* ===== ACHIEVEMENTS SHOWCASE - CELEBRATE UNLOCKS! 🏆 ===== */}
      {achievements.length > 0 && <AchievementsCard achievements={achievements} />}

      {/* ===== LEAGUE RANKING - FRIENDLY COMPETITION! ⚔️ ===== */}
      {currentLeague && (
        <LeagueRankingCard league={currentLeague} onViewLeaderboard={onNavigateToLeague} />
      )}

      {/* ===== COMPETENCY BREAKDOWN - CCR FRAMEWORK 🎓 ===== */}
      {gamificationStats && <CompetencyCard stats={gamificationStats} />}

      {/* ===== QUICK ACTION BUTTONS ===== */}
      <QuickActionsSection />

      {/* Bottom padding for scrolling */}
      <View style={{ height: 30 }} />
    </ScrollView>
  );
};

/**
 * 🔥 DAILY STREAK CARD 🔥
 * 
 * Shows current streak and longest streak!
 * Big, bold design to encourage daily habit building!
 */
interface DailyStreakCardProps {
  streak: DailyStreak;
}

const DailyStreakCard: React.FC<DailyStreakCardProps> = ({ streak }) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  // Pulse animation for visual appeal!
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [scaleAnim]);

  return (
    <LinearGradient
      colors={['#FF6B6B', '#FF8C42']} // Fiery red to orange gradient
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.streakCardGradient}
    >
      <View style={styles.streakCard}>
        {/* Fire Icon */}
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Text style={styles.fireIcon}>🔥</Text>
        </Animated.View>

        {/* Streak Info */}
        <View style={styles.streakInfo}>
          <Text style={styles.streakLabel}>Current Streak</Text>
          <Text style={styles.streakNumber}>{streak.current_streak}</Text>
          <Text style={styles.streakDays}>consecutive days!</Text>
        </View>

        {/* Personal Best */}
        <View style={styles.bestStreakContainer}>
          <Text style={styles.bestStreakLabel}>Personal Best</Text>
          <Text style={styles.bestStreakNumber}>{streak.longest_streak}</Text>
        </View>
      </View>

      {/* Motivational message based on streak */}
      <StreakMotivation streak={streak.current_streak} />
    </LinearGradient>
  );
};

/**
 * Motivational message component
 * Changes based on streak length!
 */
const StreakMotivation: React.FC<{ streak: number }> = ({ streak }) => {
  let message = '';

  if (streak === 0) {
    message = "Start your streak today! You got this! 💪";
  } else if (streak < 3) {
    message = "Nice start! Keep the momentum! 🚀";
  } else if (streak < 7) {
    message = "You're building a habit! 🌟";
  } else if (streak < 30) {
    message = "Incredible dedication! 🏆";
  } else {
    message = "You're a LEGEND! 👑";
  }

  return <Text style={styles.motivationalText}>{message}</Text>;
};

/**
 * ⭐ LEVEL & XP CARD ⭐
 * 
 * Shows current level and progress to next level!
 * Beautiful progress bar with smooth animations!
 */
interface LevelProgressCardProps {
  xp: UserXP;
}

const LevelProgressCard: React.FC<LevelProgressCardProps> = ({ xp }) => {
  const progressAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const maxXP = xp.total_xp + xp.xp_to_next_level;
    const progress = xp.total_xp / maxXP;

    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [xp.total_xp, xp.xp_to_next_level, progressAnim]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <LinearGradient
      colors={['#6366F1', '#8B5CF6']} // Indigo to violet gradient
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.levelCardGradient}
    >
      <View style={styles.levelCard}>
        {/* Level Display */}
        <View style={styles.levelHeader}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelNumber}>Lvl {xp.current_level}</Text>
          </View>
          <View style={styles.xpDisplay}>
            <Text style={styles.xpLabel}>Total XP</Text>
            <Text style={styles.xpTotal}>{xp.total_xp.toLocaleString()}</Text>
          </View>
        </View>

        {/* XP Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  width: progressWidth,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{xp.xp_to_next_level} XP to Level {xp.current_level + 1}</Text>
        </View>

        {/* Level Up Achievement Info */}
        <Text style={styles.nextLevelHint}>🎉 You're {Math.round((xp.total_xp / (xp.total_xp + xp.xp_to_next_level)) * 100)}% to the next level!</Text>
      </View>
    </LinearGradient>
  );
};

/**
 * 🏆 ACHIEVEMENTS CARD 🏆
 * 
 * Shows recently unlocked achievements!
 * Each achievement is a badge showing progress toward mastery!
 */
interface AchievementsCardProps {
  achievements: UserAchievement[];
}

const AchievementsCard: React.FC<AchievementsCardProps> = ({ achievements }) => {
  // Show only the 5 most recent achievements
  const recentAchievements = achievements.slice(0, 5);

  return (
    <LinearGradient
      colors={['#F59E0B', '#F97316']} // Amber to orange gradient
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.achievementCardGradient}
    >
      <View style={styles.achievementCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>🏆 Recent Achievements</Text>
          <Text style={styles.achievementCount}>{achievements.length} Unlocked</Text>
        </View>

        <View style={styles.achievementGrid}>
          {recentAchievements.map((achievement) => (
            <View key={achievement.id} style={styles.achievementBadge}>
              <Text style={styles.achievementEmoji}>
                {achievement.achievement_id.includes('streak') ? '🔥' : '⭐'}
              </Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>View All Achievements →</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

/**
 * ⚔️ LEAGUE RANKING CARD ⚔️
 * 
 * Shows current league standing and competitive ranking!
 * Encourages healthy competition!
 */
interface LeagueRankingCardProps {
  league: LeagueMembership & { tier?: string };
  onViewLeaderboard?: () => void;
}

const LeagueRankingCard: React.FC<LeagueRankingCardProps> = ({ league, onViewLeaderboard }) => {
  const getTierColor = (tier: string): [string, string] => {
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

  const tierColors = getTierColor(league.tier || 'bronze');

  return (
    <LinearGradient
      colors={tierColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.leagueCardGradient}
    >
      <View style={styles.leagueCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>⚔️ League Standing</Text>
          <View style={styles.rankBadge}>
            <Text style={styles.rankText}>#{league.rank}</Text>
          </View>
        </View>

        <View style={styles.leagueDetails}>
          <View style={styles.leagueDetailItem}>
            <Text style={styles.leagueDetailLabel}>League</Text>
            <Text style={styles.leagueDetailValue}>{league.tier?.toUpperCase()}</Text>
          </View>

          <View style={styles.leagueDetailItem}>
            <Text style={styles.leagueDetailLabel}>Points</Text>
            <Text style={styles.leagueDetailValue}>{league.points}</Text>
          </View>

          <View style={styles.leagueDetailItem}>
            <Text style={styles.leagueDetailLabel}>XP This Week</Text>
            <Text style={styles.leagueDetailValue}>{league.xp_earned}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.leaderboardButton} onPress={onViewLeaderboard}>
          <Text style={styles.leaderboardButtonText}>View Full Leaderboard →</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

/**
 * 🎓 COMPETENCY CARD 🎓
 * 
 * Shows progress on CCR competencies:
 * - Skills: Creativity, Critical Thinking, Communication, Collaboration
 * - Character: Curiosity, Courage, Resilience, Ethics
 * - Meta-Learning: Metacognition & Metaemotion
 */
interface CompetencyCardProps {
  stats: UserGamificationStats;
}

const CompetencyCard: React.FC<CompetencyCardProps> = ({ stats }) => {
  const getTopCompetencies = () => {
    const all = [
      ...stats.competencies_by_category.skills,
      ...stats.competencies_by_category.character,
      ...stats.competencies_by_category['meta-learning'],
    ];
    return all.sort((a, b) => b.progress_percent - a.progress_percent).slice(0, 3);
  };

  return (
    <LinearGradient
      colors={['#10B981', '#059669']} // Emerald gradient
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.competencyCardGradient}
    >
      <View style={styles.competencyCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>🎓 Your Competencies</Text>
        </View>

        <Text style={styles.competencySubtitle}>
          Developing skills through the CCR Framework
        </Text>

        <View style={styles.competencyList}>
          {getTopCompetencies().map((competency, animationIndex) => (
            <CompetencyRow key={competency.id} competency={competency} animationDelay={animationIndex * 200} />
          ))}
        </View>

        <TouchableOpacity style={styles.allCompetenciesButton}>
          <Text style={styles.allCompetenciesText}>Explore All Competencies →</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

/**
 * Individual competency row
 */
const CompetencyRow: React.FC<{ competency: UserCompetencyProgress; animationDelay: number }> = ({ competency, animationDelay }) => {
  const progressAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: competency.progress_percent / 100,
      duration: 1200,
      delay: animationDelay,
      useNativeDriver: false,
    }).start();
  }, [competency.progress_percent, progressAnim, animationDelay]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.competencyRow}>
      <Text style={styles.competencyName}>
        Level {competency.level} • {competency.lessons_contributed} lessons
      </Text>
      <View style={styles.competencyProgressBar}>
        <Animated.View
          style={[
            styles.competencyProgressFill,
            {
              width: progressWidth,
            },
          ]}
        />
      </View>
      <Text style={styles.competencyPercent}>{competency.progress_percent}%</Text>
    </View>
  );
};

/**
 * 🚀 QUICK ACTIONS SECTION 🚀
 * 
 * Fast access to main actions!
 * Thumb-friendly layout for one-handed use!
 */
const QuickActionsSection: React.FC = () => {
  return (
    <View style={styles.quickActionsContainer}>
      <Text style={styles.quickActionsTitle}>Quick Actions</Text>

      <View style={styles.actionButtonsGrid}>
        <ActionButton icon="📚" label="Continue Learning" />
        <ActionButton icon="👥" label="Add Friend" />
        <ActionButton icon="🏅" label="Challenges" />
        <ActionButton icon="⚙️" label="Settings" />
      </View>
    </View>
  );
};

/**
 * Individual action button
 */
const ActionButton: React.FC<{ icon: string; label: string }> = ({ icon, label }) => {
  return (
    <TouchableOpacity style={styles.actionButton}>
      <Text style={styles.actionButtonIcon}>{icon}</Text>
      <Text style={styles.actionButtonLabel}>{label}</Text>
    </TouchableOpacity>
  );
};

// ===== STYLES =====

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },

  // Loading & Error
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#E53E3E',
    textAlign: 'center',
  },

  // Header
  header: {
    paddingHorizontal: CARD_MARGIN,
    paddingTop: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },

  // Streak Card
  streakCardGradient: {
    marginHorizontal: CARD_MARGIN,
    marginVertical: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    justifyContent: 'space-between',
  },
  fireIcon: {
    fontSize: 48,
    marginRight: 16,
  },
  streakInfo: {
    flex: 1,
  },
  streakLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  streakNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFF',
    marginVertical: 2,
  },
  streakDays: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  bestStreakContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 16,
  },
  bestStreakLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  bestStreakNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 2,
  },
  motivationalText: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    fontSize: 14,
    color: 'rgba(255,255,255,0.95)',
    fontWeight: '500',
    fontStyle: 'italic',
  },

  // Level Card
  levelCardGradient: {
    marginHorizontal: CARD_MARGIN,
    marginVertical: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  levelCard: {
    padding: 20,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  levelBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  levelNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  xpDisplay: {
    alignItems: 'flex-end',
  },
  xpLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  xpTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 2,
  },
  progressBarContainer: {
    marginBottom: 16,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FCD34D',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  nextLevelHint: {
    marginTop: 12,
    fontSize: 13,
    color: 'rgba(255,255,255,0.95)',
    fontWeight: '600',
  },

  // Achievement Card
  achievementCardGradient: {
    marginHorizontal: CARD_MARGIN,
    marginVertical: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  achievementCard: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  achievementCount: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  achievementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  achievementBadge: {
    width: '18%',
    aspectRatio: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementEmoji: {
    fontSize: 28,
  },
  viewAllButton: {
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
  },
  viewAllText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },

  // League Card
  leagueCardGradient: {
    marginHorizontal: CARD_MARGIN,
    marginVertical: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  leagueCard: {
    padding: 20,
  },
  rankBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  rankText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  leagueDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  leagueDetailItem: {
    flex: 1,
    alignItems: 'center',
  },
  leagueDetailLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    marginBottom: 4,
  },
  leagueDetailValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  leaderboardButton: {
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    marginTop: 8,
  },
  leaderboardButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },

  // Competency Card
  competencyCardGradient: {
    marginHorizontal: CARD_MARGIN,
    marginVertical: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  competencyCard: {
    padding: 20,
  },
  competencySubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 16,
    fontWeight: '500',
  },
  competencyList: {
    marginBottom: 16,
  },
  competencyRow: {
    marginBottom: 16,
  },
  competencyName: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.95)',
    fontWeight: '600',
    marginBottom: 6,
  },
  competencyProgressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  competencyProgressFill: {
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 3,
  },
  competencyPercent: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
    textAlign: 'right',
  },
  allCompetenciesButton: {
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
  },
  allCompetenciesText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },

  // Quick Actions
  quickActionsContainer: {
    paddingHorizontal: CARD_MARGIN,
    marginVertical: 20,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  actionButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    backgroundColor: '#FFF',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  actionButtonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    textAlign: 'center',
  },
});

export default GamificationDashboard;
