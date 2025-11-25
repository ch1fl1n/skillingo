import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { createBombillosTransaction, getBombillosBalance } from '@/lib/supabase';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

// Packages chosen so that a user with an empty wallet won't exceed the 1000 cap.
const PACKAGES = [
  { id: 'p1', title: '100 Bombillos', amount: 100, price: 0.99 },
  { id: 'p2', title: '500 Bombillos', amount: 500, price: 4.99 },
  { id: 'p3', title: '900 Bombillos', amount: 900, price: 9.99 },
];

export default function BombillosShopModal({ visible, onClose, onSuccess }: Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [confirmingPkg, setConfirmingPkg] = useState<typeof PACKAGES[0] | null>(null);
  const [currentBalance, setCurrentBalance] = useState<number | null>(null);

  async function handleBuy(pkg: typeof PACKAGES[0]) {
    // Enter confirmation step: fetch current balance then show confirmation UI.
    if (loadingId) return;
    try {
      const current = await getBombillosBalance();
      if (current === null) {
        Alert.alert('Unable to check balance', 'Please try again later.');
        return;
      }
      setCurrentBalance(current);
      setConfirmingPkg(pkg);
    } catch (e) {
      console.error('shop preflight error', e);
      Alert.alert('Unable to proceed', 'Could not verify balance.');
    }
  }

  async function confirmPurchase() {
    if (!confirmingPkg || loadingId) return;
    setLoadingId(confirmingPkg.id);
    try {
      const pkg = confirmingPkg;
      const MAX_BALANCE = 1000;
      const current = currentBalance ?? (await getBombillosBalance());
      if (current === null) {
        Alert.alert('Unable to check balance', 'Please try again later.');
        return;
      }
      if (current + pkg.amount > MAX_BALANCE) {
        Alert.alert('Purchase exceeds wallet limit', `You currently have ${current} bombillos. Buying ${pkg.amount} would exceed the ${MAX_BALANCE} limit.`);
        return;
      }

      // Simulate external payment processing delay (demo only).
      await new Promise((res) => setTimeout(res, 900));

      const idempotencyKey = `shop:${pkg.id}:${Date.now()}:${Math.random().toString(36).slice(2,8)}`;
      const res = await createBombillosTransaction({ amount: Math.abs(pkg.amount), type: 'topup', idempotencyKey, metadata: { packageId: pkg.id, price: pkg.price } });

      if (res.error) {
        console.warn('createBombillosTransaction error', res.error);
        const message = (res.error as any)?.message ?? 'An error occurred while crediting your wallet.';
        Alert.alert('Purchase failed', message);
        return;
      }

      Alert.alert('Thank you!', `Credited ${pkg.amount} bombillos.`);
      onSuccess?.();
      setConfirmingPkg(null);
      onClose();
    } catch (e) {
      console.error('shop confirm error', e);
      Alert.alert('Purchase failed', 'An unexpected error occurred.');
    } finally {
      setLoadingId(null);
    }
  }

  function cancelConfirm() {
    setConfirmingPkg(null);
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.backdrop, { backgroundColor: colorScheme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)' }]}>
        <View style={[styles.sheet, { backgroundColor: colors.surface?.default || '#fff' }]}>
          <Text style={[styles.title, { color: colors.text }]}>Buy Bombillos</Text>
          <Text style={[styles.subtitle, { color: colors.neutral?.['500'] }]}>Simulated purchases (demo only)</Text>

          {!confirmingPkg ? (
            PACKAGES.map((p) => (
              <View key={p.id} style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemTitle, { color: colors.text }]}>{p.title}</Text>
                  <Text style={[styles.itemDesc, { color: colors.neutral?.['500'] }]}>{`$${p.price.toFixed(2)}`}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <TouchableOpacity style={[styles.buyButton, { backgroundColor: colors.primary?.['500'] }]} onPress={() => handleBuy(p)} disabled={!!loadingId}>
                    {loadingId === p.id ? <ActivityIndicator color="#fff" /> : <Text style={styles.buyText}>Buy</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.confirmCard}>
              <Text style={[styles.confirmTitle, { color: colors.text }]}>{confirmingPkg.title}</Text>
              <Text style={[styles.confirmLine, { color: colors.neutral?.['500'] }]}>Price: ${confirmingPkg.price.toFixed(2)}</Text>
              <Text style={[styles.confirmLine, { color: colors.neutral?.['500'] }]}>Amount: {confirmingPkg.amount} bombillos</Text>
              <Text style={[styles.confirmLine, { color: colors.neutral?.['500'] }]}>Current balance: {currentBalance ?? '—'}</Text>
              <Text style={[styles.confirmLine, { color: colors.neutral?.['500'] }]}>New balance: {currentBalance !== null ? currentBalance + confirmingPkg.amount : '—'}</Text>

              <View style={{ flexDirection: 'row', marginTop: 12 }}>
                <TouchableOpacity style={[styles.cancelButton]} onPress={cancelConfirm} disabled={!!loadingId}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.buyButton, { marginLeft: 8, flex: 1, alignItems: 'center', backgroundColor: colors.primary?.['500'] }]} onPress={confirmPurchase} disabled={!!loadingId}>
                  {loadingId ? <ActivityIndicator color="#fff" /> : <Text style={styles.buyText}>Confirm Purchase</Text>}
                </TouchableOpacity>
              </View>
            </View>
          )}

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
  sheet: { padding: 16, borderTopLeftRadius: 12, borderTopRightRadius: 12, minHeight: 240 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 13, marginBottom: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  itemTitle: { fontSize: 16, fontWeight: '700' },
  itemDesc: { fontSize: 12, marginTop: 2 },
  buyButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  buyText: { color: '#fff', fontWeight: '700' },
  cancelButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, justifyContent: 'center' },
  cancelText: { color: '#0b1220', fontSize: 15 },
  confirmCard: { padding: 12, borderRadius: 10, backgroundColor: 'transparent' },
  confirmTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  confirmLine: { fontSize: 13, marginTop: 4 },
  closeButton: { marginTop: 8, alignItems: 'center' },
  closeText: { fontSize: 15 },
});
