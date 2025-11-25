/**
 * MASTERY ASSESSMENT REACT HOOKS
 * 
 * React Query hooks for mastery-based assessment operations.
 * Provides easy-to-use interfaces for lesson evaluation and community post moderation.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  assessLesson,
  assessCommunityPost,
  assessMilestoneProgress,
  getMasteryProgressHistory,
  assessLessonsBatch,
  type LessonMasteryInput,
  type CommunityPostMasteryInput,
  type MilestoneProgressInput,
  type MilestoneAssessmentResult,
  type MilestoneAchievementFeedback,
  type MasteryAssessmentResult,
  type CommunityPostAssessment,
  type MasteryProgressHistory,
  type BatchMasteryResult
} from '@/lib/api/mastery-assessment';

// ==================== QUERY KEYS ====================

export const masteryKeys = {
  all: ['mastery'] as const,
  lessons: () => [...masteryKeys.all, 'lessons'] as const,
  lesson: (id: string | number) => [...masteryKeys.lessons(), id] as const,
  posts: () => [...masteryKeys.all, 'posts'] as const,
  post: (id: number) => [...masteryKeys.posts(), id] as const,
  history: (userId: string, skillId: number) => 
    [...masteryKeys.all, 'history', userId, skillId] as const,
};

// ==================== LESSON ASSESSMENT HOOKS ====================

/**
 * Hook for assessing a single lesson
 * 
 * @example
 * ```tsx
 * function LessonQuiz() {
 *   const assessMutation = useAssessLesson();
 *   
 *   const handleSubmit = async (answers: TaskResult[]) => {
 *     const result = await assessMutation.mutateAsync({
 *       lessonId: 123,
 *       userId: currentUser.id,
 *       objectives: lessonObjectives,
 *       tasks: answers,
 *       language: 'es'
 *     });
 *     
 *     if (result.data?.overall_mastery) {
 *       navigate('/next-lesson');
 *     } else {
 *       showFeedback(result.data?.conversational_summary);
 *     }
 *   };
 *   
 *   return (
 *     <QuizForm 
 *       onSubmit={handleSubmit}
 *       isLoading={assessMutation.isPending}
 *     />
 *   );
 * }
 * ```
 */
export function useAssessLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: LessonMasteryInput) => {
      const response = await assessLesson(input);
      if (!response.success) {
        throw new Error(response.error?.message || 'Assessment failed');
      }
      return response;
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ 
        queryKey: masteryKeys.lesson(variables.lessonId) 
      });
      
      if (variables.userId) {
        queryClient.invalidateQueries({ 
          queryKey: masteryKeys.history(
            variables.userId, 
            Number(variables.objectives[0]?.category || 0)
          ) 
        });
      }
    },
  });
}

/**
 * Hook for batch lesson assessment
 * 
 * @example
 * ```tsx
 * function BatchAssessment() {
 *   const batchMutation = useAssessLessonsBatch();
 *   
 *   const handleBatchSubmit = async (assessments: LessonMasteryInput[]) => {
 *     const result = await batchMutation.mutateAsync(assessments);
 *     console.log(`Processed: ${result.data?.successful}/${result.data?.total_processed}`);
 *   };
 *   
 *   return <BatchForm onSubmit={handleBatchSubmit} />;
 * }
 * ```
 */
export function useAssessLessonsBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inputs: LessonMasteryInput[]) => {
      const response = await assessLessonsBatch(inputs);
      if (!response.success) {
        throw new Error(response.error?.message || 'Batch assessment failed');
      }
      return response;
    },
    onSuccess: () => {
      // Invalidate all lesson queries
      queryClient.invalidateQueries({ queryKey: masteryKeys.lessons() });
    },
  });
}

// ==================== COMMUNITY POST ASSESSMENT HOOKS ====================

/**
 * Hook for assessing a community post
 * 
 * @example
 * ```tsx
 * function PostModerationPanel({ post }: { post: CommunityPostRow }) {
 *   const assessMutation = useAssessCommunityPost();
 *   
 *   const handleModerate = async () => {
 *     const result = await assessMutation.mutateAsync({
 *       postId: post.id,
 *       title: post.title,
 *       content: post.content,
 *       category: post.category || undefined,
 *       authorId: post.user_id || undefined,
 *       language: 'es'
 *     });
 *     
 *     if (result.data?.should_approve) {
 *       toast.success('Post approved!');
 *     } else {
 *       showFeedback(result.data?.conversational_feedback);
 *     }
 *   };
 *   
 *   return (
 *     <Button onClick={handleModerate} disabled={assessMutation.isPending}>
 *       {assessMutation.isPending ? 'Evaluating...' : 'Moderate Post'}
 *     </Button>
 *   );
 * }
 * ```
 */
