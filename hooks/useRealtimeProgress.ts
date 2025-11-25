import { useEffect, useCallback, useRef } from 'react';
import { supabase, currentUserId } from '@/lib/supabase';

interface ProgressUpdate {
  userId: string;
  totalXP: number;
  level: number;
  skillId?: number;
  skillProgress?: number;
  proficiencyScore?: number;
}

/**
 * Hook para escuchar cambios en tiempo real de progreso del usuario
 * Detecta cambios en la tabla 'users' y 'user_progress' y notifica al callback
 * Objetivo: Mostrar actualizaciones de XP y progreso en <2 segundos
 */
export const useRealtimeProgress = (onProgressUpdate: (update: ProgressUpdate) => void) => {
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const subscriptionRef = useRef<any>(null);

  const setupRealtimeListeners = useCallback(async () => {
    try {
      const userId = await currentUserId();
      if (!userId) return;

      // Limpiar suscripción anterior si existe
      if (subscriptionRef.current) {
        await supabase.removeChannel(subscriptionRef.current);
      }

      // Crear canal para escuchar cambios en tabla 'users'
      const channel = supabase
        .channel(`user_progress_${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'users',
            filter: `id=eq.${userId}`,
          },
          (payload) => {
            const { total_xp, level } = payload.new as any;
            console.log('[REALTIME] User stats updated:', { total_xp, level });
            
            onProgressUpdate({
              userId,
              totalXP: total_xp || 0,
              level: level || 1,
            });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'skill_proficiency_scores',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const { skill_id, current_score } = payload.new as any;
            console.log('[REALTIME] Skill proficiency updated:', { skill_id, current_score });
            
            onProgressUpdate({
              userId,
              totalXP: 0, // No actualizar XP aquí, solo skill
              level: 0,   // No actualizar level aquí, solo skill
              skillId: skill_id,
              proficiencyScore: current_score || 0,
            });
          }
        )
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            console.log('[REALTIME] Successfully subscribed to progress updates');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('[REALTIME] Channel error - retrying in 5s');
            setTimeout(setupRealtimeListeners, 5000);
          }
        });

      subscriptionRef.current = channel;

      // Retornar función para limpiar
      return () => {
        supabase.removeChannel(channel);
        subscriptionRef.current = null;
      };
    } catch (error) {
      console.error('[REALTIME] Error setting up listeners:', error);
    }
  }, [onProgressUpdate]);

  useEffect(() => {
    let cleanupFn: (() => void) | void;

    setupRealtimeListeners().then((cleanup) => {
      if (cleanup && typeof cleanup === 'function') {
        cleanupFn = cleanup;
      }
    }).catch(console.error);

    return () => {
      if (cleanupFn && typeof cleanupFn === 'function') {
        cleanupFn();
      }
    };
  }, [setupRealtimeListeners]);

  return {
    isConnected: subscriptionRef.current !== null,
  };
};
