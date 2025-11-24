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
