import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useLesson, useCompleteLessonMutation, useUserProgress } from '@/lib/api/lessons';
import { usePerf } from '@/components/tutorial/PerfProvider';

/**
 * Pantalla de lección con optimizaciones de performance:
 * - Skeleton UI mientras carga
 * - Imágenes con blurhash placeholder
 * - Prefetch de siguiente lección
 * - Progress submit optimista con offline queue
 */
export default function LessonScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const router = useRouter();

  const lessonIdNum = parseInt(lessonId || '', 10);
  const { data: lesson, isLoading, error } = useLesson(lessonIdNum, true);
  const { data: progress } = useUserProgress(lesson?.skill_id || 0);
  const completeMutation = useCompleteLessonMutation();
  const { mark, measure } = usePerf();

  useEffect(() => {
    if (lessonId) {
      mark('lesson-screen-enter');
      measure('lesson-screen-enter', 'lesson-screen-enter', {
        lessonId: lessonIdNum,
      });
    }
  }, [lessonId, mark, measure, lessonIdNum]);

  const handleCompleteLesson = async () => {
    if (!lesson) return;

    mark('lesson-complete-start');
    const xpGained = 50; // Valor fijo por completar

    try {
      const result = await completeMutation.mutateAsync({
        lessonId: lesson.id,
        skillId: lesson.skill_id!,
        xpGained,
      });

      measure('lesson-complete-success', 'lesson-complete-start', {
        lessonId: lesson.id,
        offline: result.offline,
      });

      // Mostrar feedback y navegar
      if (result.offline) {
        alert('Lección completada (offline - se sincronizará)');
      } else {
        alert(`¡Lección completada! +${xpGained} XP`);
      }

      router.back();
    } catch (err) {
      console.error('[Lesson] Error completing:', err);
      measure('lesson-complete-error', 'lesson-complete-start', {
        error: String(err),
      });
      alert('Error al completar lección. Intenta de nuevo.');
    }
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error loading lesson</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.errorLink}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <SkeletonLoader />
      </View>
    );
  }

  if (!lesson) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Lesson not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.errorLink}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.headerClose}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {lesson.title}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image */}
        {lesson.imageUrl && (
          <View style={styles.heroContainer}>
            <Image
              source={{ uri: lesson.imageUrl }}
              style={styles.heroImage}
              defaultSource={{ uri: lesson.blurhash }}
            />
          </View>
        )}

        {/* Metadata */}
        <View style={styles.metadata}>
          <Text style={styles.duration}>
            ⏱ {lesson.estimatedDuration} minutos
          </Text>
          {progress && (
            <Text style={styles.progressText}>
              Progreso: {progress.progress_percent}%
            </Text>
          )}
        </View>

        {/* Content */}
        <View style={styles.contentSection}>
          <Text style={styles.contentText}>{lesson.description}</Text>
          <Text style={styles.contentBody}>{String(lesson.content)}</Text>
        </View>

        {/* Button */}
        <TouchableOpacity
          style={[
            styles.completeButton,
            completeMutation.isPending && styles.completeButtonDisabled,
          ]}
          onPress={handleCompleteLesson}
          disabled={completeMutation.isPending}
        >
          {completeMutation.isPending ? (
            <ActivityIndicator color="#000" size="small" />
          ) : (
            <Text style={styles.completeButtonText}>Complete Lesson</Text>
          )}
        </TouchableOpacity>

        <View style={{ marginBottom: 40 }} />
      </ScrollView>
    </View>
  );
}

/**
 * Skeleton loader para UX mientras carga
 */
function SkeletonLoader() {
  return (
    <View style={styles.skeletonContainer}>
      <View style={[styles.skeleton, { height: 200, marginBottom: 16 }]} />
      <View style={[styles.skeleton, { height: 16, marginBottom: 12 }]} />
      <View style={[styles.skeleton, { height: 16, width: '80%', marginBottom: 24 }]} />
      <View style={[styles.skeleton, { height: 100, marginBottom: 16 }]} />
      <View style={[styles.skeleton, { height: 48 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1113',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  headerClose: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  heroContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#1a1a1a',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  metadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 16,
    paddingHorizontal: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
  },
  duration: {
    color: '#cbd5e1',
    fontSize: 14,
  },
  progressText: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600',
  },
  contentSection: {
    marginBottom: 24,
  },
  contentText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  contentBody: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
  },
  completeButton: {
    backgroundColor: '#00d4ff',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 20,
  },
  completeButtonDisabled: {
    opacity: 0.6,
  },
  completeButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#0f1113',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 16,
  },
  errorLink: {
    color: '#00d4ff',
    fontSize: 14,
    fontWeight: '600',
  },
  skeletonContainer: {
    padding: 16,
  },
  skeleton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
  },
});
