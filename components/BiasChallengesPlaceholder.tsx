import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, useColorScheme } from 'react-native';
import Colors from '@/constants/Colors';

interface BiasChallengesPlaceholderProps {
  title?: string;
  message?: string;
  isLoading?: boolean;
}

/**
 * Placeholder component for bias challenges
 * Used while content is loading or not yet available
 */
export const BiasChallengesPlaceholder: React.FC<BiasChallengesPlaceholderProps> = ({
  title = 'Desafío de Sesgo',
  message = 'Cargando desafío...',
  isLoading = true,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
      backgroundColor: isDark ? Colors.dark.background : Colors.light.background,
    },
    content: {
      alignItems: 'center',
      gap: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: '600',
      color: isDark ? Colors.dark.text : Colors.light.text,
      marginTop: 16,
    },
    message: {
      fontSize: 16,
      color: isDark ? Colors.dark.tabIconDefault : Colors.light.tabIconDefault,
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {isLoading && (
          <ActivityIndicator 
            size="large" 
            color={isDark ? Colors.dark.tint : Colors.light.tint}
          />
        )}
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
};

export default BiasChallengesPlaceholder;
