import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Slot, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Layout contenedor para la sección de skills.
 * Encapsula encabezado y podría añadir tabs en el futuro.
 * Protege rutas internas si el usuario no está autenticado.
 */
export default function SkillsLayout() {
  const { user, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Skills</Text>
      </View>
      <Slot />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1e293b',
  },
  title: { color: 'white', fontSize: 20, fontWeight: '600' },
});
