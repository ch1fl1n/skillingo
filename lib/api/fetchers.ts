import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  QueryClient,
  QueryCache,
  MutationCache,
} from '@tanstack/react-query';

/**
 * ETag-aware fetcher para Storage y REST endpoints.
 * Evita re-descargas usando If-None-Match y manejo 304.
 */
export class ETagFetcher {
  private etagCache = new Map<string, string>();

  async fetch<T>(
    url: string,
    options: RequestInit & { etagKey?: string } = {}
  ): Promise<T> {
    const { etagKey = url, ...fetchOptions } = options;
    const savedEtag = this.etagCache.get(etagKey);

    const headers = {
      ...fetchOptions.headers,
      ...(savedEtag && { 'If-None-Match': savedEtag }),
    };

    const response = await fetch(url, { ...fetchOptions, headers });

    if (response.status === 304) {
      // Not Modified - retornar cached data
      console.log(`[ETag] Cache hit: ${url}`);
      return Promise.reject(new Error('304-not-modified'));
    }

    if (!response.ok) {
      throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
    }

    const etag = response.headers.get('etag');
    if (etag) {
      this.etagCache.set(etagKey, etag);
    }

    return response.json();
  }

  clearEtag(key: string): void {
    this.etagCache.delete(key);
  }

  clearAllEtags(): void {
    this.etagCache.clear();
  }
}

/**
 * Crear una instancia de QueryClient con persist local.
 * Stale times están ajustados por recurso.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: 1000 * 60 * 60, // 1 hora
        staleTime: 1000 * 60 * 10, // 10 min (default)
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
      mutations: {
        retry: 1,
        retryDelay: 1000,
      },
    },
    queryCache: new QueryCache({
      onError: (error, query) => {
        console.warn(
          `[Query] Error in ${query.queryKey.join('/')}:`,
          error
        );
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, variables, context, mutation) => {
        console.warn(`[Mutation] Error in ${mutation.meta?.name}:`, error);
      },
    }),
  });
}

/**
 * Configuración para persistencia con React Query + AsyncStorage.
 * Serializa queries a AsyncStorage para warm starts.
 */
export const createPersister = () => {
  const CACHE_KEY = '@skillingo_react_query_cache';

  return {
    async persistQueryClient(client: QueryClient): Promise<void> {
      try {
        const cache = client.getQueryCache();
        const queries = cache.getAll().map((query) => ({
          key: query.queryKey,
          state: query.state.data,
          timestamp: Date.now(),
        }));

        if (queries.length > 0) {
          await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(queries));
          console.log(`[Query] Persisted ${queries.length} queries`);
        }
      } catch (err) {
        console.warn('[Query] Failed to persist cache:', err);
      }
    },

    async restoreQueryClient(client: QueryClient): Promise<void> {
      try {
        const stored = await AsyncStorage.getItem(CACHE_KEY);
        if (!stored) return;

        const queries = JSON.parse(stored);
        queries.forEach(
          (q: { key: unknown[]; state: unknown; timestamp: number }) => {
            const age = Date.now() - q.timestamp;
            // Solo restaurar si tiene menos de 5 min
            if (age < 1000 * 60 * 5) {
              client.setQueryData(q.key, q.state);
              console.log(`[Query] Restored ${q.key.join('/')}`);
            }
          }
        );
      } catch (err) {
        console.warn('[Query] Failed to restore cache:', err);
      }
    },

    async clearCache(): Promise<void> {
      try {
        await AsyncStorage.removeItem(CACHE_KEY);
      } catch (err) {
        console.warn('[Query] Failed to clear cache:', err);
      }
    },
  };
};

/**
 * Hook para prefetch de queries.
 * Típicamente usado al navegar o después de auth.
 */
export async function prefetchQueries(
  queryClient: QueryClient,
  prefetchFns: Array<() => Promise<void>>
): Promise<void> {
  try {
    await Promise.all(prefetchFns);
    console.log('[Query] Prefetch completed');
  } catch (err) {
    console.warn('[Query] Prefetch failed (non-blocking):', err);
  }
}
