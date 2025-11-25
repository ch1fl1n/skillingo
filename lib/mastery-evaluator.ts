/**
 * Mastery-Based Evaluation Service using Gemini API
 * 
 * Implementa un sistema de evaluación conversacional que:
 * - Proporciona retroalimentación constructiva en lugar de calificaciones
 * - Comunica resultados como "dominio" o "no dominio"
 * - Permite evaluación cualitativa y cuantitativa
 * - Presenta logros por objetivos de aprendizaje
 * - Fallback a evaluaciones mock si Gemini no está disponible
 */

import { generateContent, generateChat, type ChatMessage } from './gemini';
import { getMockEvaluation } from './mock-evaluations';
import { getMockEvaluationExpanded } from './mock-evaluations-expanded';
import type {
  MasteryEvaluation,
  ObjectiveEvaluation,
  LessonEvaluationContext,
  EvaluatorConfig,
  ConversationalFeedback,
  MasteryLevel,
  EvaluationSession,
  EvaluationMessage,
} from '@/types/mastery-evaluation.types';

/**
 * Configuración por defecto del evaluador
 */
const DEFAULT_CONFIG: EvaluatorConfig = {
  model: 'gemini-2.0-flash-exp',
  temperature: 0.7,
  encouragementLevel: 'high',
  detailLevel: 'detailed',
};

/**
 * Genera el prompt del sistema para el evaluador
 */
function buildSystemPrompt(config: EvaluatorConfig): string {
  return `Eres un evaluador educativo experto y empático. Tu rol es proporcionar retroalimentación constructiva sobre el aprendizaje del estudiante.

PRINCIPIOS FUNDAMENTALES:
1. La retroalimentación debe ser una conversación constructiva, NO una simple entrega de calificaciones
2. Comunica resultados como "dominio logrado" o "dominio no logrado" (NUNCA uses calificaciones numéricas directamente)
3. Evalúa tanto aspectos cualitativos (comprensión, razonamiento) como cuantitativos (precisión, completitud)
4. Presenta resultados por objetivos de aprendizaje específicos
5. Desde el grado de dominio de cada objetivo emana una puntuación interna (0-100) que NO se muestra al estudiante

ESTILO DE COMUNICACIÓN:
- ${config.encouragementLevel === 'high' ? 'Muy motivador y positivo' : 'Equilibrado y profesional'}
- ${config.detailLevel === 'detailed' ? 'Proporciona explicaciones detalladas' : 'Sé conciso pero claro'}
- Identifica fortalezas específicas primero
- Describe áreas de crecimiento (NO "debilidades") con sugerencias concretas
- Usa un tono conversacional y cercano
- Fomenta la reflexión mediante preguntas

ESTRUCTURA DE EVALUACIÓN:
- Evalúa cada objetivo de aprendizaje de forma independiente
- Para cada objetivo, determina: LOGRADO o NO LOGRADO
- Proporciona evidencias específicas del trabajo del estudiante
- Ofrece sugerencias constructivas y accionables
- Calcula internamente un score 0-100 basado en el dominio demostrado

IMPORTANTE: Tu evaluación debe ser justa, consistente y orientada al crecimiento del estudiante.`;
}

/**
 * Construye el prompt de evaluación inicial
 */
function buildEvaluationPrompt(context: LessonEvaluationContext): string {
  const objectivesText = context.objectives
    .map((obj, idx) => `${idx + 1}. ${obj.description} (Peso: ${(obj.weight * 100).toFixed(0)}%)`)
    .join('\n');

  return `CONTEXTO DE LA LECCIÓN:
Lección ID: ${context.lessonId}
Habilidad: Skill ${context.skillId}
Dificultad: ${context.difficulty}
${context.previousAttempts ? `Intentos previos: ${context.previousAttempts}` : 'Primer intento'}

PREGUNTA/ACTIVIDAD:
${context.question}

OBJETIVOS DE APRENDIZAJE:
${objectivesText}

RESPUESTA DEL ESTUDIANTE:
${context.studentResponse}

---

Por favor, evalúa esta respuesta siguiendo estos pasos:

1. ANÁLISIS GENERAL:
   - ¿Qué demuestra comprensión esta respuesta?
   - ¿Qué aspectos son particularmente buenos?

2. EVALUACIÓN POR OBJETIVOS:
   Para cada objetivo de aprendizaje:
   - Estado: LOGRADO o NO LOGRADO
   - Apreciación cualitativa: ¿Qué evidencia observas?
   - Puntuación interna (0-100): Basada en el grado de dominio
   - Evidencias específicas: Citas o aspectos concretos de la respuesta
   - Sugerencias: ¿Cómo puede mejorar en este objetivo?

3. RETROALIMENTACIÓN CONVERSACIONAL:
   - Mensaje de apertura positivo y personalizado
   - Fortalezas identificadas (2-3 específicas)
   - Áreas de crecimiento (2-3 con sugerencias)
   - Mensaje de aliento
   - Preguntas para reflexión (1-2)

4. RECOMENDACIONES:
   - Próximos pasos sugeridos
   - Recursos adicionales recomendados

Responde en formato JSON con esta estructura:
{
  "objectives": [
    {
      "objectiveId": "objetivo-1",
      "mastery": "achieved" | "not-achieved",
      "qualitativeAssessment": "descripción detallada",
      "quantitativeScore": 85,
      "evidence": ["evidencia 1", "evidencia 2"],
      "suggestions": ["sugerencia 1", "sugerencia 2"]
    }
  ],
  "conversationalFeedback": {
    "opening": "mensaje inicial",
    "strengths": ["fortaleza 1", "fortaleza 2"],
    "areasForGrowth": ["área 1", "área 2"],
    "encouragement": "mensaje de aliento",
    "dialoguePrompts": ["pregunta 1", "pregunta 2"]
  },
  "nextSteps": ["paso 1", "paso 2"],
  "resourcesSuggested": ["recurso 1", "recurso 2"]
}`;
}

