/**
 * MasteryFeedback Component
 * 
 * Componente React Native para mostrar retroalimentación basada en dominio
 * con interfaz conversacional y constructiva.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type {
  MasteryEvaluation,
  EvaluationSession,
  EvaluationMessage,
} from '@/types/mastery-evaluation.types';
import { continueEvaluationConversation } from '@/lib/mastery-evaluator';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface MasteryFeedbackProps {
  evaluation: MasteryEvaluation;
  session: EvaluationSession;
  onSessionUpdate?: (session: EvaluationSession) => void;
  onClose?: () => void;
  onRetry?: () => void;
  onContinue?: () => void;
}

export default function MasteryFeedback({
  evaluation,
  session,
  onSessionUpdate,
  onClose,
  onRetry,
  onContinue,
}: MasteryFeedbackProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  
  // Definir colores específicos para el componente
  const colors = {
    text: theme.text,
    background: theme.background,
    cardBackground: colorScheme === 'dark' ? '#1e1e1e' : '#ffffff',
    primary: typeof theme.primary === 'object' ? theme.primary['500'] : theme.primary,
    success: '#4caf50',
    warning: '#ff9800',
    disabled: '#bdbdbd',
    secondaryText: colorScheme === 'dark' ? '#aaaaaa' : '#666666',
    inputBackground: colorScheme === 'dark' ? '#2a2a2a' : '#f5f5f5',
  };

  const [conversationMode, setConversationMode] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [localSession, setLocalSession] = useState(session);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || isSending) return;

    const message = messageInput.trim();
    setMessageInput('');
    setIsSending(true);

    try {
      const { response, updatedSession } = await continueEvaluationConversation(
        localSession,
        message
      );

      setLocalSession(updatedSession);
      onSessionUpdate?.(updatedSession);

      // Scroll al final después de actualizar
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);

    } catch (error) {
      console.error('Error enviando mensaje:', error);
      alert('Error al enviar mensaje. Por favor intenta de nuevo.');
    } finally {
      setIsSending(false);
    }
  };

  const renderObjectiveItem = (obj: any, index: number) => {
    const isAchieved = obj.mastery === 'achieved';
    const icon = isAchieved ? 'check-circle' : 'circle-outline';
    const iconColor = isAchieved ? colors.success : colors.warning;

    return (
      <View key={obj.objectiveId} style={[styles.objectiveCard, { backgroundColor: colors.cardBackground }]}>
        <View style={styles.objectiveHeader}>
          <MaterialCommunityIcons name={icon} size={24} color={iconColor} />
          <Text style={[styles.objectiveTitle, { color: colors.text }]}>
            Objetivo {index + 1}
          </Text>
          <View style={[
            styles.masteryBadge,
            { backgroundColor: isAchieved ? colors.success : colors.warning }
          ]}>
            <Text style={styles.masteryBadgeText}>
              {isAchieved ? 'LOGRADO' : 'NO LOGRADO'}
            </Text>
          </View>
        </View>

        <Text style={[styles.qualitativeText, { color: colors.text }]}>
          {obj.qualitativeAssessment}
        </Text>

        {obj.evidence.length > 0 && (
          <View style={styles.evidenceSection}>
            <Text style={[styles.sectionLabel, { color: colors.secondaryText }]}>
              📌 Evidencias:
            </Text>
            {obj.evidence.map((ev: string, i: number) => (
              <Text key={i} style={[styles.evidenceItem, { color: colors.text }]}>
                • {ev}
              </Text>
            ))}
          </View>
        )}

        {!isAchieved && obj.suggestions.length > 0 && (
          <View style={styles.suggestionsSection}>
            <Text style={[styles.sectionLabel, { color: colors.secondaryText }]}>
              💡 Sugerencias:
            </Text>
            {obj.suggestions.map((sug: string, i: number) => (
              <Text key={i} style={[styles.suggestionItem, { color: colors.text }]}>
                • {sug}
              </Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderConversationMessage = (msg: EvaluationMessage, index: number) => {
    const isStudent = msg.role === 'student';
    
    return (
      <View
        key={index}
        style={[
          styles.messageContainer,
          isStudent ? styles.studentMessage : styles.evaluatorMessage,
        ]}
      >
        <View style={[
          styles.messageBubble,
          {
            backgroundColor: isStudent ? colors.primary : colors.cardBackground,
            alignSelf: isStudent ? 'flex-end' : 'flex-start',
          }
        ]}>
          <Text style={[
            styles.messageText,
            { color: isStudent ? '#fff' : colors.text }
          ]}>
            {msg.content}
          </Text>
          <Text style={[
            styles.messageTime,
            { color: isStudent ? 'rgba(255,255,255,0.7)' : colors.secondaryText }
          ]}>
            {new Date(msg.timestamp).toLocaleTimeString()}
          </Text>
        </View>
      </View>
    );
  };

  if (conversationMode) {
    return (
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <View style={[styles.header, { backgroundColor: colors.cardBackground }]}>
          <TouchableOpacity onPress={() => setConversationMode(false)}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Conversación sobre tu evaluación
          </Text>
          {onClose && (
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.conversationScroll}
          contentContainerStyle={styles.conversationContent}
        >
          {localSession.messages.map(renderConversationMessage)}
          {isSending && (
            <View style={styles.loadingMessage}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.secondaryText }]}>
                Pensando...
              </Text>
            </View>
          )}
        </ScrollView>

        <View style={[styles.inputContainer, { backgroundColor: colors.cardBackground }]}>
          <TextInput
            style={[styles.input, { color: colors.text, backgroundColor: colors.inputBackground }]}
            placeholder="Escribe tu pregunta o reflexión..."
            placeholderTextColor={colors.secondaryText}
            value={messageInput}
            onChangeText={setMessageInput}
            multiline
            maxLength={500}
            editable={!isSending}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: messageInput.trim() && !isSending ? colors.primary : colors.disabled }
            ]}
            onPress={handleSendMessage}
            disabled={!messageInput.trim() || isSending}
          >
            <MaterialCommunityIcons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <Animated.View style={[styles.container, { backgroundColor: colors.background, opacity: fadeAnim }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header con dominio general */}
        <View style={[styles.overallCard, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.openingMessage, { color: colors.text }]}>
            {evaluation.conversationalFeedback.opening}
          </Text>

          <View style={styles.overallMasteryContainer}>
            <MaterialCommunityIcons
              name={evaluation.overallMastery === 'achieved' ? 'trophy' : 'book-open-variant'}
              size={48}
              color={evaluation.overallMastery === 'achieved' ? colors.success : colors.warning}
            />
            <View style={styles.overallMasteryText}>
              <Text style={[styles.overallLabel, { color: colors.secondaryText }]}>
                Dominio General
              </Text>
              <Text style={[
                styles.overallStatus,
                { color: evaluation.overallMastery === 'achieved' ? colors.success : colors.warning }
              ]}>
                {evaluation.overallMastery === 'achieved' ? '✅ LOGRADO' : '📚 NO LOGRADO'}
              </Text>
            </View>
          </View>
        </View>

        {/* Fortalezas */}
        <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            💪 Tus Fortalezas
          </Text>
          {evaluation.conversationalFeedback.strengths.map((strength, i) => (
            <View key={i} style={styles.listItem}>
              <Text style={[styles.listItemText, { color: colors.text }]}>
                • {strength}
              </Text>
            </View>
          ))}
        </View>

        {/* Objetivos de aprendizaje */}
        <View style={styles.objectivesContainer}>
          <Text style={[styles.mainSectionTitle, { color: colors.text }]}>
            🎯 Objetivos de Aprendizaje
          </Text>
          {evaluation.objectives.map(renderObjectiveItem)}
        </View>

        {/* Áreas de crecimiento */}
        {evaluation.conversationalFeedback.areasForGrowth.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              🌱 Áreas de Crecimiento
            </Text>
            {evaluation.conversationalFeedback.areasForGrowth.map((area, i) => (
              <View key={i} style={styles.listItem}>
                <Text style={[styles.listItemText, { color: colors.text }]}>
                  • {area}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Próximos pasos */}
        {evaluation.nextSteps.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              🎯 Próximos Pasos
            </Text>
            {evaluation.nextSteps.map((step, i) => (
              <View key={i} style={styles.listItem}>
                <Text style={[styles.listItemText, { color: colors.text }]}>
                  {i + 1}. {step}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Mensaje de aliento */}
        <View style={[styles.encouragementCard, { backgroundColor: colors.primary + '15' }]}>
          <MaterialCommunityIcons name="heart" size={24} color={colors.primary} />
          <Text style={[styles.encouragementText, { color: colors.text }]}>
            {evaluation.conversationalFeedback.encouragement}
          </Text>
        </View>

        {/* Preguntas para reflexión */}
        {evaluation.conversationalFeedback.dialoguePrompts.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              💬 Reflexiona
            </Text>
            {evaluation.conversationalFeedback.dialoguePrompts.map((prompt, i) => (
              <View key={i} style={styles.listItem}>
                <Text style={[styles.listItemText, { color: colors.text }]}>
                  • {prompt}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Botones de acción */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.conversationButton, { backgroundColor: colors.primary }]}
            onPress={() => setConversationMode(true)}
          >
            <MaterialCommunityIcons name="chat" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Conversar sobre mi evaluación</Text>
          </TouchableOpacity>

          <View style={styles.secondaryActions}>
            {evaluation.overallMastery === 'not-achieved' && onRetry && (
              <TouchableOpacity
                style={[styles.actionButton, styles.retryButton, { backgroundColor: colors.warning }]}
                onPress={onRetry}
              >
                <MaterialCommunityIcons name="reload" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Intentar de nuevo</Text>
              </TouchableOpacity>
            )}

            {evaluation.overallMastery === 'achieved' && onContinue && (
              <TouchableOpacity
                style={[styles.actionButton, styles.continueButton, { backgroundColor: colors.success }]}
                onPress={onContinue}
              >
                <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Continuar</Text>
              </TouchableOpacity>
            )}

            {onClose && (
              <TouchableOpacity
                style={[styles.actionButton, styles.closeButton, { backgroundColor: colors.secondaryText }]}
                onPress={onClose}
              >
                <Text style={styles.actionButtonText}>Cerrar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginLeft: 12,
  },
  overallCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  openingMessage: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  overallMasteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  overallMasteryText: {
    marginLeft: 16,
    flex: 1,
  },
  overallLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  overallStatus: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  section: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  mainSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 8,
  },
  listItem: {
    marginBottom: 8,
  },
  listItemText: {
    fontSize: 15,
    lineHeight: 22,
  },
  objectivesContainer: {
    marginBottom: 16,
  },
  objectiveCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  objectiveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  objectiveTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  masteryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  masteryBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  qualitativeText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  evidenceSection: {
    marginTop: 8,
  },
  evidenceItem: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
    marginLeft: 8,
  },
  suggestionsSection: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderRadius: 8,
  },
  suggestionItem: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
    marginLeft: 8,
  },
  encouragementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  encouragementText: {
    fontSize: 15,
    lineHeight: 22,
    marginLeft: 12,
    flex: 1,
  },
  actionsContainer: {
    marginTop: 8,
    marginBottom: 32,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  conversationButton: {
    marginBottom: 16,
  },
  secondaryActions: {
    gap: 8,
  },
  retryButton: {},
  continueButton: {},
  closeButton: {},
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  conversationScroll: {
    flex: 1,
  },
  conversationContent: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  studentMessage: {
    alignSelf: 'flex-end',
  },
  evaluatorMessage: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  loadingMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    maxHeight: 100,
    padding: 12,
    borderRadius: 20,
    fontSize: 15,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
