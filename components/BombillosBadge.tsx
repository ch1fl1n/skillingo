import React, { useEffect, useState } from 'react';
import { TouchableOpacity, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { getBombillosBalance, subscribeToWallet } from '@/lib/supabase';

interface Props {
  onPress?: () => void;
  size?: number;
}

export default function BombillosBadge({ onPress, size = 40 }: Props) {
  const { user, loading: authLoading } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!user) {
      setBalance(null);
      return;
    }

    const uid = user.id;

    const fetchBalance = async () => {
      setLoading(true);
      setError(null);
      try {
        const b = await getBombillosBalance(uid);
        if (!mounted) return;
        setBalance(b ?? 0);
      } catch (e) {
        console.warn('BombillosBadge fetch error', e);
        if (!mounted) return;
        setError('Failed to load balance');
        setBalance(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchBalance();

    const unsubscribe = subscribeToWallet(uid, () => {
      // On change, refetch the balance.
      fetchBalance();
    });

    return () => {
      mounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  if (authLoading) {
    return (
      <View style={[styles.wrapper, { width: size, height: size, borderRadius: size / 2 }]}>
        <ActivityIndicator size="small" />
      </View>
    );
  }

  if (!user) {
    return (
      <TouchableOpacity onPress={onPress} style={[styles.wrapper, styles.anon, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={styles.emoji}>💡</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} style={[styles.wrapper, { width: size, height: size, borderRadius: size / 2 }]}>
      {loading ? (
        <ActivityIndicator size="small" />
      ) : error ? (
        <Text style={styles.error}>!</Text>
      ) : (
        <View style={styles.inner}>
          <Text style={styles.emoji}>💡</Text>
          <Text style={styles.amount}>{balance ?? 0}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
  },
  anon: {
    backgroundColor: '#f8fafc',
  },
  inner: {
    alignItems: 'center',
  },
  emoji: { fontSize: 14 },
  amount: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  error: { color: '#dc2626', fontWeight: '700' },
});
