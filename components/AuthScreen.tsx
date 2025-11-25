import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  Alert,
  useColorScheme,
} from 'react-native';
import { signUp, signIn, signOut, resetPassword, signInAnonymously } from '@/lib/auth-helpers';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import Typography from '@/constants/Typography';

/**
 * Modern Authentication Screen Component
 * 
 * Features:
 * - Sign up with email/password and optional full name
 * - Sign in with email/password
 * - Sign out
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
  const colorScheme = useColorScheme();
  const currentColors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user, loading: authLoading } = useAuth();

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
   * Handle user sign out
   * Clears session and navigates back to login
   */
  const handleSignOut = async () => {
    setLoading(true);
    const { error: signOutError } = await signOut();
    setLoading(false);

    if (signOutError) {
      Alert.alert('Error al cerrar sesión', signOutError instanceof Error ? signOutError.message : String(signOutError));
    } else {
      router.replace('/login');
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

  if (authLoading) {
    return (
      <View style={[styles.container, { backgroundColor: currentColors.background }]}>
        <ActivityIndicator size="large" color={currentColors.primary['500']} />
        <Text style={[styles.loadingText, { color: currentColors.neutral['500'] }]}>Cargando...</Text>
      </View>
    );
  }

  if (user) {
    // User is authenticated - show user profile
    return (
      <View style={[styles.container, { backgroundColor: currentColors.background }]}>
        <Text style={[styles.title, { color: currentColors.neutral['900'] }]}>¡Bienvenido!</Text>
        <Text style={[styles.email, { color: currentColors.neutral['700'] }]}>{user.email || 'Usuario anónimo'}</Text>
        
        <View style={[styles.userInfo, { backgroundColor: currentColors.surface.elevated, borderColor: currentColors.neutral['300'] }]}>
          <Text style={[styles.infoLabel, { color: currentColors.neutral['500'] }]}>ID de Usuario:</Text>
          <Text style={[styles.infoValue, { color: currentColors.neutral['900'] }]}>{user.id}</Text>
          
          <Text style={[styles.infoLabel, { color: currentColors.neutral['500'] }]}>Creado:</Text>
          <Text style={[styles.infoValue, { color: currentColors.neutral['900'] }]}>{new Date(user.created_at).toLocaleDateString('es-ES')}</Text>
          
          {user.last_sign_in_at && (
            <>
              <Text style={[styles.infoLabel, { color: currentColors.neutral['500'] }]}>Último inicio de sesión:</Text>
              <Text style={[styles.infoValue, { color: currentColors.neutral['900'] }]}>
                {new Date(user.last_sign_in_at).toLocaleString('es-ES')}
              </Text>
            </>
          )}
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: currentColors.primary['500'] }, loading && styles.buttonDisabled]}
          onPress={handleSignOut}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Cerrar Sesión</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  // User is not authenticated - show login/signup form
  return (
    <View style={[styles.container, { backgroundColor: currentColors.background }]}>
      <Text style={[styles.title, { color: currentColors.neutral['900'] }]}>
        {isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}
      </Text>

      {isSignUp && (
        <TextInput
          style={[styles.input, { color: currentColors.neutral['900'], borderColor: currentColors.neutral['300'] }]}
          placeholder="Nombre completo (opcional)"
          placeholderTextColor={currentColors.neutral['500']}
          autoCapitalize="words"
          value={fullName}
          onChangeText={setFullName}
          editable={!loading}
        />
      )}

      {isSignUp && (
        <TextInput
          style={[styles.input, { color: currentColors.neutral['900'], borderColor: currentColors.neutral['300'] }]}
          placeholder="Nombre de usuario"
          placeholderTextColor={currentColors.neutral['500']}
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
          editable={!loading}
        />
      )}

      <TextInput
        style={[styles.input, { color: currentColors.neutral['900'], borderColor: currentColors.neutral['300'] }]}
        placeholder="Email"
        placeholderTextColor={currentColors.neutral['500']}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        editable={!loading}
      />

      <TextInput
        style={[styles.input, { color: currentColors.neutral['900'], borderColor: currentColors.neutral['300'] }]}
        placeholder="Contraseña"
        placeholderTextColor={currentColors.neutral['500']}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        editable={!loading}
      />

      {error && <Text style={[styles.error, { borderLeftColor: currentColors.primary['700'] }]}>{error}</Text>}

      <TouchableOpacity
        style={[styles.button, { backgroundColor: currentColors.primary['500'] }, loading && styles.buttonDisabled]}
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
        <Text style={[styles.link, { color: currentColors.primary['500'] }]}>
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
          <Text style={[styles.link, styles.secondaryLink, { color: currentColors.neutral['500'] }]}>
            ¿Olvidaste tu contraseña?
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.divider}>
        <View style={[styles.dividerLine, { backgroundColor: currentColors.neutral['300'] }]} />
        <Text style={[styles.dividerText, { color: currentColors.neutral['500'] }]}>o</Text>
        <View style={[styles.dividerLine, { backgroundColor: currentColors.neutral['300'] }]} />
      </View>

      <TouchableOpacity
        style={[styles.button, styles.anonymousButton, { backgroundColor: currentColors.surface.elevated, borderColor: currentColors.neutral['300'] }]}
        onPress={handleAnonymousSignIn}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={currentColors.neutral['700']} />
        ) : (
          <Text style={[styles.buttonText, styles.anonymousButtonText, { color: currentColors.neutral['700'] }]}>
            🕶️ Continuar como invitado
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  
  // Typography - using Typography constants
  title: {
    fontSize: Typography.heading.h1.fontSize.value,
    fontWeight: String(Typography.heading.h1.fontWeight.value) as any,
    marginBottom: 24,
    textAlign: 'center',
  },
  email: {
    fontSize: Typography.body.regular.fontSize.value,
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  loadingText: {
    marginTop: 12,
    fontSize: Typography.body.small.fontSize.value,
    textAlign: 'center',
  },
  
  // Input styles
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
    fontSize: Typography.body.regular.fontSize.value,
  },
  
  // Button styles
  button: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    minHeight: 50,
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: String(Typography.ui.button.fontWeight.value) as any,
    fontSize: Typography.ui.button.fontSize.value,
  },
  
  // Anonymous button variant
  anonymousButton: {
    borderWidth: 1,
  },
  anonymousButtonText: {
    fontWeight: '500',
  },
  
  // Link styles
  linkButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
  link: {
    fontWeight: '500',
    fontSize: Typography.body.small.fontSize.value,
    textAlign: 'center',
  },
  secondaryLink: {
    fontSize: Typography.ui.caption.fontSize.value,
  },
  
  // Error message
  error: {
    marginBottom: 12,
    fontSize: Typography.body.small.fontSize.value,
    textAlign: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 6,
    borderLeftWidth: 4,
  },
  
  // User info card
  userInfo: {
    padding: 20,
    borderRadius: 12,
    marginVertical: 24,
    borderWidth: 1,
  },
  infoLabel: {
    fontSize: Typography.ui.caption.fontSize.value,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: Typography.ui.caption.letterSpacing.value,
  },
  infoValue: {
    fontSize: Typography.body.small.fontSize.value,
    fontWeight: '400',
  },
  
  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: Typography.body.small.fontSize.value,
    marginHorizontal: 16,
    fontWeight: '500',
  },
});

export default AuthScreen;
