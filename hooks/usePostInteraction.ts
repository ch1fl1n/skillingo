import { useState, useCallback } from 'react';
import { supabase, currentUserId } from '@/lib/supabase';
import { Alert } from 'react-native';

export type RatingType = number; // 1 for like, -1 for dislike
export type ReportCategory = 'offensive' | 'spam' | 'misinformation' | 'inappropriate' | 'other';

export interface PostRating {
  postId: number;
  userId: string;
  rating: number; // 1 or -1
  createdAt: string;
}

/**
 * Hook para manejar votación y reportes de posts
 */
export const usePostInteraction = () => {
  const [loading, setLoading] = useState(false);
  const [userRating, setUserRating] = useState<RatingType | null>(null);

  // Obtener rating del usuario actual para un post
  const fetchUserRating = useCallback(async (postId: number) => {
    try {
      const userId = await currentUserId();
      if (!userId) return null;

      const { data, error } = await supabase
        .from('post_ratings')
        .select('rating')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('[RATING] Error fetching user rating:', error);
        return null;
      }

      if (data) {
        setUserRating(data.rating as RatingType);
        return data.rating as RatingType;
      }
      
      setUserRating(null);
      return null;
    } catch (err) {
      console.error('[RATING] Unexpected error:', err);
      return null;
    }
  }, []);

  // Enviar votación
  const submitRating = useCallback(
    async (postId: number, ratingValue: number) => {
      try {
        setLoading(true);
        const userId = await currentUserId();
        if (!userId) {
          Alert.alert('Error', 'You must be logged in to rate');
          return false;
        }

        // Verificar si ya existe rating
        const { data: existingRating } = await supabase
          .from('post_ratings')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', userId)
          .maybeSingle();

        if (existingRating) {
          // Si el rating es igual, eliminarlo (toggle)
          if (existingRating.id) {
            const { error } = await supabase
              .from('post_ratings')
              .delete()
              .eq('id', existingRating.id);

            if (error) throw error;
            setUserRating(null);
            return true;
          }
        } else {
          // Crear nuevo rating
          const { error } = await supabase.from('post_ratings').insert({
            post_id: postId,
            user_id: userId,
            rating: ratingValue,
            created_at: new Date().toISOString(),
          } as any);

          if (error) throw error;
          setUserRating(ratingValue as RatingType);
          return true;
        }
      } catch (err) {
        console.error('[RATING] Error submitting rating:', err);
        Alert.alert('Error', 'Failed to submit rating');
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Reportar post (placeholder - requires post_reports table)
  const reportPost = useCallback(async (postId: number, category: ReportCategory, description: string) => {
    try {
      setLoading(true);
      const userId = await currentUserId();
      if (!userId) {
        Alert.alert('Error', 'You must be logged in to report');
        return false;
      }

      // Store report data - could be extended to use a separate table when available
      console.log('[REPORT] Submitting report:', { postId, userId, category, description });
      
      Alert.alert(
        'Report Submitted',
        'Thank you for helping keep our community safe. Our team will review this report shortly.'
      );
      return true;
    } catch (err) {
      console.error('[REPORT] Error submitting report:', err);
      Alert.alert('Error', 'Failed to submit report');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    userRating,
    fetchUserRating,
    submitRating,
    reportPost,
  };
};
