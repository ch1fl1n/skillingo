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
  Modal,
  ScrollView,
  Dimensions
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

// IMPORTS desde tu lib/gemini
import { safeGenerateChat, approximateTokens, ChatMessage } from '../../lib/gemini';

// Avatar asset
import botAsset from '../../assets/images/icon.png';

const BOT_AVATAR = botAsset;
const { width } = Dimensions.get('window');

type MsgUi = {
  id: string;
  from: 'bot' | 'me';
  text: string;
  time?: string;
};

// --- DATOS DE LOS PLANES BOMBI AI ---
const PLANS = [
  {
    id: 1,
    title: 'Bombi AI Plus',
    description: 'Aumenta tu productividad con acceso ampliado a la IA de Bombi y mayor almacenamiento.',
    storage: '200 GB',
    subtext: 'Aplicación Bombi y más',
    price: '3,99 €',
    oldPrice: '7,99 €',
    duration: 'al mes durante 2 meses',
    btnText: 'Aprovechar oferta',
    isNew: true,
  },
  {
    id: 2,
    title: 'Bombi AI Pro',
    description: 'Acceso superior a la IA de Bombi para una productividad ilimitada, además de almacenamiento amplio.',
    storage: '2 TB',
    subtext: 'Aplicación Bombi y más',
    price: '0 €',
    oldPrice: '21,99 €',
    duration: 'durante el primer mes',
    btnText: 'Iniciar prueba',
    isNew: false,
  },
  {
    id: 3,
    title: 'Bombi AI Ultra',
    description: 'Ve más allá de lo posible con acceso completo a la IA de Bombi y el máximo almacenamiento.',
    storage: '30 TB',
    subtext: 'Aplicación Bombi y más',
    price: '139,99 €',
    oldPrice: '274,99 €',
    duration: 'al mes durante 3 meses',
    btnText: 'Aprovechar oferta',
    isNew: false,
  },
];

export default function ChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Hola, soy Bombi. ¿En qué te ayudo hoy?' },
  ]);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ESTADO PARA EL MODAL DE SUSCRIPCIÓN
  const [modalVisible, setModalVisible] = useState(false);

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
      
      {/* --- MODAL DE SUSCRIPCIÓN --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Botón cerrar modal */}
            <TouchableOpacity 
              style={styles.closeModalBtn} 
              onPress={() => setModalVisible(false)}
            >
              <MaterialCommunityIcons name="close" size={24} color="#fff" />
            </TouchableOpacity>

            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.plansContainer}
              decelerationRate="fast"
              snapToInterval={width * 0.85 + 20} // Ancho tarjeta + margen
            >
              {PLANS.map((plan) => (
                <View style={styles.planCard} key={plan.id}>
                  {plan.isNew && (
                    <View style={styles.newBadge}>
                      <Text style={styles.newBadgeText}>Nuevo</Text>
                    </View>
                  )}
                  
                  <Text style={styles.planTitle}>{plan.title}</Text>
                  <Text style={styles.planDesc}>{plan.description}</Text>
                  
                  <View style={styles.separator} />
                  
                  <Text style={styles.planStorage}>{plan.storage}</Text>
                  <Text style={styles.planSubtext}>{plan.subtext}</Text>
                  
                  <View style={styles.priceContainer}>
                     <Text style={styles.oldPrice}>{plan.oldPrice}</Text>
                     <Text style={styles.planDuration}> al mes</Text>
                  </View>
                  
                  <View style={styles.currentPriceRow}>
                    <Text style={styles.currentPrice}>{plan.price}</Text>
                    <Text style={styles.planDuration}> {plan.duration}</Text>
                  </View>

                  <TouchableOpacity>
                    <Text style={styles.linkText}>Ver características del plan +</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.planButton}>
                    <Text style={styles.planButtonText}>{plan.btnText}</Text>
                    <MaterialCommunityIcons name="arrow-right" size={16} color="#fff" style={{marginLeft: 4}} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

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

        {/* CONTENEDOR BOTONES HEADER */}
        <View style={{ flexDirection: 'row' }}>
          {/* BOTÓN PLUS QUE ABRE EL MODAL */}
          <TouchableOpacity style={styles.menuBtn} onPress={() => setModalVisible(true)}>
             <MaterialCommunityIcons name="plus-circle-outline" size={24} color="#4da6ff" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuBtn}>
            <MaterialCommunityIcons name="dots-vertical" size={22} color="#e6e6e6" />
          </TouchableOpacity>
        </View>
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
  // Colores para el modal
  modalBg: 'rgba(0,0,0,0.85)',
  cardBg: '#000000', // Fondo negro puro o muy oscuro para las tarjetas
  cardBorder: '#1a73e8', // Azul de Google/Bombi
  btnBlue: '#1a73e8',
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
    justifyContent: 'space-between', // Ajustado para distribuir espacio
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

  // --- STYLES DEL MODAL ---
  modalOverlay: {
    flex: 1,
    backgroundColor: PALETTE.modalBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    height: '70%', // Ocupa buena parte de la pantalla
    justifyContent: 'center',
  },
  closeModalBtn: {
    position: 'absolute',
    top: -50,
    right: 20,
    backgroundColor: '#333',
    borderRadius: 20,
    padding: 8,
    zIndex: 10,
  },
  plansContainer: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  planCard: {
    width: width * 0.85, // 85% del ancho de pantalla
    backgroundColor: PALETTE.cardBg,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: PALETTE.cardBorder,
    padding: 24,
    marginRight: 15, // Espacio entre tarjetas
    alignItems: 'center',
    justifyContent: 'space-between',
    // Sombra (solo funciona bien en iOS, en Android usa elevation)
    shadowColor: PALETTE.cardBorder,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  newBadge: {
    position: 'absolute',
    top: 15,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  newBadgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  planTitle: {
    color: '#4da6ff', // Azul clarito para el título
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    textAlign: 'center',
  },
  planDesc: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 20,
  },
  separator: {
    height: 1,
    width: '20%',
    backgroundColor: '#333',
    marginVertical: 10,
  },
  planStorage: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  planSubtext: {
    color: '#ccc',
    fontSize: 12,
    marginBottom: 15,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  oldPrice: {
    color: '#777',
    fontSize: 14,
    textDecorationLine: 'line-through',
  },
  currentPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 5,
  },
  currentPrice: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  planDuration: {
    color: '#ccc',
    fontSize: 12,
  },
  linkText: {
    color: '#8ab4f8',
    fontSize: 12,
    textDecorationLine: 'underline',
    marginBottom: 20,
    marginTop: 10,
  },
  planButton: {
    backgroundColor: PALETTE.btnBlue,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 25,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  planButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});