import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface PostStats {
  likeCount: number;
  dislikeCount: number;
}

/**
 * Hook para escuchar actualizaciones en tiempo real de estadísticas de posts
 */
export const useRealtimePostStats = (postId: number) => {
  const [stats, setStats] = useState<PostStats>({
    likeCount: 0,
    dislikeCount: 0,
  });

  useEffect(() => {
    // Cargar estadísticas iniciales
    const loadStats = async () => {
      try {
        const { count: likeCount } = await supabase
          .from('post_ratings')
          .select('*', { count: 'exact' })
          .eq('post_id', postId)
          .eq('rating', 1);

        const { count: dislikeCount } = await supabase
          .from('post_ratings')
          .select('*', { count: 'exact' })
          .eq('post_id', postId)
          .eq('rating', -1);

        setStats({
          likeCount: likeCount || 0,
          dislikeCount: dislikeCount || 0,
        });
      } catch (err) {
        console.error('[POST_STATS] Error loading initial stats:', err);
      }
    };

    loadStats();

    // Configurar suscripción en tiempo real
    let channel: RealtimeChannel | null = null;

    const setupSubscription = async () => {
      try {
        channel = supabase
          .channel(`post_ratings:${postId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'post_ratings',
              filter: `post_id=eq.${postId}`,
            },
            async () => {
              // Recargar estadísticas cuando hay cambios
              const { count: likeCount } = await supabase
                .from('post_ratings')
                .select('*', { count: 'exact' })
                .eq('post_id', postId)
                .eq('rating', 1);

              const { count: dislikeCount } = await supabase
                .from('post_ratings')
                .select('*', { count: 'exact' })
                .eq('post_id', postId)
                .eq('rating', -1);

              setStats({
                likeCount: likeCount || 0,
                dislikeCount: dislikeCount || 0,
              });
            }
          )
          .subscribe((status) => {
            if (status === 'CHANNEL_ERROR') {
              console.error('[POST_STATS] Channel error, retrying...');
              setTimeout(() => setupSubscription(), 5000);
            }
          });
      } catch (err) {
        console.error('[POST_STATS] Error setting up subscription:', err);
      }
    };

    setupSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [postId]);

  return stats;
};
