// 🎯 PROFICIENCY SCORING ENGINE 🎯

import type { 
  CEFRLevel, 
  CEFRLevelDescriptor,
  ProficiencyPrediction,
  LearningVelocity,
  ScoreHistoryPoint 
} from '@/types/proficiency.types';

/**
 * ===== CEFR LEVEL DESCRIPTORS =====
 * 
 * Complete mapping of score ranges to proficiency levels!
 * Based on Duolingo's CEFR alignment with skill-learning adaptations!
 */
export const CEFR_DESCRIPTORS: CEFRLevelDescriptor[] = [
  {
    level: 'very_early_a1',
    score_range: [0, 9],
    title: 'Very Early A1',
    display_name: 'Beginner',
    description: 'Just starting your learning journey!',
    capabilities: [
      'Recognize basic concepts and terminology',
      'Complete simple guided exercises',
      'Follow step-by-step tutorials',
    ],
    next_level_preview: 'Soon you\'ll be able to work on basic projects!',
    icon_emoji: '🌱',
    color: '#86EFAC', // Light green
  },
  {
    level: 'early_a1',
    score_range: [10, 19],
    title: 'Early A1',
    display_name: 'Foundation Builder',
    description: 'Building your foundational knowledge!',
    capabilities: [
      'Understand core concepts and principles',
      'Complete basic exercises independently',
      'Ask and answer simple questions about the skill',
      'Recognize common patterns and practices',
    ],
    next_level_preview: 'Next: Apply skills to small real-world tasks!',
    icon_emoji: '🧱',
    color: '#6EE7B7',
  },
  {
    level: 'high_a1',
    score_range: [20, 29],
    title: 'High A1',
    display_name: 'Basic Practitioner',
    description: 'Applying basic skills with guidance!',
    capabilities: [
      'Work through structured problems',
      'Use fundamental techniques correctly',
      'Explain basic concepts to others',
      'Complete small projects with assistance',
    ],
    next_level_preview: 'Soon you\'ll work on projects independently!',
    icon_emoji: '📚',
    color: '#34D399',
  },
  {
    level: 'a2',
    score_range: [30, 59],
    title: 'A2',
    display_name: 'Confident Learner',
    description: 'Building confidence through practice!',
    capabilities: [
      'Work on projects with minimal guidance',
      'Troubleshoot common issues independently',
      'Apply knowledge to familiar scenarios',
      'Understand intermediate concepts',
      'Create simple solutions from scratch',
    ],
    next_level_preview: 'Next: Handle complex real-world challenges!',
    icon_emoji: '💪',
    color: '#10B981',
  },
  {
    level: 'early_b1',
    score_range: [60, 79],
    title: 'Early B1',
    display_name: 'Intermediate Practitioner',
    description: 'Handling real-world applications!',
    capabilities: [
      'Navigate complex projects successfully',
      'Make informed decisions about approaches',
      'Debug and optimize your work',
      'Collaborate effectively with peers',
      'Learn advanced topics independently',
    ],
    next_level_preview: 'You\'re approaching professional competence!',
    icon_emoji: '🚀',
    color: '#14B8A6',
  },
  {
    level: 'high_b1',
    score_range: [80, 99],
    title: 'High B1',
    display_name: 'Skilled Practitioner',
    description: 'Strong competence in most situations!',
    capabilities: [
      'Share knowledge and mentor others',
      'Design and implement complete solutions',
      'Handle unexpected challenges confidently',
      'Apply best practices consistently',
      'Contribute to community discussions',
    ],
    next_level_preview: 'Advanced mastery is within reach!',
    icon_emoji: '⭐',
    color: '#0EA5E9',
  },
  {
    level: 'early_b2',
    score_range: [100, 114],
    title: 'Early B2',
    display_name: 'Advanced Practitioner',
    description: 'Advanced abilities in complex scenarios!',
    capabilities: [
      'Engage in deep technical discussions',
      'Architect sophisticated solutions',
      'Optimize for performance and quality',
      'Lead projects and guide teams',
      'Stay current with industry trends',
    ],
    next_level_preview: 'Professional-level expertise coming up!',
    icon_emoji: '🌟',
    color: '#3B82F6',
  },
  {
    level: 'high_b2',
    score_range: [115, 129],
    title: 'High B2',
    display_name: 'Professional',
    description: 'Professional-level proficiency!',
    capabilities: [
      'Work at a professional capacity',
      'Express sophisticated ideas clearly',
      'Navigate complex technical challenges',
      'Contribute to advanced projects',
      'Mentor and teach others effectively',
      'Apply skills in professional settings',
    ],
    next_level_preview: 'Expert mastery awaits!',
    icon_emoji: '🏆',
    color: '#6366F1',
  },
  {
    level: 'c1_c2',
    score_range: [130, 160],
    title: 'C1/C2',
    display_name: 'Expert',
    description: 'Expert-level mastery!',
    capabilities: [
      'Master all aspects of the skill',
      'Innovate and create new approaches',
      'Understand nuanced and complex topics',
      'Speak authoritatively on the subject',
      'Contribute to field advancement',
      'Teach and mentor at all levels',
      'Lead complex initiatives',
    ],
    next_level_preview: 'You\'ve reached the pinnacle! Keep learning! 🎉',
    icon_emoji: '👑',
    color: '#8B5CF6',
  },
];

