// ChatbotVoice.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, TextInput, Alert } from 'react-native';
import { router } from 'expo-router';
import { DeviceEventEmitter } from 'react-native';
import botAsset from '../../assets/images/icon.png';

export default function VoiceMode() {
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

  const sendToChat = () => {
    if (!transcription.trim()) {
      Alert.alert('No hay texto', 'Escribe o graba algo antes de enviar.');
      return;
    }
    // Emitimos la transcripción; ChatScreen escucha 'voiceTranscription'
    DeviceEventEmitter.emit('voiceTranscription', transcription.trim());
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <TouchableOpacity style={{ position: 'absolute', top: 60, right: 20 }} onPress={() => router.back()}>
        <Text style={{ fontSize: 30, color: '#fff' }}>✕</Text>
      </TouchableOpacity>

      <Text style={{ position: 'absolute', top: 60, color: '#fff', fontSize: 16, opacity: 0.7 }}>Speaking to AI Bot</Text>

      <Image source={botAsset} style={{ width: 240, height: 240, marginBottom: 20 }} resizeMode="contain" />

      <Text style={{ color: '#fff', fontSize: 22, fontWeight: '600', textAlign: 'center', paddingHorizontal: 20, marginBottom: 12 }}>
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
