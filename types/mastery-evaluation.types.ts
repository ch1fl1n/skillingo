/**
 * Mastery-Based Evaluation Types
 * 
 * Sistema de evaluación basado en dominio que proporciona retroalimentación
 * constructiva y conversacional en lugar de calificaciones numéricas tradicionales.
 */

/**
 * Nivel de dominio del estudiante en un objetivo específico
 */
export type MasteryLevel = 
  | 'achieved'      // Logrado - Dominio completo
  | 'not-achieved'; // No logrado - Requiere más práctica

/**
 * Objetivo de aprendizaje individual evaluable
 */
export interface LearningObjective {
  id: string;
  description: string;
  weight: number; // Peso relativo (0-1) para cálculo de dominio global
}

/**
 * Evaluación de un objetivo específico
 */
export interface ObjectiveEvaluation {
  objectiveId: string;
  mastery: MasteryLevel;
  qualitativeAssessment: string; // Apreciación cualitativa detallada
  quantitativeScore: number; // 0-100, deriva del grado de dominio
  evidence: string[]; // Evidencias específicas del trabajo del estudiante
  suggestions: string[]; // Sugerencias constructivas para mejorar
}

/**
 * Evaluación completa de una lección
 */
export interface MasteryEvaluation {
  lessonId: number;
  userId: string;
  timestamp: string;
  
  // Evaluación por objetivos
  objectives: ObjectiveEvaluation[];
  
  // Dominio global de la lección
  overallMastery: MasteryLevel;
  overallScore: number; // Calculado del peso de objetivos
  
  // Retroalimentación conversacional
  conversationalFeedback: ConversationalFeedback;
  
  // Recomendaciones
  nextSteps: string[];
  resourcesSuggested: string[];
}

/**
 * Retroalimentación conversacional estructurada
 */
export interface ConversationalFeedback {
  opening: string; // Mensaje inicial positivo y motivador
  strengths: string[]; // Fortalezas identificadas
  areasForGrowth: string[]; // Áreas de crecimiento (no "debilidades")
  encouragement: string; // Mensaje de aliento personalizado
  dialoguePrompts: string[]; // Preguntas para continuar la conversación
}

/**
 * Contexto de la lección para evaluación
 */
export interface LessonEvaluationContext {
  lessonId: number;
  skillId: number;
  difficulty: 'easy' | 'medium' | 'hard';
  objectives: LearningObjective[];
  question: string;
  studentResponse: string;
  previousAttempts?: number;
}

/**
 * Mensaje en el hilo conversacional de evaluación
 */
export interface EvaluationMessage {
  role: 'student' | 'evaluator';
  content: string;
  timestamp: string;
}

/**
 * Sesión de evaluación conversacional
 */
export interface EvaluationSession {
  id: string;
  lessonId: number;
  userId: string;
  startedAt: string;
  messages: EvaluationMessage[];
  currentEvaluation?: MasteryEvaluation;
  isComplete: boolean;
}

/**
 * Configuración para el evaluador
 */
export interface EvaluatorConfig {
  model?: string; // Modelo de Gemini a usar
  temperature?: number; // Creatividad de respuestas (0-1)
  encouragementLevel?: 'moderate' | 'high'; // Nivel de aliento
  detailLevel?: 'concise' | 'detailed'; // Nivel de detalle en retroalimentación
}
