// app/(tabs)/four.tsx
import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export default function TabFourScreen() {
  const router = useRouter();
  // intentamos obtener signOut desde el contexto; si no existe, usaremos supabase.auth.signOut()
  const { profile, signOut } = useAuth() as any;
  const isModerator = profile?.role === 'moderator' || profile?.role === 'admin';

  const [settings, setSettings] = React.useState({
    adaptive: false,
    dailyLessons: false,
    streak: false,
    community: false,
    criticalThinking: false,
    collaboration: false,
    creativity: false,
    communication: false,
    flexibility: false,
    selfManagement: false,
    digitalContent: false,
    globalCitizenship: false,
  });

  const toggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  async function doLogout() {
    try {
      // preferir signOut del contexto (si está disponible)
      if (typeof signOut === 'function') {
        await signOut();
      } else {
        // fallback a Supabase directamente
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      }

      // navegar a login (replace para evitar volver con back)
      router.replace('/login');
    } catch (err) {
      console.error('Logout error', err);
      Alert.alert('Error', 'No se pudo cerrar sesión: ' + ((err as any)?.message ?? JSON.stringify(err)));
    }
  }

  function confirmLogout() {
    Alert.alert('Cerrar sesión', '¿Estás seguro de que quieres cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: () => void doLogout() },
    ]);
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} style={{ paddingHorizontal: 18 }}>

        {/* Page Title */}
        <Text style={styles.pageTitle}>Settings</Text>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionLabel}>Quick Actions</Text>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/community/create')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#3b82f6' }]}>
              <MaterialCommunityIcons name="pencil" size={20} color="#fff" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Create Post</Text>
              <Text style={styles.actionDesc}>Share with the community</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#666" />
          </TouchableOpacity>

          {isModerator && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/moderation')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#10b981' }]}>
                <MaterialCommunityIcons name="shield-check" size={20} color="#fff" />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Moderation</Text>
                <Text style={styles.actionDesc}>Review pending posts</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        {/* Section */}
        <Text style={styles.sectionLabel}>Adaptive Reminders</Text>

        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Text style={styles.rowTitle}>Adaptive Reminders</Text>
            <Text style={styles.rowDesc}>Receive AI-powered reminders based on your progress.</Text>
          </View>
          <Switch
            value={settings.adaptive}
            onValueChange={() => toggle('adaptive')}
            trackColor={{ false: '#333', true: '#00d4ff55' }}
            thumbColor={settings.adaptive ? '#00d4ff' : '#aaa'}
          />
        </View>

        {/* General Notifications */}
        <Text style={styles.sectionLabel}>General Notifications</Text>

        {renderToggle(
          "Daily Lesson Reminders",
          "Get daily reminders to keep learning.",
          "dailyLessons"
        )}
        {renderToggle(
          "Streak Notifications",
          "Celebrate your streaks and milestones.",
          "streak"
        )}
        {renderToggle(
          "Community Content Alerts",
          "Stay updated on new content and activities.",
          "community"
        )}

        {/* Skill-Specific Notifications */}
        <Text style={styles.sectionLabel}>Skill-Specific Alerts</Text>

        {renderToggle("Critical Thinking Alerts", "New logic or problem-solving challenges.", "criticalThinking")}
        {renderToggle("Collaboration Opportunities", "Join team projects and discussions.", "collaboration")}
        {renderToggle("Creativity Challenges", "Daily ideas and creative prompts.", "creativity")}
        {renderToggle("Communication Practice", "Improve persuasive writing and speaking.", "communication")}

        {/* Progress and Self-Management */}
        <Text style={styles.sectionLabel}>Progress & Self-Management</Text>

        {renderToggle("Adaptability Feedback", "Track your flexibility and adaptability progress.", "flexibility")}
        {renderToggle("Self-Management Goals", "Review your personal learning goals.", "selfManagement")}

        {/* Content categories */}
        <Text style={styles.sectionLabel}>Content & Community</Text>

        {renderToggle("Digital Content Updates", "Alerts for new digital fluency modules.", "digitalContent")}
        {renderToggle("Global Citizenship Alerts", "Updates on global topics and discussions.", "globalCitizenship")}

        {/* Account: Logout */}
        <Text style={styles.sectionLabel}>Account</Text>

        <TouchableOpacity style={styles.logoutButton} onPress={confirmLogout}>
          <MaterialCommunityIcons name="logout" size={20} color="#ff6b6b" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );

  function renderToggle(title: string, description: string, key: keyof typeof settings) {
    return (
      <View style={styles.row}>
        <View style={styles.rowLeft}>
          <Text style={styles.rowTitle}>{title}</Text>
          <Text style={styles.rowDesc}>{description}</Text>
        </View>
        <Switch
          value={settings[key]}
          onValueChange={() => toggle(key)}
          trackColor={{ false: '#333', true: '#00d4ff55' }}
          thumbColor={settings[key] ? '#00d4ff' : '#aaa'}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1113'
  },

  pageTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginTop: 48,
    marginBottom: 24,
  },

  sectionLabel: {
    color: '#999',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 28,
    marginBottom: 10,
  },

  quickActionsSection: {
    marginBottom: 12,
  },

  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161718',
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
  },

  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  actionContent: {
    flex: 1,
  },

  actionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },

  actionDesc: {
    color: '#999',
    fontSize: 13,
  },

  row: {
    backgroundColor: '#161718',
    padding: 14,
    borderRadius: 14,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#222',
  },

  rowLeft: {
    flex: 1,
    paddingRight: 10,
  },

  rowTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },

  rowDesc: {
    color: '#ccc',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },

  logoutButton: {
    marginTop: 10,
    padding: 14,
    backgroundColor: '#161718',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#222',
    flexDirection: 'row',
    alignItems: 'center',
  },

  logoutText: {
    color: '#ff6b6b',
    fontWeight: '700',
    fontSize: 15,
    marginLeft: 8,
  },
});
