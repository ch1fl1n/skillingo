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
import BiasChallengesPlaceholder from '@/components/BiasChallengesPlaceholder';
import type { MasteryEvaluation } from '@/types/mastery-evaluation.types';
import { formatEvaluationForStudent } from '@/lib/mastery-evaluator';

/**
 * Pantalla de lección con optimizaciones de performance:
 * - Skeleton UI mientras carga
 * - Imágenes con blurhash placeholder
 * - Prefetch de siguiente lección
 * - Progress submit optimista con offline queue
 * - Muestra evaluaciones de Gemini si vienen en params
 */
export default function LessonScreen() {
  const { lessonId, evaluation, fromEvaluation } = useLocalSearchParams<{ lessonId: string; evaluation?: string; fromEvaluation?: string }>();
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

  // Parse evaluation if present
  let evaluationData: MasteryEvaluation | null = null;
  if (evaluation && fromEvaluation === 'true') {
    try {
      evaluationData = JSON.parse(evaluation);
    } catch (e) {
      console.error('Error parsing evaluation:', e);
    }
  }

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

  // If we have evaluation data, show it
  if (evaluationData && fromEvaluation === 'true') {
    return <EvaluationResultScreen evaluation={evaluationData} router={router} />;
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <SkeletonLoader />
        <BiasChallengesPlaceholder 
          title="Desafío de Sesgo"
          message="Cargando el desafío..."
          isLoading={true}
        />
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
            ⏱ {lesson.estimatedDuration || 15} minutos
          </Text>
          {progress && (
            <Text style={styles.progressText}>
              Progreso: {progress.progress_percent}%
            </Text>
          )}
        </View>

        {/* Content */}
        <View style={styles.contentSection}>
          <Text style={styles.contentText}>{lesson.description || 'Descripción'}</Text>
          <Text style={styles.contentBody}>
            {renderLessonContent(lesson.content)}
          </Text>
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
 * Componente para mostrar resultados de evaluación
 */
function EvaluationResultScreen({ evaluation, router }: { evaluation: MasteryEvaluation; router: ReturnType<typeof useRouter> }) {
  const feedbackText = formatEvaluationForStudent(evaluation);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.headerClose}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Resultados</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.evaluationContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Overall Mastery Status */}
        <View style={[styles.masteryBadge, evaluation.overallMastery === 'achieved' ? styles.masteryAchieved : styles.masteryNotAchieved]}>
          <Text style={styles.masteryText}>
            {evaluation.overallMastery === 'achieved' ? '✅ DOMINIO LOGRADO' : '📚 CONTINÚA PRACTICANDO'}
          </Text>
          <Text style={styles.scoreText}>Puntuación: {evaluation.overallScore}/100</Text>
        </View>

        {/* Conversational Feedback */}
        <View style={styles.feedbackSection}>
          <Text style={styles.feedbackTitle}>Tu Retroalimentación</Text>
          <Text style={styles.feedbackText}>{feedbackText}</Text>
        </View>

        {/* Detailed Objectives */}
        <View style={styles.objectivesSection}>
          <Text style={styles.objectivesTitle}>Objetivos de Aprendizaje</Text>
          {evaluation.objectives.map((obj, idx) => (
            <View key={obj.objectiveId} style={styles.objectiveItem}>
              <View style={styles.objectiveHeader}>
                <Text style={styles.objectiveNumber}>{idx + 1}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.objectiveStatus}>
                    {obj.mastery === 'achieved' ? '✅ Logrado' : '🔄 No logrado'}
                  </Text>
                </View>
              </View>
              <Text style={styles.objectiveAssessment}>{obj.qualitativeAssessment}</Text>
              {obj.suggestions.length > 0 && (
                <View style={styles.suggestionsBox}>
                  <Text style={styles.suggestionsTitle}>💡 Sugerencias:</Text>
                  {obj.suggestions.map((sug, i) => (
                    <Text key={i} style={styles.suggestionItem}>
                      • {sug}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Next Steps */}
        {evaluation.nextSteps.length > 0 && (
          <View style={styles.nextStepsSection}>
            <Text style={styles.nextStepsTitle}>📈 Próximos Pasos</Text>
            {evaluation.nextSteps.map((step, idx) => (
              <Text key={idx} style={styles.nextStepItem}>
                {idx + 1}. {step}
              </Text>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.back()}>
            <Text style={styles.primaryButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>

        <View style={{ marginBottom: 40 }} />
      </ScrollView>
    </View>
  );
}

/**
 * Extrae y renderiza el contenido de la lección según su estructura
 */
function renderLessonContent(content: any): string {
  if (!content) return 'Sin contenido disponible.';
  
  // Si es string, retornar directamente
  if (typeof content === 'string') return content;
  
  // Si tiene formato simple {question: "..."}
  if (content.question) {
    return content.question;
  }
  
  // Si tiene formato completo con steps
  if (content.introduction) {
    let text = content.introduction;
    if (content.steps && content.steps.length > 0) {
      text += '\n\nPasos:\n';
      content.steps.forEach((step: any, idx: number) => {
        text += `\n${idx + 1}. ${step.title || ''}`;
        if (step.content) text += `\n${step.content}`;
      });
    }
    return text;
  }
  
  // Fallback: intentar JSON.stringify legible
  try {
    return JSON.stringify(content, null, 2);
  } catch {
    return 'Contenido no disponible.';
  }
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
  // Evaluation Result Styles
  evaluationContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  masteryBadge: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  masteryAchieved: {
    backgroundColor: '#10b981',
  },
  masteryNotAchieved: {
    backgroundColor: '#f59e0b',
  },
  masteryText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  scoreText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  feedbackSection: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#00d4ff',
  },
  feedbackTitle: {
    color: '#00d4ff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  feedbackText: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 22,
  },
  objectivesSection: {
    marginBottom: 24,
  },
  objectivesTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  objectiveItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#8b5cf6',
  },
  objectiveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  objectiveNumber: {
    color: '#8b5cf6',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 12,
    minWidth: 24,
  },
  objectiveStatus: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  objectiveAssessment: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 12,
  },
  suggestionsBox: {
    backgroundColor: '#111111',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  suggestionsTitle: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  suggestionItem: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4,
  },
  nextStepsSection: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  nextStepsTitle: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  nextStepItem: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 8,
  },
  actionButtons: {
    gap: 12,
    marginTop: 12,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#00d4ff',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
});
