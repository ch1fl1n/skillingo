// ChatbotVoice.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { DeviceEventEmitter } from 'react-native';
import { Audio } from 'expo-av';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import botAsset from '../../assets/images/icon.png';

export default function VoiceMode() {
  const [transcription, setTranscription] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  useEffect(() => {
    requestPermissions();
    return () => {
      cleanup();
    };
  }, []);

  const requestPermissions = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      setPermissionGranted(granted);
      if (!granted) {
        Alert.alert(
          'Permission Required',
          'Audio recording permission is required for voice input.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
    }
  };

  const cleanup = () => {
    setIsRecording(false);
    setRecordingDuration(0);
  };

  const startRecording = async () => {
    if (!permissionGranted) {
      Alert.alert('Permission Required', 'Please grant audio recording permission first.');
      return;
    }

    if (isRecording) return;

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        playThroughEarpieceAndroid: false,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      await recording.startAsync();

      setIsRecording(true);
      setRecordingDuration(0);

      // Update duration every second
      const interval = setInterval(() => {
        setRecordingDuration(prev => {
          if (prev >= 30) { // Auto-stop after 30 seconds
            clearInterval(interval);
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

      // Store interval for cleanup
      (recording as Audio.Recording & { _interval?: ReturnType<typeof setInterval> })._interval = interval;

    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!isRecording) return;

    try {
      setIsProcessing(true);

      // Stop recording and get URI
      const { recording } = await Audio.Recording.createAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      setIsRecording(false);
      setRecordingDuration(0);

      if (uri) {
        // Here you would send the audio file to a speech-to-text service
        // For now, we'll simulate transcription
        await simulateTranscription();
      }

    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to process recording.');
      setIsRecording(false);
      setIsProcessing(false);
    }
  };

  const simulateTranscription = async () => {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulate different transcriptions based on "recording duration"
    const transcriptions = [
      'Hola Bombi, ¿puedes ayudarme con una pregunta sobre React Native?',
      '¿Cuál es la mejor manera de aprender TypeScript?',
      'Cuéntame sobre las mejores prácticas en desarrollo móvil.',
      '¿Cómo puedo optimizar el rendimiento de mi aplicación?',
      '¿Qué consejos tienes para debugging en React Native?',
    ];

    const randomTranscription = transcriptions[Math.floor(Math.random() * transcriptions.length)];
    setTranscription(randomTranscription);
    setIsProcessing(false);

    Alert.alert(
      'Recording Complete',
      'Your voice has been transcribed. You can edit the text before sending it to the chat.',
      [{ text: 'OK' }]
    );
  };

  const sendToChat = () => {
    if (!transcription.trim()) {
      Alert.alert('No Text', 'Please enter or record some text before sending.');
      return;
    }

    // Emit the transcription; ChatScreen listens for 'voiceTranscription'
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

      <Text style={styles.title}>Speaking to AI Bot</Text>

      <Image source={botAsset} style={styles.avatar} resizeMode="contain" />

      <Text style={styles.subtitle}>
        Describe what you want to tell the AI
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
          style={[styles.sendBtn, !transcription.trim() && styles.disabledBtn]}
          onPress={sendToChat}
          disabled={!transcription.trim()}
        >
          <Text style={styles.sendBtnText}>Send to Chat</Text>
          <MaterialCommunityIcons name="send" size={20} color="#000" />
        </TouchableOpacity>
      </View>

      {!permissionGranted && (
        <Text style={styles.permissionNote}>
          Audio recording permission is required to use voice input.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  closeBtn: {
    position: 'absolute',
    top: 60,
    right: 20,
  },
  title: {
    position: 'absolute',
    top: 60,
    color: '#fff',
    fontSize: 16,
    opacity: 0.7,
  },
  avatar: {
    width: 240,
    height: 240,
    marginBottom: 20,
  },
  subtitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  recordingSection: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 68, 68, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ff4444',
  },
  recordingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  processingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#00d4ff',
  },
  processingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  recordBtn: {
    width: 110,
    height: 110,
    borderRadius: 60,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#444',
    marginBottom: 30,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  recordingBtn: {
    backgroundColor: '#ff4444',
    borderColor: '#ff6666',
  },
  transcriptionInput: {
    width: '90%',
    minHeight: 80,
    backgroundColor: '#111',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 20,
    fontSize: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  clearBtnText: {
    color: '#666',
    fontSize: 14,
    marginLeft: 4,
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00d4ff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  sendBtnText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  permissionNote: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
});
