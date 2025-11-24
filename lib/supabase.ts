import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { Database } from '@/types/database.types';

/**
 * Supabase singleton para la app Expo.
 * Objetivos clave:
 *  - Persistir sesión (refresh tokens) de forma segura según plataforma.
 *  - Evitar fugas de claves: sólo usamos Anon Key en cliente; Service Key vive en Edge Functions.
 *  - RLS (Row Level Security) activo en Postgres -> nunca adjuntamos user_id manual desde UI.
 *  - Configuración defensiva: detectSessionInUrl desactivado (evita parsear URL en web routers).
 */

let client: SupabaseClient<Database> | null = null;

/**
 * Adaptador de almacenamiento multiplataforma para auth.
 * Web: localStorage (sincronía simple, accesible sólo en browser y se captura en try/catch).
 * Nativo: AsyncStorage cargado dinámicamente (reduce bundle y evita SSR warnings).
 * Nota: No usamos SecureStore aquí para simplificar demo; se puede intercambiar fácilmente.
 */
const createStorageAdapter = () => {
  if (Platform.OS === 'web') {
    return {
      getItem: (key: string) => {
        try { return Promise.resolve(localStorage.getItem(key)); } catch { return Promise.resolve(null); }
      },
      setItem: (key: string, value: string) => {
        try { localStorage.setItem(key, value); } catch { /* no-op */ }
        return Promise.resolve();
      },
      removeItem: (key: string) => {
        try { localStorage.removeItem(key); } catch { /* no-op */ }
        return Promise.resolve();
      },
    };
  }
  // Plataforma nativa
  return {
    getItem: async (key: string) => {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      return AsyncStorage.getItem(key);
    },
    setItem: async (key: string, value: string) => {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      return AsyncStorage.setItem(key, value);
    },
    removeItem: async (key: string) => {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      return AsyncStorage.removeItem(key);
    },
  };
};

const storageAdapter = createStorageAdapter();

export function getSupabase(): SupabaseClient<Database> {
  if (client) return client;

  const supabaseUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

  client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      storage: storageAdapter as any,
    },
  });
  return client;
}

// Convenience export for existing imports expecting `supabase`.
export const supabase = getSupabase();

/**
 * Helper to derive the application level from total XP.
 * Level formula (simple & cheap): floor(sqrt(total_xp / 100)).
 */
export function computeLevel(totalXp: number): number {
  // Fórmula simple: raíz cuadrada escalada -> crecimiento lento y sostenible.
  return Math.floor(Math.sqrt(totalXp / 100));
}

/**
 * Safe accessor for the current auth user id. Returns null if no session.
 * Never trust client-supplied user_id; always derive from the session.
 */
export async function currentUserId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

/**
 * Suscripción Realtime utilitaria: cambios en progreso del usuario.
 * Se usa para componentes que requieren actualización casi inmediata.
 * Retorna función de cleanup.
 */
export function subscribeUserProgress(userId: string, handler: () => void) {
  const channel = supabase.channel(`user_progress_${userId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'user_progress',
      filter: `user_id=eq.${userId}`,
    }, handler)
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR') console.warn('Error suscribiendo canal user_progress');
    });
  return () => { supabase.removeChannel(channel); };
}

/**
 * Suscripción Realtime a XP / nivel del usuario (tabla users).
 */
export function subscribeUserStats(userId: string, handler: () => void) {
  const channel = supabase.channel(`users_${userId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'users',
      filter: `id=eq.${userId}`,
    }, handler)
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}


