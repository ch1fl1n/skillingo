
import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import mascotImage from '@/assets/images/mascot/step4.jpeg';
import RandomBook from '@/components/RandomBook';

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

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#2a2a2a', '#1a1a1a']} style={styles.headerGradient}>
        <View style={styles.header}>
          <View style={styles.bulbContainer}>
            <TouchableOpacity onPress={() => router.push('/Not_seen/Chatbot')} activeOpacity={0.8} style={styles.bulbButton}>
              <MaterialCommunityIcons name="lightbulb-on-outline" size={28} color="#ffd966" />
            </TouchableOpacity>
          </View>
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <Image source={mascotImage} style={styles.avatar} resizeMode="contain" />
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>1</Text>
              </View>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.userName}>{user?.email?.split('@')[0] || 'Learner'}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Skills Section */}
      <ScrollView style={styles.skillsSection} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Your Learning Path</Text>

        {/* Static Buttons for Skills */}
        {Object.keys(SKILL_STYLES).map((skillName) => {
          const style = SKILL_STYLES[skillName];
          return (
            <TouchableOpacity
              key={skillName}
              style={[styles.skillButton, { backgroundColor: style.color }]}
              onPress={() => router.push(`/skills/${skillName.replace(/\s+/g, '')}`)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name={style.icon as any} size={28} color="#fff" />
              <Text style={styles.skillTitle}>{skillName}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Floating Random Book */}
      <RandomBook />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a' },
  headerGradient: { paddingTop: 60, paddingBottom: 30, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  header: { paddingHorizontal: 20 },
  bulbContainer: { position: 'absolute', top: 18, right: 20, zIndex: 10 },
  bulbButton: { backgroundColor: 'transparent', padding: 8, borderRadius: 20 },
  profileSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  avatarContainer: { position: 'relative', marginRight: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#ffd966' },
  levelBadge: { position: 'absolute', bottom: -5, right: -5, backgroundColor: '#00d4ff', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#1a1a1a' },
  levelText: { color: '#1a1a1a', fontSize: 14, fontWeight: 'bold' },
  userInfo: { flex: 1 },
  welcomeText: { color: '#999', fontSize: 14, marginBottom: 4 },
  userName: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  skillsSection: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  sectionTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  skillButton: { flexDirection: 'column', padding: 20, borderRadius: 16, marginBottom: 16 },
  skillTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 12 },
});
