/**
 * 🎯 SKILL PROFICIENCY DASHBOARD COMPONENT 🎯
 * 
 * Beautiful UI for displaying user's skill proficiency!
 * Shows CEFR-aligned scores (0-160) with rich visualizations!
 * 
 * Features:
 * ✨ Current proficiency score with CEFR level
 * ✨ Progress visualization with charts
 * ✨ Capability descriptors
 * ✨ Next milestone preview
 * ✨ Learning velocity metrics
 * ✨ Personalized recommendations
 * 
 * Inspired by Duolingo's proficiency display! 🚀
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
  getCEFRLevel,
  getCEFRDescriptor,
  getProgressToNextLevel,
  CEFR_DESCRIPTORS,
} from '@/lib/proficiency-scoring';
import type { SkillProficiencyScore, ProficiencyMilestone, CEFRLevelDescriptor, CEFRLevel } from '@/types/proficiency.types';

interface SkillProficiencyDashboardProps {
  skillId: number;
  skillName: string;
  onTakeAssessment?: () => void;
}

/**
 * Main Proficiency Dashboard Component
 * 
 * Shows everything users need to know about their skill level!
 */
export const SkillProficiencyDashboard: React.FC<SkillProficiencyDashboardProps> = ({
  skillId,
  skillName,
  onTakeAssessment,
}) => {
  const { user } = useAuth();
  
  // State
  const [proficiencyScore, setProficiencyScore] = useState<SkillProficiencyScore | null>(null);
  const [nextMilestone, setNextMilestone] = useState<ProficiencyMilestone | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Animation
  const scoreAnimation = React.useRef(new Animated.Value(0)).current;
  
  /**
   * Load proficiency data
   */
  useEffect(() => {
    loadProficiencyData();
  }, [skillId, user?.id]);
  
  const loadProficiencyData = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      // Fetch proficiency score
      const { data: scoreData, error: scoreError } = await supabase
        .from('skill_proficiency_scores')
        .select('*')
        .eq('user_id', user.id)
        .eq('skill_id', skillId)
        .single();
      
      if (scoreError && scoreError.code !== 'PGRST116') throw scoreError;
      
      // If no score exists, create initial one
      if (!scoreData) {
        const { data: newScore, error: createError } = await supabase
          .from('skill_proficiency_scores')
          .insert([{
            user_id: user.id,
            skill_id: skillId,
            current_score: 0,
            cefr_level: 'very_early_a1' as CEFRLevel,
            assessments_completed: 0,
          }])
          .select()
          .single();
        
        if (createError) throw createError;
        setProficiencyScore(newScore as SkillProficiencyScore);
      } else {
        setProficiencyScore(scoreData as SkillProficiencyScore);
      }
      
      // Fetch next milestone
      const currentScore = scoreData?.current_score || 0;
      const { data: milestoneData, error: milestoneError } = await supabase
        .from('proficiency_milestones')
        .select('*')
        .eq('skill_id', skillId)
        .gt('score_threshold', currentScore)
        .order('score_threshold', { ascending: true })
        .limit(1)
        .single();
      
      if (milestoneError && milestoneError.code !== 'PGRST116') {
        console.warn('No milestones found');
      } else {
        setNextMilestone(milestoneData as ProficiencyMilestone);
      }
      
      // Animate score display
      if (scoreData) {
        Animated.spring(scoreAnimation, {
          toValue: scoreData.current_score,
          useNativeDriver: true,
        }).start();
      }
      
    } catch (error) {
      console.error('Error loading proficiency data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading || !proficiencyScore) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading proficiency data...</Text>
      </View>
    );
  }
  
  const currentScore = proficiencyScore.current_score;
  const cefrLevel = getCEFRLevel(currentScore);
  const descriptor = getCEFRDescriptor(cefrLevel);
  const progressToNext = getProgressToNextLevel(currentScore);
  
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* ===== HEADER ===== */}
      <View style={styles.header}>
        <Text style={styles.skillName}>{skillName}</Text>
        <Text style={styles.headerSubtitle}>Your Proficiency Score</Text>
      </View>
      
      {/* ===== MAIN SCORE CARD ===== */}
      <MainScoreCard 
        score={currentScore}
        descriptor={descriptor}
        confidenceInterval={proficiencyScore.confidence_interval}
      />
      
      {/* ===== CEFR LEVEL DESCRIPTION ===== */}
      <CEFRLevelCard descriptor={descriptor} />
      
      {/* ===== PROGRESS TO NEXT LEVEL ===== */}
      <ProgressCard 
        currentScore={currentScore}
        progressPercent={progressToNext}
        nextLevelThreshold={descriptor.score_range[1] + 1}
      />
      
      {/* ===== CAPABILITIES SHOWCASE ===== */}
      <CapabilitiesCard capabilities={descriptor.capabilities} />
      
      {/* ===== NEXT MILESTONE ===== */}
      {nextMilestone && (
        <NextMilestoneCard milestone={nextMilestone} currentScore={currentScore} />
      )}
      
      {/* ===== ASSESSMENT STATS ===== */}
      <AssessmentStatsCard 
        assessmentsCompleted={proficiencyScore.assessments_completed}
        lastAssessmentDate={proficiencyScore.last_assessment_date}
      />
      
      {/* ===== TAKE ASSESSMENT BUTTON ===== */}
      <TouchableOpacity style={styles.assessmentButton} onPress={onTakeAssessment}>
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.assessmentButtonGradient}
        >
          <Text style={styles.assessmentButtonText}>
            📊 Take Proficiency Assessment
          </Text>
          <Text style={styles.assessmentButtonSubtext}>
            Improve your score and unlock achievements!
          </Text>
        </LinearGradient>
      </TouchableOpacity>
      
      {/* ===== CEFR SCALE REFERENCE ===== */}
      <CEFRScaleReference currentLevel={cefrLevel} />
      
      <View style={{ height: 30 }} />
    </ScrollView>
  );
};

