/**
 * MASTERY-BASED ASSESSMENT API
 * 
 * Comprehensive API for evaluating learning outcomes using mastery-based principles:
 * - Constructive conversational feedback
 * - Mastery (dominio) vs non-mastery (no dominio) communication
 * - Objective-based achievement tracking
 * - Grade derivation from mastery levels
 * 
 * This module integrates with:
 * - Gemini API for AI-powered feedback generation
 * - Supabase for persistence
 * - Community posts for content moderation
 * - Lesson assessments for learning evaluation
 */

import { 
  generateEnhancedLessonFeedback,
  evaluateCommunityPost,
  generateMilestoneEvaluation,
  type EnhancedLessonInput,
  type EnhancedLessonResult,
  type CommunityPostInput,
  type CommunityPostEvaluation,
  type MasteryObjective,
  type QuestionResult,
  type MilestoneEvaluationInput,
  type MilestoneEvaluationResult
} from '@/lib/gemini';

import type {
  MasteryAssessmentResult,
  LessonMasteryInput,
  CommunityPostMasteryInput,
  CommunityPostAssessment,
  MasteryAPIResponse,
  ObjectiveFeedback,
  AchievementStatus,
  MasteryProgressHistory,
  BatchMasteryResult,
  MilestoneAssessmentResult,
  MilestoneProgressInput,
  MilestoneAchievementFeedback,
  MilestoneUnlock,
  ProficiencyMilestone,
  CEFRLevel
} from '@/types/mastery-assessment.types';

import { supabase } from '@/lib/supabase';

// ==================== LESSON ASSESSMENT ====================

/**
 * Evaluate a lesson attempt using mastery-based assessment
 * 
 * @param input - Lesson assessment input with objectives and task results
 * @returns Complete mastery assessment with conversational feedback
 * 
 * @example
 * ```typescript
 * const result = await assessLesson({
 *   lessonId: 123,
 *   userId: 'user-uuid',
 *   objectives: [
 *     { id: 'obj1', label: 'Understand variables' },
 *     { id: 'obj2', label: 'Write basic functions' }
 *   ],
 *   tasks: [
 *     { id: 'q1', objectiveId: 'obj1', correct: true },
 *     { id: 'q2', objectiveId: 'obj1', correct: true },
 *     { id: 'q3', objectiveId: 'obj2', correct: false }
 *   ],
 *   language: 'es'
 * });
 * 
 * console.log(result.conversational_summary);
 * console.log(result.grade_derivation.recommended_grade_label);
 * ```
 */
export async function assessLesson(
  input: LessonMasteryInput
): Promise<MasteryAPIResponse<MasteryAssessmentResult>> {
  try {
    const assessmentId = `assess_${input.lessonId}_${Date.now()}`;
    
    // Convert to Gemini API format
    const geminiInput: EnhancedLessonInput = {
      lessonId: input.lessonId,
      userId: input.userId,
      assessmentId,
      objectives: input.objectives.map(obj => ({
        id: obj.id,
        label: obj.label
      })),
      questions: input.tasks.map(task => ({
        id: task.id,
        objectiveId: task.objectiveId,
        correct: task.correct,
        selectedIndex: task.selectedIndex,
        correctIndex: task.correctIndex
      })),
      passingScore: input.passingThreshold || 70,
      language: input.language || 'es',
      includeRecommendations: true
    };

    const geminiResult = await generateEnhancedLessonFeedback(geminiInput);

    // Transform to our standard format
    const result: MasteryAssessmentResult = {
      assessment_id: assessmentId,
      assessed_at: geminiResult.assessed_at,
      overall_mastery: geminiResult.overall_mastery,
      mastery_level: geminiResult.mastery_level,
      conversational_summary: geminiResult.conversational_summary,
      objectives: geminiResult.objectives.map(obj => ({
        id: obj.id,
        label: obj.label,
        status: obj.achieved ? 'logrado' : 'no_logrado',
        qualitative: {
          strengths: obj.achieved 
            ? [obj.qualitative_feedback]
            : [],
          areas_for_improvement: !obj.achieved 
            ? [obj.qualitative_feedback]
            : [],
          personalized_message: obj.suggested_next_step
        },
        quantitative: {
          correct_count: parseInt(obj.quantitative_feedback.split('/')[0]) || 0,
          total_count: parseInt(obj.quantitative_feedback.split('/')[1]) || 0,
          percentage: parseFloat(obj.quantitative_feedback.match(/\d+/)?.[0] || '0')
        },
        suggested_next_steps: [obj.suggested_next_step]
      })),
      grade_derivation: geminiResult.grade_derivation,
      recommendations: geminiResult.recommendations,
      metadata: {
        lesson_id: input.lessonId,
        user_id: input.userId,
        skill_id: input.objectives[0]?.category
      }
    };

    // Optionally persist to database
    if (input.userId) {
      await persistLessonAssessment(result);
    }

    return {
      success: true,
      data: result,
      metadata: {
        timestamp: new Date().toISOString(),
        request_id: assessmentId
      }
    };

  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error during assessment',
        code: 'ASSESSMENT_ERROR',
        details: error
      },
      metadata: {
        timestamp: new Date().toISOString()
      }
    };
  }
}