/**
 * Get CEFR level from score
 * 
 * Maps a 0-160 score to appropriate CEFR level!
 * 
 * @example
 * getCEFRLevel(25) // returns 'high_a1'
 * getCEFRLevel(105) // returns 'early_b2'
 * getCEFRLevel(150) // returns 'c1_c2'
 */
export function getCEFRLevel(score: number): CEFRLevel {
  // Clamp score to valid range
  const clampedScore = Math.max(0, Math.min(160, score));
  
  // Find matching descriptor
  const descriptor = CEFR_DESCRIPTORS.find(
    desc => clampedScore >= desc.score_range[0] && clampedScore <= desc.score_range[1]
  );
  
  return descriptor?.level || 'very_early_a1';
}

/**
 * Get descriptor for CEFR level
 * 
 * Returns complete information about a proficiency level!
 * 
 * @example
 * const desc = getCEFRDescriptor('a2');
 * console.log(desc.capabilities); // Array of abilities
 */
export function getCEFRDescriptor(level: CEFRLevel): CEFRLevelDescriptor {
  const descriptor = CEFR_DESCRIPTORS.find(desc => desc.level === level);
  if (!descriptor) {
    throw new Error(`Invalid CEFR level: ${level}`);
  }
  return descriptor;
}

/**
 * Get descriptor from score
 * 
 * One-step conversion from score to full descriptor!
 */
export function getDescriptorFromScore(score: number): CEFRLevelDescriptor {
  const level = getCEFRLevel(score);
  return getCEFRDescriptor(level);
}

/**
 * Calculate score from assessment performance
 * 
 * Uses Item Response Theory (IRT) principles!
 * Considers both correctness AND difficulty!
 * 
 * @param correctAnswers - Number of correct answers
 * @param totalQuestions - Total questions attempted
 * @param averageDifficulty - Average difficulty (1-10)
 * @param currentScore - User's current score (for adaptive calculation)
 */
