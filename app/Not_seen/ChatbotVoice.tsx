// app/ChatbotVoice.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  StyleSheet,
  DeviceEventEmitter,
} from 'react-native';
import { router } from 'expo-router';
import { Audio } from 'expo-av';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import botAsset from '../../assets/images/icon.png';

/**
 * ChatbotVoice
 * - usa expo-av para grabar audio (funciona en Expo Go)
 * - prepara opciones de grabación explícitas (no usa constantes faltantes)
 * - sube la grabación al endpoint de transcripción (placeholder)
 *
 * Nota: ajusta TRANSCRIBE_ENDPOINT a tu endpoint real.
 */

export default function ChatbotVoice() {
  const [transcription, setTranscription] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const durationIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Audio.requestPermissionsAsync();
        setPermissionGranted(status === 'granted');

        // audio mode: uso un config mínimo compatible
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        } as any);
      } catch (err) {
        console.warn('Permission / audio mode error', err);
      }
    })();

    return () => {
      // cleanup
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      (async () => {
        if (recordingRef.current) {
          try {
            await recordingRef.current.stopAndUnloadAsync();
          } catch {}
          recordingRef.current = null;
        }
      })();
    };
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startTimer = () => {
    setRecordingDuration(0);
    durationIntervalRef.current = setInterval(() => {
      setRecordingDuration((s) => s + 1);
    }, 1000) as unknown as number;
  };

  const stopTimer = () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  };

  const TRANSCRIBE_ENDPOINT =
    (process.env.EXPO_PUBLIC_TRANSCRIBE_URL as string) || 'https://your-backend.example.com/transcribe';

  // Opciones explícitas para prepareToRecordAsync (evitamos usar constantes que fallan)
  const RECORDING_OPTIONS: any = {
    android: {
      extension: '.m4a',
      // muchas versiones de expo-av aceptan estos valores numéricos para outputFormat/audioEncoder,
      // pero para evitar dependencias a constantes que no existen en tu entorno, omitimos los enums
      // y nos quedamos con parámetros básicos.
      sampleRate: 44100,
      numberOfChannels: 1,
      bitRate: 128000,
      // si tu versión soporta outputFormat/audioEncoder, puedes añadirlos aquí.
    },
    ios: {
      extension: '.caf',
      sampleRate: 44100,
      numberOfChannels: 1,
      bitRate: 128000,
      linearPCMBitDepth: 16,
      linearPCMIsBigEndian: false,
      linearPCMIsFloat: false,
    },
  };

  const startRecording = async () => {
    if (!permissionGranted) {
      Alert.alert('Permiso denegado', 'Activa permisos de micrófono para grabar.');
      return;
    }

    try {
      // crear instancia de Recording
      const recording = new Audio.Recording();

      // prepareToRecordAsync exige opciones -> pasamos nuestro objeto explícito casteado a any
      await recording.prepareToRecordAsync(RECORDING_OPTIONS as any);

      await recording.startAsync();
      recordingRef.current = recording;
      setIsRecording(true);
      startTimer();
    } catch (error) {
      console.log('Error startRecording:', error);
      Alert.alert('Error', 'No se pudo iniciar la grabación. Reinicia la app si persiste.');
      setIsRecording(false);
      stopTimer();
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      stopTimer();
      if (!recordingRef.current) return;

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (!uri) {
        Alert.alert('Error', 'No se obtuvo la grabación.');
        return;
      }

      // subimos y transcribimos
      setIsProcessing(true);
      try {
        const text = await uploadAudioForTranscription(uri);
        if (text && typeof text === 'string') {
          setTranscription(text);
        } else {
          Alert.alert('Transcripción', 'No se obtuvo texto. Intenta de nuevo.');
        }
      } catch (err) {
        console.error('Transcription error', err);
        Alert.alert('Error', 'Fallo la transcripción: ' + ((err as any)?.message || String(err)));
      } finally {
        setIsProcessing(false);
      }
    } catch (error) {
      console.log('Error stopRecording:', error);
      setIsProcessing(false);
      setIsRecording(false);
    }
  };

  // Subida al servidor / transcripción (POST multipart/form-data con file)
  const uploadAudioForTranscription = async (uri: string): Promise<string | null> => {
    try {
      const filename = uri.split('/').pop() ?? `recording_${Date.now()}.m4a`;
      const ext = filename.split('.').pop()?.toLowerCase();
      const mime = ext === 'wav' ? 'audio/wav' : ext === 'm4a' ? 'audio/mp4' : 'audio/mpeg';

      const form = new FormData();
      // RN FormData file shape
      // @ts-ignore
      form.append('file', {
        uri,
        name: filename,
        type: mime,
      });

      const resp = await fetch(TRANSCRIBE_ENDPOINT, {
        method: 'POST',
        body: form as any,
        // No añadir Content-Type (fetch/React Native lo hará con boundary)
      });

      if (!resp.ok) {
        const text = await resp.text();
        console.error('Transcribe server error:', resp.status, text);
        throw new Error('Transcription server error: ' + resp.status);
      }

      const json = await resp.json();
      if (json && (json.transcription || json.text)) {
        return json.transcription ?? json.text;
      }
      return (json?.result ?? json?.data ?? null) as string | null;
    } catch (err) {
      console.error('uploadAudioForTranscription error:', err);
      throw err;
    }
  };

  const onMicPress = () => {
    if (isRecording) {
      void stopRecording();
    } else {
      void startRecording();
    }
  };

  const sendToChat = () => {
    if (!transcription.trim()) {
      Alert.alert('No hay texto', 'Graba o escribe algo antes de enviar.');
      return;
    }
    DeviceEventEmitter.emit('voiceTranscription', transcription.trim());
    router.back();
  };

  const clearTranscription = () => setTranscription('');

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
        <MaterialCommunityIcons name="close" size={30} color="#fff" />
      </TouchableOpacity>

      <Text style={styles.title}>Speaking to AI Bot</Text>

      <Image source={botAsset} style={styles.image} resizeMode="contain" />

      <Text style={styles.subtitle}>Describe lo que quieras decirle a la IA</Text>

      <View style={styles.statusContainer}>
        {isRecording && (
          <View style={styles.recordingIndicator}>
            <MaterialCommunityIcons name="microphone" size={18} color="#ff4444" />
            <Text style={styles.recordingText}>Recording… {formatDuration(recordingDuration)}</Text>
          </View>
        )}

        {isProcessing && (
          <View style={styles.processingIndicator}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.processingText}>Processing audio…</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.recordBtn,
          (!permissionGranted || isProcessing) && styles.disabledBtn,
          isRecording && styles.recordingBtn,
        ]}
        onPress={onMicPress}
        disabled={!permissionGranted || isProcessing}
      >
        <MaterialCommunityIcons name={isRecording ? 'stop' : 'microphone'} size={50} color="#fff" />
      </TouchableOpacity>

      <TextInput
        value={transcription}
        onChangeText={setTranscription}
        placeholder="Transcription will appear here..."
        placeholderTextColor="#888"
        style={styles.transcriptionInput}
        multiline
        textAlignVertical="top"
      />

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.clearBtn} onPress={clearTranscription} disabled={!transcription.trim()}>
          <MaterialCommunityIcons name="delete-outline" size={18} color="#666" />
          <Text style={styles.clearBtnText}>Clear</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sendBtn, (!transcription.trim() || isProcessing) && styles.sendBtnDisabled]}
          onPress={sendToChat}
          disabled={!transcription.trim() || isProcessing}
        >
          {isProcessing ? <ActivityIndicator color="#000" /> : <Text style={styles.sendBtnText}>Enviar a chat</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 20, alignItems: 'center' },
  closeBtn: { position: 'absolute', top: 40, right: 16 },
  title: { position: 'absolute', top: 44, color: '#fff', fontSize: 16, opacity: 0.8 },
  image: { width: 200, height: 200, marginTop: 80, marginBottom: 18 },
  subtitle: { color: '#fff', fontSize: 20, fontWeight: '600', textAlign: 'center', marginBottom: 12 },
  statusContainer: { minHeight: 32, marginBottom: 8, alignItems: 'center' },
  recordingIndicator: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recordingText: { color: '#ff8b8b', marginLeft: 8 },
  processingIndicator: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  processingText: { color: '#fff', marginLeft: 8 },
  recordBtn: {
    width: 110,
    height: 110,
    borderRadius: 60,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#444',
    marginBottom: 18,
  },
  recordingBtn: { backgroundColor: '#610000', borderColor: '#ff4d5a' },
  disabledBtn: { opacity: 0.5 },
  transcriptionInput: {
    width: '100%',
    minHeight: 120,
    backgroundColor: '#111',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  actionsRow: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  clearBtn: {
    backgroundColor: '#161616',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clearBtnText: { color: '#666', marginLeft: 8 },
  sendBtn: { backgroundColor: '#00d4ff', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 10 },
  sendBtnDisabled: { opacity: 0.6 },
  sendBtnText: { color: '#000', fontWeight: '700' },
});
