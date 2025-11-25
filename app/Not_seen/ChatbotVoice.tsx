// ChatbotVoice.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, TextInput, Alert } from 'react-native';
import { router } from 'expo-router';
import { DeviceEventEmitter } from 'react-native';
import botAsset from '../../assets/images/icon.png';

const TRANSCRIBE_ENDPOINT = (process.env.EXPO_PUBLIC_TRANSCRIBE_URL as string) || 'https://your-backend.example.com/transcribe';

export default function ChatbotVoice() {
  const [transcription, setTranscription] = useState('');

  // Aquí puedes integrar react-native-voice u otra lib de STT.
  // Por ahora dejamos un flujo manual para probar:
  // 1) Presiona el mic (simulado) para "grabar"
  // 2) Escribe/ajusta la transcripción y pulsa "Enviar a chat"

  const onMicPress = () => {
    // placeholder: aquí podrías iniciar grabación y luego convertir a texto
    // Para pruebas dejamos una transcripción de ejemplo
    setTranscription('Hola Bombi, recomiéndame un plan de fin de semana en la playa');
    Alert.alert('Grabación simulada', 'Se generó una transcripción de ejemplo. Edita si quieres.');
  };

  const sendToChatManual = () => {
    if (!transcription.trim()) {
      Alert.alert('No hay texto', 'Escribe o graba algo antes de enviar.');
      return;
    }
    // Emitimos la transcripción; ChatScreen escucha 'voiceTranscription'
    DeviceEventEmitter.emit('voiceTranscription', transcription.trim());
    router.back();
  };

  const clearTranscription = () => {
    setTranscription('');
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
        <MaterialCommunityIcons name="close" size={30} color="#fff" />
      </TouchableOpacity>

      <Text style={{ position: 'absolute', top: 60, color: '#fff', fontSize: 16, opacity: 0.7 }}>Speaking to AI Bot</Text>

      <Image source={botAsset} style={{ width: 240, height: 240, marginBottom: 20 }} resizeMode="contain" />

      <Text style={{ color: '#fff', fontSize: 22, fontWeight: '600', textAlign: 'center', paddingHorizontal: 20, marginBottom: 12 }}>
        Describe lo que quieras decirle a la IA
      </Text>

      <View style={styles.recordingSection}>
        {isRecording && (
          <View style={styles.recordingIndicator}>
            <MaterialCommunityIcons name="microphone" size={24} color="#ff4444" />
            <Text style={styles.recordingText}>Recording... {formatDuration(recordingDuration)}</Text>
          </View>
        )}

        {isProcessing && (
          <View style={styles.processingIndicator}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.processingText}>Processing audio...</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.recordBtn,
          (!permissionGranted || isProcessing) && styles.disabledBtn,
          isRecording && styles.recordingBtn,
        ]}
        onPress={isRecording ? stopRecording : startRecording}
        disabled={!permissionGranted || isProcessing}
      >
        <MaterialCommunityIcons
          name={isRecording ? "stop" : "microphone"}
          size={50}
          color="#fff"
        />
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

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.clearBtn}
          onPress={clearTranscription}
          disabled={!transcription.trim()}
        >
          <MaterialCommunityIcons name="delete-outline" size={20} color="#666" />
          <Text style={styles.clearBtnText}>Clear</Text>
        </TouchableOpacity>

      <TouchableOpacity
        style={{
          width: 110,
          height: 110,
          borderRadius: 60,
          backgroundColor: '#222',
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: 2,
          borderColor: '#444',
          marginBottom: 18,
        }}
        onPress={onMicPress}
      >
        <Text style={{ fontSize: 50, color: '#fff' }}>🎤</Text>
      </TouchableOpacity>

      <View style={{ flexDirection: 'row', gap: 24 }}>
        <TouchableOpacity onPress={() => {/* placeholder para reproducir */}} >
          <Text style={{ fontSize: 28, color: '#888' }}>🔈</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={sendToChat} style={{ backgroundColor: '#00d4ff', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 }}>
          <Text style={{ color: '#000', fontWeight: '700' }}>Enviar a chat</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
