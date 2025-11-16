import React from 'react';
import { StyleSheet, View } from 'react-native';
import { TutorialStep } from '@/components/tutorial/TutorialStep';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface LearnSkillsTutorialProps {
  onComplete?: () => void;
  onBack?: () => void;
}

export const LearnSkillsTutorial: React.FC<LearnSkillsTutorialProps> = ({
  onComplete,
  onBack,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [currentStep, setCurrentStep] = React.useState(1);

  const tutorialSteps = [
    {
      title: 'Welcome to Skillingo!',
      description:
        'Skillingo is a platform designed to help you learn and grow your skills in a fun and engaging way. Let\'s get started!',
      step: 1,
      illustration: <LightBulbIllustration variant="welcome" />,
    },
    {
      title: 'Join the Community Hub',
      description:
        'Connect with fellow learners, share insights, and collaborate on projects. Our community is here to support your growth.',
      step: 2,
      illustration: <LightBulbIllustration variant="community" />,
    },
    {
      title: 'Learn with friends',
      description:
        'Connect with friends, share your progress, and learn together.',
      step: 3,
      illustration: <LightBulbIllustration variant="friends" />,
      buttonLabel: 'Start Learning',
    },
  ];

  const handleNext = () => {
    if (currentStep < tutorialSteps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete?.();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      onBack?.();
    }
  };

  const step = tutorialSteps[currentStep - 1];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TutorialStep
        title={step.title}
        description={step.description}
        stepNumber={currentStep}
        totalSteps={tutorialSteps.length}
        onNext={handleNext}
        onPrevious={handlePrevious}
        canGoBack={true}
        image={step.illustration}
        showSkip={currentStep === 2}
        onSkip={onComplete}
        buttonLabel={step.buttonLabel}
      />
    </View>
  );
};

// Simple SVG-like illustration component
const LightBulbIllustration: React.FC<{ variant?: string }> = ({ variant }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Variant for community step: arms up, small bulb above
  if (variant === 'community') {
    return (
      <View style={[styles.illustration, { backgroundColor: colors.surface?.elevated }]}> 
        {/* Main Bulb */}
        <View style={{ alignItems: 'center' }}>
          <View style={[styles.lightbulb, { borderColor: colors.primary['500'] }]}> 
            <View style={[styles.bulbTop, { backgroundColor: colors.primary['300'], borderColor: colors.primary['500'] }]} />
            <View style={[styles.bulbBase, { backgroundColor: colors.neutral['300'] }]} />
          </View>
          {/* Arms up (simple lines) */}
          <View style={{ position: 'absolute', top: 60, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', width: 120 }}>
            <View style={{ width: 30, height: 40, borderTopWidth: 4, borderColor: colors.primary['500'], borderRadius: 20, transform: [{ rotate: '-30deg' }] }} />
            <View style={{ width: 30, height: 40, borderTopWidth: 4, borderColor: colors.primary['500'], borderRadius: 20, transform: [{ rotate: '30deg' }] }} />
          </View>
        </View>
        {/* Small bulb above */}
        <View style={{ position: 'absolute', top: 0, left: 80, alignItems: 'center' }}>
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary['300'], borderWidth: 2, borderColor: colors.primary['500'], marginBottom: 2 }} />
          <View style={{ width: 12, height: 8, backgroundColor: colors.neutral['300'], borderRadius: 4 }} />
        </View>
      </View>
    );
  }

  // Variant for friends step: arms up, small bulb above, surrounded by friends (abstracted)
  if (variant === 'friends') {
    return (
      <View style={[styles.illustration, { backgroundColor: colors.surface?.elevated, justifyContent: 'flex-end' }]}> 
        {/* Table */}
        <View style={{ position: 'absolute', bottom: 0, left: 10, right: 10, height: 40, backgroundColor: colors.neutral['100'], borderRadius: 20, zIndex: 0 }} />
        {/* Friends (abstracted as colored circles) */}
        <View style={{ position: 'absolute', bottom: 30, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10, zIndex: 1 }}>
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.secondary['300'] }} />
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary['300'] }} />
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.secondary['500'] }} />
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary['500'] }} />
        </View>
        {/* Main Bulb */}
        <View style={{ alignItems: 'center', zIndex: 2 }}>
          <View style={[styles.lightbulb, { borderColor: colors.primary['500'] }]}> 
            <View style={[styles.bulbTop, { backgroundColor: colors.primary['300'], borderColor: colors.primary['500'] }]} />
            <View style={[styles.bulbBase, { backgroundColor: colors.neutral['300'] }]} />
          </View>
          {/* Arms up (simple lines) */}
          <View style={{ position: 'absolute', top: 60, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', width: 120 }}>
            <View style={{ width: 30, height: 40, borderTopWidth: 4, borderColor: colors.primary['500'], borderRadius: 20, transform: [{ rotate: '-30deg' }] }} />
            <View style={{ width: 30, height: 40, borderTopWidth: 4, borderColor: colors.primary['500'], borderRadius: 20, transform: [{ rotate: '30deg' }] }} />
          </View>
        </View>
        {/* Small bulb above */}
        <View style={{ position: 'absolute', top: 0, left: 80, alignItems: 'center', zIndex: 3 }}>
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary['300'], borderWidth: 2, borderColor: colors.primary['500'], marginBottom: 2 }} />
          <View style={{ width: 12, height: 8, backgroundColor: colors.neutral['300'], borderRadius: 4 }} />
        </View>
      </View>
    );
  }

  // Default (welcome, etc.)
  return (
    <View style={[styles.illustration, { backgroundColor: colors.surface?.elevated }]}> 
      <View style={[styles.lightbulb, { borderColor: colors.primary['500'] }]}> 
        <View style={[styles.bulbTop, { backgroundColor: colors.primary['300'], borderColor: colors.primary['500'] }]} />
        <View style={[styles.bulbBase, { backgroundColor: colors.neutral['300'] }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  illustration: {
    width: 200,
    height: 200,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightbulb: {
    width: 120,
    height: 140,
    borderWidth: 2,
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  bulbTop: {
    flex: 2,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    borderBottomWidth: 2,
  },
  bulbBase: {
    flex: 1,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
});