/**
 * Persist lesson assessment to database
 */
async function persistLessonAssessment(
  assessment: MasteryAssessmentResult
): Promise<void> {
  if (!assessment.metadata?.user_id || !assessment.metadata?.lesson_id) {
    return;
  }

  // Store in lesson_attempts table
  const { error: attemptError } = await supabase
    .from('lesson_attempts')
    .insert({
      user_id: assessment.metadata.user_id,
      lesson_id: Number(assessment.metadata.lesson_id),
      score: assessment.grade_derivation.numeric_equivalent || null,
      completed: assessment.overall_mastery,
      attempted_at: assessment.assessed_at
    });

  if (attemptError) {
    console.error('Failed to persist lesson attempt:', attemptError);
  }

  // Update proficiency scores if skill_id is available
  if (assessment.metadata.skill_id) {
    const masteryScore = assessment.overall_mastery ? 100 : 
      Math.round(assessment.grade_derivation.mastery_percentage);

    const { error: proficiencyError } = await supabase
      .from('skill_proficiency_scores')
      .upsert({
        user_id: assessment.metadata.user_id,
        skill_id: Number(assessment.metadata.skill_id),
        current_score: masteryScore,
        confidence_interval: 10,
        last_assessed: assessment.assessed_at,
        cefr_level: assessment.overall_mastery ? 'high_b1' : 'a2'
      });

    if (proficiencyError) {
      console.error('Failed to update proficiency score:', proficiencyError);
    }
  }
}

// ==================== COMMUNITY POST ASSESSMENT ====================

/**
 * Evaluate a community post for moderation using mastery-based criteria
 * 
 * @param input - Community post to evaluate
 * @returns Assessment with approval recommendation and feedback
 * 
 * @example
 * ```typescript
 * const result = await assessCommunityPost({
 *   postId: 456,
 *   title: 'How to use React Hooks',
 *   content: 'Here is a detailed explanation...',
 *   category: 'tutorials',
 *   authorId: 'user-uuid',
 *   language: 'es'
 * });
 * 
 * if (result.data?.should_approve) {
 *   await approvePost(456);
 * }
 * ```
 */
export async function assessCommunityPost(
  input: CommunityPostMasteryInput
): Promise<MasteryAPIResponse<CommunityPostAssessment>> {
  try {
    const geminiInput: CommunityPostInput = {
      postId: input.postId,
      title: input.title,
      content: input.content,
      category: input.category,
      criteria: input.criteria,
      language: input.language || 'es'
    };

    const geminiResult = await evaluateCommunityPost(geminiInput);

    // Transform to our standard format
    const result: CommunityPostAssessment = {
      post_id: input.postId,
      assessed_at: new Date().toISOString(),
      overall_quality: geminiResult.overall_quality,
      should_approve: geminiResult.should_approve,
      criteria_evaluations: geminiResult.criteria.map(c => ({
        criterion_id: c.criterion_id,
        criterion_name: c.criterion_name,
        status: c.achieved ? 'logrado' : 'no_logrado',
        score: c.score,
        feedback: c.feedback,
        suggestions: c.suggestions
      })),
      conversational_feedback: geminiResult.conversational_feedback,
      improvement_suggestions: geminiResult.improvement_suggestions,
      grade_derivation: geminiResult.grade_derivation
    };

    // Optionally update post status
    if (input.authorId) {
      await updatePostStatus(input.postId, result);
    }

    return {
      success: true,
      data: result,
      metadata: {
        timestamp: new Date().toISOString(),
        request_id: `post_assess_${input.postId}_${Date.now()}`
      }
    };

  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error during post assessment',
        code: 'POST_ASSESSMENT_ERROR',
        details: error
      },
      metadata: {
        timestamp: new Date().toISOString()
      }
    };
  }
}

