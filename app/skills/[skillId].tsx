import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getSkillById, getLessonsBySkillId } from '@/lib/db';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import type { Skill, LessonWithCompletion, Difficulty } from '@/types/lesson.types';

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: '#10b981',
  medium: '#f59e0b',
  hard: '#ef4444',
};

export default function LessonsListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const skillId = parseInt(params.skillId as string, 10);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [skill, setSkill] = useState<Skill | null>(null);
  const [lessons, setLessons] = useState<LessonWithCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [skillId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [skillData, lessonsData] = await Promise.all([
        getSkillById(skillId),
        getLessonsBySkillId(skillId),
      ]);
      setSkill(skillData);
      setLessons(lessonsData);
    } catch (err) {
      console.error('Error loading lessons:', err);
      setError(err instanceof Error ? err.message : 'Failed to load lessons');
    } finally {
      setLoading(false);
    }
  };

  const renderLessonCard = ({ item }: { item: LessonWithCompletion }) => {
    const difficultyColor = DIFFICULTY_COLORS[item.difficulty];

    return (
      <TouchableOpacity
        style={[
          styles.lessonCard,
          { backgroundColor: colors.surface?.default || '#f5f5f5' },
          item.completed && styles.completedCard,
        ]}
        onPress={() => router.push(`/lesson/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.lessonHeader}>
          <View style={styles.lessonTitleRow}>
            <Text style={[styles.lessonTitle, { color: colors.text }]} numberOfLines={2}>
              {item.title}
            </Text>
            {item.completed && (
              <MaterialCommunityIcons name="check-circle" size={24} color="#10b981" />
            )}
          </View>
        </View>

        <View style={styles.lessonMeta}>
          <View style={[styles.difficultyBadge, { backgroundColor: difficultyColor }]}>
            <Text style={styles.difficultyText}>
              {item.difficulty.charAt(0).toUpperCase() + item.difficulty.slice(1)}
            </Text>
          </View>

          <View style={styles.xpBadge}>
            <MaterialCommunityIcons name="star" size={16} color="#f59e0b" />
            <Text style={styles.xpText}>{item.xp_reward} XP</Text>
          </View>
        </View>

        {item.completed && item.user_score !== null && (
          <Text style={styles.scoreText}>Score: {Math.round(item.user_score)}%</Text>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary?.['500'] || '#3b82f6'} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading lessons...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <MaterialCommunityIcons name="alert-circle" size={48} color="#ef4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const completedCount = lessons.filter(l => l.completed).length;
  const progressPercent = lessons.length > 0 ? (completedCount / lessons.length) * 100 : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={[styles.skillName, { color: colors.text }]}>{skill?.name}</Text>
          {skill?.description && (
            <Text style={[styles.skillDescription, { color: colors.neutral?.['500'] || '#6b7280' }]}>
              {skill.description}
            </Text>
          )}

          <View style={styles.statsRow}>
            <Text style={[styles.statsText, { color: colors.text }]}>
              {completedCount} / {lessons.length} lessons completed
            </Text>
            <Text style={[styles.statsText, { color: colors.text }]}>
              {Math.round(progressPercent)}%
            </Text>
          </View>

          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { backgroundColor: colors.neutral?.['200'] || '#e5e7eb' }]}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progressPercent}%`, backgroundColor: colors.primary?.['500'] || '#3b82f6' },
                ]}
              />
            </View>
          </View>
        </View>
      </View>

      <FlatList
        data={lessons}
        renderItem={renderLessonCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="book-open-variant" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>No lessons available yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginBottom: 12,
  },
  headerContent: {
    marginTop: 8,
  },
  skillName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  skillDescription: {
    fontSize: 16,
    marginBottom: 16,
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statsText: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressBarContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  listContent: {
    padding: 20,
    paddingTop: 8,
  },
  lessonCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  completedCard: {
    borderWidth: 2,
    borderColor: '#10b981',
  },
  lessonHeader: {
    marginBottom: 12,
  },
  lessonTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  lessonTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  lessonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  difficultyText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  xpText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#f59e0b',
  },
  scoreText: {
    marginTop: 8,
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#9ca3af',
  },
});
