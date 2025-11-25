// lib/lesson-cache.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

export interface QuestionContent {
  id: string;
  prompt: string;
  options: string[];
  answer: number;
}

export interface LessonContentData {
  questions: QuestionContent[];
  passThreshold: number;
}

export interface LessonCacheEntry {
  id: number;
  skillId: number;
  title: string;
  difficulty: string | null;
  xp_reward: number | null;
  content: LessonContentData;
  cachedAt: number; // timestamp
}

const CACHE_KEY = '@skillingo_lesson_cache';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 días en milisegundos
const MAX_CACHE_SIZE = 50; // máximo de lecciones en caché

/**
 * Get lesson from cache if available and not expired
 */
export const getCachedLesson = async (lessonId: number, skillId: number): Promise<LessonCacheEntry | null> => {
  try {
    const cacheJson = await AsyncStorage.getItem(CACHE_KEY);
    if (!cacheJson) return null;

    const cache: Record<string, LessonCacheEntry> = JSON.parse(cacheJson);
    const key = `${skillId}_${lessonId}`;
    const entry = cache[key];

    if (!entry) return null;

    // Check if cache is expired
    const now = Date.now();
    if (now - entry.cachedAt > CACHE_TTL) {
      // Expired - remove it
      delete cache[key];
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      return null;
    }

    return entry;
  } catch (error) {
    console.error('Error reading lesson cache:', error);
    return null;
  }
};

/**
 * Cache a lesson
 */
export const cacheLesson = async (
  lessonId: number,
  skillId: number,
  lesson: Omit<LessonCacheEntry, 'cachedAt'>
): Promise<void> => {
  try {
    let cache: Record<string, LessonCacheEntry> = {};

    // Load existing cache
    const cacheJson = await AsyncStorage.getItem(CACHE_KEY);
    if (cacheJson) {
      cache = JSON.parse(cacheJson);
    }

    const key = `${skillId}_${lessonId}`;

    // Add new entry
    cache[key] = {
      ...lesson,
      cachedAt: Date.now(),
    };

    // Prune if too large (keep only most recent)
    const keys = Object.keys(cache);
    if (keys.length > MAX_CACHE_SIZE) {
      const sorted = keys
        .map((k) => ({ key: k, time: cache[k].cachedAt }))
        .sort((a, b) => b.time - a.time)
        .slice(0, MAX_CACHE_SIZE);

      const newCache: Record<string, LessonCacheEntry> = {};
      sorted.forEach(({ key: k }) => {
        newCache[k] = cache[k];
      });
      cache = newCache;
    }

    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Error caching lesson:', error);
  }
};

/**
 * Load lesson with cache-first strategy
 * 1. Check cache first
 * 2. If not in cache or expired, fetch from Supabase
 * 3. Cache the result for future use
 */
export const loadLessonOptimized = async (
  skillId: number,
  lessonId?: number
): Promise<LessonCacheEntry | null> => {
  try {
    // Try to get from cache first
    if (lessonId) {
      const cached = await getCachedLesson(lessonId, skillId);
      if (cached) {
        console.log(`[CACHE HIT] Lesson ${lessonId} from skill ${skillId}`);
        return cached;
      }
    }

    // Cache miss or no lessonId - fetch from Supabase
    console.log(`[CACHE MISS] Fetching lesson for skill ${skillId}`);
    const query = supabase
      .from('lessons')
      .select('id,title,difficulty,xp_reward,content,skill_id')
      .eq('skill_id', skillId);

    if (lessonId) {
      query.eq('id', lessonId);
    } else {
      query.limit(1);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error('Error loading lesson:', error);
      return null;
    }

    if (!data) {
      console.log('No lesson found for skill:', skillId);
      return null;
    }

    // Type-safe content extraction from Supabase Json type
    const defaultContent: LessonContentData = {
      questions: [],
      passThreshold: 70,
    };
    
    let lessonContent = defaultContent;
    if (data.content && typeof data.content === 'object' && 'questions' in data.content) {
      lessonContent = data.content as unknown as LessonContentData;
    }

    const lesson: LessonCacheEntry = {
      id: data.id,
      skillId: data.skill_id || skillId,
      title: data.title,
      difficulty: data.difficulty,
      xp_reward: data.xp_reward,
      content: lessonContent,
      cachedAt: Date.now(),
    };

    // Cache for next time
    await cacheLesson(data.id, skillId, lesson);

    return lesson;
  } catch (error) {
    console.error('Error in loadLessonOptimized:', error);
    return null;
  }
};

