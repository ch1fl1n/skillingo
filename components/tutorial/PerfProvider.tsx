import React, { createContext, useContext, useCallback, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';

interface PerformanceEvent {
  id: string;
  name: string;
  duration: number;
  startTime: number;
  metadata: Record<string, unknown>;
  timestamp: number;
  userAgent?: string;
  userId?: string;
}

interface PerfContextType {
  mark: (name: string) => void;
  measure: (name: string, startMark: string, metadata?: Record<string, unknown>) => number;
  recordEvent: (event: PerformanceEvent) => void;
  getRecentMetrics: () => PerformanceEvent[];
  getP95: (metricName: string) => number | null;
  flushEvents: () => Promise<void>;
}

const PerfContext = createContext<PerfContextType | null>(null);

const PERF_STORAGE_KEY = '@skillingo_perf_events';
const MAX_STORED_EVENTS = 500;

export function PerfProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const marksRef = useRef<Map<string, number>>(new Map());
  const eventsRef = useRef<PerformanceEvent[]>([]);
  const uploadTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cargar eventos persistidos al iniciar
  useEffect(() => {
    const loadPersistedEvents = async () => {
      try {
        const stored = await AsyncStorage.getItem(PERF_STORAGE_KEY);
        if (stored) {
          eventsRef.current = JSON.parse(stored);
        }
      } catch (err) {
        console.warn('[Perf] Failed to load persisted events:', err);
      }
    };

    loadPersistedEvents();

    // Configurar envío periódico (cada 30s o cuando alcance 100 eventos)
    uploadTimerRef.current = setInterval(() => {
      const shouldFlush = eventsRef.current.length >= 100;
      if (shouldFlush) {
        flushEvents();
      }
    }, 30000);

    return () => {
      if (uploadTimerRef.current) clearInterval(uploadTimerRef.current);
    };
  }, []);

  // Persistir eventos a AsyncStorage
  const persistEvents = useCallback(async (events: PerformanceEvent[]): Promise<void> => {
    try {
      const capped = events.slice(-MAX_STORED_EVENTS);
      await AsyncStorage.setItem(PERF_STORAGE_KEY, JSON.stringify(capped));
    } catch (err) {
      console.warn('[Perf] Failed to persist events:', err);
    }
  }, []);

  const mark = useCallback((name: string) => {
    marksRef.current.set(name, performance.now());
  }, []);

  const measure = useCallback(
    (name: string, startMark: string, metadata: Record<string, unknown> = {}): number => {
      const startTime = marksRef.current.get(startMark);
      if (startTime === undefined) {
        console.warn(`[Perf] Start mark "${startMark}" not found`);
        return 0;
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      const event: PerformanceEvent = {
        id: `${name}_${Date.now()}_${Math.random()}`,
        name,
        duration,
        startTime,
        metadata,
        timestamp: Date.now(),
        userAgent: `Skillingo/1.0 (Expo)`,
        userId: user?.id,
      };

      recordEvent(event);
      marksRef.current.delete(startMark);

      return duration;
    },
    [user?.id]
  );

  const recordEvent = useCallback((event: PerformanceEvent) => {
    eventsRef.current.push(event);

    // Log para debugging
    console.log(
      `[Perf] ${event.name}: ${event.duration.toFixed(2)}ms`,
      event.metadata
    );

    // Persistir si excede threshold
    if (eventsRef.current.length % 50 === 0) {
      persistEvents(eventsRef.current);
    }
  }, [persistEvents]);

  const getRecentMetrics = useCallback(() => {
    // Retorna los últimos 100 eventos
    return eventsRef.current.slice(-100);
  }, []);

  const getP95 = useCallback((metricName: string): number | null => {
    const filtered = eventsRef.current
      .filter((e) => e.name === metricName)
      .map((e) => e.duration)
      .sort((a, b) => a - b);

    if (filtered.length === 0) return null;

    const p95Index = Math.ceil(filtered.length * 0.95) - 1;
    return filtered[p95Index];
  }, []);

  const flushEvents = useCallback(async () => {
    if (eventsRef.current.length === 0) return;

    const eventsToSend = [...eventsRef.current];
    const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    if (!baseUrl || !anonKey) {
      console.warn('[Perf] Supabase config missing');
      return;
    }

    try {
      const response = await fetch(`${baseUrl}/functions/v1/perf-write`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
        },
        body: JSON.stringify({
          events: eventsToSend,
        }),
      });

      if (!response.ok) {
        throw new Error(`Perf upload failed: ${response.status}`);
      }

      // Limpiar eventos enviados
      eventsRef.current = [];
      await persistEvents([]);

      console.log('[Perf] Events flushed successfully');
    } catch (err) {
      console.warn('[Perf] Failed to flush events:', err);
      // Los eventos se retendrán para reintento
    }
  }, [persistEvents]);

  const value: PerfContextType = {
    mark,
    measure,
    recordEvent,
    getRecentMetrics,
    getP95,
    flushEvents,
  };

  return <PerfContext.Provider value={value}>{children}</PerfContext.Provider>;
}

export function usePerf(): PerfContextType {
  const context = useContext(PerfContext);
  if (!context) {
    throw new Error('usePerf must be used within PerfProvider');
  }
  return context;
}
