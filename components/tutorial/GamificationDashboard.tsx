import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { supabase, currentUserId } from '@/lib/supabase';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

interface AchievementRow { id: number; name: string; xp_reward: number | null; code: string; }

interface UserAchievementWithDetails {
  achievement_id: number | null;
  achieved_at: string | null;
  achievements: {
    name: string;
    xp_reward: number | null;
    code: string;
  } | null;
}

export default function GamificationDashboard() {
  const { profile } = useAuth();
  const [achievements, setAchievements] = React.useState<AchievementRow[]>([]);
  const [loading, setLoading] = React.useState(false);

  const load = async () => {
    const uid = await currentUserId();
    if (!uid) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('user_achievements')
      .select('achievement_id,achieved_at,achievements(name,xp_reward,code)')
      .eq('user_id', uid)
      .order('achieved_at', { ascending: false })
      .limit(10);
    if (error) console.warn(error);
    const parsed: AchievementRow[] = (data || []).map((r: UserAchievementWithDetails) => ({
      id: r.achievement_id || 0,
      name: r.achievements?.name || '',
      xp_reward: r.achievements?.xp_reward || null,
      code: r.achievements?.code || '',
    }));
    setAchievements(parsed);
    setLoading(false);
  };

  useFocusEffect(React.useCallback(() => { load(); }, []));

  if (loading && achievements.length === 0) return <ActivityIndicator />;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Gamificación</Text>
      <Text style={styles.metric}>XP Total: {profile?.total_xp ?? 0}</Text>
      <Text style={styles.metric}>Nivel: {profile?.level ?? 0}</Text>
      <Text style={styles.subheader}>Últimos Logros</Text>
      <FlatList
        data={achievements}
        keyExtractor={a => a.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.achievement}>
            <Text style={styles.achName}>{item.name}</Text>
            <Text style={styles.achXp}>+{item.xp_reward ?? 0} XP</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Sin logros todavía</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  header: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  metric: { fontSize: 14, color: '#334155' },
  subheader: { marginTop: 14, fontWeight: '600' },
  achievement: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomColor: '#e2e8f0', borderBottomWidth: 1 },
  achName: { fontWeight: '500', color: '#1e293b' },
  achXp: { color: '#0f766e', fontWeight: '600' },
  empty: { color: '#64748b', marginTop: 8 },
});
