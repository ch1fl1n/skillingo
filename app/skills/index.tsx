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
import { getSkills } from '@/lib/db';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import type { SkillWithProgress } from '@/types/lesson.types';

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

  const [skills, setSkills] = useState<SkillWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSkills();
  }, []);

  const loadSkills = async () => {
    try {
      setLoading(true);
      const data = await getSkills();
      setSkills(data);
    } catch (err) {
      console.error('Error loading skills:', err);
      setError(err instanceof Error ? err.message : 'Failed to load skills');
    } finally {
      setLoading(false);
    }
  };

  const getSkillStyle = (skillName: string) => {
    return SKILL_STYLES[skillName] || { color: '#6b7280', icon: 'star-outline' };
  };

  const renderSkillCard = ({ item }: { item: SkillWithProgress }) => {
    const style = getSkillStyle(item.name);
    const progress = item.progress_percent || 0;

    return (
      <TouchableOpacity
        style={[styles.skillCard, { backgroundColor: style.color }]}
        onPress={() => router.push(`/skills/${item.id}`)}
        activeOpacity={0.8}
      >
        <View style={styles.skillContent}>
          <MaterialCommunityIcons
            name={style.icon as any}
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
