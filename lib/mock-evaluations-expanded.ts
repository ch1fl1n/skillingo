/**
 * Mock Evaluations Expandidas - Todas las 50 lecciones
 * Datos hardcodeados para testing sin Gemini API
 * 
 * Estructura:
 * - Lecciones 1-5: Creativity
 * - Lecciones 6-10: Critical Thinking
 * - Lecciones 11-15: Communication
 * - Lecciones 16-20: Collaboration
 * - Lecciones 21-25: Curiosity
 * - Lecciones 26-30: Courage
 * - Lecciones 31-35: Resilience
 * - Lecciones 36-40: Ethics
 * - Lecciones 41-45: Metacognition
 * - Lecciones 46-50: Imagination
 */

import type { MasteryEvaluation } from '@/types/mastery-evaluation.types';

/**
 * Factory para crear evaluaciones mock con contenido adaptado a cada lección
 */
export function createMockEvaluation(
  lessonId: number,
  skill: string,
  masteryLevel: 'achieved' | 'not-achieved' = 'achieved',
  score: number = 85
): MasteryEvaluation {
  const skillDescriptions = {
    creativity: 'Pensamiento creativo e innovación',
    critical_thinking: 'Pensamiento crítico y análisis',
    communication: 'Comunicación clara y efectiva',
    collaboration: 'Trabajo colaborativo y en equipo',
    curiosity: 'Curiosidad y exploración intelectual',
    courage: 'Valentía y toma de riesgos calculados',
    resilience: 'Resiliencia y recuperación',
    ethics: 'Razonamiento ético y moral',
    metacognition: 'Pensamiento sobre el pensamiento',
    imagination: 'Imaginación y pensamiento divergente'
  };

  const commonObjectives = [
    {
      objectiveId: 'obj-1',
      mastery: masteryLevel,
      qualitativeAssessment: 'Tu respuesta demuestra una comprensión sólida del concepto fundamental.',
      quantitativeScore: Math.min(100, score + 5),
      evidence: ['Demuestras comprensión clara', 'Tu razonamiento es lógico'],
      suggestions: masteryLevel === 'achieved' ? ['Continúa profundizando'] : ['Estudia ejemplos más']
    },
    {
      objectiveId: 'obj-2',
      mastery: masteryLevel,
      qualitativeAssessment: 'Tu análisis muestra reflexión y pensamiento.profundo.',
      quantitativeScore: score,
      evidence: ['Consideras múltiples perspectivas', 'Tu análisis es balanceado'],
      suggestions: masteryLevel === 'achieved' ? [] : ['Añade más detalles']
    },
    {
      objectiveId: 'obj-3',
      mastery: masteryLevel,
      qualitativeAssessment: 'Expresas tus ideas de forma clara y coherente.',
      quantitativeScore: Math.max(score - 5, 30),
      evidence: ['Tu explicación es clara', 'Es fácil de seguir tu lógica'],
      suggestions: []
    }
  ];

  return {
    lessonId,
    userId: 'mock-user',
    timestamp: new Date().toISOString(),
    overallMastery: masteryLevel,
    overallScore: score,
    objectives: commonObjectives,
    conversationalFeedback: {
      opening:
        masteryLevel === 'achieved'
          ? `¡Excelente trabajo! Demuestras una sólida comprensión de ${skillDescriptions[skill as keyof typeof skillDescriptions]}.`
          : `Gracias por tu intento. Vamos a trabajar juntos en mejorar tu comprensión.`,
      strengths:
        masteryLevel === 'achieved'
          ? [
              'Comprendes los conceptos clave',
              'Tu análisis es profundo',
              'Expresas tus ideas claramente'
            ]
          : ['Hiciste un esfuerzo genuino', 'Tus intenciones fueron correctas'],
      areasForGrowth:
        masteryLevel === 'achieved'
          ? ['Amplía tu perspectiva', 'Explora casos más complejos']
          : ['Necesitas más práctica', 'Estudia los conceptos fundamentales', 'Intenta nuevamente'],
      encouragement:
        masteryLevel === 'achieved'
          ? '¡Vas muy bien! Continúa con este ritmo de aprendizaje.'
          : 'No te desanimes. Cada intento te acerca más al dominio. ¡Sigue adelante!',
      dialoguePrompts:
        masteryLevel === 'achieved'
          ? ['¿Cómo aplicarías esto a un contexto real?', '¿Qué preguntas tienes?']
          : ['¿Qué parte fue más confusa?', '¿Necesitas más recursos?']
    },
    nextSteps:
      masteryLevel === 'achieved'
        ? [`Explora lecciones más avanzadas sobre ${skillDescriptions[skill as keyof typeof skillDescriptions]}`, 'Aplica esto a tu vida real', 'Enseña a otros']
        : ['Revisa el material de la lección', 'Estudia ejemplos de buenas respuestas', 'Intenta nuevamente'],
    resourcesSuggested:
      masteryLevel === 'achieved'
        ? ['Lecturas avanzadas', 'Casos de estudio reales', 'Comunidades de expertos']
        : ['Conceptos fundamentales', 'Ejercicios de práctica', 'Tutoriales paso a paso']
  };
}

