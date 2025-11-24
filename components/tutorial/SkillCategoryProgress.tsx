import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { supabase, currentUserId } from '@/lib/supabase';
import { useFocusEffect } from 'expo-router';

interface SkillRow { id: number; name: string; }

export default function SkillCategoryProgress() {
  const [rows, setRows] = React.useState<(SkillRow & { progress: number })[]>([]);

  const load = async () => {
    const uid = await currentUserId();
    if (!uid) return;
    const { data: skills, error } = await supabase.from('skills').select('id,name');
    if (error) { console.warn(error); return; }
    const { data: progress, error: pErr } = await supabase
      .from('user_progress')
      .select('skill_id,progress_percent')
      .eq('user_id', uid);
    if (pErr) console.warn(pErr);
    const map = new Map<number, number>();
    progress?.forEach(r => map.set(r.skill_id!, r.progress_percent || 0));
    setRows((skills || []).map(s => ({ ...s, progress: map.get(s.id) || 0 })));
  };

  useFocusEffect(React.useCallback(() => { load(); }, []));

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Progreso por Skill</Text>
      {rows.map(r => (
        <View key={r.id} style={styles.row}>
          <Text style={styles.name}>{r.name}</Text>
          <Text style={styles.value}>{r.progress.toFixed(0)}%</Text>
        </View>
      ))}
      {rows.length === 0 && <Text style={styles.empty}>Sin progreso todavía</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  header: { fontWeight: '700', fontSize: 18, marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomColor: '#e2e8f0', borderBottomWidth: 1 },
  name: { fontWeight: '500', color: '#1e293b' },
  value: { color: '#0f766e', fontWeight: '600' },
  empty: { color: '#64748b' },
});
