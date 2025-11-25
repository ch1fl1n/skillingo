import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  Alert,
} from 'react-native';
import { signUp, signIn, resetPassword, signInAnonymously } from '@/lib/auth-helpers';
import { useRouter } from 'expo-router';

/**
 * Modern Authentication Screen Component
 * 
 * Features:
 * - Sign up with email/password and optional full name
 * - Sign in with email/password
 * - Anonymous sign-in for quick access
 * - Password recovery via email
 * - Integration with AuthContext for global state
 * - Modern UI with TouchableOpacity and ActivityIndicator
 * - Automatic navigation using expo-router
 * 
 * @param {Object} props - Component props
 * @param {'login' | 'signup'} props.mode - Initial mode (optional)
 */
interface AuthScreenProps {
  mode?: 'login' | 'signup';
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ mode: initialMode = 'login' }) => {
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handle user sign up
   * Creates new account and navigates to onboarding on success
   */
  const handleSignUp = async () => {
    if (!email || !password) {
      setError('Por favor completa todos los campos');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const { data, error: signUpError } = await signUp(email, password, {
        full_name: fullName || username,
        username: username,
      });

      if (signUpError) {
        setError(signUpError instanceof Error ? signUpError.message : String(signUpError));
      } else if (data && data.user && !data.session) {
        Alert.alert(
          'Éxito',
          'Por favor revisa tu email para confirmar tu cuenta antes de iniciar sesión.'
        );
        setIsSignUp(false);
      } else if (data && data.user && data.session) {
        // Successfully signed up with auto-login
        router.replace('/onboarding');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al crear cuenta');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle user sign in
   * Authenticates user and navigates to main app on success
   */
  const handleSignIn = async () => {
    if (!email || !password) {
      setError('Por favor completa todos los campos');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const { error: signInError } = await signIn(email, password);
      
      if (signInError) {
        setError(signInError instanceof Error ? signInError.message : String(signInError));
      } else {
        router.replace('/(tabs)');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error de autenticación');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle password reset request
   * Sends password reset email to user
   */
  const handlePasswordReset = async () => {
    if (!email) {
      setError('Por favor ingresa tu email');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const { error: resetError } = await resetPassword(email);
      
      if (resetError) {
        setError(resetError instanceof Error ? resetError.message : String(resetError));
      } else {
        Alert.alert('Éxito', '¡Email de recuperación enviado! Revisa tu bandeja de entrada.');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al enviar email');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle anonymous sign in
   * Allows user to access app without creating account
   */
  const handleAnonymousSignIn = async () => {
    setError(null);
    setLoading(true);

    try {
      const { error: anonError } = await signInAnonymously({
        data: {
          source: 'auth_screen',
          created_at: new Date().toISOString(),
        },
      });

      if (anonError) {
        setError(anonError instanceof Error ? anonError.message : String(anonError));
      } else {
        router.replace('/(tabs)');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error en sesión anónima');
    } finally {
      setLoading(false);
    }
  };

  // User is not authenticated - show login/signup form
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}
      </Text>

      {isSignUp && (
        <TextInput
          style={styles.input}
          placeholder="Nombre completo (opcional)"
          placeholderTextColor="#6b7280"
          autoCapitalize="words"
          value={fullName}
          onChangeText={setFullName}
          editable={!loading}
        />
      )}

      {isSignUp && (
        <TextInput
          style={styles.input}
          placeholder="Nombre de usuario"
          placeholderTextColor="#6b7280"
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
          editable={!loading}
        />
      )}

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#6b7280"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        editable={!loading}
      />

      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        placeholderTextColor="#6b7280"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        editable={!loading}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={isSignUp ? handleSignUp : handleSignIn}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {isSignUp ? 'Registrarse' : 'Entrar'}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => {
          setIsSignUp(!isSignUp);
          setError(null);
        }}
        disabled={loading}
      >
        <Text style={styles.link}>
          {isSignUp 
            ? '¿Ya tienes cuenta? Inicia sesión' 
            : '¿No tienes cuenta? Regístrate'}
        </Text>
      </TouchableOpacity>

      {!isSignUp && (
        <TouchableOpacity
          style={styles.linkButton}
          onPress={handlePasswordReset}
          disabled={loading}
        >
          <Text style={[styles.link, styles.secondaryLink]}>
            ¿Olvidaste tu contraseña?
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>o</Text>
        <View style={styles.dividerLine} />
      </View>

      <TouchableOpacity
        style={[styles.button, styles.anonymousButton, loading && styles.buttonDisabled]}
        onPress={handleAnonymousSignIn}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#374151" />
        ) : (
          <Text style={[styles.buttonText, styles.anonymousButtonText]}>
            🕶️ Continuar como invitado
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 12, marginBottom: 12 },
  button: { backgroundColor: '#0f766e', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 4 },
  buttonText: { color: 'white', fontWeight: '600' },
  error: { color: '#dc2626', marginBottom: 8 },
  link: { marginTop: 16, color: '#1e3a8a', fontWeight: '500' },
  buttonDisabled: { opacity: 0.6 },
  linkButton: { marginTop: 16, paddingVertical: 8 },
  secondaryLink: { fontSize: 12 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#d1d5db' },
  dividerText: { fontSize: 14, marginHorizontal: 16, fontWeight: '500', color: '#6b7280' },
  anonymousButton: { borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#f9fafb' },
  anonymousButtonText: { color: '#374151', fontWeight: '500' },
});

export default AuthScreen;