/**
 * Main Score Display Card
 * 
 * Shows the big proficiency score number! 🎯
 */
const MainScoreCard: React.FC<{
  score: number;
  descriptor: CEFRLevelDescriptor;
  confidenceInterval: number;
}> = ({ score, descriptor, confidenceInterval }) => {
  return (
    <LinearGradient
      colors={[descriptor.color, adjustColor(descriptor.color, -20)]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.mainScoreCard}
    >
      <View style={styles.scoreHeader}>
        <Text style={styles.scoreEmoji}>{descriptor.icon_emoji}</Text>
        <View style={styles.scoreInfo}>
          <Text style={styles.scoreNumber}>{score}</Text>
          <Text style={styles.scoreMax}>/160</Text>
        </View>
      </View>
      
      <Text style={styles.cefrLevelText}>{descriptor.display_name}</Text>
      <Text style={styles.cefrSubtext}>{descriptor.title}</Text>
      
      <View style={styles.confidenceIndicator}>
        <Text style={styles.confidenceText}>
          Confidence: ±{confidenceInterval} points
        </Text>
      </View>
    </LinearGradient>
  );
};

/**
 * CEFR Level Description Card
 * 
 * Explains what the current level means!
 */
const CEFRLevelCard: React.FC<{ descriptor: CEFRLevelDescriptor }> = ({ descriptor }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>What This Means</Text>
      <Text style={styles.levelDescription}>{descriptor.description}</Text>
      
      {descriptor.next_level_preview && (
        <View style={styles.nextLevelPreview}>
          <Text style={styles.nextLevelPreviewLabel}>Coming Up Next:</Text>
          <Text style={styles.nextLevelPreviewText}>
            {descriptor.next_level_preview}
          </Text>
        </View>
      )}
    </View>
  );
};

/**
 * Progress to Next Level Card
 * 
 * Visual progress bar showing advancement! 📈
 */
