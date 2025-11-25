import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getLessonById, trackLessonAttempt, awardXP } from '@/lib/db';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import type { Lesson, LessonStep } from '@/types/lesson.types';

export default function LessonViewerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const lessonId = parseInt(params.lessonId as string, 10);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState('');

  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadLesson();
  }, [lessonId]);

  const loadLesson = async () => {
    try {
      setLoading(true);
      const data = await getLessonById(lessonId);
      setLesson(data);
    } catch (err) {
      console.error('Error loading lesson:', err);
      setError(err instanceof Error ? err.message : 'Failed to load lesson');
    } finally {
      setLoading(false);
    }
  };

  const animateTransition = (callback: () => void) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      callback();
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleNext = () => {
    if (!lesson) return;

    if (currentStepIndex < lesson.content.steps.length - 1) {
      animateTransition(() => setCurrentStepIndex(currentStepIndex + 1));
    } else if (lesson.content.quiz) {
      setShowQuiz(true);
    } else {
      handleLessonComplete(100, true);
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      animateTransition(() => setCurrentStepIndex(currentStepIndex - 1));
    }
  };

  const handleQuizComplete = async (score: number, passed: boolean) => {
    if (passed) {
      await handleLessonComplete(score, true);
    } else {
      // Quiz failed - allow retry
      setCompleting(false);
    }
  };

  const handleLessonComplete = async (score: number, completed: boolean) => {
    if (!lesson) return;

    try {
      setCompleting(true);

      // Save lesson attempt
      await trackLessonAttempt({
        lesson_id: lesson.id,
        score,
        completed,
      });

      // Award XP
      if (completed) {
        await awardXP(lesson.xp_reward);
      }

      // Update skill progress (simplified: just mark completion, real calculation would count completed lessons)
      // For now, we'll skip detailed progress update and let it be calculated on skills page

      // Navigate back to lessons list
      router.back();
    } catch (err) {
      console.error('Error completing lesson:', err);
      setError(err instanceof Error ? err.message : 'Failed to save progress');
      setCompleting(false);
    }
  };

  const renderStep = (step: LessonStep) => {
    switch (step.type) {
      case 'text':
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>{step.title}</Text>
            <Text style={[styles.stepText, { color: colors.text }]}>{step.content}</Text>
          </View>
        );

      case 'code':
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>{step.title}</Text>
            <Text style={[styles.stepText, { color: colors.text }]}>{step.content}</Text>
            {step.code_snippet && (
              <View style={styles.codeBlock}>
                <Text style={styles.codeText}>{step.code_snippet}</Text>
              </View>
            )}
          </View>
        );

      case 'video':
      case 'interactive':
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>{step.title}</Text>
            <Text style={[styles.stepText, { color: colors.text }]}>{step.content}</Text>
            <View style={styles.placeholderBox}>
              <MaterialCommunityIcons name="video-outline" size={48} color="#9ca3af" />
              <Text style={styles.placeholderText}>
                {step.type === 'video' ? 'Video content' : 'Interactive content'} coming soon
              </Text>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary?.['500'] || '#3b82f6'} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading lesson...</Text>
      </View>
    );
  }

  if (error || !lesson) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <MaterialCommunityIcons name="alert-circle" size={48} color="#ef4444" />
        <Text style={styles.errorText}>{error || 'Lesson not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (completing) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={[styles.loadingText, { color: colors.text }]}>Saving your progress...</Text>
      </View>
    );
  }

  if (showQuiz && lesson.content.quiz) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowQuiz(false)} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Quiz Time!</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentStep = lesson.content.steps[currentStepIndex];
  const totalSteps = lesson.content.steps.length;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {lesson.title}
        </Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {currentStepIndex === 0 && (
          <View style={styles.introSection}>
            <Text style={[styles.introText, { color: colors.text }]}>
              {lesson.content.introduction}
            </Text>
          </View>
        )}

        <Animated.View style={{ opacity: fadeAnim }}>
          {renderStep(currentStep)}
        </Animated.View>

        <View style={styles.dotsContainer}>
          {lesson.content.steps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentStepIndex && styles.activeDot,
                { backgroundColor: index === currentStepIndex ? colors.primary?.['500'] || '#3b82f6' : '#d1d5db' },
              ]}
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.navButton, isFirstStep && styles.navButtonDisabled]}
          onPress={handlePrevious}
          disabled={isFirstStep}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={24}
            color={isFirstStep ? '#d1d5db' : colors.text}
          />
          <Text style={[styles.navButtonText, { color: isFirstStep ? '#d1d5db' : colors.text }]}>
            Previous
          </Text>
        </TouchableOpacity>

        <Text style={[styles.stepCounter, { color: colors.text }]}>
          {currentStepIndex + 1} / {totalSteps}
        </Text>

        <TouchableOpacity
          style={[styles.navButton, styles.nextButton]}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>
            {isLastStep ? (lesson.content.quiz ? 'Take Quiz' : 'Complete') : 'Next'}
          </Text>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  introSection: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  introText: {
    fontSize: 16,
    lineHeight: 24,
  },
  stepContent: {
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  stepText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  codeBlock: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 16,
    marginTop: 12,
  },
  codeText: {
    fontFamily: 'Courier',
    fontSize: 14,
    color: '#e2e8f0',
    lineHeight: 20,
  },
  placeholderBox: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    marginTop: 16,
  },
  placeholderText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 4,
  },
  nextButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingHorizontal: 20,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 4,
  },
  stepCounter: {
    fontSize: 14,
    fontWeight: '600',
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