/**
 * Update community post status based on assessment
 */
async function updatePostStatus(
  postId: number,
  assessment: CommunityPostAssessment
): Promise<void> {
  const newStatus = assessment.should_approve ? 'approved' : 'pending';
  const approvedAt = assessment.should_approve ? new Date().toISOString() : null;

  const { error } = await supabase
    .from('community_posts')
    .update({
      status: newStatus,
      approved_at: approvedAt
    })
    .eq('id', postId);

  if (error) {
    console.error('Failed to update post status:', error);
  }
}

// ==================== BATCH OPERATIONS ====================

/**
 * Assess multiple lessons in batch
 * 
 * @param inputs - Array of lesson assessment inputs
 * @returns Batch results with individual outcomes
 */
export async function assessLessonsBatch(
  inputs: LessonMasteryInput[]
): Promise<MasteryAPIResponse<BatchMasteryResult>> {
  const results: MasteryAssessmentResult[] = [];
  const errors: Array<{ item_id: string; error: string }> = [];

  for (const input of inputs) {
    const response = await assessLesson(input);
    
    if (response.success && response.data) {
      results.push(response.data);
    } else {
      errors.push({
        item_id: String(input.lessonId),
        error: response.error?.message || 'Unknown error'
      });
    }
  }

  const batchResult: BatchMasteryResult = {
    total_processed: inputs.length,
    successful: results.length,
    failed: errors.length,
    results,
    errors: errors.length > 0 ? errors : undefined
  };

  return {
    success: true,
    data: batchResult,
    metadata: {
      timestamp: new Date().toISOString()
    }
  };
}

// ==================== PROGRESS TRACKING ====================

/**
 * Get mastery progress history for a user and skill
 * 
 * @param userId - User identifier
 * @param skillId - Skill identifier
 * @returns Historical mastery progression
 */
export async function getMasteryProgressHistory(
  userId: string,
  skillId: number
): Promise<MasteryAPIResponse<MasteryProgressHistory>> {
  try {
    // Get lesson attempts for this skill
    const { data: attempts, error: attemptsError } = await supabase
      .from('lesson_attempts')
      .select(`
        id,
        lesson_id,
        score,
        completed,
        attempted_at,
        lessons!inner (
          skill_id
        )
      `)
      .eq('user_id', userId)
      .eq('lessons.skill_id', skillId)
      .order('attempted_at', { ascending: true });

    if (attemptsError) throw attemptsError;

    // Transform to assessment history
    const assessments = (attempts || [])
      .filter(attempt => attempt.attempted_at !== null)
      .map(attempt => {
        const masteryLevel = attempt.completed 
          ? 'dominio' 
          : (attempt.score && attempt.score >= 50) 
            ? 'parcial' 
            : 'no_dominio';

        return {
          assessment_id: `attempt_${attempt.id}`,
          timestamp: attempt.attempted_at as string,
          mastery_level: masteryLevel as 'dominio' | 'parcial' | 'no_dominio',
          objectives_achieved: attempt.completed ? 1 : 0,
          objectives_total: 1
        };
      });

    // Calculate trend
    const recentScores = assessments.slice(-5).map(a => 
      a.mastery_level === 'dominio' ? 100 : 
      a.mastery_level === 'parcial' ? 50 : 0
    );
    
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (recentScores.length >= 3) {
      const firstHalf = recentScores.slice(0, Math.floor(recentScores.length / 2));
      const secondHalf = recentScores.slice(Math.floor(recentScores.length / 2));
      const avgFirst = firstHalf.reduce((a: number, b: number) => a + b, 0) / firstHalf.length;
      const avgSecond = secondHalf.reduce((a: number, b: number) => a + b, 0) / secondHalf.length;
      
      if (avgSecond > avgFirst + 10) trend = 'improving';
      else if (avgSecond < avgFirst - 10) trend = 'declining';
    }

    const currentLevel = assessments.length > 0 
      ? assessments[assessments.length - 1].mastery_level 
      : 'no_dominio';

    const history: MasteryProgressHistory = {
      user_id: userId,
      skill_id: skillId,
      assessments,
      overall_trend: trend,
      current_mastery_level: currentLevel,
      strengths: [], // Could be enhanced with AI analysis
      growth_areas: []
    };

    return {
      success: true,
      data: history,
      metadata: {
        timestamp: new Date().toISOString()
      }
    };

  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to fetch progress history',
        code: 'HISTORY_FETCH_ERROR',
        details: error
      },
      metadata: {
        timestamp: new Date().toISOString()
      }
    };
  }
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Calculate mastery percentage from objective results
 */
