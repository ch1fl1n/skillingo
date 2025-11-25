import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { usePerf } from '@/components/tutorial/PerfProvider';
import { useAuth } from '@/contexts/AuthContext';
import { ProgressOutbox } from '@/components/tutorial/ProgressOutbox';
import { Json } from '@/types/database.types';

interface Lesson {
  id: number;
  skill_id: number | null;
  title: string;
  content: Json;
  difficulty: string | null;
  xp_reward: number | null;
  created_at: string | null;
  // Assuming other fields are added in migrations
  description?: string;
  imageUrl?: string;
  blurhash?: string;
  estimatedDuration?: number;
  order?: number;
}

interface UserProgress {
  user_id: string | null;
  skill_id: number | null;
  progress_percent: number | null;
  last_updated: string | null;
  // Assuming xpGained, completedLessons are calculated or from other fields
}

interface LessonAttempt {
  id: number;
  user_id: string | null;
  lesson_id: number | null;
  attempted_at: string | null;
  completed: boolean | null;
  score: number | null;
}

/**
 * Hook para obtener una lección con optimizaciones:
 * - Stale time de 10 minutos
 * - Skeleton UI mientras carga
 * - Prefetch de siguiente lección
 */
export function useLesson(lessonId: number, prefetchNext: boolean = true) {
  const { mark, measure } = usePerf();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: async (): Promise<Lesson | null> => {
      mark(`lesson-load-${lessonId}`);

      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId);

      if (error) throw error;

      if (!data || data.length === 0) {
        measure(`lesson-load-${lessonId}`, `lesson-load-${lessonId}`, {
          lessonId,
          found: false,
        });
        return null;
      }

      const lesson = data[0];

      measure(`lesson-load-${lessonId}`, `lesson-load-${lessonId}`, {
        lessonId,
      });

      // Prefetch siguiente lección si existe
      if (prefetchNext && (lesson as Lesson).order) {
        const nextOrder = (lesson as Lesson).order! + 1;
        queryClient.prefetchQuery({
          queryKey: ['lesson', 'byOrder', lesson.skill_id, nextOrder],
          queryFn: async () => {
            const { data: next } = await supabase
              .from('lessons')
              .select('*')
              .eq('skill_id', lesson.skill_id as number)
              .eq('order', nextOrder);
            return next && next.length > 0 ? next[0] : null;
          },
          staleTime: 1000 * 60 * 10,
        });
      }

      return lesson;
    },
    staleTime: 1000 * 60 * 10, // 10 min
    gcTime: 1000 * 60 * 60 * 24, // 24 horas
  });
}

/**
 * Hook para lecciones de una skill.
 */
export function useSkillLessons(skillId: number) {
  return useQuery({
    queryKey: ['lessons', 'bySkill', skillId],
    queryFn: async (): Promise<Lesson[]> => {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('skill_id', skillId)
        .order('order', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 30, // 30 min
    gcTime: 1000 * 60 * 60 * 24,
  });
}

/**
 * Hook para progreso del usuario en una skill.
 */
export function useUserProgress(skillId: number) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['progress', user?.id, skillId],
    queryFn: async (): Promise<UserProgress | null> => {
      if (!user?.id) throw new Error('No user');

      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('skill_id', skillId);

      if (error) throw error;
      return data && data.length > 0 ? data[0] : null;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 min
    gcTime: 1000 * 60 * 60,
  });
}

/**
 * Mutation para completar una lección.
 * Usa offline queue (ProgressOutbox) para offline-first.
 */
export function useCompleteLessonMutation() {
  const { user } = useAuth();
  const { mark, measure } = usePerf();
  const queryClient = useQueryClient();
  const outbox = ProgressOutbox.getInstance();

  return useMutation({
    mutationFn: async ({
      lessonId,
      skillId,
      xpGained,
    }: {
      lessonId: number;
      skillId: number;
      xpGained: number;
    }) => {
      if (!user?.id) throw new Error('No user');

      mark('lesson-submit-start');

      // Intentar enviar al servidor
      try {
        const { error } = await supabase.from('lesson_attempts').insert({
          user_id: user.id,
          lesson_id: lessonId,
          completed_at: new Date().toISOString(),
          score_percentage: 100,
          xp_earned: xpGained,
        });

        if (error) throw error;

        measure('lesson-submit-complete', 'lesson-submit-start', {
          lessonId,
          skillId,
        });

        return { success: true, offline: false };
      } catch (err) {
        console.warn('[Lesson] Failed to submit to server, using outbox:', err);

        // Fallback: agregar a offline queue
        const id = await outbox.addUpdate({
          userId: user.id,
          lessonId,
          skillId,
          completedAt: new Date().toISOString(),
          xpGained,
        });

        measure('lesson-submit-outbox', 'lesson-submit-start', {
          lessonId,
          skillId,
          offlineId: id,
        });

        return { success: true, offline: true, offlineId: id };
      }
    },
    onSuccess: (result, variables) => {
      // Invalidar queries relevantes
      queryClient.invalidateQueries({
        queryKey: ['progress', user?.id, variables.skillId],
      });
      queryClient.invalidateQueries({
        queryKey: ['lesson', variables.lessonId],
      });
    },
  });
}

/**
 * Hook para obtener intentos recientes de una lección.
 */
export function useRecentLessonAttempts(lessonId: number) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['attempts', user?.id, lessonId],
    queryFn: async (): Promise<LessonAttempt[]> => {
      if (!user?.id) throw new Error('No user');

      const { data, error } = await supabase
        .from('lesson_attempts')
        .select('*')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60,
  });
}
