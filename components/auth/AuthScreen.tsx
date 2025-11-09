import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { signUp, signIn, signOut, resetPassword, signInAnonymously } from '@/lib/auth-helpers';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Complete Auth Flow Screen
 * 
 * This component demonstrates a complete authentication flow including:
 * - Sign up
 * - Sign in
 * - Sign out
 * - Anonymous sign-in
 * - Password recovery
 * - Using auth context
 */
export const AuthScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const { user, loading: authLoading } = useAuth();

  const handleSignUp = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    const { data, error } = await signUp(email, password, {
      full_name: fullName,
    });

    setLoading(false);

    if (error) {
      Alert.alert('Sign Up Error', error.message);
    } else if (data && data.user && !data.session) {
      Alert.alert(
        'Success',
        'Please check your email to confirm your account before signing in.'
      );
    } else if (data && data.user && data.session) {
      Alert.alert('Success', 'Account created successfully!');
    }
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    const { data, error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      Alert.alert('Sign In Error', error.message);
    } else {
      Alert.alert('Success', 'Signed in successfully!');
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    const { error } = await signOut();
    setLoading(false);

    if (error) {
      Alert.alert('Sign Out Error', error.message);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Password reset email sent! Check your inbox.');
    }
  };

  const handleAnonymousSignIn = async () => {
    setLoading(true);
    const { data, error } = await signInAnonymously({
      data: {
        source: 'auth_screen',
        created_at: new Date().toISOString(),
      },
    });
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert(
        'Anonymous Session',
        'You can now use the app! Create an account later to save your progress.'
      );
    }
  };

  if (authLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (user) {
    // User is authenticated
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Welcome!</Text>
        <Text style={styles.email}>{user.email}</Text>
        
        <View style={styles.userInfo}>
          <Text>User ID: {user.id}</Text>
          <Text>Created: {new Date(user.created_at).toLocaleDateString()}</Text>
          {user.last_sign_in_at && (
            <Text>
              Last Sign In: {new Date(user.last_sign_in_at).toLocaleString()}
            </Text>
          )}
        </View>

        <Button
          title="Sign Out"
          onPress={handleSignOut}
          disabled={loading}
        />
      </View>
    );
  }

  // User is not authenticated
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {isSignUp ? 'Create Account' : 'Sign In'}
      </Text>

      {isSignUp && (
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={fullName}
          onChangeText={setFullName}
          autoCapitalize="words"
        />
      )}

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
      />

      <View style={styles.buttonContainer}>
        <Button
          title={isSignUp ? 'Sign Up' : 'Sign In'}
          onPress={isSignUp ? handleSignUp : handleSignIn}
          disabled={loading}
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title={isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
          onPress={() => setIsSignUp(!isSignUp)}
          disabled={loading}
        />
      </View>

      {!isSignUp && (
        <View style={styles.buttonContainer}>
          <Button
            title="Forgot Password?"
            onPress={handlePasswordReset}
            disabled={loading}
            color="#888"
          />
        </View>
      )}

      <View style={styles.divider}>
        <Text style={styles.dividerText}>or</Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="🕶️ Continue Anonymously"
          onPress={handleAnonymousSignIn}
          disabled={loading}
          color="#666"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  buttonContainer: {
    marginVertical: 5,
  },
  email: {
    fontSize: 18,
    marginBottom: 10,
    textAlign: 'center',
  },
  userInfo: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginVertical: 20,
  },
  divider: {
    marginVertical: 15,
    alignItems: 'center',
  },
  dividerText: {
    color: '#999',
    fontSize: 14,
  },
});