/**
 * Calcula el dominio general basado en objetivos individuales
 */
function calculateOverallMastery(
  objectives: ObjectiveEvaluation[],
  objectivesContext: LessonEvaluationContext['objectives']
): { mastery: MasteryLevel; score: number } {
  let totalScore = 0;
  let achievedWeight = 0;
  let totalWeight = 0;

  objectives.forEach((evaluation) => {
    const objective = objectivesContext.find(obj => obj.id === evaluation.objectiveId);
    if (objective) {
      totalScore += evaluation.quantitativeScore * objective.weight;
      totalWeight += objective.weight;
      if (evaluation.mastery === 'achieved') {
        achievedWeight += objective.weight;
      }
    }
  });

  const overallScore = totalWeight > 0 ? totalScore / totalWeight : 0;
  
  // Considera dominio logrado si:
  // 1. El score ponderado es >= 70 Y
  // 2. Al menos 70% de los objetivos (por peso) están logrados
  const achievedRatio = totalWeight > 0 ? achievedWeight / totalWeight : 0;
  const overallMastery: MasteryLevel = 
    (overallScore >= 70 && achievedRatio >= 0.7) ? 'achieved' : 'not-achieved';

  return { mastery: overallMastery, score: overallScore };
}

/**
 * Evalúa la respuesta de un estudiante usando Gemini
 * Si Gemini falla (429, 401, etc), usa evaluaciones mock
 */
export async function evaluateWithMastery(
  context: LessonEvaluationContext,
  config: EvaluatorConfig = {}
): Promise<MasteryEvaluation> {
  const evaluatorConfig = { ...DEFAULT_CONFIG, ...config };
  
  try {
    // Construir el prompt de evaluación
    const systemPrompt = buildSystemPrompt(evaluatorConfig);
    const evaluationPrompt = buildEvaluationPrompt(context);

    // Llamar a Gemini
    const messages: ChatMessage[] = [
      { role: 'system', text: systemPrompt },
      { role: 'user', text: evaluationPrompt },
    ];

    const response = await generateChat(messages, {
      model: evaluatorConfig.model,
    });

    // Extraer JSON de la respuesta
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No se pudo extraer JSON de la respuesta de Gemini');
    }

    const evaluationData = JSON.parse(jsonMatch[1] || jsonMatch[0]);

    // Calcular dominio general
    const { mastery: overallMastery, score: overallScore } = calculateOverallMastery(
      evaluationData.objectives,
      context.objectives
    );

    // Construir evaluación completa
    const evaluation: MasteryEvaluation = {
      lessonId: context.lessonId,
      userId: '', // Se debe establecer desde el contexto de autenticación
      timestamp: new Date().toISOString(),
      objectives: evaluationData.objectives,
      overallMastery,
      overallScore: Math.round(overallScore),
      conversationalFeedback: evaluationData.conversationalFeedback,
      nextSteps: evaluationData.nextSteps || [],
      resourcesSuggested: evaluationData.resourcesSuggested || [],
    };

    return evaluation;

  } catch (error) {
    console.error('Error en evaluateWithMastery:', error);
    
    // Fallback: usar evaluación mock si Gemini falla
    console.log(`[EVALUACIÓN MOCK] Usando evaluación local para lección ${context.lessonId}`);
    console.log(`[EVALUACIÓN MOCK] Dificultad: ${context.difficulty}`);
    
    // Primero intenta con la versión expandida (soporta todas las 50 lecciones)
    const mockEval = getMockEvaluationExpanded(context.lessonId, context.difficulty);
    
    if (mockEval) {
      console.log(`[EVALUACIÓN MOCK] ✓ Evaluación mock cargada exitosamente (v2 expandida)`);
      console.log(`[EVALUACIÓN MOCK] Mastery: ${mockEval.overallMastery}, Score: ${mockEval.overallScore}`);
      return mockEval;
    }
    
    // Fallback final a versión original
    const oldMockEval = getMockEvaluation(context.lessonId);
    if (oldMockEval) {
      console.log(`[EVALUACIÓN MOCK] ✓ Usando versión original de mock`);
      return oldMockEval;
    }
    
    // Si nada funciona, relanzar error
    throw new Error(
      `Error al evaluar con Gemini: ${error instanceof Error ? error.message : 'Error desconocido'}`
    );
  }
}

