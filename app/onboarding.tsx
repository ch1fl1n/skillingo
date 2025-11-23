import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { updateUserMetadata } from '@/lib/auth-helpers';
import { supabase } from '@/lib/supabase';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

import step1Image from '@/assets/images/mascot/step1.jpeg';
import step2Image from '@/assets/images/mascot/step2.jpeg';
import step3Image from '@/assets/images/mascot/step3.jpeg';
import step4Image from '@/assets/images/mascot/step4.jpeg';

const { width, height } = Dimensions.get('window');

type OnboardingStep = {
  id: number;
  title: string;
  description: string;
  image: number;
  backgroundColor: string;
};

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 1,
    title: 'Welcome to Skillingo!',
    description:
      "Skillingo is a platform designed to help you learn and grow your skills in a fun and engaging way. Let's get started!",
    image: step1Image,
    backgroundColor: '#0f1724',
  },
  {
    id: 2,
    title: 'Join the Community Hub',
    description:
      'Connect with fellow learners, share insights, and collaborate on projects. Our community is here to support your growth.',
    image: step3Image,
    backgroundColor: '#0f1724',
  },
  {
    id: 3,
    title: 'Learn with Friends',
    description:
      'Connect with friends, share your progress, and learn together. Track your achievements and celebrate victories!',
    image: step2Image,
    backgroundColor: '#0f1724',
  },
  {
    id: 4,
    title: 'Learn and Connect',
    description:
      'Dive into interactive modules designed to boost your problem-solving and collaboration skills through engaging scenarios and challenges.',
    image: step4Image,
    backgroundColor: '#0f1724',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [currentStep, setCurrentStep] = useState(0);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const animateTransition = (callback: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      callback();
      slideAnim.setValue(50);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      animateTransition(() => setCurrentStep((s) => s + 1));
    } else {
      setCurrentStep(ONBOARDING_STEPS.length);
    }
  };

  const handleSkip = () => {
    animateTransition(() => setCurrentStep(ONBOARDING_STEPS.length));
  };

  const validateUsername = async (usernameToCheck: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('users')
      .select('username')
      .eq('username', usernameToCheck)
      .maybeSingle();

    return !data && !error;
  };

  const handleComplete = async () => {
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Username can only contain letters, numbers, and underscores');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const isAvailable = await validateUsername(username);
      if (!isAvailable) {
        setError('Username already taken');
        setLoading(false);
        return;
      }

      if (!user?.id) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      await supabase.from('users').update({ username }).eq('id', user.id);

      await updateUserMetadata({ onboarding_completed: true });

      router.replace('/(tabs)');
    } catch (err) {
      console.error('Error completing onboarding:', err);
      setError('Failed to complete setup. Please try again.');
      setLoading(false);
    }
  };

  // Loading UI while saving
  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background, flex: 1 }]}>
        <ActivityIndicator size="large" color={colors.primary?.['500'] || '#00d4ff'} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Completing setup...</Text>
      </View>
    );
  }

  // Show error state
  if (error && currentStep >= ONBOARDING_STEPS.length) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background, flex: 1 }]}>
        <Text style={[styles.errorText, { color: '#e74c3c' }]}>{error}</Text>
      </View>
    );
  }

  // Username step (final)
  if (currentStep >= ONBOARDING_STEPS.length) {
    return (
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.usernameContainer}>
          <Image source={step2Image} style={styles.usernameImage} resizeMode="contain" />

          <Text style={styles.usernameTitle}>Choose Your Username</Text>
          <Text style={styles.usernameDescription}>
            Pick a unique username that represents you in the Skillingo community
          </Text>

          <TextInput
            style={styles.usernameInput}
            placeholder="Enter username"
            placeholderTextColor="#666"
            value={username}
            onChangeText={(text) => {
              setUsername(text);
              setError('');
            }}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={20}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={[styles.completeButton, loading && styles.buttonDisabled]} onPress={handleComplete} disabled={loading}>
            <Text style={styles.completeButtonText}>{loading ? '...' : 'Get Started'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  const step = ONBOARDING_STEPS[currentStep];

  return (
    <View style={[styles.container, { backgroundColor: step.backgroundColor }]}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <Image source={step.image} style={styles.image} resizeMode="contain" />

        <View style={styles.textContainer}>
          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.description}>{step.description}</Text>
        </View>

        <View style={styles.dotsContainer}>
          {ONBOARDING_STEPS.map((_, index) => (
            <View key={index} style={[styles.dot, index === currentStep && styles.activeDot]} />
          ))}
        </View>

        <View style={styles.buttonsContainer}>
          {currentStep < ONBOARDING_STEPS.length - 1 && (
            <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
            <Text style={styles.nextText}>{currentStep === ONBOARDING_STEPS.length - 1 ? 'Get Started' : 'Next'}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 60,
    paddingBottom: 40,
  },
  image: {
    width: width * 0.8,
    height: height * 0.4,
    alignSelf: 'center',
    marginBottom: 40,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.9,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
    backgroundColor: '#fff',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  skipText: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.8,
  },
  nextButton: {
    backgroundColor: '#00d4ff',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  nextText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: 'bold',
  },
  usernameContainer: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  usernameImage: {
    width: width * 0.5,
    height: height * 0.25,
    marginBottom: 30,
  },
  usernameTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  usernameDescription: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  usernameInput: {
    width: '100%',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#fff',
    borderWidth: 2,
    borderColor: '#333',
    marginBottom: 12,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  completeButton: {
    backgroundColor: '#00d4ff',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  completeButtonText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
  },
});