export function calculateAssessmentScore(
  correctAnswers: number,
  totalQuestions: number,
  averageDifficulty: number,
  currentScore: number = 0
): number {
  if (totalQuestions === 0) return currentScore;
  
  // Calculate accuracy percentage
  const accuracy = correctAnswers / totalQuestions;
  
  // Difficulty multiplier (harder questions worth more!)
  const difficultyMultiplier = 0.5 + (averageDifficulty / 10) * 0.5; // 0.5 to 1.0
  
  // Base points from this assessment
  const basePoints = accuracy * 20 * difficultyMultiplier; // Max 20 points per assessment
  
  // Confidence interval adjustment (less certain at extremes)
  const confidenceAdjustment = Math.abs(80 - currentScore) / 80; // 0 to 1
  const adjustedPoints = basePoints * (0.7 + confidenceAdjustment * 0.3);
  
  // Calculate new score with weighted average
  // Early assessments have more impact, later ones fine-tune
  const assessmentWeight = Math.min(0.3, 1 / (currentScore / 10 + 1));
  const newScore = currentScore + (adjustedPoints * assessmentWeight);
  
  // Clamp to valid range
  return Math.max(0, Math.min(160, Math.round(newScore)));
}

/**
 * Calculate adaptive next question difficulty
 * 
 * Adjusts difficulty based on performance!
 * Gets easier if struggling, harder if excelling!
 * 
 * @param currentDifficulty - Current question difficulty (1-10)
 * @param wasCorrect - Did user answer correctly?
 * @param confidenceLevel - How confident are we in skill level (0-100)
 */
export function calculateNextDifficulty(
  currentDifficulty: number,
  wasCorrect: boolean,
  confidenceLevel: number
): number {
  let adjustment = 0;
  
  if (wasCorrect) {
    // Increase difficulty, but more slowly as confidence grows
    adjustment = 1 + (100 - confidenceLevel) / 100;
  } else {
    // Decrease difficulty, faster if low confidence
    adjustment = -(1 + (100 - confidenceLevel) / 100);
  }
  
  // Apply adjustment
  const newDifficulty = currentDifficulty + adjustment;
  
  // Clamp to valid range (1-10)
  return Math.max(1, Math.min(10, Math.round(newDifficulty)));
}

/**
 * Calculate confidence interval
 * 
 * Statistical confidence in the score estimate!
 * More assessments = higher confidence!
 * 
 * @param assessmentCount - Number of assessments completed
 * @param scoreVariance - How much scores vary (standard deviation)
 */
export function calculateConfidenceInterval(
  assessmentCount: number,
  scoreVariance: number
): number {
  if (assessmentCount === 0) return 20; // ±20 points with no data
  
  // Confidence improves with more data
  const baseConfidence = 20 / Math.sqrt(assessmentCount);
  
  // Variance reduces confidence
  const varianceAdjustment = scoreVariance * 0.1;
  
  const confidence = baseConfidence + varianceAdjustment;
  
  // Return confidence interval (±N points)
  return Math.max(2, Math.min(20, Math.round(confidence)));
}

/**
 * Calculate score decay
 * 
 * Skills decay over time without practice! 📉
 * Encourages regular engagement!
 * 
 * @param currentScore - Current proficiency score
 * @param daysSinceLastPractice - Days since last activity
 * @param decayRatePerDay - Points lost per day
 * @param minScore - Won't decay below this
 */
export function calculateScoreDecay(
  currentScore: number,
  daysSinceLastPractice: number,
  decayRatePerDay: number = 0.5,
  minScore: number = 0
): number {
  if (daysSinceLastPractice <= 0) return currentScore;
  
  // Exponential decay (faster at first, slows down)
  const decayFactor = Math.exp(-decayRatePerDay * daysSinceLastPractice / 10);
  const decayedScore = currentScore * decayFactor;
  
  // Don't go below minimum
  return Math.max(minScore, Math.round(decayedScore));
}

/**
 * Calculate learning velocity
 * 
 * How fast is the user progressing? 🚀
 * 
 * @param scoreHistory - Array of historical scores
 * @param timeWindowDays - Look back this many days
 */