/**
 * Mapeo de lecciones a skills para generar evaluaciones coherentes
 */
const lessonSkillMap: Record<number, string> = {
  // Creativity (1-5)
  1: 'creativity',
  2: 'creativity',
  3: 'creativity',
  4: 'creativity',
  5: 'creativity',

  // Critical Thinking (6-10)
  6: 'critical_thinking',
  7: 'critical_thinking',
  8: 'critical_thinking',
  9: 'critical_thinking',
  10: 'critical_thinking',

  // Communication (11-15)
  11: 'communication',
  12: 'communication',
  13: 'communication',
  14: 'communication',
  15: 'communication',

  // Collaboration (16-20)
  16: 'collaboration',
  17: 'collaboration',
  18: 'collaboration',
  19: 'collaboration',
  20: 'collaboration',

  // Curiosity (21-25)
  21: 'curiosity',
  22: 'curiosity',
  23: 'curiosity',
  24: 'curiosity',
  25: 'curiosity',

  // Courage (26-30)
  26: 'courage',
  27: 'courage',
  28: 'courage',
  29: 'courage',
  30: 'courage',

  // Resilience (31-35)
  31: 'resilience',
  32: 'resilience',
  33: 'resilience',
  34: 'resilience',
  35: 'resilience',

  // Ethics (36-40)
  36: 'ethics',
  37: 'ethics',
  38: 'ethics',
  39: 'ethics',
  40: 'ethics',

  // Metacognition (41-45)
  41: 'metacognition',
  42: 'metacognition',
  43: 'metacognition',
  44: 'metacognition',
  45: 'metacognition',

  // Imagination (46-50)
  46: 'imagination',
  47: 'imagination',
  48: 'imagination',
  49: 'imagination',
  50: 'imagination'
};

/**
 * Genera evaluación mock variada según dificultad
 * Lecciones "easy" tienen más probabilidad de "achieved"
 * Lecciones "hard" pueden ser "not-achieved"
 */
export function getMockEvaluationForLesson(
  lessonId: number,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium'
): MasteryEvaluation {
  const skill = lessonSkillMap[lessonId] || 'creativity';

  // Basado en dificultad, varía probabilidad de dominio
  let masteryLevel: 'achieved' | 'not-achieved' = 'achieved';
  let score = 85;

  if (difficulty === 'easy') {
    masteryLevel = 'achieved';
    score = 80 + Math.random() * 20; // 80-100
  } else if (difficulty === 'medium') {
    masteryLevel = Math.random() > 0.3 ? 'achieved' : 'not-achieved';
    score = masteryLevel === 'achieved' ? 75 + Math.random() * 25 : 40 + Math.random() * 35;
  } else {
    // hard
    masteryLevel = Math.random() > 0.5 ? 'achieved' : 'not-achieved';
    score = masteryLevel === 'achieved' ? 70 + Math.random() * 30 : 35 + Math.random() * 40;
  }

  return createMockEvaluation(lessonId, skill, masteryLevel, Math.round(score));
}

/**
 * Crea un banco de evaluaciones mock para todas las 50 lecciones
 */
export function generateAllMockEvaluations(): Record<number, MasteryEvaluation> {
  const evaluations: Record<number, MasteryEvaluation> = {};

  // Difficulty por lección (sigue patrón: 1-2 easy, 3-4 medium, 5 hard)
  const difficulties: Record<number, 'easy' | 'medium' | 'hard'> = {};
  for (let skillBase = 1; skillBase <= 10; skillBase++) {
    const skillLessons = [
      (skillBase - 1) * 5 + 1,
      (skillBase - 1) * 5 + 2,
      (skillBase - 1) * 5 + 3,
      (skillBase - 1) * 5 + 4,
      (skillBase - 1) * 5 + 5
    ];
    difficulties[skillLessons[0]] = 'easy';
    difficulties[skillLessons[1]] = 'easy';
    difficulties[skillLessons[2]] = 'medium';
    difficulties[skillLessons[3]] = 'medium';
    difficulties[skillLessons[4]] = 'hard';
  }

  for (let i = 1; i <= 50; i++) {
    const difficulty = difficulties[i] || 'medium';
    evaluations[i] = getMockEvaluationForLesson(i, difficulty);
  }

  return evaluations;
}

/**
 * Obtiene evaluación mock (versión expandida)
 */
export function getMockEvaluationExpanded(
  lessonId: number,
  difficulty?: 'easy' | 'medium' | 'hard'
): MasteryEvaluation {
  if (difficulty) {
    return getMockEvaluationForLesson(lessonId, difficulty);
  }

  // Si no se especifica dificultad, inferir del lessonId
  const positionInSkill = ((lessonId - 1) % 5) + 1;
  let inferredDifficulty: 'easy' | 'medium' | 'hard' = 'medium';
  if (positionInSkill <= 2) inferredDifficulty = 'easy';
  else if (positionInSkill >= 4) inferredDifficulty = 'medium';
  else inferredDifficulty = 'hard';

  return getMockEvaluationForLesson(lessonId, inferredDifficulty);
}
