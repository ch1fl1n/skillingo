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

/**
 * Renderiza un quiz de opción múltiple en memoria. No persiste respuestas.
 * Calcula score como (correctas / total) * 100.
 */
export default function QuizComponent({ content, onSubmit, submitting }: Props) {
  const [answers, setAnswers] = React.useState<Record<string, number>>({});
  const [submitted, setSubmitted] = React.useState(false);

  const selectOption = (qid: string, idx: number) => {
    if (submitted) return; // no permitir cambios tras submit
    setAnswers(a => ({ ...a, [qid]: idx }));
  };

  const handleSubmit = () => {
    const total = content.questions.length;
    const correct = content.questions.reduce((acc, q) => acc + (answers[q.id] === q.answer ? 1 : 0), 0);
    const score = (correct / total) * 100;
    setSubmitted(true);
    onSubmit(Math.round(score));
  };

  return (
    <View>
      {content.questions.map(q => (
        <View key={q.id} style={styles.block}>
          <Text style={styles.prompt}>{q.prompt}</Text>
          {q.options.map((opt, idx) => {
            const selected = answers[q.id] === idx;
            return (
              <TouchableOpacity
                key={idx}
                style={[styles.option, selected && styles.optionSelected]}
                onPress={() => selectOption(q.id, idx)}
              >
                <Text style={selected ? styles.optionTextSelected : styles.optionText}>{opt}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
      <TouchableOpacity
        style={[styles.submitBtn, submitting && { opacity: 0.7 }]} disabled={submitting || submitted}
        onPress={handleSubmit}
      >
        <Text style={styles.submitText}>{submitted ? 'Enviado' : 'Enviar intento'}</Text>
      </TouchableOpacity>
    </View>
  );
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