export function calculateLearningVelocity(
  scoreHistory: ScoreHistoryPoint[],
  timeWindowDays: number = 30
): LearningVelocity | null {
  if (scoreHistory.length < 2) return null;
  
  // Filter to time window
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - timeWindowDays);
  
  const recentHistory = scoreHistory.filter(
    point => new Date(point.date) >= cutoffDate
  );
  
  if (recentHistory.length < 2) return null;
  
  // Calculate average points per week
  const firstPoint = recentHistory[0];
  const lastPoint = recentHistory[recentHistory.length - 1];
  const scoreDiff = lastPoint.score - firstPoint.score;
  const timeDiff = new Date(lastPoint.date).getTime() - new Date(firstPoint.date).getTime();
  const weeksDiff = timeDiff / (7 * 24 * 60 * 60 * 1000);
  const pointsPerWeek = weeksDiff > 0 ? scoreDiff / weeksDiff : 0;
  
  // Calculate assessments per week
  const assessmentCount = recentHistory.filter(p => p.event_type === 'assessment').length;
  const assessmentsPerWeek = weeksDiff > 0 ? assessmentCount / weeksDiff : 0;
  
  // Determine learning pace
  let pace: 'accelerated' | 'steady' | 'gradual' | 'stalled';
  if (pointsPerWeek > 10) pace = 'accelerated';
  else if (pointsPerWeek > 5) pace = 'steady';
  else if (pointsPerWeek > 1) pace = 'gradual';
  else pace = 'stalled';
  
  // Calculate momentum (consistency score)
  const momentum = calculateMomentumScore(recentHistory);
  
  // Project next level date
  const currentLevel = getCEFRLevel(lastPoint.score);
  const currentDescriptor = getCEFRDescriptor(currentLevel);
  const nextLevelMinScore = currentDescriptor.score_range[1] + 1;
  const pointsNeeded = nextLevelMinScore - lastPoint.score;
  const weeksToNextLevel = pointsPerWeek > 0 ? pointsNeeded / pointsPerWeek : 999;
  
  const projectedDate = new Date();
  projectedDate.setDate(projectedDate.getDate() + weeksToNextLevel * 7);
  
  return {
    user_id: '', // Would be filled by caller
    skill_id: '', // Would be filled by caller
    points_per_week: Math.round(pointsPerWeek * 10) / 10,
    assessments_per_week: Math.round(assessmentsPerWeek * 10) / 10,
    learning_pace: pace,
    momentum_score: momentum,
    projected_next_level_date: projectedDate.toISOString(),
    calculated_at: new Date().toISOString(),
  };
}

/**
 * Calculate momentum score
 * 
 * Measures consistency of practice! 💪
 * Higher score = more regular practice!
 */
function calculateMomentumScore(history: ScoreHistoryPoint[]): number {
  if (history.length < 3) return 50; // Not enough data
  
  // Calculate variance in time between practice
  const gaps: number[] = [];
  for (let i = 1; i < history.length; i++) {
    const gap = new Date(history[i].date).getTime() - new Date(history[i - 1].date).getTime();
    gaps.push(gap / (24 * 60 * 60 * 1000)); // Convert to days
  }
  
  const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  const variance = gaps.reduce((acc, gap) => acc + Math.pow(gap - avgGap, 2), 0) / gaps.length;
  
  // Lower variance = higher consistency = higher momentum
  // Normalize to 0-100 scale
  const momentum = Math.max(0, Math.min(100, 100 - variance * 5));
  
  return Math.round(momentum);
}

/**
 * Predict future score
 * 
 * ML-inspired prediction of future proficiency! 🔮
 * Based on current velocity and momentum!
 * 
 * @param currentScore - Current proficiency score
 * @param velocity - Learning velocity metrics
 * @param weeksAhead - Predict this many weeks into future
 */
