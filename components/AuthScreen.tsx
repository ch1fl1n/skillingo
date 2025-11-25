import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { signUp, signIn, resetPassword, signInAnonymously, signInWithOAuth, createUserProfile, checkUsernameExists } from '@/lib/auth-helpers';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import Typography from '@/constants/Typography';

/**
 * Modern Authentication Screen Component
 * 
 * Features:
 * - Sign up with email/password and optional full name
 * - Sign in with email/password
 * - Sign up with Google OAuth
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
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  /**
   * Handle user sign up
   * Creates new account and navigates to onboarding on success
   */
  const handleSignUp = async () => {
    if (!email || !password) {
      setError('Por favor completa todos los campos');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (isSignUp && !username) {
      setError('Por favor ingresa un nombre de usuario');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // Check if username already exists
      const { exists: usernameExists } = await checkUsernameExists(username);
      if (usernameExists) {
        setError('El nombre de usuario ya está en uso');
        setLoading(false);
        return;
      }

      const { data, error: signUpError } = await signUp(email, password, {
        full_name: fullName || username,
        username: username,
      });

      if (signUpError) {
        setError(signUpError instanceof Error ? signUpError.message : String(signUpError));
      } else if (data && data.user) {
        // Create user profile in database
        const { error: profileError } = await createUserProfile(
          data.user.id,
          email,
          username,
          fullName,
          undefined
        );

        if (profileError) {
          console.error('Profile creation error:', profileError);
          setError('Error al crear el perfil de usuario');
          setLoading(false);
          return;
        }

        if (!data.session) {
          Alert.alert(
            'Éxito',
            'Por favor revisa tu email para confirmar tu cuenta antes de iniciar sesión.'
          );
          setIsSignUp(false);
          setEmail('');
          setPassword('');
          setUsername('');
          setFullName('');
        } else {
          // Successfully signed up with auto-login - go to onboarding
          router.replace('/onboarding');
        }
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

  /**
   * Handle Google Sign Up/Sign In
   * Uses OAuth flow to authenticate with Google
   */
  const handleGoogleSignUp = async () => {
    setError(null);
    setLoading(true);

    try {
      const { data, error: googleError } = await signInWithOAuth('google', {
        redirectTo: undefined,
      });

      if (googleError) {
        setError(googleError instanceof Error ? googleError.message : String(googleError));
      } else if (data?.url) {
        // OAuth flow initiated - the app will handle the redirect
        // After successful OAuth, user will be authenticated
        // They should be directed to onboarding if new user
        router.replace('/onboarding');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al iniciar sesión con Google');
    } finally {
      setLoading(false);
    }
  };

  // User is not authenticated - show login/signup form
  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <Text style={[styles.title, { color: colors.text }]}>
            {isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.neutral['500'] }]}>
            {isSignUp 
              ? 'Únete a Skillingo hoy' 
              : 'Bienvenido de vuelta'}
          </Text>
        </View>

        {isSignUp && (
          <>
            <TextInput
              style={[styles.input, { 
                borderColor: colors.neutral['300'],
                backgroundColor: colors.surface.elevated,
                color: colors.text,
              }]}
              placeholder="Nombre completo (opcional)"
              placeholderTextColor={colors.neutral['500']}
              autoCapitalize="words"
              value={fullName}
              onChangeText={setFullName}
              editable={!loading}
            />

            <TextInput
              style={[styles.input, { 
                borderColor: colors.neutral['300'],
                backgroundColor: colors.surface.elevated,
                color: colors.text,
              }]}
              placeholder="Nombre de usuario"
              placeholderTextColor={colors.neutral['500']}
              autoCapitalize="none"
              value={username}
              onChangeText={setUsername}
              editable={!loading}
            />
          </>
        )}

        <TextInput
          style={[styles.input, { 
            borderColor: colors.neutral['300'],
            backgroundColor: colors.surface.elevated,
            color: colors.text,
          }]}
          placeholder="Email"
          placeholderTextColor={colors.neutral['500']}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          editable={!loading}
        />

        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.passwordInput, { 
              borderColor: colors.neutral['300'],
              backgroundColor: colors.surface.elevated,
              color: colors.text,
            }]}
            placeholder="Contraseña"
            placeholderTextColor={colors.neutral['500']}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            editable={!loading}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
            disabled={!password}
          >
            <MaterialCommunityIcons
              name={showPassword ? 'eye-off' : 'eye'}
              size={20}
              color={password ? colors.neutral['500'] : colors.neutral['300']}
            />
          </TouchableOpacity>
        </View>

        {error && (
          <View style={[styles.errorContainer, { backgroundColor: colors.background, borderColor: colors.primary['500'] }]}>
            <MaterialCommunityIcons name="alert-circle" size={16} color={colors.primary['500']} />
            <Text style={[styles.error, { color: colors.primary['500'] }]}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, styles.primaryButton, { backgroundColor: colors.primary['500'] }, loading && styles.buttonDisabled]}
          onPress={isSignUp ? handleSignUp : handleSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}
            </Text>
          )}
        </TouchableOpacity>

        {!isSignUp && (
          <TouchableOpacity
            style={styles.linkButton}
            onPress={handlePasswordReset}
            disabled={loading}
          >
            <Text style={[styles.link, { color: colors.primary['500'] }]}>
              ¿Olvidaste tu contraseña?
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: colors.neutral['300'] }]} />
          <Text style={[styles.dividerText, { color: colors.neutral['500'] }]}>o continúa con</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.neutral['300'] }]} />
        </View>

        {isSignUp && (
          <TouchableOpacity
            style={[styles.button, styles.googleButton, { 
              borderColor: colors.neutral['300'],
              backgroundColor: colors.surface.default,
            }, loading && styles.buttonDisabled]}
            onPress={handleGoogleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <View style={styles.googleButtonContent}>
                <Text style={styles.googleIcon}>🔵</Text>
                <Text style={[styles.buttonText, { color: colors.text }]}>
                  Registrarse con Google
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.button, styles.anonymousButton, { 
            borderColor: colors.neutral['300'],
            backgroundColor: colors.surface.elevated,
          }, loading && styles.buttonDisabled]}
          onPress={handleAnonymousSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.neutral['700']} />
          ) : (
            <View style={styles.anonContent}>
              <Text style={styles.anonIcon}>🕶️</Text>
              <Text style={[styles.buttonText, { color: colors.neutral['700'] }]}>
                {isSignUp ? 'Continuar como invitado' : 'Modo invitado'}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.switchModeContainer}>
          <Text style={[styles.switchModeText, { color: colors.neutral['500'] }]}>
            {isSignUp ? '¿Ya tienes cuenta? ' : '¿No tienes cuenta? '}
          </Text>
          <TouchableOpacity
            onPress={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            disabled={loading}
          >
            <Text style={[styles.switchModeLink, { color: colors.primary['500'] }]}>
              {isSignUp ? 'Inicia sesión' : 'Regístrate'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  headerSection: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: { 
    fontSize: Typography.sizes.h2, 
    fontWeight: Typography.weights.bold, 
    marginBottom: 8,
  },
  subtitle: {
    fontSize: Typography.sizes.small,
    fontWeight: Typography.weights.medium,
  },
  input: { 
    borderWidth: 1, 
    borderRadius: 8, 
    padding: 12, 
    marginBottom: 12,
    fontSize: Typography.sizes.small,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  passwordInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: Typography.sizes.small,
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    padding: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
  },
  error: { 
    marginLeft: 8,
    flex: 1,
    fontSize: Typography.sizes.caption,
    fontWeight: Typography.weights.medium,
  },
  button: { 
    padding: 14, 
    borderRadius: 8, 
    alignItems: 'center', 
    marginTop: 12,
  },
  primaryButton: {
    marginTop: 20,
  },
  buttonText: { 
    color: 'white', 
    fontWeight: Typography.weights.medium,
    fontSize: Typography.sizes.small,
  },
  buttonDisabled: { 
    opacity: 0.6 
  },
  linkButton: { 
    marginTop: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  link: { 
    fontWeight: Typography.weights.medium,
    fontSize: Typography.sizes.caption,
  },
  secondaryLink: { 
    fontSize: Typography.sizes.caption,
  },
  divider: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginVertical: 24 
  },
  dividerLine: { 
    flex: 1, 
    height: 1,
  },
  dividerText: { 
    fontSize: Typography.sizes.caption, 
    marginHorizontal: 16, 
    fontWeight: Typography.weights.medium,
  },
  googleButton: { 
    borderWidth: 1,
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  anonymousButton: { 
    borderWidth: 1,
  },
  anonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  anonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  switchModeContainer: {
    marginTop: 24,
    marginBottom: 32,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchModeText: {
    fontSize: Typography.sizes.caption,
  },
  switchModeLink: {
    fontWeight: Typography.weights.bold,
    fontSize: Typography.sizes.caption,
  },
});

export default AuthScreen;
