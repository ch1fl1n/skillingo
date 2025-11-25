import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { getBombillosBalance, createBombillosTransaction, awardXp } from '@/lib/supabase';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

const STORE_ITEMS = [
  { id: 'item1', title: 'Profile Theme', description: 'Unlock a premium profile theme', cost: 100 },
  { id: 'item2', title: 'Avatar Frame', description: 'Decorative avatar frame', cost: 25 },
  { id: 'item3', title: 'Highlight Badge', description: 'Special badge shown on profile', cost: 50 },
  { id: 'xp100', title: '100 XP Pack', description: 'Convert 100 bombillos into 100 XP', cost: 100, isXp: true },
];

export default function BombillosStoreModal({ visible, onClose, onSuccess }: Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    let mounted = true;
    (async () => {
      const b = await getBombillosBalance();
      if (!mounted) return;
      setBalance(b);
    })();
    return () => { mounted = false; };
  }, [visible]);

  async function handlePurchase(item: typeof STORE_ITEMS[0]) {
    if (loading) return;
    if ((balance ?? 0) < item.cost) {
      Alert.alert('Not enough bombillos', 'You do not have enough bombillos to buy this item.');
      return;
    }
    setLoading(true);
    try {
      const idempotencyKey = `store:${item.id}:${Date.now()}`;
      // Spend bombillos first
      const res = await createBombillosTransaction({ amount: -Math.abs(item.cost), type: item.isXp ? 'spend_for_xp' : 'spend', idempotencyKey, metadata: { itemId: item.id } });
      if (res.error) {
        Alert.alert('Purchase failed', res.error.message || 'An error occurred');
        return;
      }

      // If this is an XP purchase, award XP via RPC.
      if ((item as any).isXp) {
        const xpAmount = item.cost; // 1 bombillo = 1 XP
        const xpRes = await awardXp(xpAmount);
        if (xpRes.error) {
          // Try to refund the bombillos if awarding XP failed
          console.warn('awardXp failed, attempting refund', xpRes.error);
          const refundKey = `refund:${idempotencyKey}`;
          await createBombillosTransaction({ amount: Math.abs(item.cost), type: 'refund', idempotencyKey: refundKey, metadata: { reason: 'xp_award_failure', originalId: idempotencyKey } });
          Alert.alert('Purchase failed', xpRes.error.message || 'Could not award XP — your bombillos have been refunded.');
          return;
        }
        Alert.alert('Purchase successful', `Credited ${xpAmount} XP to your account.`);
        onSuccess?.();
        onClose();
        return;
      }

      // Non-XP item success
      Alert.alert('Purchase successful', `You bought ${item.title}!`);
      onSuccess?.();
      onClose();
    } catch (e) {
      console.error('store purchase error', e);
      Alert.alert('Purchase failed', 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.backdrop, { backgroundColor: colorScheme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)' }]}>
        <View style={[styles.sheet, { backgroundColor: colors.surface?.default || '#fff' }]}>
          <Text style={[styles.title, { color: colors.text }]}>Spend Bombillos</Text>
          <Text style={[styles.balance, { color: colors.neutral?.['500'] }]}>Balance: {balance ?? '—'}</Text>

          {STORE_ITEMS.map((it) => (
            <View key={it.id} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemTitle, { color: colors.text }]}>{it.title}</Text>
                <Text style={[styles.itemDesc, { color: colors.neutral?.['500'] }]}>{it.description}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.itemCost, { color: colors.primary?.['500'] }]}>{it.cost}</Text>
                <TouchableOpacity style={[styles.buyButton, { backgroundColor: colors.primary?.['500'] }]} onPress={() => handlePurchase(it)} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buyText}>Buy</Text>}
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={[styles.closeText, { color: colors.neutral?.['500'] }]}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: { padding: 16, borderTopLeftRadius: 12, borderTopRightRadius: 12, minHeight: 260 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  balance: { fontSize: 14, marginBottom: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  itemTitle: { fontSize: 16, fontWeight: '700' },
  itemDesc: { fontSize: 12, marginTop: 2 },
  itemCost: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  buyButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  buyText: { color: '#fff', fontWeight: '700' },
  closeButton: { marginTop: 8, alignItems: 'center' },
  closeText: { fontSize: 15 },
});
