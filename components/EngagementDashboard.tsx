import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {
  useUserStreak,
  useActiveChallenges,
  useUserChallengeProgress,
} from '@/lib/api/rsk-hooks';

/**
 * ============================================================================
 * EngagementDashboard Component
 * ============================================================================
 * Demonstrates RSK-002 (Low Engagement) mechanics.
 * Features:
 *  - Display current streak with visual indicator
 *  - Show active seasonal challenges
 *  - Track progress toward challenge completion
 */

export function EngagementDashboard() {
  const { data: streak, isLoading: streakLoading } = useUserStreak();
  const { data: challenges, isLoading: challengesLoading } = useActiveChallenges();
  const { data: progress, isLoading: progressLoading } = useUserChallengeProgress();

  const isLoading = streakLoading || challengesLoading || progressLoading;

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#00d4ff" />
      </View>
    );
  }

  const streakPercentage = Math.min((streak?.current_streak || 0) / 30, 1); // Max 30-day display

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Streak Card */}
      <View style={styles.streakCard}>
        <View style={styles.streakHeader}>
          <Text style={styles.streakLabel}>🔥 Current Streak</Text>
          <Text style={styles.streakValue}>{streak?.current_streak || 0} days</Text>
        </View>

        {/* Streak progress bar */}
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${streakPercentage * 100}%`,
                backgroundColor:
                  streakPercentage > 0.75
                    ? '#10b981' // green
                    : streakPercentage > 0.5
                      ? '#fbbf24' // yellow
                      : '#ff6b6b', // red
              },
            ]}
          />
        </View>

        <View style={styles.streakMeta}>
          <Text style={styles.metaText}>Longest: {streak?.longest_streak || 0} days</Text>
          <Text style={styles.metaText}>Total XP: {streak?.total_xp_earned || 0}</Text>
        </View>
      </View>

      {/* Active Challenges */}
      {challenges && challenges.length > 0 && (
        <View style={styles.challengesContainer}>
          <Text style={styles.sectionTitle}>🎯 Active Challenges</Text>

          {challenges.map((challenge) => {
            const userProgress = progress?.find((p) => p.challenge_id === challenge.id);
            const progressPercentage = Math.min(
              ((userProgress?.current_value || 0) / challenge.target_value) * 100,
              100
            );

            return (
              <View key={challenge.id} style={styles.challengeCard}>
                <View style={styles.challengeHeader}>
                  <Text style={styles.challengeName}>{challenge.name}</Text>
                  <Text style={styles.challengeReward}>+{challenge.xp_reward} XP</Text>
                </View>

                <Text style={styles.challengeDescription}>{challenge.description}</Text>

                {/* Challenge progress */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBar,
                        {
                          width: `${progressPercentage}%`,
                          backgroundColor: userProgress?.completed ? '#10b981' : '#00d4ff',
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {userProgress?.current_value || 0} / {challenge.target_value}
                  </Text>
                </View>

                {userProgress?.completed && (
                  <Text style={styles.completedBadge}>✅ Completed</Text>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Empty state */}
      {(!challenges || challenges.length === 0) && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No active challenges right now</Text>
          <Text style={styles.emptySubText}>Check back soon for seasonal events!</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#0f1113',
  },
  streakCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ff6b6b33',
  },
  streakHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  streakLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  streakValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ff6b6b',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: 12,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  streakMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#cbd5e1',
  },
  challengesContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
  },
  challengeCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  challengeName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
  },
  challengeReward: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10b981',
  },
  challengeDescription: {
    fontSize: 13,
    color: '#cbd5e1',
    marginBottom: 10,
  },
  progressContainer: {
    marginVertical: 8,
  },
  progressText: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
    textAlign: 'right',
  },
  completedBadge: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#cbd5e1',
  },
  emptySubText: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 8,
  },
});
