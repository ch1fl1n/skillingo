import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, computeLevel, subscribeUserStats } from '@/lib/supabase';

// Perfil mínimo expuesto al cliente desde la tabla `users`. Mantenerlo limitado reduce superficie de datos.
interface AppUserProfile {
  id: string;
  email: string;
  username: string;
  avatar_url: string | null;
  total_xp: number;
  level: number;
  role: string; // 'learner' | 'moderator' | 'admin'
}

interface AuthContextType {
  user: User | null;              // Usuario autenticado (GoTrue)
  session: Session | null;        // Sesión completa (tokens, expiración)
  profile: AppUserProfile | null; // Fila de la tabla users con campos permitidos
  loading: boolean;               // Carga inicial de sesión/perfil
  refreshing: boolean;            // Indicador de refetch manual
  signOut: () => Promise<void>;   // Cierra sesión (revoca refresh token en cliente)
  refreshProfile: () => Promise<void>; // Forzar refetch perfil
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  refreshing: false,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<AppUserProfile | null>(null);

  // Obtiene y normaliza el perfil del usuario desde Supabase.
  const loadProfile = useCallback(async (uid: string) => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id,email,username,avatar_url,total_xp,level,role')
        .eq('id', uid)
        .single();
      if (error) throw error;
      if (data) {
        // Ensure level consistency client-side (defensive; server should maintain it).
        const computed = computeLevel(data.total_xp);
        setProfile({ ...data, level: computed });
      }
    } catch (e) {
      console.warn('Failed fetching profile', e);
      setProfile(null);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // 1. Carga inicial de sesión (persistida por supabase-js)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      const uid = session?.user?.id;
      if (uid) {
        loadProfile(uid).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // 2. Escucha cambios de auth (login / logout / token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (!mounted) return;
        setSession(nextSession);
        setUser(nextSession?.user ?? null);
        const uid = nextSession?.user?.id;
        if (uid) {
          loadProfile(uid);
        } else {
          setProfile(null);
        }
      }
    );

    // 3. Suscripción realtime a cambios de XP / nivel para reflejo casi inmediato.
    let unsubscribeStats: (() => void) | null = null;
    if (session?.user?.id) {
      unsubscribeStats = subscribeUserStats(session.user.id, () => {
        // Evitamos spam: refrescamos sólo perfil (pequeña query) al recibir evento.
        loadProfile(session.user!.id);
      });
    }

    return () => {
      mounted = false;
      subscription.unsubscribe();
      if (unsubscribeStats) unsubscribeStats();
    };
  }, []);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (!user?.id) return;
    await loadProfile(user.id);
  };

  const value = {
    user,
    session,
    profile,
    loading,
    refreshing,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