export function useAssessCommunityPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CommunityPostMasteryInput) => {
      const response = await assessCommunityPost(input);
      if (!response.success) {
        throw new Error(response.error?.message || 'Post assessment failed');
      }
      return response;
    },
    onSuccess: (data, variables) => {
      // Invalidate post queries
      queryClient.invalidateQueries({ 
        queryKey: masteryKeys.post(variables.postId) 
      });
      
      // Refetch community posts list
      queryClient.invalidateQueries({ 
        queryKey: ['community', 'posts'] 
      });
    },
  });
}

// ==================== PROGRESS TRACKING HOOKS ====================

/**
 * Hook for fetching mastery progress history
 * 
 * @example
 * ```tsx
 * function ProgressDashboard({ userId, skillId }: Props) {
 *   const { data, isLoading } = useMasteryHistory(userId, skillId);
 *   
 *   if (isLoading) return <Spinner />;
 *   
 *   return (
 *     <div>
 *       <h2>Current Level: {data?.data?.current_mastery_level}</h2>
 *       <p>Trend: {data?.data?.overall_trend}</p>
 *       <AssessmentTimeline assessments={data?.data?.assessments} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useMasteryHistory(
  userId: string | undefined,
  skillId: number | undefined,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  }
) {
  return useQuery({
    queryKey: masteryKeys.history(userId || '', skillId || 0),
    queryFn: async () => {
      if (!userId || !skillId) {
        throw new Error('userId and skillId are required');
      }
      const response = await getMasteryProgressHistory(userId, skillId);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch history');
      }
      return response;
    },
    enabled: Boolean(userId && skillId) && (options?.enabled !== false),
    refetchInterval: options?.refetchInterval,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ==================== UTILITY HOOKS ====================

/**
 * Hook for real-time assessment feedback display
 * 
 * @example
 * ```tsx
 * function AssessmentFeedback({ assessment }: { assessment: MasteryAssessmentResult }) {
 *   const feedback = useAssessmentFeedback(assessment);
 *   
 *   return (
 *     <div>
 *       <h3>{feedback.title}</h3>
 *       <p>{feedback.summary}</p>
 *       <div>
 *         {feedback.objectives.map(obj => (
 *           <ObjectiveFeedbackCard key={obj.id} objective={obj} />
 *         ))}
 *       </div>
 *       {feedback.showRetry && <Button>Try Again</Button>}
 *       {feedback.showAdvance && <Button>Next Lesson</Button>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useAssessmentFeedback(assessment: MasteryAssessmentResult | undefined) {
  if (!assessment) {
    return {
      title: '',
      summary: '',
      objectives: [],
      showRetry: false,
      showAdvance: false,
      masteryLevel: 'no_dominio' as const,
    };
  }

  const title = assessment.overall_mastery 
    ? '¡Felicidades! Has logrado dominio' 
    : assessment.mastery_level === 'parcial'
      ? 'Buen progreso - Dominio parcial'
      : 'Necesitas más práctica';

  return {
    title,
    summary: assessment.conversational_summary,
    objectives: assessment.objectives,
    showRetry: assessment.recommendations.should_retry,
    showAdvance: assessment.recommendations.should_advance,
    masteryLevel: assessment.mastery_level,
    gradeLabel: assessment.grade_derivation.recommended_grade_label,
    masteryPercentage: assessment.grade_derivation.mastery_percentage,
    practiceFocus: assessment.recommendations.practice_focus,
    estimatedTime: assessment.recommendations.estimated_time_to_mastery,
  };
}

/**
 * Hook for post assessment feedback display
 * 
 * @example
 * ```tsx
 * function PostFeedback({ assessment }: { assessment: CommunityPostAssessment }) {
 *   const feedback = usePostFeedback(assessment);
 *   
 *   return (
 *     <div className={feedback.statusColor}>
 *       <h3>{feedback.statusText}</h3>
 *       <p>{feedback.summary}</p>
 *       <CriteriaList criteria={feedback.criteria} />
 *       {feedback.suggestions.length > 0 && (
 *         <ImprovementSuggestions items={feedback.suggestions} />
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function usePostFeedback(assessment: CommunityPostAssessment | undefined) {
  if (!assessment) {
    return {
      statusText: '',
      statusColor: 'gray',
      summary: '',
      criteria: [],
      suggestions: [],
      shouldApprove: false,
    };
  }

  const statusText = assessment.should_approve
    ? 'Aprobado'
    : assessment.overall_quality === 'parcial'
      ? 'Requiere Revisión'
      : 'No Aprobado';

  const statusColor = assessment.should_approve
    ? 'green'
    : assessment.overall_quality === 'parcial'
      ? 'yellow'
      : 'red';

  return {
    statusText,
    statusColor,
    summary: assessment.conversational_feedback,
    criteria: assessment.criteria_evaluations,
    suggestions: assessment.improvement_suggestions,
    shouldApprove: assessment.should_approve,
    overallScore: assessment.grade_derivation.overall_score,
    recommendation: assessment.grade_derivation.recommendation,
    explanation: assessment.grade_derivation.explanation,
  };
}

// ==================== COMBINED HOOKS ====================

/**
 * Combined hook for lesson assessment with automatic feedback handling
 * 
 * @example
 * ```tsx
 * function SmartQuiz() {
 *   const {
 *     assess,
 *     isAssessing,
 *     feedback,
 *     reset
 *   } = useLessonAssessmentFlow();
 *   
 *   const handleSubmit = (answers: TaskResult[]) => {
 *     assess({
 *       lessonId: 123,
 *       userId: currentUser.id,
 *       objectives: objectives,
 *       tasks: answers
 *     });
 *   };
 *   
 *   if (feedback) {
 *     return <FeedbackScreen feedback={feedback} onReset={reset} />;
 *   }
 *   
 *   return <QuizForm onSubmit={handleSubmit} isLoading={isAssessing} />;
 * }
 * ```
 */
