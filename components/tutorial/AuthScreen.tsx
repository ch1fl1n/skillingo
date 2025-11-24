import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { signIn, signUp } from '@/lib/api/auth';
import { useRouter } from 'expo-router';

interface Props { mode: 'login' | 'signup'; }

export default function AuthScreen({ mode }: Props) {
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [username, setUsername] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn({ email, password });
        router.replace('/(tabs)');
      } else {
        await signUp({ email, password, username });
        router.replace('/onboarding');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error de autenticación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}</Text>
      {mode === 'signup' && (
        <TextInput
          style={styles.input}
          placeholder="Usuario"
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
        />
      )}
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <TouchableOpacity style={styles.button} disabled={loading} onPress={submit}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{mode === 'login' ? 'Entrar' : 'Registrar'}</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.replace(mode === 'login' ? '/signup' : '/login')}>
        <Text style={styles.link}>{mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 12, marginBottom: 12 },
  button: { backgroundColor: '#0f766e', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 4 },
  buttonText: { color: 'white', fontWeight: '600' },
  error: { color: '#dc2626', marginBottom: 8 },
  link: { marginTop: 16, color: '#1e3a8a', fontWeight: '500' },
});
