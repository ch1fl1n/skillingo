/**
 * Custom React Hooks for Community Features
 * Optimized for performance with memoization and debouncing
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PostDetailData, CommentWithUser } from '@/lib/api/community-optimized';
import * as communityApi from '@/lib/api/community-optimized';
import { subscribeToPostLikes } from '@/lib/supabase';

// =====================
// useLikePost Hook
// =====================

export function useLikePost(postId: number, initialIsLiked: boolean, initialLikeCount: number = 0) {
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [loading, setLoading] = useState(false);

  const handleLike = useCallback(async () => {
    setLoading(true);
    try {
      await communityApi.likePostOptimized(
        postId,
        (newIsLiked, newCount) => {
          setIsLiked(newIsLiked);
          setLikeCount(newCount);
        }
      );
    } catch (error) {
      console.error('Error toggling like:', error);
      // Rollback on error
      setIsLiked(!isLiked);
    } finally {
      setLoading(false);
    }
  }, [postId, isLiked]);

  // Update local state if initial props change (e.g., when post detail re-fetches)
  useEffect(() => {
    setIsLiked(initialIsLiked);
    setLikeCount(initialLikeCount);
  }, [initialIsLiked, initialLikeCount]);

  return { isLiked, likeCount, loading, handleLike };
}

// =====================
// useRatePost Hook
// =====================

export function useRatePost(postId: number, initialRating: number | null = null) {
  const [rating, setRating] = useState<number | null>(initialRating);
  const [loading, setLoading] = useState(false);

  const handleRate = useCallback(
    async (newRating: number) => {
      setLoading(true);
      try {
        await communityApi.ratePostOptimized(
          postId,
          newRating,
          (optimisticRating) => {
            setRating(optimisticRating);
          }
        );
      } catch (error) {
        console.error('Error rating post:', error);
        // Rollback on error
        setRating(initialRating);
      } finally {
        setLoading(false);
      }
    },
    [postId, initialRating]
  );

  return { rating, loading, handleRate };
}

// =====================
// usePostDetail Hook
// =====================

interface UsePostDetailOptions {
  prefetch?: boolean;
}

export function usePostDetail(
  postId: number,
  options: UsePostDetailOptions = {}
) {
  const [data, setData] = useState<PostDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await communityApi.getPostDetailOptimized(postId);
        
        if (!controller.signal.aborted) {
          setData(result);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    // Subscribe to post_likes changes for realtime updates; when likes change we'll
    // refetch the post detail to refresh counts and userMetadata.
    let unsub: (() => void) | null = null;
    try {
      unsub = subscribeToPostLikes(postId, () => {
        // silent refresh - ignore errors but update data when possible
        communityApi.getPostDetailOptimized(postId).then((r) => setData(r)).catch(() => {/* no-op */});
      });
    } catch (e) {
      // ignore subscription errors
    }

    return () => {
      controller.abort();
      if (unsub) unsub();
    };
  }, [postId]);

  // Prefetch on demand
  useEffect(() => {
    if (options.prefetch && postId) {
      communityApi.prefetchPostDetail(postId).catch(console.warn);
    }
  }, [postId, options.prefetch]);

  return { data, loading, error };
}

// =====================
// usePostComments Hook
// =====================

export function usePostComments(postId: number, limit = 50) {
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchComments = useCallback(
    async (pageOffset = 0) => {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        setLoading(true);
        const result = await communityApi.getPostCommentsOptimized(
          postId,
          limit,
          pageOffset
        );

        if (!controller.signal.aborted) {
          if (pageOffset === 0) {
            setComments(result);
          } else {
            setComments((prev) => [...prev, ...result]);
          }
          setHasMore(result.length === limit);
          setOffset(pageOffset);
          setError(null);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    },
    [postId, limit]
  );

  // Initial fetch
  useEffect(() => {
    fetchComments(0);
    return () => abortControllerRef.current?.abort();
  }, [postId]);

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      fetchComments(offset + limit);
    }
  }, [hasMore, loading, offset, limit, fetchComments]);

  const addComment = useCallback((comment: CommentWithUser) => {
    setComments((prev) => [comment, ...prev]);
  }, []);

  return { comments, loading, error, hasMore, loadMore, addComment };
}

// =====================
// useCreateComment Hook
// =====================

export function useCreateComment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createComment = useCallback(
    async (input: { postId: number; content: string; parentCommentId?: number }) => {
      setLoading(true);
      setError(null);

      try {
        const result = await communityApi.createCommentOptimized(input);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { createComment, loading, error };
}

// =====================
// useDebounce Hook (Generic)
// =====================

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// =====================
// useIntersectionObserver Hook (Virtual Scrolling)
// =====================

export function useIntersectionObserver(
  ref: React.RefObject<HTMLElement | null>,
  options: IntersectionObserverInit = {}
) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting);
    }, {
      threshold: 0.1,
      ...options,
    });

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [ref, options]);

  return isVisible;
}

// =====================
// useThrottle Hook (Generic)
// =====================

export function useThrottle<T>(value: T, delay: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRan = useRef<number>(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= delay) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, delay - (Date.now() - lastRan.current));

    return () => clearTimeout(handler);
  }, [value, delay]);

  return throttledValue;
}

// =====================
// Cleanup on unmount
// =====================

export function useCommunityCleanup() {
  useEffect(() => {
    return () => {
      communityApi.cleanupDebounceTimers();
    };
  }, []);
}
