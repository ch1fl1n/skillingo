
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { evaluateWithMastery, formatEvaluationForStudent } from '@/lib/mastery-evaluator';
import type { LessonEvaluationContext, MasteryEvaluation } from '@/types/mastery-evaluation.types';

const SKILL_OBJECTIVES = [
  { id: 'obj-1', description: 'Originality and Innovation - Generate truly novel ideas by combining concepts in unexpected ways', weight: 0.4 },
  { id: 'obj-2', description: 'Practicality and Usefulness - Ensure the proposed invention solves a real problem or provides genuine value', weight: 0.35 },
  { id: 'obj-3', description: 'Explanation and Justification - Clearly articulate why the combination works and how it would function', weight: 0.25 },
];

export default function Creativity() {
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Evaluando tu respuesta...');
  const router = useRouter();

  const handleSubmit = async () => {
    if (!answer.trim()) {
      Alert.alert('Error', 'Please write an answer before submitting.');
      return;
    }

    setLoading(true);
    setLoadingMessage('Evaluando tu respuesta...');
    
    try {
      const context: LessonEvaluationContext = {
        lessonId: 1,
        skillId: 1, // Creativity skill
        difficulty: 'medium',
        objectives: SKILL_OBJECTIVES,
        question: 'Combine two everyday objects into a new useful invention. Example: Mix a broken umbrella with a portable clothes hanger.',
        studentResponse: answer,
      };

      // Actualizar mensaje mientras procesa
      setLoadingMessage('Analizando tu creatividad...');
      
      const evaluation = await evaluateWithMastery(context);
      
      // Navigate to result screen with evaluation data
      router.push({
        pathname: '/skills/[lessonId]' as any,
        params: {
          lessonId: '1',
          evaluation: JSON.stringify(evaluation),
          fromEvaluation: 'true',
        },
      });
    } catch (error) {
      console.error('Evaluation error:', error);
      Alert.alert('Error', 'Failed to evaluate your answer. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMessage('Evaluando tu respuesta...');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.lessonTitle}>Lesson 1: Creativity</Text>
      <Text style={styles.progress}>10% Complete</Text>
      <View style={styles.progressBar}>
        <View style={{ ...styles.progressFill, width: '10%' }} />
      </View>
      <View style={styles.challengeBox}>
        <Text style={styles.challengeTitle}>Challenge 1: Idea Fusion</Text>
        <Text style={styles.challengeDescription}>
          Combine two everyday objects into a new useful invention.
        </Text>
        <Text style={styles.statement}>
          Example: Mix a broken umbrella with a portable clothes hanger.
        </Text>
        <TextInput 
          style={styles.input} 
          placeholder="Type your answer here..." 
          placeholderTextColor="#888" 
          multiline
          numberOfLines={6}
          value={answer}
          onChangeText={setAnswer}
          editable={!loading}
        />
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#000" />
              <Text style={styles.loadingText}>{loadingMessage}</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>Submit</Text>
          )}
        </TouchableOpacity>
      </View>
      <View style={styles.bottomNav}>
        <Text style={styles.navItem}>Learning</Text>
        <Text style={styles.navItem}>Community</Text>
        <Text style={styles.navItem}>Profile</Text>
        <Text style={styles.navItem}>Settings</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 20 },
  lessonTitle: { color: '#fff', fontSize: 18, marginBottom: 10, fontWeight: 'bold' },
  progress: { color: '#fff', marginBottom: 10 },
  progressBar: { height: 6, backgroundColor: '#333', borderRadius: 3, marginBottom: 20 },
  progressFill: { height: 6, backgroundColor: '#00ff88', borderRadius: 3 },
  challengeBox: { backgroundColor: '#111', padding: 15, borderRadius: 8 },
  challengeTitle: { color: '#fff', fontSize: 16, marginBottom: 10, fontWeight: 'bold' },
  challengeDescription: { color: '#ccc', marginBottom: 10 },
  statement: { color: '#fff', fontStyle: 'italic', marginBottom: 15 },
  input: { backgroundColor: '#222', color: '#fff', padding: 10, borderRadius: 5, borderWidth: 1, borderColor: '#444', minHeight: 100 },
  button: { backgroundColor: '#00ff88', padding: 12, marginTop: 15, borderRadius: 5 },
  buttonDisabled: { backgroundColor: '#00cc66', opacity: 0.7 },
  buttonText: { color: '#000', textAlign: 'center', fontWeight: 'bold' },
  loadingContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#000', marginLeft: 10, fontSize: 14 },
  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 30, paddingBottom: 20 },
  navItem: { color: '#fff' }
});
