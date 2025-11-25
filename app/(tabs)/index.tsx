import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { getCurrentUserProfile, getUserStreak, getSkills } from '@/lib/db';
import type { SkillWithProgress } from '@/types/lesson.types';

import mascotImage from '@/assets/images/mascot/step4.jpeg';
import RandomBook from '@/components/RandomBook';

// Map skill names to colors and icons (matching the skills list screen)
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

// Component for each skill item in the list
const SkillItem: React.FC<{ skill: SkillWithProgress; router: ReturnType<typeof useRouter> }> = ({ skill, router }) => {
  const style = SKILL_STYLES[skill.name] || { color: '#6b7280', icon: 'star-outline' };
  const progress = skill.progress_percent || 0;
  
  return (
    <View style={styles.skillContainer}>
      <TouchableOpacity
        style={[
          styles.skillButton,
          { backgroundColor: style.color },
        ]}
        onPress={() => router.push({
          pathname: '/skills/[skillId]',
          params: { skillId: String(skill.id) }
        })}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          name={style.icon as any}
          size={28}
          color="#fff"
        />
        <Text style={styles.skillTitle}>{skill.name}</Text>
        {progress > 0 && (
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

// Main screen component
export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [profile, setProfile] = useState<{ username: string | null; level: number | null; total_xp: number | null } | null>(null);
  const [streak, setStreak] = useState<number>(0);
  const [dbSkills, setDbSkills] = useState<SkillWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        
        const [profileData, streakCount, skillsData] = await Promise.all([
          getCurrentUserProfile(),
          getUserStreak(),
          getSkills(),
        ]);
        
        setProfile(profileData);
        setStreak(streakCount);
        setDbSkills(skillsData);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  const displayName = profile?.username || user?.email?.split('@')[0] || 'Learner';
  const level = profile?.level || 1;
  const totalXP = profile?.total_xp || 0;
  const xpForNextLevel = level * 100;
  const currentLevelXP = totalXP % 100;
  const xpProgress = (currentLevelXP / xpForNextLevel) * 100;

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#00d4ff" />
        <Text style={styles.loadingText}>Loading your progress...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <MaterialCommunityIcons name="alert-circle" size={48} color="#ff4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => window.location.reload()}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Profile Header with Gradient */}
      <LinearGradient
        colors={['#2a2a2a', '#1a1a1a']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          {/* Icono del bombillo centrado en la parte superior */}
          <View style={styles.bulbContainer}>
            <TouchableOpacity
              onPress={() => router.push('/Not_seen/Chatbot')}
              activeOpacity={0.8}
              style={styles.bulbButton}
            >
              <MaterialCommunityIcons name="lightbulb-on-outline" size={28} color="#ffd966" />
            </TouchableOpacity>
          </View>

          {/* Avatar and User Info */}
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <Image 
                source={mascotImage}
                style={styles.avatar}
                resizeMode="contain"
              />
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>{level}</Text>
              </View>
            </View>
            
            <View style={styles.userInfo}>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.userName}>{displayName}</Text>
              
              {/* XP Progress Bar */}
              <View style={styles.xpContainer}>
                <View style={styles.xpBar}>
                  <View style={[styles.xpFill, { width: `${xpProgress}%` }]} />
                </View>
                <Text style={styles.xpText}>{currentLevelXP}/{xpForNextLevel} XP</Text>
              </View>
            </View>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <TouchableOpacity style={styles.statCard} activeOpacity={0.7}>
              <MaterialCommunityIcons name="fire" size={24} color="#ff6b35" />
              <Text style={styles.statValue}>{streak}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.statCard} activeOpacity={0.7}>
              <MaterialCommunityIcons name="trophy" size={24} color="#ffd700" />
              <Text style={styles.statValue}>{totalXP}</Text>
              <Text style={styles.statLabel}>Total XP</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.statCard} 
              activeOpacity={0.7}
              onPress={() => router.push('/skills')}
            >
              <MaterialCommunityIcons name="star" size={24} color="#00d4ff" />
              <Text style={styles.statValue}>{level}</Text>
              <Text style={styles.statLabel}>Level</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Skills Section */}
      <ScrollView style={styles.skillsSection} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Your Learning Path</Text>
        
        {dbSkills.length > 0 ? (
          dbSkills.map((skill) => (
            <SkillItem key={skill.id} skill={skill} router={router} />
          ))
        ) : (
          <Text style={styles.emptyText}>No skills available yet</Text>
        )}
      </ScrollView>
      {/* Floating Random Book bubble (persistent) */}
      <RandomBook />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  header: {
    paddingHorizontal: 20,
  },
  // new bulb styles
  bulbContainer: {
    position: 'absolute',
    top: 18,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  bulbButton: {
    backgroundColor: 'transparent',
    padding: 8,
    borderRadius: 20,
  },

  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ffd966',
  },
  levelBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: '#00d4ff',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#1a1a1a',
  },
  levelText: {
    color: '#1a1a1a',
    fontSize: 14,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  welcomeText: {
    color: '#999',
    fontSize: 14,
    marginBottom: 4,
  },
  userName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  xpContainer: {
    marginTop: 4,
  },
  xpBar: {
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  xpFill: {
    height: '100%',
    backgroundColor: '#00d4ff',
    borderRadius: 4,
  },
  xpText: {
    color: '#999',
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    color: '#999',
    fontSize: 12,
    marginTop: 4,
  },
  skillsSection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 30,
    color: '#ff4444',
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#00d4ff',
  },
  retryButtonText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  skillContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  skillButton: {
    flexDirection: 'column',
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#333',
  },
  skillTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00d4ff',
    borderRadius: 3,
  },
  lockBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#666',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