/**
 * Pre-load lessons for a skill in the background
 * This should be called when the skills screen is displayed
 */
export const preloadLessonsForSkill = async (skillId: number, limit: number = 5): Promise<void> => {
  try {
    console.log(`[PRELOAD] Starting to preload lessons for skill ${skillId}`);

    const { data, error } = await supabase
      .from('lessons')
      .select('id,title,difficulty,xp_reward,content,skill_id')
      .eq('skill_id', skillId)
      .limit(limit);

    if (error) {
      console.error('Error preloading lessons:', error);
      return;
    }

    if (!data || data.length === 0) {
      console.log('No lessons to preload for skill:', skillId);
      return;
    }

    // Cache all lessons
    const defaultContent: LessonContentData = {
      questions: [],
      passThreshold: 70,
    };
    
    for (const lesson of data) {
      let lessonContent = defaultContent;
      if (lesson.content && typeof lesson.content === 'object' && 'questions' in lesson.content) {
        lessonContent = lesson.content as unknown as LessonContentData;
      }

      const entry: LessonCacheEntry = {
        id: lesson.id,
        skillId: lesson.skill_id || skillId,
        title: lesson.title,
        difficulty: lesson.difficulty,
        xp_reward: lesson.xp_reward,
        content: lessonContent,
        cachedAt: Date.now(),
      };

      await cacheLesson(lesson.id, skillId, entry);
    }

    console.log(`[PRELOAD] Successfully preloaded ${data.length} lessons for skill ${skillId}`);
  } catch (error) {
    console.error('Error in preloadLessonsForSkill:', error);
  }
};

/**
 * Batch preload lessons for multiple skills
 * Call this when loading skills list
 */
export const preloadLessonsForSkills = async (skillIds: number[]): Promise<void> => {
  try {
    console.log(`[BATCH PRELOAD] Starting batch preload for ${skillIds.length} skills`);

    // Preload first lesson of each skill in parallel
    const preloadPromises = skillIds.map((skillId) =>
      preloadLessonsForSkill(skillId, 1).catch((err) => {
        console.warn(`Error preloading skill ${skillId}:`, err);
      })
    );

    await Promise.all(preloadPromises);
    console.log('[BATCH PRELOAD] Completed');
  } catch (error) {
    console.error('Error in preloadLessonsForSkills:', error);
  }
};

/**
 * Clear the entire lesson cache
 */
export const clearLessonCache = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(CACHE_KEY);
    console.log('[CACHE] Lesson cache cleared');
  } catch (error) {
    console.error('Error clearing lesson cache:', error);
  }
};

/**
 * Get cache stats for debugging
 */
export const getCacheStats = async (): Promise<{
  totalEntries: number;
  totalSize: number;
  oldestEntry: number | null;
  newestEntry: number | null;
}> => {
  try {
    const cacheJson = await AsyncStorage.getItem(CACHE_KEY);
    if (!cacheJson) {
      return {
        totalEntries: 0,
        totalSize: 0,
        oldestEntry: null,
        newestEntry: null,
      };
    }

    const cache: Record<string, LessonCacheEntry> = JSON.parse(cacheJson);
    const entries = Object.values(cache);

    if (entries.length === 0) {
      return {
        totalEntries: 0,
        totalSize: cacheJson.length,
        oldestEntry: null,
        newestEntry: null,
      };
    }

    const timestamps = entries.map((e) => e.cachedAt);
    const oldestEntry = Math.min(...timestamps);
    const newestEntry = Math.max(...timestamps);

    return {
      totalEntries: entries.length,
      totalSize: cacheJson.length,
      oldestEntry,
      newestEntry,
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return {
      totalEntries: 0,
      totalSize: 0,
      oldestEntry: null,
      newestEntry: null,
    };
  }
};