const ProgressCard: React.FC<{
  currentScore: number;
  progressPercent: number;
  nextLevelThreshold: number;
}> = ({ currentScore, progressPercent, nextLevelThreshold }) => {
  const pointsNeeded = Math.max(0, nextLevelThreshold - currentScore);
  
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Progress to Next Level</Text>
      
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <View 
            style={[
              styles.progressBarFill,
              { width: `${progressPercent}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>{progressPercent}% Complete</Text>
      </View>
      
      <Text style={styles.pointsNeededText}>
        {pointsNeeded > 0 
          ? `${pointsNeeded} more points to reach next level! 🎯`
          : 'You\'re at the top of this level! 🎉'}
      </Text>
    </View>
  );
};

/**
 * Capabilities Showcase Card
 * 
 * Lists what user can do at their current level! 💪
 */
const CapabilitiesCard: React.FC<{ capabilities: string[] }> = ({ capabilities }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Your Capabilities</Text>
      <Text style={styles.capabilitiesSubtext}>
        At your current level, you can:
      </Text>
      
      {capabilities.map((capability) => (
        <View key={capability} style={styles.capabilityItem}>
          <Text style={styles.capabilityBullet}>✓</Text>
          <Text style={styles.capabilityText}>{capability}</Text>
        </View>
      ))}
    </View>
  );
};

/**
 * Next Milestone Card
 * 
 * Shows upcoming achievement! 🏆
 */
const NextMilestoneCard: React.FC<{
  milestone: ProficiencyMilestone;
  currentScore: number;
}> = ({ milestone, currentScore }) => {
  const pointsToMilestone = milestone.score_threshold - currentScore;
  
  return (
    <LinearGradient
      colors={['#F59E0B', '#F97316']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.milestoneCard}
    >
      <Text style={styles.milestoneEmoji}>{milestone.badge_icon}</Text>
      <Text style={styles.milestoneTitle}>Next Milestone</Text>
      <Text style={styles.milestoneName}>{milestone.title}</Text>
      <Text style={styles.milestoneDescription}>{milestone.description}</Text>
      
      <View style={styles.milestoneProgress}>
        <Text style={styles.milestoneProgressText}>
          {pointsToMilestone} points away
        </Text>
        <Text style={styles.milestoneReward}>
          Reward: {milestone.xp_reward} XP 🎁
        </Text>
      </View>
    </LinearGradient>
  );
};

/**
 * Assessment Stats Card
 * 
 * Shows assessment history!
 */
const AssessmentStatsCard: React.FC<{
  assessmentsCompleted: number;
  lastAssessmentDate: string | null;
}> = ({ assessmentsCompleted, lastAssessmentDate }) => {
  const lastDate = lastAssessmentDate 
    ? new Date(lastAssessmentDate).toLocaleDateString()
    : 'Never';
  
  return (
    <View style={styles.statsCard}>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{assessmentsCompleted}</Text>
        <Text style={styles.statLabel}>Assessments Taken</Text>
      </View>
      
      <View style={styles.statDivider} />
      
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{lastDate}</Text>
        <Text style={styles.statLabel}>Last Assessment</Text>
      </View>
    </View>
  );
};

/**
 * CEFR Scale Reference
 * 
 * Shows all levels with current highlighted! 📊
 */
const CEFRScaleReference: React.FC<{ currentLevel: string }> = ({ currentLevel }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>CEFR Proficiency Scale</Text>
      <Text style={styles.scaleSubtext}>
        International standard for measuring skill proficiency
      </Text>
      
      {CEFR_DESCRIPTORS.map((desc) => (
        <View
          key={desc.level}
          style={[
            styles.scaleItem,
            desc.level === currentLevel && styles.scaleItemActive
          ]}
        >
          <View style={styles.scaleItemHeader}>
            <Text style={styles.scaleEmoji}>{desc.icon_emoji}</Text>
            <View style={styles.scaleItemInfo}>
              <Text style={[
                styles.scaleItemTitle,
                desc.level === currentLevel && styles.scaleItemTitleActive
              ]}>
                {desc.title}
              </Text>
              <Text style={styles.scaleItemRange}>
                {desc.score_range[0]}-{desc.score_range[1]} points
              </Text>
            </View>
            {desc.level === currentLevel && (
              <Text style={styles.currentBadge}>YOU ARE HERE</Text>
            )}
          </View>
        </View>
      ))}
    </View>
  );
};

/**
 * Helper function to adjust color brightness
 */
function adjustColor(color: string, amount: number): string {
  // Simple color adjustment (works for hex colors)
  const num = parseInt(color.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
  const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// ===== STYLES =====

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  
  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  skillName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  
  // Main Score Card
  mainScoreCard: {
    marginHorizontal: 20,
    marginVertical: 12,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreEmoji: {
    fontSize: 48,
    marginRight: 16,
  },
  scoreInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreNumber: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#FFF',
  },
  scoreMax: {
    fontSize: 24,
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 4,
  },
  cefrLevelText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  cefrSubtext: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 16,
  },
  confidenceIndicator: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  confidenceText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  
  // Cards
  card: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  
  // Level Description
  levelDescription: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
    marginBottom: 16,
  },
  nextLevelPreview: {
    backgroundColor: '#DBEAFE',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  nextLevelPreviewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 4,
  },
  nextLevelPreviewText: {
    fontSize: 14,
    color: '#1E3A8A',
    fontStyle: 'italic',
  },
  
  // Progress
  progressBarContainer: {
    marginVertical: 16,
  },
  progressBarBackground: {
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    textAlign: 'center',
  },
  pointsNeededText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  
  // Capabilities
  capabilitiesSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  capabilityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  capabilityBullet: {
    fontSize: 18,
    color: '#10B981',
    marginRight: 12,
    fontWeight: 'bold',
  },
  capabilityText: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  
  // Milestone Card
  milestoneCard: {
    marginHorizontal: 20,
    marginVertical: 12,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  milestoneEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  milestoneTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  milestoneName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  milestoneDescription: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.95)',
    textAlign: 'center',
    marginBottom: 16,
  },
  milestoneProgress: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  milestoneProgressText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  milestoneReward: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '500',
  },
  
  // Stats Card
  statsCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  
  // Assessment Button
  assessmentButton: {
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  assessmentButtonGradient: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  assessmentButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  assessmentButtonSubtext: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
  },
  
  // CEFR Scale
  scaleSubtext: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
  },
  scaleItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  scaleItemActive: {
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 0,
  },
  scaleItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scaleEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  scaleItemInfo: {
    flex: 1,
  },
  scaleItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  scaleItemTitleActive: {
    color: '#4F46E5',
    fontWeight: 'bold',
  },
  scaleItemRange: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  currentBadge: {
    backgroundColor: '#4F46E5',
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
});

export default SkillProficiencyDashboard;