export function predictFutureScore(
  currentScore: number,
  velocity: LearningVelocity,
  weeksAhead: number
): ProficiencyPrediction {
  // Base prediction from velocity
  const basePrediction = currentScore + (velocity.points_per_week * weeksAhead);
  
  // Adjust for momentum (high momentum = more likely to continue)
  const momentumFactor = velocity.momentum_score / 100;
  const adjustedPrediction = currentScore + 
    ((basePrediction - currentScore) * (0.5 + momentumFactor * 0.5));
  
  // Apply learning curve diminishing returns
  const learningCurveFactor = 1 - (currentScore / 160) * 0.3; // Harder to improve at higher levels
  const finalPrediction = currentScore + 
    ((adjustedPrediction - currentScore) * learningCurveFactor);
  
  // Calculate confidence (based on data quality and consistency)
  const dataQuality = Math.min(100, velocity.assessments_per_week * 20); // More data = more confidence
  const consistency = velocity.momentum_score;
  const confidence = (dataQuality * 0.6 + consistency * 0.4);
  
  // Clamp to valid range
  const clampedPrediction = Math.max(0, Math.min(160, Math.round(finalPrediction)));
  
  return {
    user_id: velocity.user_id,
    skill_id: velocity.skill_id,
    current_score: currentScore,
    predicted_score_1_week: weeksAhead === 1 ? clampedPrediction : 0,
    predicted_score_1_month: weeksAhead === 4 ? clampedPrediction : 0,
    predicted_score_3_months: weeksAhead === 12 ? clampedPrediction : 0,
    confidence: Math.round(confidence),
    factors_considered: [
      `Learning pace: ${velocity.learning_pace}`,
      `Points per week: ${velocity.points_per_week}`,
      `Momentum: ${velocity.momentum_score}/100`,
      `Current level: ${getCEFRLevel(currentScore)}`,
    ],
    recommended_actions: generateRecommendations(velocity, currentScore),
    model_version: '1.0.0',
    predicted_at: new Date().toISOString(),
  };
}

/**
 * Generate personalized recommendations
 * 
 * AI-powered suggestions for improvement! 💡
 */
function generateRecommendations(
  velocity: LearningVelocity,
  currentScore: number
): string[] {
  const recommendations: string[] = [];
  
  // Pace-based recommendations
  if (velocity.learning_pace === 'stalled') {
    recommendations.push('🎯 Try practicing at least 2-3 times per week');
    recommendations.push('📅 Set a consistent practice schedule');
  } else if (velocity.learning_pace === 'gradual') {
    recommendations.push('⚡ Increase practice frequency for faster progress');
  } else if (velocity.learning_pace === 'accelerated') {
    recommendations.push('🌟 Amazing pace! Maintain consistency to keep momentum');
  }
  
  // Momentum-based recommendations
  if (velocity.momentum_score < 40) {
    recommendations.push('📊 Focus on regular practice over long sessions');
  } else if (velocity.momentum_score > 80) {
    recommendations.push('🔥 Excellent consistency! Keep up the great work!');
  }
  
  // Level-based recommendations
  const level = getCEFRLevel(currentScore);
  if (level === 'very_early_a1' || level === 'early_a1') {
    recommendations.push('📚 Focus on foundational concepts first');
    recommendations.push('✅ Complete beginner exercises daily');
  } else if (level === 'high_b1' || level === 'early_b2') {
    recommendations.push('🚀 Challenge yourself with advanced projects');
    recommendations.push('👥 Consider mentoring others to reinforce knowledge');
  } else if (level === 'c1_c2') {
    recommendations.push('👑 Share your expertise with the community!');
    recommendations.push('💡 Explore cutting-edge applications');
  }
  
  return recommendations;
}

/**
 * Calculate percentile ranking
 * 
 * Where does user stand compared to peers? 📊
 * 
 * @param userScore - User's score
 * @param allScores - Array of all user scores for this skill
 */
export function calculatePercentile(userScore: number, allScores: number[]): number {
  if (allScores.length === 0) return 50; // Default to median
  
  const lowerScores = allScores.filter(score => score < userScore).length;
  const percentile = (lowerScores / allScores.length) * 100;
  
  return Math.round(percentile);
}

