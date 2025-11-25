// hooks/usePerformanceMonitor.ts
import { useEffect, useRef, useCallback } from 'react';

export interface PerformanceMetrics {
  navigationTime: number; // Time from navigation to render start
  loadTime: number; // Time from load start to completion
  totalTime: number; // Total time from navigation to full render
  isSlow: boolean; // True if exceeded threshold (2000ms)
}

const PERFORMANCE_THRESHOLD = 2000; // 2 seconds for mid-range devices

/**
 * Hook to monitor performance of lesson loading
 * Tracks navigation time, data fetch time, and render time
 */
export const usePerformanceMonitor = (componentName: string) => {
  const navigationStartRef = useRef<number>(Date.now());
  const loadStartRef = useRef<number | null>(null);
  const metricsRef = useRef<PerformanceMetrics | null>(null);

  const recordLoadStart = useCallback(() => {
    if (!loadStartRef.current) {
      loadStartRef.current = Date.now();
    }
  }, []);

  const recordLoadComplete = useCallback(() => {
    const now = Date.now();
    const navigationTime = (loadStartRef.current || now) - navigationStartRef.current;
    const loadTime = loadStartRef.current ? now - loadStartRef.current : 0;
    const totalTime = now - navigationStartRef.current;

    const metrics: PerformanceMetrics = {
      navigationTime,
      loadTime,
      totalTime,
      isSlow: totalTime > PERFORMANCE_THRESHOLD,
    };

    metricsRef.current = metrics;

    // Log metrics
    const status = metrics.isSlow ? '⚠️ SLOW' : '✅ FAST';
    console.log(`
[PERF] ${componentName}
${status}
  Navigation → Load Start: ${navigationTime}ms
  Load Time: ${loadTime}ms
  Total Time: ${totalTime}ms
  Threshold: ${PERFORMANCE_THRESHOLD}ms
    `);

    // Send to analytics if available
    const globalWithAnalytics = global as Record<string, any>;
    if (globalWithAnalytics.__analytics) {
      globalWithAnalytics.__analytics.trackEvent('lesson_load_performance', {
        component: componentName,
        totalTime,
        isSlow: metrics.isSlow,
      });
    }

    return metrics;
  }, [componentName]);

  const getMetrics = useCallback(() => metricsRef.current, []);

  useEffect(() => {
    navigationStartRef.current = Date.now();
  }, []);

  return {
    recordLoadStart,
    recordLoadComplete,
    getMetrics,
  };
};

/**
 * Performance observer for React Native rendering
 * Measures component render times
 */
export const measureRenderTime = (componentName: string, callback: () => void) => {
  const startTime = Date.now();
  callback();
  const renderTime = Date.now() - startTime;
  
  console.log(`[RENDER] ${componentName}: ${renderTime}ms`);
  
  if (renderTime > 500) {
    console.warn(`[RENDER WARN] ${componentName} took ${renderTime}ms (slow render detected)`);
  }
  
  return renderTime;
};

/**
 * Debounce function load operations
 * Prevents multiple rapid loads
 */
export const createLoadDebouncer = (delayMs: number = 300) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return (fn: () => Promise<void>) => {
    return new Promise<void>((resolve) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(async () => {
        await fn();
        resolve();
      }, delayMs);
    });
  };
};
