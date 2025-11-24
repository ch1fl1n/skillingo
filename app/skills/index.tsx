import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase, currentUserId, subscribeUserProgress } from '@/lib/supabase';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';

// Estructura combinada (skill + progreso usuario) que usamos en la UI.
interface SkillWithProgress {
  id: number;
  name: string;
  description: string | null;
  progress_percent: number; // 0-100 agregado localmente
}

// Map skill names to colors and icons
const SKILL_STYLES: Record<string, { color: string; icon: string }> = {
  'Creativity': { color: '#10b981', icon: 'lightbulb-on-outline' },
  'Critical Thinking': { color: '#3b82f6', icon: 'head-lightbulb-outline' },
  'Communication': { color: '#8b5cf6', icon: 'message-text-outline' },
  'Collaboration': { color: '#eab308', icon: 'account-group-outline' },
  'Curiosity': { color: '#f97316', icon: 'magnify' },
  'Courage': { color: '#ef4444', icon: 'shield-outline' },
  'Resilience': { color: '#14b8a6', icon: 'arm-flex-outline' },
  'Ethics': { color: '#6b7280', icon: 'scale-balance' },
  'Metacognition': { color: '#10b981', icon: 'brain' },
  'Imagination': { color: '#a855f7', icon: 'creation' },
};

export default function SkillsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { profile } = useAuth();

  const [skills, setSkills] = useState<SkillWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Cargar skills al montar o cuando cambie perfil (login/logout).
    loadSkills();
    let unsubscribe: (() => void) | null = null;
    (async () => {
      const uid = await currentUserId();
      if (uid) {
        // Suscribimos a cambios de progreso para refrescar sólo secciones afectadas.
        unsubscribe = subscribeUserProgress(uid, () => {
          // Estrategia simple: recargar progresos (podría optimizarse con diff).    
          loadSkills();
        });
      }
    })();
    return () => { if (unsubscribe) unsubscribe(); };
  }, [profile]);

  const loadSkills = async () => {
    const uid = await currentUserId();
    if (!uid) return;
    try {
      setLoading(true);
      const { data: skillsData, error: skillsError } = await supabase
        .from('skills')
        .select('id,name,description');
      if (skillsError) throw skillsError;

      const { data: progressData, error: progressError } = await supabase
        .from('user_progress')
        .select('skill_id,progress_percent')
        .eq('user_id', uid);
      if (progressError) console.warn(progressError);

      // Map rápido skill_id -> progress_percent para unir datos.
      const progressMap = new Map<number, number>();
      progressData?.forEach(p => progressMap.set(p.skill_id!, p.progress_percent || 0));

      const skillsWithProgress = skillsData.map(s => ({
        ...s,
        progress_percent: progressMap.get(s.id) || 0,
      }));

      setSkills(skillsWithProgress);
    } catch (err) {
      console.error('Error loading skills:', err);
      setError(err instanceof Error ? err.message : 'Failed to load skills');
    } finally {
      setLoading(false);
    }
  };

  // Mapea nombre de la skill a color e ícono. Fallback neutral.
  const getSkillStyle = (skillName: string) => {
    return SKILL_STYLES[skillName] || { color: '#6b7280', icon: 'star-outline' };
  };

  // Renderiza tarjeta de skill con barra de progreso local.
  const renderSkillCard = ({ item }: { item: SkillWithProgress }) => {
    const style = getSkillStyle(item.name);
    const progress = item.progress_percent || 0;

    return (
      <TouchableOpacity
        style={[styles.skillCard, { backgroundColor: style.color }]}
        onPress={() =>
          router.push({
            pathname: '/skills/lesson01',
            params: { skillId: String(item.id) },
          })
        }
        activeOpacity={0.8}
      >
        <View style={styles.skillContent}>
          <MaterialCommunityIcons
            name={style.icon as keyof typeof MaterialCommunityIcons.glyphMap}
            size={32}
            color="#fff"
            style={styles.skillIcon}
          />
          <View style={styles.skillInfo}>
            <Text style={styles.skillName}>{item.name}</Text>
            {item.description && (
              <Text style={styles.skillDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}
          </View>
        </View>

        {progress > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>{Math.round(progress)}%</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary?.['500'] || '#3b82f6'} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading skills...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <MaterialCommunityIcons name="alert-circle" size={48} color="#ef4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadSkills}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Skills</Text>
        <Text style={[styles.subtitle, { color: colors.neutral?.['500'] || '#6b7280' }]}>
          Choose a skill to start learning
        </Text>
        {profile && (
          <Text style={[styles.stats, { color: colors.neutral?.['500'] || '#9ca3af' }]}>
            XP Total: {profile.total_xp} | Nivel: {profile.level}
          </Text>
        )}
      </View>

      <FlatList
        data={skills}
        renderItem={renderSkillCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  stats: {
    fontSize: 14,
    marginTop: 4,
  },
  listContent: {
    padding: 20,
    paddingTop: 8,
  },
  skillCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  skillContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skillIcon: {
    marginRight: 16,
  },
  skillInfo: {
    flex: 1,
  },
  skillName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  skillDescription: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    minWidth: 40,
    textAlign: 'right',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
