// Stub de integración Live API (WebSocket) para Gemini.
// NOTA: El endpoint exacto de Live API debe confirmarse en la documentación oficial.
// Para producción: usar tokens efímeros en lugar de API key directa.

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

export interface LiveSessionConfig {
  model: string; // Ej: 'gemini-2.5-flash-native-audio-preview-09-2025'
  systemInstruction?: string;
  responseModalities?: string[]; // Ej: ['AUDIO']
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

  constructor(cfg: LiveSessionConfig, callbacks: LiveEventCallbackMap = {}) {
    if (!GEMINI_API_KEY) throw new Error('Falta EXPO_PUBLIC_GEMINI_API_KEY');
    this.cfg = cfg;
    this.cbs = callbacks;
    // FIXME: Reemplazar por endpoint real de Live API cuando se confirme.
    // Posible formato (placeholder):
    // wss://generativelanguage.googleapis.com/v1beta/live:connect?key=API_KEY&model=MODEL
    this.endpoint = `wss://generativelanguage.googleapis.com/v1beta/live:connect?key=${GEMINI_API_KEY}&model=${encodeURIComponent(cfg.model)}`;
  }

  connect() {
    this.ws = new WebSocket(this.endpoint);
    this.ws.binaryType = 'arraybuffer';

    this.ws.onopen = () => {
      this.opened = true;
      // Enviar configuración inicial
      const init = {
        type: 'session_config',
        response_modalities: this.cfg.responseModalities || ['AUDIO'],
        system_instruction: this.cfg.systemInstruction || 'You are a helpful assistant.'
      };
      this.ws?.send(JSON.stringify(init));
      this.cbs.onOpen?.();
    };

    this.ws.onerror = (e) => this.cbs.onError?.(e);
    this.ws.onclose = (_e) => this.cbs.onClose?.(_e.code, _e.reason);

    this.ws.onmessage = (msg) => {
      if (typeof msg.data === 'string') {
        try {
          const json = JSON.parse(msg.data);
          this.cbs.onMessageDebug?.(json);
          // Podrían venir metadatos, estados de turnos, etc.
        } catch (e) {
          // Texto plano inesperado
        }
      } else if (msg.data instanceof ArrayBuffer) {
        // Audio binario presumiblemente PCM 16-bit 24kHz (verificar en doc)
        const chunk = new Uint8Array(msg.data);
        this.cbs.onAudioChunk?.(chunk);
      }
    };
  }

  sendText(text: string) {
    if (!this.opened) throw new Error('Sesión no abierta');
    const payload = { type: 'input_text', text };
    this.ws?.send(JSON.stringify(payload));
  }

  sendAudio(rawPcm16Mono16k: Uint8Array) {
    if (!this.opened) throw new Error('Sesión no abierta');
    // Placeholder: según doc puede requerir encabezado JSON antes del binario
    // y/o empaquetar en mensaje con base64. Ajustar tras confirmación.
    this.ws?.send(rawPcm16Mono16k); // binario directo (a confirmar)
  }

  close() {
    this.ws?.close();
  }
}

// Helper seguro
export function createLiveSession(cfg: LiveSessionConfig, callbacks?: LiveEventCallbackMap) {
  const session = new GeminiLiveSession(cfg, callbacks);
  session.connect();
  return session;
}
