import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase, currentUserId, computeLevel } from '@/lib/supabase';
import QuizComponent from '@/components/tutorial/QuizComponent';
import { useAuth } from '@/contexts/AuthContext';

// Forma mínima de la lección usada en el cliente. "content" es JSON adhoc para prototipo.
interface LessonData {
  id: number;
  title: string;
  difficulty: string | null;
  xp_reward: number | null;
  content: {
    questions: Array<{
      id: string;
      prompt: string;
      options: string[];
      answer: number; // índice de opción correcta
    }>;
    passThreshold: number; // % necesario para marcar completado
  };
  skill_id: number | null;
}

export default function LessonScreen() {
  const params = useLocalSearchParams();
  const skillId = Number(params.skillId) || 1; // fallback demo
  const { refreshProfile } = useAuth();
  const [lesson, setLesson] = React.useState<LessonData | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [lastScore, setLastScore] = React.useState<number | null>(null);

  React.useEffect(() => {
    const loadLesson = async () => {
      setLoading(true);
      // For demo we pick first lesson of skill or create a synthetic one if none.
      const { data, error } = await supabase
        .from('lessons')
        .select('id,title,difficulty,xp_reward,content,skill_id')
        .eq('skill_id', skillId)
        .limit(1)
        .maybeSingle();
      if (error) console.warn(error);
      if (!data) {
        // Fallback sintético (no persiste): permite demo en DB vacía.
        setLesson({
          id: 0,
            title: 'Comunicación Básica',
            difficulty: 'easy',
            xp_reward: 50,
            content: {
              questions: [
                { id: 'q1', prompt: 'Selecciona la mejor práctica de escucha activa', options: ['Interrumpir para acelerar', 'Parafrasear para confirmar', 'Mirar el móvil'], answer: 1 },
                { id: 'q2', prompt: 'Cuál mejora la empatía?', options: ['Juzgar rápido', 'Hacer preguntas abiertas', 'Evitar contacto visual'], answer: 1 },
              ],
              passThreshold: 60,
            },
            skill_id: skillId,
        });
      } else {
        setLesson(data as LessonData);
      }
      setLoading(false);
    };
    loadLesson();
  }, [skillId]);

  // Registra intento y aplica actualizaciones relacionadas (progreso, XP, logros).
  const recordAttempt = async (score: number) => {
    const uid = await currentUserId();
    if (!uid || !lesson) return;
    setSubmitting(true);
    const passThreshold = lesson.content?.passThreshold ?? 60;
    const completed = score >= passThreshold;
    // 1. Insert attempt (RLS garantiza user_id = session.user.id)
    const { error: attemptError } = await supabase.from('lesson_attempts').insert({
      user_id: uid,
      lesson_id: lesson.id || null,
      score,
      completed,
    });
    if (attemptError) {
      Alert.alert('Error', 'No se pudo registrar el intento');
      setSubmitting(false);
      return;
    }
    // 2. Actualizar progreso del skill (upsert idempotente)
    if (lesson.skill_id) {
      const progressPercent = completed ? 100 : Math.min(100, score); // simplistic
      const { error: progressError } = await supabase.from('user_progress').upsert({
        user_id: uid,
        skill_id: lesson.skill_id,
        progress_percent: progressPercent,
        last_updated: new Date().toISOString(),
      });
      if (progressError) console.warn(progressError);
    }
    // 3. XP & logros (simplificado: lógica embebida hasta que trigger server-side se active)
    if (completed && lesson.xp_reward) {
      const { data: userRow, error: userErr } = await supabase.from('users').select('total_xp').eq('id', uid).single();
      if (!userErr && userRow) {
        const newXp = userRow.total_xp + (lesson.xp_reward || 0);
        const newLevel = computeLevel(newXp);
        const { error: xpErr } = await supabase.from('users').update({ total_xp: newXp, level: newLevel }).eq('id', uid);
        if (xpErr) console.warn(xpErr);
        // Award first_lesson achievement if first completion
        const { data: attemptsCompleted } = await supabase
          .from('lesson_attempts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', uid)
          .eq('completed', true);
        if ((attemptsCompleted as { id: number }[] | null)?.length === 0) {
          // Insert achievement row if schema has matching achievement code
          // For demo: find achievement with code 'first_lesson'
          const { data: ach, error: achErr } = await supabase
            .from('achievements')
            .select('id,code')
            .eq('code', 'first_lesson')
            .maybeSingle();
          if (!achErr && ach) {
            const { error: uaErr } = await supabase.from('user_achievements').insert({
              user_id: uid,
              achievement_id: ach.id,
              achieved_at: new Date().toISOString(),
            });
            if (uaErr) console.warn(uaErr);
          }
        }
      }
    }
    setLastScore(score);
    setSubmitting(false);
    refreshProfile();
    Alert.alert('Resultado', `Intento registrado. Puntaje: ${score}`);
  };

  if (loading || !lesson) return <View style={styles.center}><ActivityIndicator /></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{lesson.title}</Text>
      <Text style={styles.meta}>Dificultad: {lesson.difficulty} | XP: {lesson.xp_reward}</Text>
      <QuizComponent content={lesson.content} onSubmit={recordAttempt} submitting={submitting} />
      {lastScore !== null && <Text style={styles.score}>Último puntaje: {lastScore}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 4 },
  meta: { color: '#475569', marginBottom: 12 },
  score: { marginTop: 12, fontWeight: '500', color: '#1e293b' },
});