/**
 * Continúa una conversación de evaluación existente
 */
export async function continueEvaluationConversation(
  session: EvaluationSession,
  studentMessage: string,
  config: EvaluatorConfig = {}
): Promise<{ response: string; updatedSession: EvaluationSession }> {
  const evaluatorConfig = { ...DEFAULT_CONFIG, ...config };
  
  try {
    // Construir historial de mensajes
    const systemPrompt = buildSystemPrompt(evaluatorConfig);
    const chatHistory: ChatMessage[] = [
      { role: 'system', text: systemPrompt },
      ...session.messages.map(msg => ({
        role: msg.role === 'student' ? 'user' as const : 'model' as const,
        text: msg.content,
      })),
      { role: 'user', text: studentMessage },
    ];

    // Obtener respuesta de Gemini
    const response = await generateChat(chatHistory, {
      model: evaluatorConfig.model,
    });

    // Actualizar sesión
    const updatedSession: EvaluationSession = {
      ...session,
      messages: [
        ...session.messages,
        {
          role: 'student',
          content: studentMessage,
          timestamp: new Date().toISOString(),
        },
        {
          role: 'evaluator',
          content: response,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    return { response, updatedSession };

  } catch (error) {
    console.error('Error en continueEvaluationConversation:', error);
    throw new Error(
      `Error al continuar conversación: ${error instanceof Error ? error.message : 'Error desconocido'}`
    );
  }
}

/**
 * Genera una sesión inicial de evaluación
 */
export function createEvaluationSession(
  lessonId: number,
  userId: string,
  initialEvaluation?: MasteryEvaluation
): EvaluationSession {
  return {
    id: `eval-${lessonId}-${userId}-${Date.now()}`,
    lessonId,
    userId,
    startedAt: new Date().toISOString(),
    messages: [],
    currentEvaluation: initialEvaluation,
    isComplete: false,
  };
}

/**
 * Formatea la evaluación para mostrar al estudiante
 * (Oculta scores numéricos internos)
 */
export function formatEvaluationForStudent(evaluation: MasteryEvaluation): string {
  const { conversationalFeedback, objectives, overallMastery, nextSteps } = evaluation;

  let formatted = `${conversationalFeedback.opening}\n\n`;

  formatted += `🎯 **DOMINIO GENERAL**: ${overallMastery === 'achieved' ? '✅ LOGRADO' : '📚 NO LOGRADO (Continúa practicando)'}\n\n`;

  formatted += `💪 **TUS FORTALEZAS**:\n`;
  conversationalFeedback.strengths.forEach((s, i) => {
    formatted += `${i + 1}. ${s}\n`;
  });

  formatted += `\n📈 **OBJETIVOS DE APRENDIZAJE**:\n`;
  objectives.forEach((obj, i) => {
    const status = obj.mastery === 'achieved' ? '✅ Logrado' : '🔄 No logrado';
    formatted += `\n**Objetivo ${i + 1}**: ${status}\n`;
    formatted += `${obj.qualitativeAssessment}\n`;
    if (obj.mastery === 'not-achieved' && obj.suggestions.length > 0) {
      formatted += `💡 Sugerencias: ${obj.suggestions.join('. ')}\n`;
    }
  });

  if (conversationalFeedback.areasForGrowth.length > 0) {
    formatted += `\n🌱 **ÁREAS DE CRECIMIENTO**:\n`;
    conversationalFeedback.areasForGrowth.forEach((area, i) => {
      formatted += `${i + 1}. ${area}\n`;
    });
  }

  if (nextSteps.length > 0) {
    formatted += `\n🎯 **PRÓXIMOS PASOS**:\n`;
    nextSteps.forEach((step, i) => {
      formatted += `${i + 1}. ${step}\n`;
    });
  }

  formatted += `\n${conversationalFeedback.encouragement}\n\n`;

  if (conversationalFeedback.dialoguePrompts.length > 0) {
    formatted += `💬 **REFLEXIONA**:\n`;
    conversationalFeedback.dialoguePrompts.forEach((prompt, i) => {
      formatted += `• ${prompt}\n`;
    });
  }

  return formatted;
}
