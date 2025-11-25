// Gemini API service wrapper
// Uses REST endpoint; keep API key in EXPO_PUBLIC_GEMINI_API_KEY.

// Soporta ambas variables de entorno para flexibilidad.
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export type GeminiGenerateContentPart = { text?: string };
export type GeminiContent = { parts: GeminiGenerateContentPart[] };
export interface GeminiGenerateContentRequest {
  contents: GeminiContent[];
}
export interface GeminiCandidateContentPartText { text: string }
export interface GeminiCandidateContentPart { text?: string }
export interface GeminiCandidateContent { parts: GeminiCandidateContentPart[] }
export interface GeminiCandidate { content: GeminiCandidateContent }
export interface GeminiGenerateContentResponse {
  candidates?: GeminiCandidate[];
  error?: { message: string; code?: number };
}

const defaultModel = 'gemini-2.5-flash';

function ensureKey() {
  if (!GEMINI_API_KEY) {
    throw new Error('Falta la variable EXPO_PUBLIC_GEMINI_API_KEY. Añádela al entorno.');
  }
}

export async function generateText(prompt: string, model: string = defaultModel): Promise<string> {
  const resp = await generateContent({ contents: [{ parts: [{ text: prompt }] }] }, model);
  return resp;
}

export async function generateContent(body: GeminiGenerateContentRequest, model: string = defaultModel): Promise<string> {
  ensureKey();
  const url = `${BASE_URL}/${model}:generateContent?key=${GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Error ${res.status}: ${txt}`);
  }
  const data: GeminiGenerateContentResponse = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Respuesta vacía de Gemini');
  return text;
}

export async function safeGenerateText(prompt: string, model?: string): Promise<{ ok: boolean; text?: string; error?: string }> {
  try {
    const text = await generateText(prompt, model);
    return { ok: true, text };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error desconocido' };
  }
}

// Representación de mensajes en un chat local
export interface ChatMessage { role: 'user' | 'model' | 'system'; text: string }

// Estimación muy aproximada de tokens (caracteres/4) para decisiones de trimming.
export function approximateTokens(str: string): number {
  return Math.ceil(str.length / 4);
}

// Construye el array contents para multi-turn: cada mensaje va como un objeto separado.
function buildChatContents(messages: ChatMessage[]): GeminiGenerateContentRequest {
  return {
    contents: messages.map(m => ({ parts: [{ text: `${m.role}: ${m.text}` }] }))
  };
}

// Límite suave para trimming (puede ajustarse según el modelo). Ej: 200k tokens << 1M.
const SOFT_TOKEN_LIMIT = 200_000;

export interface GenerateChatOptions {
  model?: string;
  softLimitTokens?: number; // para override
  systemPrompt?: string; // se antepone si existe
}

export async function generateChat(messages: ChatMessage[], opts: GenerateChatOptions = {}): Promise<string> {
  ensureKey();
  const model = opts.model || defaultModel;
  const softLimit = opts.softLimitTokens || SOFT_TOKEN_LIMIT;
  // Añadir systemPrompt si se proporciona y aún no está.
  const enriched = [...(opts.systemPrompt ? [{ role: 'system', text: opts.systemPrompt } as ChatMessage] : []), ...messages];
  // Trim desde el inicio (mensajes más antiguos) si superamos límite aproximado.
  let totalTokens = approximateTokens(enriched.map(m => m.text).join('\n'));
  const trimmed = [...enriched];
  while (totalTokens > softLimit && trimmed.length > 1) {
    trimmed.shift();
    totalTokens = approximateTokens(trimmed.map(m => m.text).join('\n'));
  }
  const req = buildChatContents(trimmed);
  const text = await generateContent(req, model);
  return text;
}

export async function safeGenerateChat(messages: ChatMessage[], opts?: GenerateChatOptions): Promise<{ ok: boolean; text?: string; error?: string }> {
  try {
    const text = await generateChat(messages, opts || {});
    return { ok: true, text };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error desconocido' };
  }
}

