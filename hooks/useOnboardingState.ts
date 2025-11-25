import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_COMPLETED_KEY = '@skillingo_onboarding_completed';
const ONBOARDING_SKIPPED_KEY = '@skillingo_onboarding_skipped';

export interface OnboardingState {
  isCompleted: boolean;
  isSkipped: boolean;
  loading: boolean;
}

/**
 * Hook para manejar el estado de onboarding persistente
 * Verifica si el usuario ya completó o saltó el onboarding
 */
export const useOnboardingState = () => {
  const [state, setState] = useState<OnboardingState>({
    isCompleted: false,
    isSkipped: false,
    loading: true,
  });

  // Cargar estado de onboarding al montar el componente
  useEffect(() => {
    const loadOnboardingState = async () => {
      try {
        const [completed, skipped] = await Promise.all([
          AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY),
          AsyncStorage.getItem(ONBOARDING_SKIPPED_KEY),
        ]);

        setState({
          isCompleted: completed === 'true',
          isSkipped: skipped === 'true',
          loading: false,
        });
      } catch (error) {
        console.error('Error loading onboarding state:', error);
        setState((prev) => ({ ...prev, loading: false }));
      }
    };

    loadOnboardingState();
  }, []);

  // Marcar onboarding como completado
  const markAsCompleted = useCallback(async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
      await AsyncStorage.setItem(ONBOARDING_SKIPPED_KEY, 'false');
      setState({
        isCompleted: true,
        isSkipped: false,
        loading: false,
      });
    } catch (error) {
      console.error('Error marking onboarding as completed:', error);
    }
  }, []);

  // Marcar onboarding como saltado
  const markAsSkipped = useCallback(async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_SKIPPED_KEY, 'true');
      await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'false');
      setState({
        isCompleted: false,
        isSkipped: true,
        loading: false,
      });
    } catch (error) {
      console.error('Error marking onboarding as skipped:', error);
    }
  }, []);

  // Reiniciar onboarding (para debugging o re-onboarding)
  const reset = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(ONBOARDING_COMPLETED_KEY);
      await AsyncStorage.removeItem(ONBOARDING_SKIPPED_KEY);
      setState({
        isCompleted: false,
        isSkipped: false,
        loading: false,
      });
    } catch (error) {
      console.error('Error resetting onboarding state:', error);
    }
  }, []);

  return {
    ...state,
    markAsCompleted,
    markAsSkipped,
    reset,
  };
};