export function calculateMasteryPercentage(
  objectives: ObjectiveFeedback[]
): number {
  if (objectives.length === 0) return 0;
  
  const achieved = objectives.filter(obj => obj.status === 'logrado').length;
  return Math.round((achieved / objectives.length) * 100);
}

/**
 * Determine if user should advance based on assessment
 */
export function shouldAdvanceToNextLesson(
  assessment: MasteryAssessmentResult,
  minMasteryThreshold: number = 70
): boolean {
  return assessment.overall_mastery && 
         assessment.grade_derivation.mastery_percentage >= minMasteryThreshold;
}

/**
 * Get conversational feedback summary
 */
export function getConversationalSummary(
  assessment: MasteryAssessmentResult,
  language: 'es' | 'en' = 'es'
): string {
  const { overall_mastery, mastery_level, conversational_summary } = assessment;
  
  if (conversational_summary) {
    return conversational_summary;
  }

  // Fallback generation
  if (overall_mastery) {
    return language === 'es'
      ? '¡Excelente trabajo! Has demostrado dominio de los objetivos de aprendizaje.'
      : 'Excellent work! You have demonstrated mastery of the learning objectives.';
  } else if (mastery_level === 'parcial') {
    return language === 'es'
      ? 'Buen progreso. Has alcanzado dominio parcial. Con un poco más de práctica, lo lograrás.'
      : 'Good progress. You have achieved partial mastery. With a bit more practice, you will succeed.';
  } else {
    return language === 'es'
      ? 'Sigue practicando. Revisa los objetivos no logrados y vuelve a intentarlo.'
      : 'Keep practicing. Review the unachieved objectives and try again.';
  }
}

// ==================== PROFICIENCY MILESTONE ASSESSMENT ====================

/**
 * Assess proficiency milestone progress
 */