/**
 * Determine recommended practice difficulty
 * 
 * What difficulty should user practice at? 🎯
 * Sweet spot: challenging but achievable!
 */
export function getRecommendedPracticeDifficulty(
  currentScore: number,
  recentPerformance: number // 0-100% success rate
): number {
  const baseLevel = getCEFRLevel(currentScore);
  const descriptor = getCEFRDescriptor(baseLevel);
  
  // Start at midpoint of current CEFR level's score range
  const [minScore, maxScore] = descriptor.score_range;
  const relativeDifficulty = (currentScore - minScore) / (maxScore - minScore);
  
  // Map to 1-10 difficulty scale
  let difficulty = 1 + (relativeDifficulty * 9);
  
  // Adjust based on recent performance
  if (recentPerformance > 80) {
    // Doing well, increase difficulty!
    difficulty += 1;
  } else if (recentPerformance < 60) {
    // Struggling, reduce difficulty!
    difficulty -= 1;
  }
  
  // Clamp to valid range
  return Math.max(1, Math.min(10, Math.round(difficulty)));
}

/**
 * Format score for display
 * 
 * Show score with context! 📱
 */
export function formatScoreDisplay(score: number, showRange: boolean = true): string {
  const level = getCEFRLevel(score);
  const descriptor = getCEFRDescriptor(level);
  
  if (showRange) {
    return `${score}/160 (${descriptor.display_name})`;
  }
  
  return `${score}`;
}

/**
 * Get progress to next level percentage
 * 
 * How close to next CEFR level? 🎯
 */
export function getProgressToNextLevel(score: number): number {
  const currentLevel = getCEFRLevel(score);
  const currentDescriptor = getCEFRDescriptor(currentLevel);
  const [minScore, maxScore] = currentDescriptor.score_range;
  
  if (score >= maxScore) return 100; // At max of current level
  
  const progress = ((score - minScore) / (maxScore - minScore)) * 100;
  return Math.round(progress);
}

/**
 * Validate assessment answer
 * 
 * Check if user's answer is correct! ✅
 * Supports different question types!
 */
export function validateAnswer(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userAnswer: string | number | any[] | Record<string, any> | null,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  correctAnswer: string | number | any[] | Record<string, any> | null,
  questionType: string
): boolean {
  switch (questionType) {
    case 'multiple_choice':
      return userAnswer === correctAnswer;
    
    case 'true_false':
      return userAnswer === correctAnswer;
    
    case 'ordering':
      return JSON.stringify(userAnswer) === JSON.stringify(correctAnswer);
    
    case 'match_pairs':
      // Check if all pairs match
      if (!correctAnswer || typeof correctAnswer !== 'object') return false;
      if (!userAnswer || typeof userAnswer !== 'object') return false;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return Object.keys(correctAnswer as Record<string, any>).every(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        key => (userAnswer as Record<string, any>)[key] === (correctAnswer as Record<string, any>)[key]
      );
    
    case 'code_completion': {
      // Normalize whitespace and compare
      const normalizedUser = String(userAnswer).replace(/\s+/g, ' ').trim();
      const normalizedCorrect = String(correctAnswer).replace(/\s+/g, ' ').trim();
      return normalizedUser === normalizedCorrect;
    }
    
    default:
      // For complex types, use exact match
      return JSON.stringify(userAnswer) === JSON.stringify(correctAnswer);
  }
}

export default {
  getCEFRLevel,
  getCEFRDescriptor,
  getDescriptorFromScore,
  calculateAssessmentScore,
  calculateNextDifficulty,
  calculateConfidenceInterval,
  calculateScoreDecay,
  calculateLearningVelocity,
  predictFutureScore,
  calculatePercentile,
  getRecommendedPracticeDifficulty,
  formatScoreDisplay,
  getProgressToNextLevel,
  validateAnswer,
  CEFR_DESCRIPTORS,
};