// ---------------- Structured Outputs ----------------
// Subconjunto soportado de JSON Schema.
export type JSONSchema = {
  type?: string | string[];
  properties?: Record<string, JSONSchema>;
  items?: JSONSchema;
  required?: string[];
  enum?: (string | number)[];
  description?: string;
  title?: string;
  additionalProperties?: boolean | JSONSchema;
  minimum?: number;
  maximum?: number;
  prefixItems?: JSONSchema[];
  minItems?: number;
  maxItems?: number;
};

export interface StructuredOptions {
  model?: string;
  schema: JSONSchema;
  // texto o mensajes; si se pasan mensajes aprovechamos mismo formato de chat
  messages?: ChatMessage[];
  prompt?: string; // alternativa rápida
}

interface RawStructuredResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
}

export async function generateStructured<T = unknown>(opts: StructuredOptions): Promise<T> {
  ensureKey();
  const model = opts.model || defaultModel;
  const contents = opts.messages && opts.messages.length
    ? buildChatContents(opts.messages).contents
    : [{ parts: [{ text: opts.prompt || '' }] }];
  const url = `${BASE_URL}/${model}:generateContent?key=${GEMINI_API_KEY}`;
  const body = {
    contents,
    generationConfig: {
      responseMimeType: 'application/json',
      responseJsonSchema: opts.schema
    }
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Error ${res.status}: ${txt}`);
  }
  const data: RawStructuredResponse = await res.json();
  const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!jsonText) throw new Error('Respuesta vacía de Gemini (structured)');
  try {
    return JSON.parse(jsonText) as T;
  } catch {
    throw new Error('No se pudo parsear JSON estructurado');
  }
}

export async function safeGenerateStructured<T = unknown>(opts: StructuredOptions): Promise<{ ok: boolean; data?: T; error?: string }> {
  try {
    const data = await generateStructured<T>(opts);
    return { ok: true, data };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error desconocido' };
  }
}

// ---------------- Mastery-Oriented Feedback ----------------
// Entrada mínima para evaluar dominio por objetivos a partir de resultados de evaluación
export interface MasteryObjective {
  id: string;
  label: string;
}

export interface QuestionResult {
  id: string;
  objectiveId?: string | null;
  correct: boolean;
  selectedIndex?: number | null;
  correctIndex?: number | null;
}

export interface MasteryInput {
  lessonId?: string | number;
  objectives: MasteryObjective[];
  questions: QuestionResult[];
  passingScore?: number; // porcentaje sugerido para dominio global, p.ej. 70
  language?: 'es' | 'en';
}

export type MasteryLevel = 'no_dominio' | 'parcial' | 'dominio';

export interface MasteryObjectiveFeedback {
  id: string;
  label: string;
  achieved: boolean; // logrado / no logrado
  qualitative_feedback: string; // apreciación cualitativa
  quantitative_feedback: string; // apreciación cuantitativa (p.ej., 3/5 correctas)
  suggested_next_step: string; // siguiente paso concreto
}

export interface MasteryFeedback {
  overall_mastery: boolean; // dominio / no dominio
  mastery_level: MasteryLevel; // etiqueta resumida
  summary: string; // mensaje breve con tono conversacional
  objectives: MasteryObjectiveFeedback[]; // por objetivo: logrado / no logrado
  grade_derivation: {
    basis: string; // cómo se deriva la calificación desde el dominio
    recommended_grade_label: string; // etiqueta si aplica (opcional)
  };
}

function buildObjectiveStats(input: MasteryInput) {
  const stats = new Map<string, { total: number; correct: number }>();
  input.objectives.forEach(o => stats.set(o.id, { total: 0, correct: 0 }));
  for (const q of input.questions) {
    const key = q.objectiveId || '';
    if (!key || !stats.has(key)) continue;
    const s = stats.get(key)!;
    s.total += 1;
    if (q.correct) s.correct += 1;
  }
  const totals = { total: 0, correct: 0 };
  for (const [, s] of stats) {
    totals.total += s.total;
    totals.correct += s.correct;
  }
  return { stats, totals };
}

export async function generateMasteryFeedback(input: MasteryInput): Promise<MasteryFeedback> {
  const { stats, totals } = buildObjectiveStats(input);
  const pass = typeof input.passingScore === 'number' && totals.total > 0
    ? (totals.correct / totals.total) * 100 >= (input.passingScore as number)
    : undefined;

  // Construir contexto objetivo -> porcentaje
  const objectiveLines = input.objectives.map(o => {
    const s = stats.get(o.id) || { total: 0, correct: 0 };
    const pct = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
    return `- ${o.label} (id=${o.id}): ${s.correct}/${s.total} correctas (${pct}%)`;
  }).join('\n');

  const lang = input.language || 'es';
  const system = lang === 'es'
    ? `Eres un tutor pedagógico. La retroalimentación debe ser una conversación constructiva, breve y motivadora. 
No uses calificaciones numéricas como resultado final; comunica el resultado como dominio o no dominio. 
Muestra por objetivo si está logrado o no logrado, con una apreciación cualitativa y otra cuantitativa. 
Deja claro que la calificación emana del grado de dominio por objetivos.`
    : `You are a pedagogical tutor. Make feedback constructive and conversational. 
Avoid numeric grades as the final result; communicate mastery or non-mastery. 
For each objective, mark achieved or not achieved with qualitative and quantitative notes. 
Explain that any grade derives from mastery across objectives.`;

  const userPrompt = [
    lang === 'es' ? `Lección: ${String(input.lessonId ?? '')}` : `Lesson: ${String(input.lessonId ?? '')}`,
    lang === 'es' ? 'Objetivos y desempeño por objetivo:' : 'Objectives and per-objective performance:',
    objectiveLines || (lang === 'es' ? '(sin mapeo por objetivo)' : '(no per-objective mapping)'),
    lang === 'es'
      ? `Resultado global preliminar: ${totals.correct}/${totals.total} correctas (${totals.total > 0 ? Math.round((totals.correct / totals.total) * 100) : 0}%).` 
      : `Preliminary overall result: ${totals.correct}/${totals.total} correct (${totals.total > 0 ? Math.round((totals.correct / totals.total) * 100) : 0}%).`,
    (typeof input.passingScore === 'number')
      ? (lang === 'es' ? `Umbral sugerido de dominio: ${input.passingScore}%` : `Suggested mastery threshold: ${input.passingScore}%`)
      : '',
    lang === 'es'
      ? 'Devuelve JSON estructurado ajustado al esquema.'
      : 'Return structured JSON matching the schema.'
  ].filter(Boolean).join('\n');

  const schema: JSONSchema = {
    type: 'object',
    properties: {
      overall_mastery: { type: 'boolean', description: 'dominio/no dominio' },
      mastery_level: { type: 'string', enum: ['no_dominio', 'parcial', 'dominio'] },
      summary: { type: 'string', description: 'mensaje conversacional breve' },
      objectives: {
        type: 'array',
        minItems: 0,
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            label: { type: 'string' },
            achieved: { type: 'boolean' },
            qualitative_feedback: { type: 'string' },
            quantitative_feedback: { type: 'string' },
            suggested_next_step: { type: 'string' }
          },
          required: ['id', 'label', 'achieved', 'qualitative_feedback', 'quantitative_feedback', 'suggested_next_step'],
          additionalProperties: false
        }
      },
      grade_derivation: {
        type: 'object',
        properties: {
          basis: { type: 'string' },
          recommended_grade_label: { type: 'string' }
        },
        required: ['basis', 'recommended_grade_label'],
        additionalProperties: false
      }
    },
    required: ['overall_mastery', 'mastery_level', 'summary', 'objectives', 'grade_derivation'],
    additionalProperties: false
  };

  const data = await generateStructured<MasteryFeedback>({
    schema,
    messages: [
      { role: 'system', text: system },
      { role: 'user', text: userPrompt }
    ]
  });

  // Rellenar seguridad: asegurar que cada objetivo tenga entrada
  const byId = new Map<string, MasteryObjectiveFeedback>();
  for (const o of data.objectives || []) byId.set(o.id, o);
  const completed: MasteryObjectiveFeedback[] = input.objectives.map(o => {
    const s = stats.get(o.id) || { total: 0, correct: 0 };
    const fallback: MasteryObjectiveFeedback = {
      id: o.id,
      label: o.label,
      achieved: s.total > 0 ? s.correct / s.total >= 0.7 : false,
      qualitative_feedback: lang === 'es' ? 'Apreciación no disponible.' : 'Feedback not available.',
      quantitative_feedback: `${s.correct}/${s.total} correctas`,
      suggested_next_step: lang === 'es' ? 'Practica con ejemplos adicionales y repasa el objetivo.' : 'Practice with more examples and review the objective.'
    };
    return byId.get(o.id) || fallback;
  });

  // Coherencia global: si modelo no devolvió overall_mastery, derivarlo
  const derivedOverall = typeof data.overall_mastery === 'boolean'
    ? data.overall_mastery
    : (typeof pass === 'boolean' ? pass : (totals.total > 0 && (totals.correct / totals.total) >= 0.7));

  return {
    overall_mastery: derivedOverall,
    mastery_level: data.mastery_level || (derivedOverall ? 'dominio' : 'no_dominio'),
    summary: data.summary || (lang === 'es' ? 'Retroalimentación generada.' : 'Feedback generated.'),
    objectives: completed,
    grade_derivation: data.grade_derivation || {
      basis: lang === 'es' ? 'Derivada del grado de dominio por objetivos.' : 'Derived from objective-level mastery.',
      recommended_grade_label: derivedOverall ? (lang === 'es' ? 'Aprobado (por dominio)' : 'Pass (mastery)') : (lang === 'es' ? 'No Aprobado (sin dominio)' : 'Fail (no mastery)')
    }
  };
}

// ---------------- Community Post Assessment ----------------
// Evaluación de publicaciones de la comunidad usando criterios de calidad y dominio

export interface CommunityPostCriterion {
  id: string;
  name: string;
  description: string;
  weight: number;
}

export interface CriterionAssessment {
  criterion_id: string;
  criterion_name: string;
  achieved: boolean;
  score: number; // 0-100
  feedback: string;
  suggestions: string[];
}

export interface CommunityPostEvaluation {
  post_id: number;
  overall_quality: 'no_dominio' | 'parcial' | 'dominio';
  should_approve: boolean;
  conversational_feedback: string;
  criteria: CriterionAssessment[];
  improvement_suggestions: string[];
  grade_derivation: {
    overall_score: number;
    criteria_met: number;
    criteria_total: number;
    recommendation: 'approve' | 'request_revision' | 'reject';
    explanation: string;
  };
}

export interface CommunityPostInput {
  postId: number;
  title: string;
  content: string;
  category?: string;
  criteria?: CommunityPostCriterion[];
  language?: 'es' | 'en';
}

const DEFAULT_COMMUNITY_CRITERIA: CommunityPostCriterion[] = [
  {
    id: 'clarity',
    name: 'Claridad',
    description: 'El contenido es claro, bien estructurado y fácil de entender',
    weight: 0.25
  },
  {
    id: 'relevance',
    name: 'Relevancia',
    description: 'El contenido es relevante para la comunidad y aporta valor',
    weight: 0.25
  },
  {
    id: 'accuracy',
    name: 'Precisión',
    description: 'La información es correcta y está bien fundamentada',
    weight: 0.25
  },
  {
    id: 'engagement',
    name: 'Engagement',
    description: 'El contenido fomenta la discusión y participación constructiva',
    weight: 0.25
  }
];

export async function evaluateCommunityPost(input: CommunityPostInput): Promise<CommunityPostEvaluation> {
  const criteria = input.criteria || DEFAULT_COMMUNITY_CRITERIA;
  const lang = input.language || 'es';

  const criteriaDescription = criteria.map(c => 
    `- ${c.name} (${c.id}): ${c.description} (peso: ${c.weight})`
  ).join('\n');

  const systemPrompt = lang === 'es'
    ? `Eres un moderador pedagógico de contenido de la comunidad. 
Tu retroalimentación debe ser constructiva, conversacional y motivadora.
Evalúa el contenido según criterios específicos, comunicando el resultado como dominio/no dominio.
Cada criterio se marca como logrado/no logrado con apreciaciones cualitativas y cuantitativas.
La decisión de aprobación emana del grado de cumplimiento de los criterios.`
    : `You are a pedagogical content moderator for the community.
Your feedback should be constructive, conversational, and motivating.
Evaluate content according to specific criteria, communicating results as mastery/non-mastery.
Each criterion is marked as achieved/not achieved with qualitative and quantitative notes.
The approval decision derives from the degree of criteria fulfillment.`;

  const userPrompt = [
    lang === 'es' ? `Post ID: ${input.postId}` : `Post ID: ${input.postId}`,
    lang === 'es' ? `Título: ${input.title}` : `Title: ${input.title}`,
    lang === 'es' ? `Categoría: ${input.category || 'General'}` : `Category: ${input.category || 'General'}`,
    lang === 'es' ? '\nContenido a evaluar:' : '\nContent to evaluate:',
    input.content,
    lang === 'es' ? '\nCriterios de evaluación:' : '\nEvaluation criteria:',
    criteriaDescription,
    lang === 'es' 
      ? '\nDevuelve un JSON estructurado con la evaluación por criterios y feedback conversacional.'
      : '\nReturn structured JSON with per-criterion evaluation and conversational feedback.'
  ].join('\n');

  const schema: JSONSchema = {
    type: 'object',
    properties: {
      overall_quality: { 
        type: 'string', 
        enum: ['no_dominio', 'parcial', 'dominio'],
        description: 'Calidad general del post'
      },
      should_approve: { 
        type: 'boolean',
        description: 'Si el post debe aprobarse para publicación'
      },
      conversational_feedback: { 
        type: 'string',
        description: 'Mensaje conversacional principal para el autor'
      },
      criteria: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            criterion_id: { type: 'string' },
            criterion_name: { type: 'string' },
            achieved: { type: 'boolean' },
            score: { type: 'number', minimum: 0, maximum: 100 },
            feedback: { type: 'string' },
            suggestions: { 
              type: 'array',
              items: { type: 'string' }
            }
          },
          required: ['criterion_id', 'criterion_name', 'achieved', 'score', 'feedback', 'suggestions']
        }
      },
      improvement_suggestions: {
        type: 'array',
        items: { type: 'string' },
        description: 'Sugerencias generales de mejora'
      },
      grade_derivation: {
        type: 'object',
        properties: {
          overall_score: { type: 'number', minimum: 0, maximum: 100 },
          criteria_met: { type: 'number' },
          criteria_total: { type: 'number' },
          recommendation: { 
            type: 'string',
            enum: ['approve', 'request_revision', 'reject']
          },
          explanation: { type: 'string' }
        },
        required: ['overall_score', 'criteria_met', 'criteria_total', 'recommendation', 'explanation']
      }
    },
    required: ['overall_quality', 'should_approve', 'conversational_feedback', 'criteria', 'improvement_suggestions', 'grade_derivation']
  };

  const result = await generateStructured<CommunityPostEvaluation>({
    schema,
    messages: [
      { role: 'system', text: systemPrompt },
      { role: 'user', text: userPrompt }
    ]
  });

  // Ensure all criteria have an assessment
  const assessedIds = new Set(result.criteria.map(c => c.criterion_id));
  const missingCriteria = criteria.filter(c => !assessedIds.has(c.id));
  
  for (const missing of missingCriteria) {
    result.criteria.push({
      criterion_id: missing.id,
      criterion_name: missing.name,
      achieved: false,
      score: 50,
      feedback: lang === 'es' 
        ? 'Evaluación no generada automáticamente.' 
        : 'Assessment not automatically generated.',
      suggestions: [
        lang === 'es' 
          ? `Revisa y mejora el aspecto de ${missing.name.toLowerCase()}.`
          : `Review and improve the ${missing.name.toLowerCase()} aspect.`
      ]
    });
  }

  return {
    ...result,
    post_id: input.postId
  };
}

// ---------------- Enhanced Lesson Assessment ----------------
// Versión mejorada de evaluación de lecciones con feedback más rico

export interface EnhancedLessonResult {
  assessment_id: string;
  lesson_id: string | number;
  user_id?: string;
  assessed_at: string;
  overall_mastery: boolean;
  mastery_level: MasteryLevel;
  conversational_summary: string;
  objectives: MasteryObjectiveFeedback[];
  grade_derivation: {
    basis: string;
    mastery_percentage: number;
    objectives_achieved: number;
    objectives_total: number;
    recommended_grade_label: string;
    numeric_equivalent?: number;
  };
  recommendations: {
    should_retry: boolean;
    should_advance: boolean;
    practice_focus: string[];
    estimated_time_to_mastery?: string;
  };
}

export interface EnhancedLessonInput extends MasteryInput {
  userId?: string;
  assessmentId?: string;
  includeRecommendations?: boolean;
}

export async function generateEnhancedLessonFeedback(input: EnhancedLessonInput): Promise<EnhancedLessonResult> {
  // Get base mastery feedback
  const baseFeedback = await generateMasteryFeedback(input);
  
  // Calculate enhanced metrics
  const { stats, totals } = buildObjectiveStats(input);
  const masteryPercentage = totals.total > 0 ? (totals.correct / totals.total) * 100 : 0;
  const objectivesAchieved = input.objectives.filter(obj => {
    const s = stats.get(obj.id) || { total: 0, correct: 0 };
    return s.total > 0 && (s.correct / s.total) >= 0.7;
  }).length;

  const shouldAdvance = baseFeedback.overall_mastery;
  const shouldRetry = !shouldAdvance && masteryPercentage < 50;

  // Generate practice focus areas
  const practiceFocus = baseFeedback.objectives
    .filter(o => !o.achieved)
    .map(o => o.label);

  // Estimate time to mastery
  let estimatedTime: string | undefined;
  if (!shouldAdvance) {
    const gap = 70 - masteryPercentage;
    if (gap > 40) {
      estimatedTime = input.language === 'es' 
        ? '3-4 sesiones de práctica adicionales'
        : '3-4 additional practice sessions';
    } else if (gap > 20) {
      estimatedTime = input.language === 'es'
        ? '1-2 sesiones de práctica adicionales'
        : '1-2 additional practice sessions';
    } else {
      estimatedTime = input.language === 'es'
        ? '1 sesión de repaso enfocado'
        : '1 focused review session';
    }
  }

  return {
    assessment_id: input.assessmentId || `assess_${Date.now()}`,
    lesson_id: input.lessonId || 'unknown',
    user_id: input.userId,
    assessed_at: new Date().toISOString(),
    overall_mastery: baseFeedback.overall_mastery,
    mastery_level: baseFeedback.mastery_level,
    conversational_summary: baseFeedback.summary,
    objectives: baseFeedback.objectives,
    grade_derivation: {
      basis: baseFeedback.grade_derivation.basis,
      mastery_percentage: Math.round(masteryPercentage * 10) / 10,
      objectives_achieved: objectivesAchieved,
      objectives_total: input.objectives.length,
      recommended_grade_label: baseFeedback.grade_derivation.recommended_grade_label,
      numeric_equivalent: Math.round(masteryPercentage)
    },
    recommendations: {
      should_retry: shouldRetry,
      should_advance: shouldAdvance,
      practice_focus: practiceFocus,
      estimated_time_to_mastery: estimatedTime
    }
  };
}

// ==================== MILESTONE ASSESSMENT ====================

export interface MilestoneEvaluationInput {
  skillName: string;
  currentCEFRLevel: string;
  currentScore: number; // 0-160
  scoreThreshold: number;
  previousScore?: number;
  milestoneTitle: string;
  milestoneDescription: string;
  xpReward: number;
  language?: 'es' | 'en';
}

export interface MilestoneEvaluationResult {
  achieved: boolean;
  mastery_level: 'no_dominio' | 'parcial' | 'dominio';
  congratulations_message: string;
  summary: string;
  strengths: string[];
  next_phase_focus: string[];
  improvement_rate: number;
  estimated_time_to_next: string;
  celebration_intensity: 'low' | 'medium' | 'high';
  suggested_resources: Array<{
    title: string;
    type: 'practice' | 'theory' | 'advanced' | 'certification';
    difficulty: 'intermediate' | 'advanced' | 'expert';
  }>;
}

/**
 * Evaluate milestone achievement with constructive, conversational feedback
 */
export async function generateMilestoneEvaluation(
  input: MilestoneEvaluationInput
): Promise<MilestoneEvaluationResult> {
  const lang = input.language || 'es';
  const improvement = input.previousScore ? input.currentScore - input.previousScore : 0;
  const improvementRate = input.previousScore && input.previousScore > 0 
    ? Math.round((improvement / input.previousScore) * 100) 
    : 0;

  const systemPrompt = lang === 'es'
    ? `Eres un tutor de idiomas experto y motivador. Evalúa el progreso del estudiante hacia un hito (milestone) de dominio.
Tu retroalimentación debe ser:
- Conversacional y constructiva (no transaccional)
- Celebratoria si el estudiante logra dominio (dominio)
- Motivadora si está en progreso (parcial) 
- Orientada al crecimiento incluso si no alcanzó el umbral (no_dominio)
- Basada en la comparación de puntuaciones anteriores/actuales
- Clara sobre cómo la calificación emana del dominio demostrado`
    : `You are an expert and motivating language tutor. Evaluate student progress toward a proficiency milestone.
Your feedback should be:
- Conversational and constructive
- Celebratory if student achieves mastery (dominio)
- Motivating if in progress (parcial)
- Growth-oriented even if threshold not reached (no_dominio)
- Based on score improvements
- Clear about how grades derive from demonstrated mastery`;

  const achievedThreshold = input.currentScore >= input.scoreThreshold;
  const proximityPercent = Math.round((input.currentScore / input.scoreThreshold) * 100);
  const pointsRemaining = input.scoreThreshold - input.currentScore;

  const userPrompt = [
    lang === 'es' ? `Hito de Dominio: ${input.milestoneTitle}` : `Proficiency Milestone: ${input.milestoneTitle}`,
    lang === 'es' ? `Habilidad: ${input.skillName}` : `Skill: ${input.skillName}`,
    lang === 'es' ? `Nivel CEFR: ${input.currentCEFRLevel}` : `CEFR Level: ${input.currentCEFRLevel}`,
    '',
    lang === 'es' ? 'Resultados de Puntuación:' : 'Score Results:',
    lang === 'es' 
      ? `- Puntuación actual: ${input.currentScore}/160`
      : `- Current score: ${input.currentScore}/160`,
    lang === 'es'
      ? `- Umbral del hito: ${input.scoreThreshold}`
      : `- Milestone threshold: ${input.scoreThreshold}`,
    lang === 'es'
      ? `- Proximidad al hito: ${proximityPercent}%`
      : `- Proximity to milestone: ${proximityPercent}%`,
    input.previousScore !== undefined
      ? (lang === 'es'
          ? `- Puntuación anterior: ${input.previousScore} → Mejora: ${improvement > 0 ? '+' : ''}${improvement} puntos (${improvementRate > 0 ? '+' : ''}${improvementRate}%)`
          : `- Previous score: ${input.previousScore} → Improvement: ${improvement > 0 ? '+' : ''}${improvement} points (${improvementRate > 0 ? '+' : ''}${improvementRate}%)`)
      : '',
    '',
    lang === 'es' 
      ? `Descripción del hito:\n${input.milestoneDescription}`
      : `Milestone description:\n${input.milestoneDescription}`,
    '',
    lang === 'es'
      ? `¿Logró el umbral? ${achievedThreshold ? 'SÍ' : `NO (le faltan ${pointsRemaining} puntos)`}`
      : `Threshold achieved? ${achievedThreshold ? 'YES' : `NO (${pointsRemaining} points remaining)`}`,
    '',
    lang === 'es'
      ? 'Genera retroalimentación constructiva que:' 
      : 'Generate constructive feedback that:',
    lang === 'es'
      ? '1. Celebre el progreso sin importar si logró el umbral'
      : '1. Celebrates progress regardless of threshold achievement',
    lang === 'es'
      ? '2. Destaque fortalezas demostradas en este nivel'
      : '2. Highlights strengths demonstrated at this level',
    lang === 'es'
      ? '3. Indique claramente el grado de dominio (dominio/parcial/no_dominio)'
      : '3. Clearly states mastery level (dominio/parcial/no_dominio)',
    lang === 'es'
      ? '4. Sugiera enfoque para la siguiente fase'
      : '4. Suggests focus for next phase',
    lang === 'es'
      ? '5. Incluya estimación de tiempo para próximo hito'
      : '5. Includes time estimate for next milestone',
    lang === 'es'
      ? 'Devuelve JSON estructurado.'
      : 'Return structured JSON.'
  ].filter(Boolean).join('\n');

  const schema: JSONSchema = {
    type: 'object',
    properties: {
      achieved: {
        type: 'boolean',
        description: lang === 'es' ? 'Si logró el umbral del hito' : 'If milestone threshold was achieved'
      },
      mastery_level: {
        type: 'string',
        enum: ['no_dominio', 'parcial', 'dominio'],
        description: lang === 'es' 
          ? 'Nivel de dominio: dominio (≥umbral), parcial (75-99% del umbral), no_dominio (<75%)'
          : 'Mastery level: dominio (≥threshold), parcial (75-99% of threshold), no_dominio (<75%)'
      },
      congratulations_message: {
        type: 'string',
        description: lang === 'es' 
          ? 'Mensaje de celebración breve y motivador'
          : 'Brief, motivating celebration message'
      },
      summary: {
        type: 'string',
        description: lang === 'es'
          ? 'Resumen conversacional del logro y próximos pasos'
          : 'Conversational summary of achievement and next steps'
      },
      strengths: {
        type: 'array',
        items: { type: 'string' },
        description: lang === 'es' 
          ? 'Fortalezas demostradas (máximo 4)'
          : 'Demonstrated strengths (max 4)'
      },
      next_phase_focus: {
        type: 'array',
        items: { type: 'string' },
        description: lang === 'es'
          ? 'Áreas de enfoque para la siguiente fase (máximo 3)'
          : 'Focus areas for next phase (max 3)'
      },
      improvement_rate: {
        type: 'number',
        description: lang === 'es'
          ? 'Porcentaje de mejora respecto a puntuación anterior'
          : 'Percentage improvement from previous score'
      },
      estimated_time_to_next: {
        type: 'string',
        description: lang === 'es'
          ? 'Estimación: ej "2-3 semanas" o "1 mes de práctica diaria"'
          : 'Estimate: e.g., "2-3 weeks" or "1 month of daily practice"'
      },
      celebration_intensity: {
        type: 'string',
        enum: ['low', 'medium', 'high'],
        description: lang === 'es'
          ? 'Intensidad de celebración: high si dominio, medium si parcial, low si no_dominio'
          : 'Celebration intensity: high for dominio, medium for parcial, low for no_dominio'
      },
      suggested_resources: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            type: {
              type: 'string',
              enum: ['practice', 'theory', 'advanced', 'certification']
            },
            difficulty: {
              type: 'string',
              enum: ['intermediate', 'advanced', 'expert']
            }
          },
          required: ['title', 'type', 'difficulty']
        },
        description: lang === 'es'
          ? 'Recursos sugeridos para continuar'
          : 'Suggested resources for continuation'
      }
    },
    required: [
      'achieved',
      'mastery_level',
      'congratulations_message',
      'summary',
      'strengths',
      'next_phase_focus',
      'improvement_rate',
      'estimated_time_to_next',
      'celebration_intensity',
      'suggested_resources'
    ]
  };

  const result = await generateStructured<MilestoneEvaluationResult>({
    schema,
    messages: [
      { role: 'system', text: systemPrompt },
      { role: 'user', text: userPrompt }
    ]
  });

  return result;
}
