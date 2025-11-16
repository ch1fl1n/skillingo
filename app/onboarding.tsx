import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LearnSkillsTutorial } from '@/components/tutorial/LearnSkillsTutorial';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useRouter } from 'expo-router';

export default function OnboardingScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const handleTutorialComplete = () => {
    // Navigate to the main app after tutorial
    router.replace('/(tabs)');
  };

  const handleTutorialBack = () => {
    // Handle back navigation if needed
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LearnSkillsTutorial
        onComplete={handleTutorialComplete}
        onBack={handleTutorialBack}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
