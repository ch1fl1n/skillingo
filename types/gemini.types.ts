export type GeminiGenerateContentPart = { text?: string };
export type GeminiContent = { parts: GeminiGenerateContentPart[] };
export interface GeminiGenerateContentRequest { contents: GeminiContent[] }
export interface GeminiCandidateContentPart { text?: string }
export interface GeminiCandidateContent { parts: GeminiCandidateContentPart[] }
export interface GeminiCandidate { content: GeminiCandidateContent }
export interface GeminiGenerateContentResponse { candidates?: GeminiCandidate[]; error?: { message: string; code?: number } }
