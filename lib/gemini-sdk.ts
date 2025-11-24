// Wrapper opcional usando @google/genai (SDK oficial)
// Requiere haber instalado: npm install @google/genai
// Usa la variable de entorno GEMINI_API_KEY o EXPO_PUBLIC_GEMINI_API_KEY.

import { GoogleGenAI } from '@google/genai';

const KEY = process.env.GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY;
if (!KEY) {
  console.warn('[gemini-sdk] Falta GEMINI_API_KEY / EXPO_PUBLIC_GEMINI_API_KEY. El SDK intentará usar configuración global si aplica.');
}

// La librería toma automáticamente GEMINI_API_KEY del entorno si no se pasa.
const ai = new GoogleGenAI(KEY ? { apiKey: KEY } : {});

export async function sdkGenerateText(prompt: string, model = 'gemini-2.5-flash'): Promise<string> {
  const response = await ai.models.generateContent({ model, contents: prompt });
  return response.text();
}

export interface SdkStructuredOptions {
  prompt: string | string[]; // puede ser varias partes
  model?: string;
  schema: Record<string, unknown>; // JSON Schema
  // Nota: El SDK usa responseMimeType y responseJsonSchema
}

export async function sdkGenerateStructured<T = unknown>(opts: SdkStructuredOptions<T>): Promise<T> {
  const response = await ai.models.generateContent({
    model: opts.model || 'gemini-2.5-flash',
    contents: Array.isArray(opts.prompt) ? opts.prompt.join('\n') : opts.prompt,
    config: {
      responseMimeType: 'application/json',
      responseJsonSchema: opts.schema,
    },
  });
  const txt = response.text();
  return JSON.parse(txt) as T;
}

export async function sdkSafeGenerateStructured<T = unknown>(opts: SdkStructuredOptions<T>): Promise<{ ok: boolean; data?: T; error?: string }> {
  try {
    const data = await sdkGenerateStructured<T>(opts);
    return { ok: true, data };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : 'Error desconocido' };
  }
}

// Ejemplo de uso (comentado):
// const recipeSchema = { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] };
// const data = await sdkGenerateStructured({ prompt: 'Devuelve un objeto {"name":"Chocolate"}', schema: recipeSchema });
// console.log(data.name);