export function useLessonAssessmentFlow() {
  const mutation = useAssessLesson();
  const [currentAssessment, setCurrentAssessment] = 
    React.useState<MasteryAssessmentResult | undefined>(undefined);

  const assess = React.useCallback((input: LessonMasteryInput) => {
    mutation.mutate(input, {
      onSuccess: (response) => {
        if (response.data) {
          setCurrentAssessment(response.data);
        }
      },
    });
  }, [mutation]);

  const reset = React.useCallback(() => {
    setCurrentAssessment(undefined);
    mutation.reset();
  }, [mutation]);

  const feedback = useAssessmentFeedback(currentAssessment);

  return {
    assess,
    isAssessing: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    feedback: currentAssessment ? feedback : undefined,
    assessment: currentAssessment,
    reset,
  };
}

// Import React for useState and useCallback
import * as React from 'react';

// ==================== MILESTONE ASSESSMENT HOOKS ====================

/**
 * Hook for assessing milestone progress
 */
export function useMilestoneAssessment() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: assessMilestoneProgress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestone_progress'] });
    },
  });

  return {
    assessMilestone: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data?.data,
  };
}

/**
 * Hook for fetching milestone progress history
 */
export function useMilestoneProgress(userId: string, skillId: number) {
  return useQuery({
    queryKey: ['milestone_progress', userId, skillId],
    queryFn: async () => {
      // This would fetch from your API or database
      // For now, returns placeholder structure
      return {
        current_milestone: {} as MilestoneAssessmentResult['current_milestone'],
        progress_percentage: 0,
        days_until_next_milestone: 0,
        estimated_completion_date: undefined,
      };
    },
    enabled: !!userId && !!skillId,
  });
}

/**
 * Hook for tracking milestone achievements across skills
 */
export function useMilestoneAchievements(userId: string) {
  return useQuery({
    queryKey: ['milestone_achievements', userId],
    queryFn: async () => {
      // Fetch all milestone achievements for user
      return [] as MilestoneAssessmentResult[];
    },
    enabled: !!userId,
  });
}

/**
 * Complete milestone assessment flow hook
 */
export function useMilestoneAssessmentFlow(skillId: number) {
  const [currentScore, setCurrentScore] = React.useState(0);
  const [previousScore, setPreviousScore] = React.useState<number>();
  const [assessment, setAssessment] = React.useState<MilestoneAssessmentResult>();
  
  const assessMutation = useMutation({
    mutationFn: async (input: MilestoneProgressInput) => {
      const response = await assessMilestoneProgress(input);
      if (response.success && response.data) {
        setAssessment(response.data);
        return response.data;
      }
      throw new Error(response.error?.message || 'Assessment failed');
    },
  });

  const handleAssessProgress = React.useCallback(
    (score: number, prevScore?: number) => {
      setCurrentScore(score);
      setPreviousScore(prevScore);
      
      return assessMutation.mutateAsync({
        user_id: '', // Would come from auth context
        skill_id: skillId,
        current_score: score,
        previous_score: prevScore,
        language: 'es',
      });
    },
    [skillId, assessMutation]
  );

  const reset = React.useCallback(() => {
    setAssessment(undefined);
    setCurrentScore(0);
    setPreviousScore(undefined);
    assessMutation.reset();
  }, [assessMutation]);

  return {
    assess: handleAssessProgress,
    isPending: assessMutation.isPending,
    isSuccess: assessMutation.isSuccess,
    isError: assessMutation.isError,
    error: assessMutation.error,
    assessment,
    currentScore,
    previousScore,
    reset,
  };
}

// Re-export types for convenience
export type {
  LessonMasteryInput,
  CommunityPostMasteryInput,
  MasteryAssessmentResult,
  CommunityPostAssessment,
  MasteryProgressHistory,
  BatchMasteryResult,
  MilestoneAssessmentResult,
  MilestoneProgressInput,
  MilestoneAchievementFeedback,
};
