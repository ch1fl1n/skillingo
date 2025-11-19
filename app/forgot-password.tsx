import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { resetPassword } from '@/lib/auth-helpers';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

interface AuthError {
  message?: string;
}

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const validateEmail = (email: string) => {
    return email.includes('@');
  };

  const handleResetPassword = async () => {
    setError('');
    setSuccess(false);

    // Validation
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const { error: resetError } = await resetPassword(email.trim());
      
      if (resetError) {
        setError((resetError as AuthError)?.message || 'Failed to reset password');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  // Guard: if this screen loads without the expected navigation param and user isn't in recovery flow, send to login
  useEffect(() => {
    // If Supabase triggers PASSWORD_RECOVERY we could add a different param later (e.g., recovery=true)
    // Example: if you require a `recovery` param to be present, redirect when it's missing.
    if (params && typeof (params as Record<string, unknown>).recovery === 'undefined') {
      // Uncomment the next line to force navigation back to login when recovery param is missing:
      // router.replace('/login');
    }
  }, [params, router]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => router.replace('/login')}
          style={styles.backButton}
          disabled={loading}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>

        {/* Logo/Icon Section */}
        <View style={styles.iconContainer}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primary?.['300'] || '#e3f2fd' }]}>
            <MaterialCommunityIcons
              name="lock-reset"
              size={48}
              color={colors.primary?.['500'] || '#3498db'}
            />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Reset Password</Text>
          <Text style={[styles.subtitle, { color: colors.neutral?.['500'] || '#666' }]}>
            {success
              ? 'Check your email for password reset instructions'
              : 'Enter your email address and we\'ll send you instructions to reset your password'}
          </Text>
        </View>

        {!success ? (
          <View style={styles.formContainer}>
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Email</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.surface?.default || '#f5f5f5' }]}>
                <MaterialCommunityIcons
                  name="email-outline"
                  size={20}
                  color={colors.neutral?.['500'] || '#666'}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="your@email.com"
                  placeholderTextColor={colors.neutral?.['300'] || '#999'}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  editable={!loading}
                  autoFocus
                />
              </View>
            </View>

            {/* Error Message */}
            {error ? (
              <View style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-circle" size={16} color="#e74c3c" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Reset Button */}
            <TouchableOpacity
              style={[
                styles.resetButton,
                { backgroundColor: colors.primary?.['500'] || '#3498db' },
                loading && styles.resetButtonDisabled,
              ]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.resetButtonText}>Send Reset Link</Text>
              )}
            </TouchableOpacity>

            {/* Back to Login Link */}
            <View style={styles.loginContainer}>
              <Text style={[styles.loginText, { color: colors.neutral?.['500'] || '#666' }]}>
                Remember your password?{' '}
              </Text>
              <TouchableOpacity
                onPress={() => router.replace('/login')}
                disabled={loading}
              >
                <Text style={[styles.loginLink, { color: colors.primary?.['500'] || '#3498db' }]}>
                  Log In
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.successContainer}>
            {/* Success Icon */}
            <View style={[styles.successIconCircle, { backgroundColor: '#d4edda' }]}>
              <MaterialCommunityIcons name="check-circle" size={64} color="#2ecc71" />
            </View>

            {/* Success Message */}
            <Text style={[styles.successTitle, { color: colors.text }]}>Email Sent!</Text>
            <Text style={[styles.successMessage, { color: colors.neutral?.['500'] || '#666' }]}>
              We've sent password reset instructions to {email}
            </Text>
            <Text style={[styles.successNote, { color: colors.neutral?.['500'] || '#999' }]}>
              Please check your inbox and spam folder
            </Text>

            {/* Action Buttons */}
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.primary?.['500'] || '#3498db' }]}
              onPress={() => router.replace('/login')}
            >
              <Text style={styles.primaryButtonText}>Back to Login</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                setSuccess(false);
                setEmail('');
              }}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.primary?.['500'] || '#3498db' }]}>
                Resend Email
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  resetButton: {
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resetButtonDisabled: {
    opacity: 0.6,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  successContainer: {
    alignItems: 'center',
    paddingTop: 20,
  },
  successIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  successNote: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
  },
  primaryButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    paddingVertical: 12,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
