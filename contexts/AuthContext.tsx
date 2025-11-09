import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
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

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, currentSession: Session | null) => {
        console.log('Auth event:', event);

        switch (event) {
          case 'INITIAL_SESSION':
            // Handle initial session load
            console.log('Initial session loaded');
            setSession(currentSession);
            setUser(currentSession?.user ?? null);
            setLoading(false);
            break;

          case 'SIGNED_IN':
            // User signed in or session re-established
            console.log('User signed in:', currentSession?.user?.email);
            setSession(currentSession);
            setUser(currentSession?.user ?? null);
            setLoading(false);
            break;

          case 'SIGNED_OUT':
            // User signed out - clean up local state
            console.log('User signed out');
            setSession(null);
            setUser(null);
            setLoading(false);
            // Add any cleanup logic here (clear local storage, reset app state, etc.)
            break;

          case 'TOKEN_REFRESHED':
            // New access token fetched
            console.log('Token refreshed');
            setSession(currentSession);
            // Extract and store access token if needed
            const accessToken = currentSession?.access_token;
            if (accessToken) {
              // Store in memory or use for API calls
              console.log('New access token available');
            }
            break;

          case 'USER_UPDATED':
            // User profile updated
            console.log('User updated:', currentSession?.user?.email);
            setSession(currentSession);
            setUser(currentSession?.user ?? null);
            break;

          case 'PASSWORD_RECOVERY':
            // Password recovery link clicked
            console.log('Password recovery initiated');
            // Navigate to password reset screen
            // You can emit a custom event or use navigation here
            break;

          default:
            console.log('Unhandled auth event:', event);
        }
      }
    );

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const value = {
    user,
    session,
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