export async function assessMilestoneProgress(
  input: {
    user_id: string;
    skill_id: number;
    current_score: number;
    previous_score?: number;
    language?: 'es' | 'en';
  }
): Promise<MasteryAPIResponse<MilestoneAssessmentResult>> {
  try {
    // Get current milestone from database
    const { data: milestone, error: milestoneError } = await supabase
      .from('proficiency_milestones')
      .select('*')
      .eq('skill_id', input.skill_id)
      .order('score_threshold', { ascending: false })
      .limit(1)
      .single();

    if (milestoneError || !milestone) {
      return {
        success: false,
        error: {
          message: 'No milestone found for skill',
          code: 'MILESTONE_NOT_FOUND',
          details: milestoneError
        },
        metadata: { timestamp: new Date().toISOString() }
      };
    }

    // Get previous milestone if exists
    const { data: previousMilestone } = await supabase
      .from('proficiency_milestones')
      .select('*')
      .eq('skill_id', input.skill_id)
      .lt('score_threshold', milestone.score_threshold)
      .order('score_threshold', { ascending: false })
      .limit(1)
      .single();

    // Determine current CEFR level
    const currentCEFRLevel = milestone.cefr_level;
    const previousCEFRLevel = previousMilestone?.cefr_level;

    // Call Gemini for evaluation
    const evaluation = await generateMilestoneEvaluation({
      skillName: `Skill #${input.skill_id}`,
      currentCEFRLevel,
      currentScore: input.current_score,
      scoreThreshold: milestone.score_threshold,
      previousScore: input.previous_score,
      milestoneTitle: milestone.title,
      milestoneDescription: milestone.description,
      xpReward: milestone.xp_reward,
      language: input.language || 'es'
    });

    const levelAchieved = evaluation.achieved;
    const levelImproved = 
      input.previous_score !== undefined && 
      input.current_score > input.previous_score;

    const scoreImprovement = input.previous_score 
      ? input.current_score - input.previous_score 
      : 0;

    // Create feedback object
    const feedback: MilestoneAchievementFeedback = {
      achieved: levelAchieved,
      mastery_level: evaluation.mastery_level,
      current_milestone: milestone as unknown as ProficiencyMilestone,
      next_milestone: undefined,
      congratulations_message: evaluation.congratulations_message,
      summary: evaluation.summary,
      strengths_demonstrated: evaluation.strengths,
      next_phase_focus: evaluation.next_phase_focus,
      total_assessments: 0,
      consecutive_successes: 0,
      improvement_rate: evaluation.improvement_rate,
      xp_earned: levelAchieved ? milestone.xp_reward : 0,
      unlocked_features: levelAchieved ? (JSON.parse(JSON.stringify(milestone.unlocks || []))  as unknown as MilestoneUnlock[]) : [],
      recommendations: {
        should_celebrate: levelAchieved,
        estimated_time_to_next_milestone: evaluation.estimated_time_to_next,
        suggested_practice_focus: evaluation.next_phase_focus,
        advanced_resources: evaluation.suggested_resources
          .filter((r: any) => r.difficulty === 'advanced' || r.difficulty === 'expert')
          .map((r: any) => ({
            title: r.title,
            url: '',
            difficulty: r.difficulty as 'advanced' | 'expert'
          }))
      },
      grade_explanation: `${evaluation.mastery_level.toUpperCase()}: ${evaluation.summary}`
    };

    // Determine if database updates needed
    const updatesRequired = {
      update_proficiency_score: levelAchieved,
      update_cefr_level: levelAchieved,
      award_xp: levelAchieved ? milestone.xp_reward : 0,
      unlock_features: levelAchieved ? (JSON.parse(JSON.stringify(milestone.unlocks || [])) as unknown as MilestoneUnlock[]) : []
    };

    const result: MilestoneAssessmentResult = {
      assessment_id: `milestone_${input.user_id}_${input.skill_id}_${Date.now()}`,
      assessed_at: new Date().toISOString(),
      user_id: input.user_id,
      skill_id: input.skill_id,
      current_milestone: milestone as unknown as ProficiencyMilestone,
      current_cefr_level: currentCEFRLevel as CEFRLevel,
      current_score: input.current_score,
      previous_milestone: previousMilestone as unknown as ProficiencyMilestone,
      previous_cefr_level: previousCEFRLevel as CEFRLevel,
      previous_score: input.previous_score,
      level_achieved: levelAchieved,
      level_improved: levelImproved,
      score_improvement: scoreImprovement,
      feedback,
      updates_required: {
        update_proficiency_score: levelAchieved,
        update_cefr_level: levelAchieved,
        award_xp: levelAchieved ? milestone.xp_reward : 0,
        unlock_features: levelAchieved ? (JSON.parse(JSON.stringify(milestone.unlocks || [])) as unknown as MilestoneUnlock[]) : []
      }
    };

    // Persist updates if needed
    if (updatesRequired.update_proficiency_score) {
      await updateMilestoneStatus(input.user_id, input.skill_id, result);
    }

    return {
      success: true,
      data: result,
      metadata: {
        timestamp: new Date().toISOString(),
        request_id: `milestone_assess_${input.skill_id}_${Date.now()}`
      }
    };

  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error during milestone assessment',
        code: 'MILESTONE_ASSESSMENT_ERROR',
        details: error
      },
      metadata: {
        timestamp: new Date().toISOString()
      }
    };
  }
}

/**
 * Update proficiency score and milestone status
 */
async function updateMilestoneStatus(
  userId: string,
  skillId: number,
  assessment: MilestoneAssessmentResult
): Promise<void> {
  try {
    // Update skill_proficiency_scores
    const { error: updateError } = await supabase
      .from('skill_proficiency_scores')
      .update({
        current_score: assessment.current_score,
        cefr_level: assessment.current_cefr_level,
        last_assessment_date: assessment.assessed_at,
        updated_at: assessment.assessed_at,
        assessments_completed: {
          increment: 1
        } as any
      })
      .eq('user_id', userId)
      .eq('skill_id', skillId);

    if (updateError) {
      console.error('Failed to update proficiency score:', updateError);
    }

    // Award XP if needed via user_achievements or other tracking
    if (assessment.updates_required.award_xp > 0) {
      // XP would be tracked via skill_proficiency_scores or user_achievements
      // depending on your gamification schema
      console.log(`Award ${assessment.updates_required.award_xp} XP to user ${userId}`);
    }

  } catch (error) {
    console.error('Failed to update milestone status:', error);
  }
}

// Export types for external use
export type {
  MasteryAssessmentResult,
  LessonMasteryInput,
  CommunityPostMasteryInput,
  CommunityPostAssessment,
  MasteryAPIResponse,
  MasteryProgressHistory,
  BatchMasteryResult,
  MilestoneAssessmentResult,
  MilestoneProgressInput,
  MilestoneAchievementFeedback
};
