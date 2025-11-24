import React, { useRef, useState } from 'react';
import { View, Text, Button, ScrollView } from 'react-native';
import { createLiveSession, GeminiLiveSession } from '../../lib/gemini-live';
// Para audio real necesitarás expo-av (instalar) y transformar a PCM 16k mono.

export default function LiveVoiceChat() {
  const [connected, setConnected] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [receivingAudioChunks, setReceivingAudioChunks] = useState(0);
  const sessionRef = useRef<GeminiLiveSession | null>(null);

  function append(line: string) {
    setLog(l => [...l, line]);
  }

  function start() {
    if (sessionRef.current) return;
    const session = createLiveSession({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      responseModalities: ['AUDIO'],
      systemInstruction: 'Responde de forma amistosa y concisa.'
    }, {
      onOpen: () => { setConnected(true); append('Conectado.'); },
      onMessageDebug: (m) => append('Mensaje debug: ' + JSON.stringify(m).slice(0, 200)),
      onAudioChunk: () => setReceivingAudioChunks(c => c + 1),
      onError: (e) => append('Error: ' + (typeof e === 'string' ? e : 'evento')),
      onClose: (code, reason) => { append(`Cerrado (${code}): ${reason}`); setConnected(false); sessionRef.current = null; }
    });
    sessionRef.current = session;
  }

  function stop() {
    sessionRef.current?.close();
  }

  function sendText() {
    sessionRef.current?.sendText('Hola, ¿puedes describir brevemente programación funcional?');
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: '600' }}>Live Voice Chat (Stub)</Text>
      <Text>Estado: {connected ? 'Conectado' : 'Desconectado'}</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Button title="Iniciar" onPress={start} />
        <Button title="Enviar Texto" onPress={sendText} disabled={!connected} />
        <Button title="Detener" onPress={stop} disabled={!connected} />
      </View>
      <Text>Chunks de audio recibidos: {receivingAudioChunks}</Text>
      <Text style={{ fontWeight: '600', marginTop: 12 }}>Logs:</Text>
      {log.map((l, i) => <Text key={i} style={{ fontSize: 12 }}>{l}</Text>)}
      <Text style={{ marginTop: 16, fontSize: 12, color: '#666' }}>Nota: Implementar captura de micrófono y conversión PCM con expo-av y procesamiento adicional.</Text>
    </ScrollView>
  );
}
