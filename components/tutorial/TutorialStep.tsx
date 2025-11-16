import React from 'react';
import { StyleSheet, View, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface TutorialStepProps {
  title: string;
  description: string;
  image?: React.ReactNode;
  stepNumber: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious?: () => void;
  canGoBack?: boolean;
  showSkip?: boolean;
  onSkip?: () => void;
  buttonLabel?: string;
}

export const TutorialStep: React.FC<TutorialStepProps> = ({
  title,
  description,
  image,
  stepNumber,
  totalSteps,
  onNext,
  onPrevious,
  canGoBack = true,
  showSkip = false,
  onSkip,
  buttonLabel,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { height } = useWindowDimensions();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Image/Illustration Area */}
      {image && (
        <View style={[styles.imageContainer, { height: height * 0.4 }]}>
          {image}
        </View>
      )}

      {/* Content Area */}
      <View style={styles.contentArea}>
        {/* Title */}
        <Text style={[styles.title, { color: colors.text }]}>
          {title}
        </Text>

        {/* Description */}
        <Text style={[styles.description, { color: colors.text }]}>
          {description}
        </Text>
      </View>

      {/* Pagination Dots */}
      <View style={styles.dotsContainer}>
        {Array.from({ length: totalSteps }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor:
                  index === stepNumber - 1
                    ? colors.primary['500']
                    : index < stepNumber - 1
                    ? colors.primary['500']
                    : '#ccc',
              },
            ]}
          />
        ))}
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        {showSkip && onSkip ? (
          <>
            <Pressable
              style={[styles.button, { backgroundColor: colors.secondary['500'], marginRight: 8 }]}
              onPress={onSkip}
            >
              <Text style={[styles.buttonText, { color: '#fff' }]}>Skip</Text>
            </Pressable>
            <Pressable
              style={[styles.button, { backgroundColor: colors.primary['500'], marginLeft: 8 }]}
              onPress={onNext}
            >
              <Text style={[styles.buttonText, { color: '#fff' }]}>Next</Text>
            </Pressable>
          </>
        ) : (
          <>
            {canGoBack && onPrevious && stepNumber > 1 && (
              <Pressable
                style={[styles.button, styles.secondaryButton, { borderColor: colors.primary['500'] }]}
                onPress={onPrevious}
              >
                <Text style={[styles.buttonText, { color: colors.primary['500'] }]}>Back</Text>
              </Pressable>
            )}
            <Pressable
              style={[
                styles.button,
                styles.primaryButton,
                { backgroundColor: colors.primary['500'], flex: canGoBack && onPrevious && stepNumber > 1 ? 1 : 1 },
              ]}
              onPress={onNext}
            >
              <Text style={[styles.buttonText, { color: '#fff', fontWeight: '700' }]}> 
                {buttonLabel ? buttonLabel : stepNumber === totalSteps ? 'Get Started' : 'Next'}
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 24,
  },
  contentArea: {
    marginVertical: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 24,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  primaryButton: {
    elevation: 3,
  },
  secondaryButton: {
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
