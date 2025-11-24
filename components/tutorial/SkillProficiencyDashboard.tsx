import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { supabase, currentUserId } from '@/lib/supabase';
import { useFocusEffect } from 'expo-router';

interface ProficiencyRow { skill_id: number; current_score: number; cefr_level: string; }
interface Milestone { score_threshold: number; title: string; xp_reward: number; cefr_level: string; }

export default function SkillProficiencyDashboard() {
  const [row, setRow] = React.useState<ProficiencyRow | null>(null);
  const [nextMilestone, setNextMilestone] = React.useState<Milestone | null>(null);
  const [loading, setLoading] = React.useState(false);

  const load = async () => {
    const uid = await currentUserId();
    if (!uid) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('skill_proficiency_scores')
      .select('skill_id,current_score,cefr_level')
      .eq('user_id', uid)
      .limit(1)
      .maybeSingle();
    if (error) console.warn(error);
    setRow(data || null);
    if (data) {
      const { data: milestone, error: mErr } = await supabase
        .from('proficiency_milestones')
        .select('score_threshold,title,xp_reward,cefr_level')
        .eq('skill_id', data.skill_id)
        .gt('score_threshold', data.current_score)
        .order('score_threshold', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (mErr) console.warn(mErr);
      setNextMilestone(milestone || null);
    }
    setLoading(false);
  };

  useFocusEffect(React.useCallback(() => { load(); }, []));

  if (loading) return <ActivityIndicator />;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Proficiencia</Text>
      {row ? (
        <>
          <Text style={styles.metric}>Score Actual: {row.current_score}</Text>
          <Text style={styles.metric}>CEFR: {row.cefr_level}</Text>
          {nextMilestone ? (
            <Text style={styles.next}>Próximo hito "{nextMilestone.title}" a {nextMilestone.score_threshold} (+{nextMilestone.xp_reward} XP)</Text>
          ) : (
            <Text style={styles.next}>Sin hitos siguientes</Text>
          )}
        </>
      ) : (
        <Text style={styles.empty}>Sin datos de proficiencia todavía</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  header: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  metric: { fontSize: 14, color: '#334155' },
  next: { marginTop: 12, fontWeight: '500', color: '#0f172a' },
  empty: { color: '#64748b' },
});
