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
  // New progression:
  // - Level 1 requires 100 total XP
  // - Subsequent levels increase by a fixed 125 total XP per level (so total(L) = 100 + 125*(L-1))
  // This gives totals: L1=100, L2=225, L3=350, ...
  // Solve for level: level = floor((totalXp + 25) / 125)
  if (!totalXp || totalXp <= 0) return 0;
  const level = Math.floor((totalXp + 25) / 125);
  return Math.max(0, level);
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

/**
 * --- Bombillos (wallet) client helpers ---
 * These helpers call the public tables/RPC for wallet data.
 * They are defensive: they resolve to `null`/empty arrays and log warnings
 * if the server RPC/tables are not yet present or if RLS prevents access.
 */

export async function getBombillosBalance(userId?: string): Promise<number | null> {
  try {
    const uid = userId ?? (await currentUserId());
    if (!uid) return null;
    const { data, error } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', uid)
      .maybeSingle();
    if (error) {
      console.warn('getBombillosBalance: select error', error);
      return null;
    }
    // If no wallet row exists yet, return 0 instead of throwing.
    if (!data) {
      console.debug('getBombillosBalance: no wallet row found, returning 0');
      return 0;
    }
    return (data?.balance ?? 0) as number | null;
  } catch (e) {
    console.error('getBombillosBalance error', e);
    return null;
  }
}

export type WalletTransaction = {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  metadata: any;
  created_at: string;
};

export async function getBombillosTransactions(userId?: string, limit = 20): Promise<WalletTransaction[]> {
  try {
    const uid = userId ?? (await currentUserId());
    if (!uid) return [];
    const { data, error } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) {
      console.warn('getBombillosTransactions: select error', error);
      return [];
    }
    return (data ?? []) as WalletTransaction[];
  } catch (e) {
    console.error('getBombillosTransactions error', e);
    return [];
  }
}

/**
 * Attempts to create a wallet transaction via the Postgres RPC `create_wallet_transaction`.
 * Parameters:
 *  - amount: positive to credit, negative to debit
 *  - type: string enum describing the reason (e.g. 'earn', 'spend', 'reward')
 *  - idempotencyKey: client-generated id to avoid double-charges
 *  - metadata: optional JSON
 */
export async function createBombillosTransaction(opts: {
  amount: number;
  type: string;
  idempotencyKey: string;
  metadata?: Record<string, unknown> | null;
}) {
  try {
    const payload = {
      p_amount: opts.amount,
      p_type: opts.type,
      p_idempotency_key: opts.idempotencyKey,
      p_metadata: opts.metadata ?? {},
    };

    // RPC should enforce min/max bounds (0..1000). We call it and return the result.
    const { data, error } = await supabase.rpc('create_wallet_transaction', payload as any);
    if (error) {
      console.warn('createBombillosTransaction: rpc error', error);
      return { error, data: null };
    }
    return { data, error: null };
  } catch (e) {
    console.error('createBombillosTransaction error', e);
    return { error: e, data: null };
  }
}

export function subscribeToWallet(userId: string, handler: () => void) {
  const channel = supabase.channel(`wallets_${userId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'wallets',
      filter: `user_id=eq.${userId}`,
    }, handler)
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

/**
 * Subscribe to post_likes changes for a specific post. Handler is called when any
 * row for that post is inserted or deleted so callers can refresh counts/UI.
 * Returns an unsubscribe function.
 */
export function subscribeToPostLikes(postId: number, handler: () => void) {
  const channel = supabase.channel(`post_likes_${postId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'post_likes',
      filter: `post_id=eq.${postId}`,
    }, handler)
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

/**
 * Award XP to the authenticated user. Returns { data, error } where data is [{ new_total_xp, new_level }]
 */
export async function awardXp(xp: number) {
  try {
    const { data, error } = await supabase.rpc('award_xp', { p_xp: xp } as any);
    if (error) {
      console.warn('awardXp: rpc error', error);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (e) {
    console.error('awardXp error', e);
    return { data: null, error: e };
  }
}


