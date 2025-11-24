// ChatScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  DeviceEventEmitter,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

// IMPORTS desde tu lib/gemini (usa tus archivos nuevos)
import { safeGenerateChat, approximateTokens, ChatMessage } from '../../lib/gemini';

// Avatar asset (asegúrate de tener /assets/images/icon.png)
import botAsset from '../../assets/images/icon.png';

const BOT_AVATAR = botAsset;

type MsgUi = {
  id: string;
  from: 'bot' | 'me';
  text: string;
  time?: string;
};

export default function ChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Hola, soy Bombi. ¿En qué te ayudo hoy?' },
  ]);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Map messages -> UI (inverted for FlatList)
  const messagesUi: MsgUi[] = useMemo(
    () =>
      messages
        .map((m, i) => ({
          id: `${i}-${m.text.substring(0, 12)}`,
          from: m.role === 'user' ? 'me' as const : 'bot' as const,
          text: m.text,
        }))
        .reverse(),
    [messages]
  );

  // Escucha transcripciones desde ChatbotVoice
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('voiceTranscription', (transcription: string) => {
      if (typeof transcription === 'string' && transcription.trim().length > 0) {
        void sendVoicePrompt(transcription.trim());
      }
    });
    return () => sub.remove();
  }, [messages, loading]);

  const tokenEstimate = useMemo(() => approximateTokens(messages.map((m) => m.text).join('\n')), [messages]);

  async function sendVoicePrompt(transcription: string) {
    if (!transcription || loading) return;
    const userMsg: ChatMessage = { role: 'user', text: transcription };
    setMessages((m) => [...m, userMsg]);
    setPrompt('');
    setLoading(true);
    setError(null);

    const result = await safeGenerateChat([...messages, userMsg]);
    setLoading(false);

    if (!result.ok) {
      setError(result.error || 'Error al generar respuesta (voice)');
      return;
    }
    setMessages((m) => [...m, { role: 'model', text: result.text ?? '...' }]);
  }

  async function send() {
    const text = prompt.trim();
    if (!text || loading) return;
    const userMsg: ChatMessage = { role: 'user', text };
    setMessages((m) => [...m, userMsg]);
    setPrompt('');
    setLoading(true);
    setError(null);

    try {
      const result = await safeGenerateChat([...messages, userMsg]);
      setLoading(false);
      if (!result.ok) {
        setError(result.error || 'Error al generar respuesta');
        return;
      }
      setMessages((m) => [...m, { role: 'model', text: result.text ?? '...' }]);
    } catch (err: unknown) {
      setLoading(false);
      setError(String(err));
    }
  }

  function renderItem({ item }: { item: MsgUi }) {
    if (item.from === 'bot') {
      return (
        <View style={styles.rowLeft}>
          <Image source={BOT_AVATAR} style={styles.avatar} />
          <View style={styles.bubbleDarkWrapper}>
            <View style={styles.bubbleDark}>
              <Text style={styles.bubbleDarkText}>{item.text}</Text>
            </View>
            <TouchableOpacity style={styles.starTouch}>
              <MaterialCommunityIcons name="star-outline" size={16} color="#9aa0a6" />
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    // usuario
    return (
      <View style={styles.rowRight}>
        <View style={styles.bubbleLight}>
          <Text style={styles.bubbleLightText}>{item.text}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/')} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#e6e6e6" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Image source={BOT_AVATAR} style={styles.headerAvatar} />
          <Text style={styles.headerTitle}>Bombi Chat</Text>
          <Text style={styles.headerSubtitle}>Chat Bot</Text>
        </View>

        <TouchableOpacity style={styles.menuBtn}>
          <MaterialCommunityIcons name="dots-vertical" size={22} color="#e6e6e6" />
        </TouchableOpacity>
      </View>

      {/* timestamp */}
      <View style={styles.centerTime}>
        <Text style={styles.centerTimeText}>19.01.12</Text>
      </View>

      {/* Messages list */}
      <FlatList
        data={messagesUi}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        inverted
        showsVerticalScrollIndicator={false}
        ListFooterComponent={() => (
          <>
            {loading && (
              <View style={{ paddingVertical: 8 }}>
                <ActivityIndicator size="small" color="#cbd5e1" />
              </View>
            )}
            {error && <Text style={{ color: '#ff6666', textAlign: 'center', marginVertical: 6 }}>{error}</Text>}
            <Text style={{ color: '#9aa0a6', fontSize: 12, textAlign: 'center', marginBottom: 8 }}>
              Tokens aprox: {tokenEstimate}
            </Text>
          </>
        )}
      />

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <View style={styles.inputBar}>
          <View style={styles.inputInner}>
            <TextInput
              placeholder="Escribe tu mensaje..."
              placeholderTextColor="#9aa0a6"
              value={prompt}
              onChangeText={setPrompt}
              style={styles.input}
              onSubmitEditing={() => void send()}
              returnKeyType="send"
            />
            <TouchableOpacity style={styles.emojiBtn}>
              <MaterialCommunityIcons name="emoticon-outline" size={20} color="#e6e6e6" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.micBtn} onPress={() => router.push('/Not_seen/ChatbotVoice')}>
              <MaterialCommunityIcons name="microphone" size={20} color="#e6e6e6" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.sendBtn} onPress={() => void send()}>
            <MaterialCommunityIcons name="send" size={20} color="#1b1b1b" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

/* ---------------- Styles ---------------- */
const PALETTE = {
  bg: '#1f1f1f',
  header: '#2b2b2b',
  bubbleBot: '#2e3234',
  bubbleUser: '#e9eef1',
  textLight: '#e6e6e6',
  textDark: '#141414',
  neutral: '#9aa0a6',
  inputBg: '#2b2b2b',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PALETTE.bg },
  header: {
    height: 92,
    paddingTop: Platform.OS === 'ios' ? 48 : 36,
    paddingHorizontal: 14,
    backgroundColor: PALETTE.header,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center', marginRight: 8, marginTop: 6 },
  headerCenter: { flex: 1, alignItems: 'center', flexDirection: 'column' },
  headerAvatar: { width: 44, height: 44, borderRadius: 22, marginBottom: 4 },
  headerTitle: { color: PALETTE.textLight, fontSize: 14, fontWeight: '700' },
  headerSubtitle: { color: PALETTE.neutral, fontSize: 11, marginTop: 2 },
  menuBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center', marginTop: 6 },

  centerTime: { alignItems: 'center', marginVertical: 8 },
  centerTimeText: { color: PALETTE.neutral, fontSize: 12 },

  list: { paddingHorizontal: 16, paddingBottom: 14 },

  rowLeft: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  avatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  bubbleDarkWrapper: { flexDirection: 'row', alignItems: 'center' },
  bubbleDark: {
    backgroundColor: PALETTE.bubbleBot,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    maxWidth: '75%',
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  bubbleDarkText: { color: PALETTE.textLight, fontSize: 13, lineHeight: 18 },
  starTouch: { marginLeft: 8, alignSelf: 'center' },

  rowRight: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 14 },
  bubbleLight: {
    backgroundColor: PALETTE.bubbleUser,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    maxWidth: '80%',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
  },
  bubbleLightText: { color: PALETTE.textDark, fontSize: 13, lineHeight: 18 },

  inputBar: { padding: 12, backgroundColor: PALETTE.header, flexDirection: 'row', alignItems: 'center' },
  inputInner: { flexDirection: 'row', alignItems: 'center', backgroundColor: PALETTE.inputBg, borderRadius: 28, paddingHorizontal: 12, flex: 1, height: 48 },
  input: { flex: 1, paddingVertical: 10, paddingHorizontal: 8, color: PALETTE.textLight, fontSize: 14 },
  emojiBtn: { marginLeft: 6, marginRight: 4, padding: 6 },
  micBtn: { marginLeft: 6, marginRight: 4, padding: 6 },
  sendBtn: { marginLeft: 10, backgroundColor: '#cbd5e1', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
});
