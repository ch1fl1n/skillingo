import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import { createLiveSession, GeminiLiveSession } from '../../lib/gemini-live';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function LiveVoiceChat() {
  const [connected, setConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [receivingAudioChunks, setReceivingAudioChunks] = useState(0);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const sessionRef = useRef<GeminiLiveSession | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

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
        Alert.alert('Permission Required', 'Audio recording permission is required for voice chat.');
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
    }
  };

  const cleanup = () => {
    if (recordingRef.current) {
      recordingRef.current.stopAndUnloadAsync();
      recordingRef.current = null;
    }
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    setConnected(false);
    setIsRecording(false);
  };

  function append(line: string) {
    setLog(l => [...l, `${new Date().toLocaleTimeString()}: ${line}`]);
  }

  function startSession() {
    if (sessionRef.current || !permissionGranted) return;

    append('Initializing live session...');
    const session = createLiveSession({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      responseModalities: ['AUDIO'],
      systemInstruction: 'You are Bombi, a friendly AI assistant. Respond in Spanish and be helpful and concise.'
    }, {
      onOpen: () => {
        setConnected(true);
        append('Connected to Gemini Live API');
      },
      onMessageDebug: (m) => append(`Debug: ${JSON.stringify(m).slice(0, 100)}...`),
      onAudioChunk: (chunk) => {
        setReceivingAudioChunks(c => c + 1);
        // Here you would play the audio chunk
        append(`Received audio chunk (${chunk.length} bytes)`);
      },
      onError: (e) => append(`Error: ${typeof e === 'string' ? e : 'Unknown error'}`),
      onClose: (code, reason) => {
        append(`Session closed (${code}): ${reason}`);
        setConnected(false);
        sessionRef.current = null;
        setIsRecording(false);
      }
    });
    sessionRef.current = session;
  }

  async function startRecording() {
    if (!connected || isRecording) return;

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const recording = new Audio.Recording();
      recordingRef.current = recording;

      await recording.prepareToRecordAsync({
        isMeteringEnabled: true,
      });

      await recording.startAsync();
      setIsRecording(true);
      append('Started recording...');

      // Auto-stop after 30 seconds
      setTimeout(() => {
        if (isRecording) {
          stopRecording();
        }
      }, 30000);

    } catch (error) {
      console.error('Failed to start recording:', error);
      append('Failed to start recording');
    }
  }

  async function stopRecording() {
    if (!recordingRef.current || !isRecording) return;

    try {
      setIsRecording(false);
      append('Stopping recording...');

      const status = await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();

      if (uri && status.durationMillis && status.durationMillis > 1000) {
        append(`Recording saved: ${uri} (${status.durationMillis}ms)`);

        // Here you would process the audio file and send it to Gemini
        // For now, we'll just send a text message
        sendTextMessage('Audio message received and processed');
      } else {
        append('Recording too short or failed');
      }

      recordingRef.current = null;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      append('Failed to stop recording');
    }
  }

  function sendTextMessage(text: string) {
    if (!sessionRef.current || !connected) {
      append('No active session to send message');
      return;
    }

    sessionRef.current.sendText(text);
    append(`Sent: ${text}`);
  }

  function stopSession() {
    cleanup();
    append('Session stopped manually');
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Live Voice Chat with Bombi</Text>

      {!permissionGranted && (
        <Text style={styles.warning}>
          Audio recording permission is required for voice chat.
        </Text>
      )}

      <View style={styles.statusContainer}>
        <Text style={styles.status}>
          Status: {connected ? '🟢 Connected' : '🔴 Disconnected'}
        </Text>
        <Text style={styles.status}>
          Recording: {isRecording ? '🎤 Active' : '⏸️ Stopped'}
        </Text>
      </View>

      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.controlButton, !permissionGranted && styles.disabledButton]}
          onPress={startSession}
          disabled={!permissionGranted || connected}
        >
          <MaterialCommunityIcons name="connection" size={24} color="#fff" />
          <Text style={styles.buttonText}>Connect</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, !connected && styles.disabledButton]}
          onPress={isRecording ? stopRecording : startRecording}
          disabled={!connected}
        >
          <MaterialCommunityIcons
            name={isRecording ? "stop" : "microphone"}
            size={24}
            color="#fff"
          />
          <Text style={styles.buttonText}>
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.disconnectButton]}
          onPress={stopSession}
          disabled={!connected && !isRecording}
        >
          <MaterialCommunityIcons name="power-off" size={24} color="#fff" />
          <Text style={styles.buttonText}>Disconnect</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickButton}
          onPress={() => sendTextMessage('Hola Bombi, ¿cómo estás?')}
          disabled={!connected}
        >
          <Text style={styles.quickButtonText}>Say Hello</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickButton}
          onPress={() => sendTextMessage('Cuéntame un chiste')}
          disabled={!connected}
        >
          <Text style={styles.quickButtonText}>Tell a Joke</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.stats}>Audio chunks received: {receivingAudioChunks}</Text>

      <Text style={styles.logsTitle}>Activity Logs:</Text>
      <ScrollView style={styles.logsContainer} nestedScrollEnabled>
        {log.slice(-20).map((line, i) => (
          <Text key={i} style={styles.logLine}>{line}</Text>
        ))}
      </ScrollView>

      <Text style={styles.note}>
        Note: Full audio processing requires additional setup with PCM conversion and real-time streaming.
        This is a demonstration of the Live API integration structure.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
    backgroundColor: '#1a1a1a',
    minHeight: '100%',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  warning: {
    color: '#ff6b6b',
    textAlign: 'center',
    fontSize: 14,
  },
  statusContainer: {
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  status: {
    color: '#fff',
    fontSize: 14,
  },
  controlsContainer: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  controlButton: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    minWidth: 100,
  },
  disabledButton: {
    backgroundColor: '#555',
    opacity: 0.6,
  },
  disconnectButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickButton: {
    backgroundColor: '#28a745',
    padding: 10,
    borderRadius: 6,
    flex: 1,
    alignItems: 'center',
  },
  quickButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  stats: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
  },
  logsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logsContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 8,
    maxHeight: 200,
  },
  logLine: {
    color: '#ccc',
    fontSize: 11,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  note: {
    color: '#888',
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 16,
  },
});
