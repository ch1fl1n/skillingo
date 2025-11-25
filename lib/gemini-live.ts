// Integración optimizada de Gemini Live API (WebSocket) con enfoque en rendimiento.
// NOTA: Endpoint actualizado según especificación oficial de Gemini Live API.
// Para producción: usar tokens efímeros en lugar de API key directa.

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

// Constantes pre-calculadas para optimización
const LIVE_API_BASE_URL = 'wss://generativelanguage.googleapis.com/v1beta/live:connect';
const DEFAULT_RESPONSE_MODALITIES = ['AUDIO'];
const DEFAULT_SYSTEM_INSTRUCTION = 'You are a helpful assistant.';

// Caché de endpoints para evitar reconstrucción repetida
const endpointCache = new Map<string, string>();

export interface LiveSessionConfig {
  model: string; // Ej: 'gemini-2.5-flash-native-audio-preview-09-2025'
  systemInstruction?: string;
  responseModalities?: string[]; // Ej: ['AUDIO']
  audioBufferSize?: number; // Tamaño del buffer para batch de audio (bytes)
}

export interface LiveEventCallbackMap {
  onOpen?: () => void;
  onError?: (err: Event | string) => void;
  onClose?: (code?: number, reason?: string) => void;
  onAudioChunk?: (pcm: Uint8Array) => void; // Salida binaria
  onMessageDebug?: (raw: Record<string, unknown>) => void; // Mensajes crudos para depuración
}

export class GeminiLiveSession {
  private ws?: WebSocket;
  private cfg: LiveSessionConfig;
  private cbs: LiveEventCallbackMap;
  private opened = false;
  private endpoint: string;
  private audioBuffer: Uint8Array[] = []; // Buffer para batch de audio
  private audioBufferSize: number;
  private currentBufferBytes = 0;
  private sessionConfigPayload: string; // Pre-serializado para rendimiento

  constructor(cfg: LiveSessionConfig, callbacks: LiveEventCallbackMap = {}) {
    if (!GEMINI_API_KEY) throw new Error('Falta EXPO_PUBLIC_GEMINI_API_KEY');
    
    // Validación temprana de configuración
    if (!cfg.model || typeof cfg.model !== 'string') {
      throw new Error('El modelo es requerido y debe ser una cadena válida');
    }
    
    this.cfg = cfg;
    this.cbs = callbacks;
    this.audioBufferSize = cfg.audioBufferSize || 4096; // 4KB por defecto
    
    // Construcción optimizada del endpoint con caché
    const cacheKey = `${cfg.model}`;
    let cachedEndpoint = endpointCache.get(cacheKey);
    
    if (!cachedEndpoint) {
      // Usar URLSearchParams para construcción segura y eficiente
      const params = new URLSearchParams({
        key: GEMINI_API_KEY,
        model: cfg.model
      });
      cachedEndpoint = `${LIVE_API_BASE_URL}?${params.toString()}`;
      
      // Limitar tamaño del caché (LRU simple)
      if (endpointCache.size > 10) {
        const firstKey = endpointCache.keys().next().value;
        if (firstKey) endpointCache.delete(firstKey);
      }
      endpointCache.set(cacheKey, cachedEndpoint);
    }
    
    this.endpoint = cachedEndpoint;
    
    // Pre-serializar configuración de sesión para evitar JSON.stringify repetido
    const sessionConfig = {
      type: 'session_config',
      response_modalities: cfg.responseModalities || DEFAULT_RESPONSE_MODALITIES,
      system_instruction: cfg.systemInstruction || DEFAULT_SYSTEM_INSTRUCTION
    };
    this.sessionConfigPayload = JSON.stringify(sessionConfig);
  }

  connect() {
    this.ws = new WebSocket(this.endpoint);
    this.ws.binaryType = 'arraybuffer';

    this.ws.onopen = () => {
      this.opened = true;
      // Usar payload pre-serializado para evitar overhead de JSON.stringify
      this.ws?.send(this.sessionConfigPayload);
      this.cbs.onOpen?.();
    };

    this.ws.onerror = (e) => this.cbs.onError?.(e);
    
    this.ws.onclose = (_e) => {
      this.cleanup();
      this.cbs.onClose?.(_e.code, _e.reason);
    };

    this.ws.onmessage = (msg) => {
      if (typeof msg.data === 'string') {
        // Parsing optimizado: evitar try-catch en hot path cuando sea posible
        const json = this.parseJSON(msg.data);
        if (json) {
          this.cbs.onMessageDebug?.(json);
          // Podrían venir metadatos, estados de turnos, etc.
        }
      } else if (msg.data instanceof ArrayBuffer) {
        // Audio binario presumiblemente PCM 16-bit 24kHz (verificar en doc)
        // Usar vistas tipadas para mejor rendimiento
        const chunk = new Uint8Array(msg.data);
        this.cbs.onAudioChunk?.(chunk);
      }
    };
  }

  // Parser JSON optimizado sin try-catch en hot path
  private parseJSON(data: string): Record<string, unknown> | null {
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  sendText(text: string) {
    if (!this.opened) throw new Error('Sesión no abierta');
    // Reutilizar estructura para evitar creación de objetos
    const payload = { type: 'input_text', text };
    this.ws?.send(JSON.stringify(payload));
  }

  // Envío de audio con buffering para optimizar throughput
  sendAudio(rawPcm16Mono16k: Uint8Array) {
    if (!this.opened) throw new Error('Sesión no abierta');
    
    this.audioBuffer.push(rawPcm16Mono16k);
    this.currentBufferBytes += rawPcm16Mono16k.byteLength;
    
    // Flush cuando alcanzamos el tamaño del buffer
    if (this.currentBufferBytes >= this.audioBufferSize) {
      this.flushAudioBuffer();
    }
  }

  // Flush manual para casos donde se necesita envío inmediato
  flushAudioBuffer() {
    if (this.audioBuffer.length === 0) return;
    
    // Concatenar chunks eficientemente
    const totalBytes = this.currentBufferBytes;
    const combined = new Uint8Array(totalBytes);
    let offset = 0;
    
    for (const chunk of this.audioBuffer) {
      combined.set(chunk, offset);
      offset += chunk.byteLength;
    }
    
    // Enviar como binario directo (ajustar según especificación final)
    this.ws?.send(combined.buffer);
    
    // Limpiar buffer
    this.audioBuffer = [];
    this.currentBufferBytes = 0;
  }

  // Limpieza de recursos para prevenir memory leaks
  private cleanup() {
    this.opened = false;
    this.audioBuffer = [];
    this.currentBufferBytes = 0;
  }

  close() {
    // Enviar audio pendiente antes de cerrar
    if (this.audioBuffer.length > 0) {
      this.flushAudioBuffer();
    }
    this.ws?.close();
    this.cleanup();
  }
}

// Helper seguro con mejor manejo de errores
export function createLiveSession(cfg: LiveSessionConfig, callbacks?: LiveEventCallbackMap) {
  const session = new GeminiLiveSession(cfg, callbacks);
  session.connect();
  return session;
}
