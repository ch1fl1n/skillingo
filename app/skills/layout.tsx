import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Slot, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useAuth } from '@/contexts/AuthContext';

SplashScreen.preventAutoHideAsync();

/**
 * Skills layout optimizado para performance:
 * - Lazy loading de pantallas con react-native-screens
 * - Prefetch configurado en onboarding
 * - Auth guard con tolerancia (máximo 3s espera)
 */
export default function SkillsLayout() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const handleAuthCheck = async () => {
      // Timeout de seguridad: máximo 3 segundos
      const timeoutId = setTimeout(() => {
        console.warn('[Skills] Auth check timeout');
        SplashScreen.hideAsync();
      }, 3000);

      if (!loading) {
        clearTimeout(timeoutId);

        if (!user) {
          router.replace('/login');
        } else {
          SplashScreen.hideAsync();
        }
      }
    };

    handleAuthCheck();
  }, [user, loading, router, mark, measure]);

  // Mostrar fallback mientras se verifica autenticación
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Slot
        screenOptions={{
          // Optimización: lazy load screens con react-native-screens
          lazy: true,
          detachInactiveScreens: true,
          animationEnabled: true,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1113' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
