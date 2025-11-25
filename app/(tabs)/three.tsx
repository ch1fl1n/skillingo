// app/(tabs)/three.tsx
import * as React from 'react';
import { StyleSheet, View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import EditScreenInfo from '@/components/EditScreenInfo';

// rutas a las imágenes subidas (usa exactamente estas rutas)
// Removed duplicate declaration of SKILL_GRAPH_URI

// Imports para obtener datos (igual que en index)
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { getCurrentUserProfile, getUserStreak } from '@/lib/db';

// Mascot asset (ya lo tenías)
import mascotImage from '@/assets/images/mascot/step4.jpeg';

// Rutas "subidas" que proporcionaste (fallback)
const HERO_IMAGE_URI = '/mnt/data/4c96c5e3-309b-4ac6-88cb-67303910a4f4.png';
const SKILL_GRAPH_URI = '/mnt/data/c82faa0b-ab2e-4e0d-91b8-50200f7d7aa0.png';

// Intentar resolver assets locales (si tienes los archivos dentro de /assets/images/)
let heroImageSource: any;
let graphImageSource: any;
try {
  // Si los pusiste en assets/images con estos nombres, descomenta o ajusta los require
  // heroImageSource = require('../../assets/images/hero.png');
  // graphImageSource = require('../../assets/images/skill_graph.png');

  // Si no están como assets, usamos las URIs que diste (funciona en native si la ruta existe en tu entorno)
  heroImageSource = { uri: HERO_IMAGE_URI };
  graphImageSource = { uri: SKILL_GRAPH_URI };
} catch {
  heroImageSource = { uri: HERO_IMAGE_URI };
  graphImageSource = { uri: SKILL_GRAPH_URI };
}

type IconName = 'message-text-outline' | 'account-group-outline' | 'lightbulb-on-outline' | 'puzzle';

export default function TabThreeScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [profile, setProfile] = React.useState<{ username: string | null; level: number | null; total_xp: number | null; avatar_url?: string | null } | null>(null);
  const [streak, setStreak] = React.useState<number>(0);
  const [loadingHeader, setLoadingHeader] = React.useState<boolean>(true);

  React.useEffect(() => {
    const loadHeader = async () => {
      if (!user) {
        setLoadingHeader(false);
        return;
      }
      try {
        setLoadingHeader(true);
        const [profileData, streakCount] = await Promise.all([
          getCurrentUserProfile(),
          getUserStreak(),
        ]);
        setProfile(profileData);
        setStreak(streakCount);
      } catch (err) {
        console.warn('Error loading profile/header data:', err);
      } finally {
        setLoadingHeader(false);
      }
    };

    loadHeader();
  }, [user]);

  // datos locales por si no hay datos reales
  const displayNameStatic = 'Ethan Carter';
  const levelStatic = 5;
  const xpTextStatic = '1200 XP';
  const skills: Array<{ id: string; name: string; pct: number; icon: IconName }> = [
    { id: 's1', name: 'Communication', pct: 80, icon: 'message-text-outline' },
    { id: 's2', name: 'Collaboration', pct: 60, icon: 'account-group-outline' },
    { id: 's3', name: 'Creativity', pct: 90, icon: 'lightbulb-on-outline' },
    { id: 's4', name: 'Problem Solving', pct: 40, icon: 'puzzle' },
  ];

  const breakdown = [
    { id: 'b1', name: 'Communication', pct: 85 },
    { id: 'b2', name: 'Collaboration', pct: 78 },
    { id: 'b3', name: 'Creativity', pct: 92 },
    { id: 'b4', name: 'Critical Thinking', pct: 88 },
  ];

  const displayName = profile?.username || user?.email?.split('@')[0] || displayNameStatic;
  const level = profile?.level ?? levelStatic;
  const parsedXP = parseInt(xpTextStatic.replace(/\D/g, ''), 10) || 0;
  const totalXP = profile?.total_xp ?? parsedXP;
  const xpForNextLevel = level * 100;
  const currentLevelXP = totalXP % 100;
  const xpProgress = xpForNextLevel > 0 ? (currentLevelXP / xpForNextLevel) * 100 : 0;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#2a2a2a', '#1a1a1a']} style={styles.headerGradient}>
        <View style={styles.header}>
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <Image
  source={ profile?.avatar_url ? { uri: profile.avatar_url } : mascotImage }
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

              <View style={styles.xpContainer}>
                <View style={styles.xpBar}>
                  <View style={[styles.xpFill, { width: `${xpProgress}%` }]} />
                </View>
                <Text style={styles.xpText}>{currentLevelXP}/{xpForNextLevel} XP</Text>
              </View>
            </View>
          </View>

          {/* Reemplazamos statsRow por el botón Edit Profile */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.editProfileButton}
              activeOpacity={0.85}
              onPress={() => router.push('/Not_seen/EditProfile')}
            >
              <Text style={styles.editProfileButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Lesson */}
        <View style={styles.card}>
          <View style={styles.cardLeft}>
            <Text style={styles.cardTitle}>Current Lesson</Text>
            <Text style={styles.cardSub}>Critical Thinking</Text>
            <Text style={styles.cardLesson}>Analyzing Arguments — Lesson 3 of 5</Text>
          </View>
          <View style={styles.cardRight}>
            <View style={styles.lessonThumb}>
              <Image source={{ uri: HERO_IMAGE_URI }} style={styles.lessonImage} />
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Skill Levels</Text>
        <View style={styles.skillsList}>
          {skills.map(s => (
            <View key={s.id} style={styles.skillRow}>
              <View style={styles.skillIcon}>
                <MaterialCommunityIcons name={s.icon} size={20} color="#fff" />
              </View>
              <View style={styles.skillInfo}>
                <View style={styles.skillTop}>
                  <Text style={styles.skillName}>{s.name}</Text>
                  <Text style={styles.skillPct}>{s.pct}</Text>
                </View>
                <View style={styles.skillBar}>
                  <View style={[styles.skillFill, { width: `${s.pct}%` }]} />
                </View>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Achievements</Text>
        <View style={styles.achievementsRow}>
          <View style={styles.achCard}>
            <View style={styles.achCircle}><MaterialCommunityIcons name="account-group" size={20} color="#fff" /></View>
            <Text style={styles.achLabel}>Team Player</Text>
          </View>
          <View style={styles.achCard}>
            <View style={[styles.achCircle, { backgroundColor: '#2fb98f' }]}><MaterialCommunityIcons name="lightbulb-on-outline" size={20} color="#fff" /></View>
            <Text style={styles.achLabel}>Critical Thinker</Text>
          </View>
          <View style={styles.achCard}>
            <View style={[styles.achCircle, { backgroundColor: '#f59e0b' }]}><MaterialCommunityIcons name="star" size={20} color="#fff" /></View>
            <Text style={styles.achLabel}>Creative</Text>
          </View>
        </View>

        <View style={styles.overallSection}>
          <Text style={styles.overallLabel}>Overall Skill Level</Text>
          <Text style={styles.overallLevel}>Level 7</Text>
          <View style={styles.overallRow}>
            <Text style={styles.overallSub}>Last 3 Months</Text>
            <Text style={styles.overallGain}>+10%</Text>
          </View>

          <Image source={{ uri: SKILL_GRAPH_URI }} style={styles.graphImage} resizeMode="contain" />

          <View style={styles.graphAxis}>
            <Text style={styles.axisLabel}>Jan</Text>
            <Text style={styles.axisLabel}>Feb</Text>
            <Text style={styles.axisLabel}>Mar</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Skill Breakdown</Text>
        <View style={styles.breakdownGrid}>
          {breakdown.map((b) => (
            <View key={b.id} style={styles.breakCard}>
              <Text style={styles.breakName}>{b.name}</Text>
              <Text style={styles.breakPct}>{b.pct}%</Text>
            </View>
          ))}
        </View>

        <View style={{ marginTop: 24, paddingBottom: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },

  headerGradient: {
    paddingTop: 48,
    paddingBottom: 18,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  header: { paddingHorizontal: 18 },
  profileSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
    width: 84,
    height: 84,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#ffd966',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: { width: 84, height: 84 },
  levelBadge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#00d4ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#0f1113',
  },
  levelText: { color: '#0f1113', fontWeight: '700' },
  userInfo: { flex: 1 },
  welcomeText: { color: '#999', fontSize: 14, marginBottom: 2 },
  userName: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 6 },
  xpContainer: { marginTop: 4 },
  xpBar: { height: 8, backgroundColor: '#333', borderRadius: 4, overflow: 'hidden', marginBottom: 4 },
  xpFill: { height: '100%', backgroundColor: '#00d4ff' },
  xpText: { color: '#999', fontSize: 12 },

  // botón Edit Profile
  actionRow: { marginTop: 12 },
  editProfileButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  editProfileButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },

  content: { paddingHorizontal: 18, paddingTop: 18 },
  card: { flexDirection: 'row', backgroundColor: '#161718', borderRadius: 16, padding: 14, alignItems: 'center', marginBottom: 16 },
  cardLeft: { flex: 1 },
  cardTitle: { color: '#9ca3af', fontSize: 12, marginBottom: 6 },
  cardSub: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cardLesson: { color: '#93a1ab', fontSize: 12, marginTop: 4 },
  cardRight: { marginLeft: 12 },
  lessonThumb: { width: 64, height: 48, borderRadius: 10, overflow: 'hidden', backgroundColor: '#22343b' },
  lessonImage: { width: '100%', height: '100%' },

  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  skillsList: { marginBottom: 8 },
  skillRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#141516', padding: 12, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#202022' },
  skillIcon: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#2a2a2a', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  skillInfo: { flex: 1 },
  skillTop: { flexDirection: 'row', justifyContent: 'space-between' },
  skillName: { color: '#fff', fontWeight: '700', fontSize: 14 },
  skillPct: { color: '#9ca3af', fontWeight: '700', fontSize: 13 },
  skillBar: { marginTop: 8, height: 6, backgroundColor: '#202225', borderRadius: 6, overflow: 'hidden' },
  skillFill: { height: '100%', backgroundColor: '#00d4ff' },

  achievementsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  achCard: { flex: 1, backgroundColor: '#0f1416', padding: 12, marginRight: 10, borderRadius: 12, alignItems: 'center' },
  achCircle: { width: 46, height: 46, borderRadius: 12, backgroundColor: '#375aeb', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  achLabel: { color: '#cbd5e1', fontSize: 12, textAlign: 'center' },

  overallSection: { marginTop: 8, backgroundColor: 'transparent', paddingVertical: 8, paddingHorizontal: 2 },
  overallLabel: { color: '#cbd5e1', fontSize: 12 },
  overallLevel: { color: '#fff', fontSize: 28, fontWeight: '800', marginTop: 6 },
  overallRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  overallSub: { color: '#9ca3af', fontSize: 12, marginRight: 8 },
  overallGain: { color: '#10b981', fontSize: 12, fontWeight: '700' },
  graphImage: { width: '100%', height: 120, marginTop: 12 },
  graphAxis: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 6, marginTop: 6 },
  axisLabel: { color: '#9ca3af', fontSize: 12 },

  breakdownGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 12 },
  breakCard: { width: '48%', backgroundColor: '#141516', borderRadius: 12, padding: 14, marginBottom: 12, minHeight: 84, justifyContent: 'space-between' },
  breakName: { color: '#cbd5e1', fontSize: 13, lineHeight: 18 },
  breakPct: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 6 },
});
