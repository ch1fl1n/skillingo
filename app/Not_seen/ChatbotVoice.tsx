import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';

export default function VoiceMode() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
      }}
    >

      {/* Botón cerrar */}
      <TouchableOpacity
        style={{ position: 'absolute', top: 60, right: 20 }}
        onPress={() => router.back()}
      >
        <Text style={{ fontSize: 30, color: '#fff' }}>✕</Text>
      </TouchableOpacity>

      {/* Título arriba estilo iPhone */}
      <Text
        style={{
          position: 'absolute',
          top: 60,
          color: '#fff',
          fontSize: 16,
          opacity: 0.7,
        }}
      >
        Speaking to AI Bot
      </Text>

      {/* Robot grande */}
      <Image
        source={require('../../assets/images/icon.png')} // AJUSTA SI TU ASSET ESTÁ EN OTRA RUTA
        style={{ width: 240, height: 240, marginBottom: 20 }}
        resizeMode="contain"
      />

      {/* Texto en el centro */}
      <Text
        style={{
          color: '#fff',
          fontSize: 22,
          fontWeight: '600',
          textAlign: 'center',
          paddingHorizontal: 20,
          marginBottom: 50,
        }}
      >
        Describe and show me the perfect vacation spot
      </Text>

      {/* Botón principal del micrófono */}
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
        }}
        onPress={() => console.log("Mic pressed")}
      >
        <Text style={{ fontSize: 50, color: '#fff' }}>🎤</Text>
      </TouchableOpacity>

      {/* Sección inferior */}
      <View
        style={{
          position: 'absolute',
          bottom: 50,
          flexDirection: 'row',
          gap: 40,
        }}
      >
        <TouchableOpacity>
          <Text style={{ fontSize: 28, color: '#888' }}>🔈</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/Not_seen/Chatbot')}>
          <Text style={{ fontSize: 28, color: '#888' }}>⌨️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
