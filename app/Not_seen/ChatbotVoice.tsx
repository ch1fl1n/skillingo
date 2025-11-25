// ChatbotVoice.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  DeviceEventEmitter,
} from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { router } from 'expo-router';
import botAsset from '../../assets/images/icon.png';

const TRANSCRIBE_ENDPOINT = (process.env.EXPO_PUBLIC_TRANSCRIBE_URL as string) || 'https://your-backend.example.com/transcribe';

export default function ChatbotVoice() {
  const [transcription, setTranscription] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);

  useEffect(() => {
    // Clean up if leaving screen
    return () => {
      if (recordingRef.current) {
        try {
          recordingRef.current.stopAndUnloadAsync();
        } catch {}
        recordingRef.current = null;
      }
    };
  }, []);

  async function startRecording() {
    try {
      // Request permissions and prepare audio mode
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos', 'Se requieren permisos de micrófono.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
  android: {
    extension: '.m4a',
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
  },
  ios: {
    extension: '.m4a',
    audioQuality: Audio.IOSAudioQuality.HIGH,
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 128000,
  }
});

      await recording.startAsync();
      recordingRef.current = recording;
      setIsRecording(true);
      setTranscription('');
    } catch (err) {
      console.error('Error startRecording:', err);
      Alert.alert('Error', 'No se pudo iniciar la grabación. ' + (err as any).message);
      setIsRecording(false);
    }
  }

  async function stopRecordingAndProcess() {
    try {
      setIsRecording(false);
      const recording = recordingRef.current;
      if (!recording) return;

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      recordingRef.current = null;

      if (!uri) {
        Alert.alert('Error', 'No se obtuvo la grabación.');
        return;
      }

      setIsProcessing(true);

      // Leer archivo como base64 (Expo FileSystem)
      // Nota: si TypeScript marca error en EncodingType, puedes quitar el tipo o usar @ts-ignore
      // @ts-ignore
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });

      // Enviar al endpoint de transcripción (tu backend debe manejar la conversión a lo que use: OpenAI Whisper, etc.)
      // Aquí enviamos JSON con base64; tu backend convertirá a audio y hará la transcripción.
      const resp = await fetch(TRANSCRIBE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // NO pongas keys privadas aquí. Si el endpoint requiere auth, utiliza un token seguro.
        },
        body: JSON.stringify({
          filename: 'recording.wav',
          content_base64: base64,
          mime_type: 'audio/wav', // o audio/m4a según tu recording format
        }),
      });

      if (!resp.ok) {
        const text = await resp.text();
        console.error('Transcribe endpoint error', resp.status, text);
        Alert.alert('Error', 'Error en transcripción: ' + resp.status);
        setIsProcessing(false);
        return;
      }

      const json = await resp.json();
      // Esperamos que el backend responda { transcription: "texto..." }
      const resultText = json.transcription || json.text || '';

      setTranscription(resultText);
      // Emitimos para que el ChatScreen lo reciba
      DeviceEventEmitter.emit('voiceTranscription', (resultText as string).trim());
      // opcional: volver atrás
      router.back();
    } catch (err) {
      console.error('stopRecordingAndProcess error', err);
      Alert.alert('Error', 'No se pudo procesar la grabación: ' + ((err as any)?.message ?? err));
    } finally {
      setIsProcessing(false);
    }
  }

  const onMicPress = () => {
    if (isRecording) {
      void stopRecordingAndProcess();
    } else {
      void startRecording();
    }
  };

  const sendToChatManual = () => {
    if (!transcription.trim()) {
      Alert.alert('No hay texto', 'Graba o escribe algo antes de enviar.');
      return;
    }
    DeviceEventEmitter.emit('voiceTranscription', transcription.trim());
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <TouchableOpacity style={{ position: 'absolute', top: 60, right: 20 }} onPress={() => router.back()}>
        <Text style={{ fontSize: 30, color: '#fff' }}>✕</Text>
      </TouchableOpacity>

      <Text style={{ position: 'absolute', top: 60, color: '#fff', fontSize: 16, opacity: 0.7 }}>
        Speaking to AI Bot
      </Text>

      <Image source={botAsset} style={{ width: 200, height: 200, marginBottom: 20 }} resizeMode="contain" />

      <Text style={{ color: '#fff', fontSize: 20, fontWeight: '600', textAlign: 'center', paddingHorizontal: 20, marginBottom: 12 }}>
        Describe lo que quieras decirle a la IA
      </Text>

      <TextInput
        value={transcription}
        onChangeText={setTranscription}
        placeholder="Aquí aparecerá la transcripción..."
        placeholderTextColor="#888"
        style={{
          width: '90%',
          minHeight: 48,
          backgroundColor: '#111',
          color: '#fff',
          paddingHorizontal: 12,
          borderRadius: 10,
          marginBottom: 16,
        }}
        multiline
      />

      <TouchableOpacity
        style={{
          width: 110,
          height: 110,
          borderRadius: 60,
          backgroundColor: isRecording ? '#ff0033' : '#222',
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: 2,
          borderColor: isRecording ? '#ff5577' : '#444',
          marginBottom: 18,
        }}
        onPress={onMicPress}
      >
        <Text style={{ fontSize: 50, color: '#fff' }}>{isRecording ? '◼️' : '🎤'}</Text>
      </TouchableOpacity>

      <View style={{ flexDirection: 'row', gap: 24, alignItems: 'center' }}>
        <TouchableOpacity onPress={() => { /* TTS placeholder */ }} >
          <Text style={{ fontSize: 28, color: '#888' }}>🔈</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={sendToChatManual}
          style={{ backgroundColor: '#00d4ff', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 }}
          disabled={isProcessing}
        >
          {isProcessing ? <ActivityIndicator /> : <Text style={{ color: '#000', fontWeight: '700' }}>Enviar a chat</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}
