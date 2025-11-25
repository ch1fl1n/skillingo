import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface QuizContent {
  questions: { id: string; prompt: string; options: string[]; answer: number }[];
  passThreshold?: number; // percentage
}

interface Props {
  content: QuizContent;
  onSubmit: (score: number) => void;
  submitting?: boolean;
}

const styles = StyleSheet.create({
  block: { marginBottom: 16 },
  prompt: { fontWeight: '600', marginBottom: 8 },
  option: { padding: 10, borderRadius: 6, borderWidth: 1, borderColor: '#cbd5e1', marginBottom: 6 },
  optionSelected: { backgroundColor: '#1e3a8a', borderColor: '#1e3a8a' },
  optionText: { color: '#334155' },
  optionTextSelected: { color: 'white', fontWeight: '500' },
  submitBtn: { backgroundColor: '#0f766e', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 4 },
  submitText: { color: 'white', fontWeight: '600' },
});
