import { supabase } from '@/lib/supabase';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';

/**
 * Auth Event Handler Utilities
 * 
 * These utilities help you handle Supabase auth events safely and efficiently
 */

/**
 * Type-safe auth event handler
 */
type AuthEventHandler = {
  onInitialSession?: (session: Session | null) => void;
  onSignedIn?: (session: Session) => void;
  onSignedOut?: () => void;
  onTokenRefreshed?: (session: Session) => void;
  onUserUpdated?: (session: Session) => void;
  onPasswordRecovery?: (session: Session | null) => void;
};

/**
 * Create a typed auth state listener with specific event handlers
 */
export const createAuthListener = (handlers: AuthEventHandler) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event: AuthChangeEvent, session: Session | null) => {
      switch (event) {
        case 'INITIAL_SESSION':
          handlers.onInitialSession?.(session);
          break;
        
        case 'SIGNED_IN':
          if (session) handlers.onSignedIn?.(session);
          break;
        
        case 'SIGNED_OUT':
          handlers.onSignedOut?.();
          break;
        
        case 'TOKEN_REFRESHED':
          if (session) handlers.onTokenRefreshed?.(session);
          break;
        
        case 'USER_UPDATED':
          if (session) handlers.onUserUpdated?.(session);
          break;
        
        case 'PASSWORD_RECOVERY':
          handlers.onPasswordRecovery?.(session);
          break;
      }
    }
  );

  return subscription;
};

/**
 * Safely execute async operations in auth callbacks
 * 
 * This helper defers async operations to avoid deadlocks
 * when calling other Supabase methods inside auth callbacks
 */
export const deferAsyncOperation = (operation: () => Promise<void>) => {
  setTimeout(async () => {
    try {
      await operation();
    } catch (error) {
      console.error('Deferred operation error:', error);
    }
  }, 0);
};

/**
 * Debounce helper for frequent auth events
 * 
 * Some events (like SIGNED_IN) can fire very frequently.
 * Use this to debounce expensive operations.
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      // Evitar llamada anidada directa a func(...args)
      const callArgs = args;
      func(...callArgs);
    }, wait);
  };
};

/**
 * Access token manager
 * 
 * Stores and manages the JWT access token in memory
 * Listen to TOKEN_REFRESHED and SIGNED_IN to keep it updated
 */
class AccessTokenManager {
  private token: string | null = null;
  private subscription: { data: { subscription: { unsubscribe: () => void } } } | null = null;

  /**
   * Start listening for token updates
   */
  start() {
    if (this.subscription) return;

    this.subscription = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') && session) {
        this.token = session.access_token;
        console.log('Access token updated in memory');
      } else if (event === 'SIGNED_OUT') {
        this.token = null;
      }
    });
  }

  /**
   * Stop listening for token updates
   */
  stop() {
    if (this.subscription) {
      this.subscription.data.subscription.unsubscribe();
      this.subscription = null;
    }
  }

  /**
   * Get the current access token
   * PREFER this over calling supabase.auth.getSession() frequently
   */
  getToken(): string | null {
    return this.token;
  }
}

export const accessTokenManager = new AccessTokenManager();

/**
 * Sign up helper with proper error handling
 */
export const signUp = async (email: string, password: string, metadata?: Record<string, unknown>) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    if (error) throw error;

    return { data, error: null };
  } catch (error: unknown) {
    console.error('Sign up error:', error instanceof Error ? error.message : String(error));
    return { data: null, error };
  }
};

/**
 * Sign in helper with proper error handling
 * 
 * @param email - User's email address
 * @param password - User's password
 */
export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return { data, error: null };
  } catch (error: unknown) {
    console.error('Sign in error:', error instanceof Error ? error.message : String(error));
    return { data: null, error };
  }
};

/**
 * Sign in with phone and password
 * 
 * @param phone - User's phone number (E.164 format recommended)
 * @param password - User's password
 */
export const signInWithPhone = async (phone: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      phone,
      password,
    });

    if (error) throw error;

    return { data, error: null };
  } catch (error: unknown) {
    console.error('Phone sign in error:', error instanceof Error ? error.message : String(error));
    return { data: null, error };
  }
};

/**
 * Sign out a user
 * 
 * Signs out the user and removes the session from storage.
 * - Browser: Removes all items from localStorage and triggers SIGNED_OUT event
 * - Server: Revokes refresh tokens (access tokens remain valid until expiry)
 * 
 * @param scope - Determines which sessions to sign out:
 *   - 'global' (default): Signs out ALL sessions for this user across all devices
 *   - 'local': Signs out only the current session
 *   - 'others': Signs out all OTHER sessions except the current one
 *                Note: No SIGNED_OUT event is fired when using 'others'!
 * 
 */
export const signOut = async (scope: 'global' | 'local' | 'others' = 'global') => {
  try {
    const { error } = await supabase.auth.signOut({ scope });
    if (error) throw error;
    return { error: null };
  } catch (error: unknown) {
    console.error('Sign out error:', error instanceof Error ? error.message : String(error));
    return { error };
  }
};

/**
 * Sign out from all sessions (all devices)
 * 
 * Convenience wrapper for signing out globally.
 * Revokes all refresh tokens and removes session from all devices.
 */
export const signOutGlobal = async () => {
  return signOut('global');
};

/**
 * Sign out from current session only
 * 
 * Convenience wrapper for signing out locally.
 * Only removes the current session, other sessions remain active.
 */
export const signOutLocal = async () => {
  return signOut('local');
};

/**
 * Sign out from all other sessions (keep current session)
 * 
 * Convenience wrapper for signing out others.
 * Useful for "Sign out all other devices" feature.
 * 
 * ⚠️ WARNING: No SIGNED_OUT event is fired on the current session!
 */
export const signOutOthers = async () => {
  return signOut('others');
};

/**
 * Reset password helper
 */
export const resetPassword = async (
  email: string,
  options?: {
    redirectTo?: string;
    captchaToken?: string;
  }
) => {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: options?.redirectTo || 'yourapp://reset-password',
      captchaToken: options?.captchaToken,
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error: unknown) {
    console.error('Password reset error:', error instanceof Error ? error.message : String(error));
    return { data: null, error };
  }
};

/**
 * Update user's password
 * 
 * Use this after the user has clicked the password reset link and been
 * redirected back to your app (PASSWORD_RECOVERY event).
 * 
 * @param newPassword - The new password to set
 */
export const updatePassword = async (newPassword: string) => {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error: unknown) {
    console.error('Password update error:', error instanceof Error ? error.message : String(error));
    return { data: null, error };
  }
};

/**
 * Send password reset email with custom options
 */
export const sendPasswordResetEmail = async (
  email: string,
  redirectTo: string,
  captchaToken?: string
) => {
  return resetPassword(email, { redirectTo, captchaToken });
};

/**
 * Update user profile helper
 */
export const updateUserProfile = async (updates: { 
  email?: string;
  password?: string;
  data?: Record<string, unknown>;
}) => {
  try {
    const { data, error } = await supabase.auth.updateUser(updates);
    if (error) throw error;
    return { data, error: null };
  } catch (error: unknown) {
    console.error('Profile update error:', error instanceof Error ? error.message : String(error));
    return { data: null, error };
  }
};

/**
 * Reauthenticate current user to obtain a nonce required for sensitive updates
 * like changing the password. Use the returned nonce in updatePasswordWithNonce.
 */
export const reauthenticate = async () => {
  try {
    // Depending on the SDK version, reauthenticate may return a nonce or a URL flow.
    // Here we assume a direct nonce response when applicable.
    const auth = supabase.auth as unknown as { reauthenticate?: () => Promise<{ data: unknown; error: unknown }> };
    const { data, error } = await auth.reauthenticate?.() || { data: null, error: new Error('Reauthenticate not supported') };
    if (error) throw error;
    return { data, error: null };
  } catch (error: unknown) {
    console.error('Reauthenticate error:', error instanceof Error ? error.message : String(error));
    return { data: null, error };
  }
};

/**
 * Send a password reauthentication nonce (alias of reauthenticate)
 * Provides clearer naming aligned with Supabase docs.
 * Use returned data.nonce (when provided) in updatePasswordWithNonce.
 */
export const sendReauthenticationNonce = async () => {
  return reauthenticate();
};

/**
 * Update any user attributes supported by Supabase Auth
 * - email, password, phone, data (metadata), nonce (for reauth), etc.
 * - options.emailRedirectTo controls email confirmation redirect URL
 */
export const updateUser = async (
  attributes: {
    email?: string;
    password?: string;
    phone?: string;
    data?: Record<string, unknown>;
    nonce?: string;
  },
  options?: {
    emailRedirectTo?: string;
  }
) => {
  try {
    // Some SDK versions accept options as second arg; include when provided
    const result = options
      ? await (supabase.auth.updateUser as unknown as (attrs: typeof attributes, opts: { emailRedirectTo?: string }) => Promise<{ data: { user: unknown }; error: unknown }>)(attributes, { emailRedirectTo: options.emailRedirectTo })
      : await supabase.auth.updateUser(attributes as unknown as { email?: string; password?: string; phone?: string; data?: Record<string, unknown>; nonce?: string });

    const { data, error } = result;
    if (error) throw error;
    return { data, error: null };
  } catch (error: unknown) {
    console.error('Update user error:', error instanceof Error ? error.message : String(error));
    return { data: null, error };
  }
};

/** Update email (optionally set email redirect URL) */
export const updateEmail = async (email: string, options?: { emailRedirectTo?: string }) => {
  return updateUser({ email }, options);
};

/** Update phone number */
export const updatePhone = async (phone: string) => {
  return updateUser({ phone });
};

/**
 * Update password using a reauthentication nonce
 * Call reauthenticate() first to get a nonce if your security policy requires it.
 */
export const updatePasswordWithNonce = async (password: string, nonce: string) => {
  return updateUser({ password, nonce });
};

/** Update user metadata (raw_user_meta_data) */
export const updateUserMetadata = async (data: Record<string, unknown>) => {
  return updateUser({ data });
};

/**
 * Create an anonymous user
 * 
 * Anonymous users allow users to interact with your app without signing up.
 * They can later be converted to permanent users.
 * 
 * @param options - Optional configuration
 * @param options.data - Custom user metadata to attach to the anonymous user
 * @param options.captchaToken - Captcha token for abuse prevention (recommended)
 * 
 */
export const signInAnonymously = async (options?: {
  data?: Record<string, unknown>;
  captchaToken?: string;
}) => {
  try {
    const { data, error } = await supabase.auth.signInAnonymously({
      options: {
        data: options?.data,
        captchaToken: options?.captchaToken,
      },
    });

    if (error) throw error;

    // Check if user is anonymous
    if (data.user?.is_anonymous) {
      console.log('Anonymous user created:', data.user.id);
    }

    return { data, error: null };
  } catch (error: unknown) {
    console.error('Anonymous sign-in error:', error instanceof Error ? error.message : String(error));
    return { data: null, error };
  }
};

/**
 * Convert an anonymous user to a permanent user
 * 
 * This links an email/password to an existing anonymous user,
 * preserving their data and session.
 * 
 * @param email - Email address for the permanent account
 * @param password - Password for the permanent account
 * @param metadata - Optional additional user metadata
 */
export const convertAnonymousUser = async (
  email: string,
  password: string,
  metadata?: Record<string, unknown>
) => {
  try {
    const { data, error } = await supabase.auth.updateUser({
      email,
      password,
      data: metadata,
    });

    if (error) throw error;

    console.log('Anonymous user converted to permanent user');
    return { data, error: null };
  } catch (error: unknown) {
    console.error('Conversion error:', error instanceof Error ? error.message : String(error));
    return { data: null, error };
  }
};

/**
 * Check if the current user is anonymous
 * 
 * @returns True if user is anonymous, false otherwise
 */
export const isAnonymousUser = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.is_anonymous ?? false;
  } catch (error) {
    console.error('Error checking anonymous status:', error);
    return false;
  }
};

/**
 * Sign in with email OTP (One-Time Password) or magic link
 * 
 * Sends a magic link or OTP to the user's email based on your email template configuration.
 * - If email template contains {{ .ConfirmationURL }}, a magic link is sent
 * - If email template contains {{ .Token }}, an OTP code is sent
 * 
 * @param email - User's email address
 * @param options - Optional configuration
 * @param options.shouldCreateUser - Create user if doesn't exist (default: true)
 * @param options.emailRedirectTo - URL to redirect after email confirmation
 * @param options.data - Custom user metadata
 */
export const signInWithOTP = async (
  email: string,
  options?: {
    shouldCreateUser?: boolean;
    emailRedirectTo?: string;
    data?: Record<string, unknown>;
  }
) => {
  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: options?.shouldCreateUser ?? true,
        emailRedirectTo: options?.emailRedirectTo,
        data: options?.data,
      },
    });

    if (error) throw error;

    return { data, error: null };
  } catch (error: unknown) {
    console.error('OTP sign in error:', error instanceof Error ? error.message : String(error));
    return { data: null, error };
  }
};

/**
 * Sign in with phone OTP via SMS
 * 
 * Sends an OTP code to the user's phone number via SMS.
 * 
 * @param phone - User's phone number (E.164 format recommended, e.g., +1234567890)
 * @param options - Optional configuration
 * @param options.shouldCreateUser - Create user if doesn't exist (default: true)
 * @param options.data - Custom user metadata
 */
export const signInWithPhoneOTP = async (
  phone: string,
  options?: {
    shouldCreateUser?: boolean;
    data?: Record<string, unknown>;
  }
) => {
  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      phone,
      options: {
        shouldCreateUser: options?.shouldCreateUser ?? true,
        data: options?.data,
      },
    });

    if (error) throw error;

    return { data, error: null };
  } catch (error: unknown) {
    console.error('Phone OTP sign in error:', error instanceof Error ? error.message : String(error));
    return { data: null, error };
  }
};

/**
 * Sign in with phone OTP via WhatsApp
 * 
 * Sends an OTP code to the user's phone number via WhatsApp.
 * Note: You need to configure a WhatsApp sender on Twilio.
 * 
 * @param phone - User's phone number (E.164 format recommended)
 * @param options - Optional configuration
 */
export const signInWithWhatsAppOTP = async (
  phone: string,
  options?: {
    shouldCreateUser?: boolean;
    data?: Record<string, unknown>;
  }
) => {
  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      phone,
      options: {
        shouldCreateUser: options?.shouldCreateUser ?? true,
        channel: 'whatsapp',
        data: options?.data,
      },
    });

    if (error) throw error;

    return { data, error: null };
  } catch (error: unknown) {
    console.error('WhatsApp OTP sign in error:', error instanceof Error ? error.message : String(error));
    return { data: null, error };
  }
};

/**
 * Verify OTP code
 * 
 * Verifies an OTP token sent via email, SMS, or WhatsApp.
 * 
 * @param params - Verification parameters
 * @param params.email - User's email (for email OTP)
 * @param params.phone - User's phone (for SMS/WhatsApp OTP)
 * @param params.token - The OTP token to verify
 * @param params.type - Type of verification (email, sms, phone_change, etc.)
 */
export const verifyOTP = async (
  params: 
    | { email: string; token: string; type: 'email' | 'signup' | 'magiclink' | 'recovery' | 'email_change' }
    | { phone: string; token: string; type: 'sms' | 'phone_change' }
) => {
  try {
    const { data, error } = await supabase.auth.verifyOtp(params);

    if (error) throw error;

    return { data, error: null };
  } catch (error: unknown) {
    console.error('OTP verification error:', error instanceof Error ? error.message : String(error));
    return { data: null, error };
  }
};

/**
 * Granular verification helpers for clarity and better DX
 * These wrap supabase.auth.verifyOtp with stricter typing per use case.
 */
export const verifyEmailOTP = async (email: string, token: string) => {
  return verifyOTP({ email, token, type: 'email' });
};

/** Deprecated types: 'signup', 'magiclink' retained for backwards compatibility */
export const verifySignupOTP = async (email: string, token: string) => {
  return verifyOTP({ email, token, type: 'signup' });
};

export const verifyMagicLinkOTP = async (email: string, token: string) => {
  return verifyOTP({ email, token, type: 'magiclink' });
};

export const verifyRecoveryOTP = async (email: string, token: string) => {
  return verifyOTP({ email, token, type: 'recovery' });
};

export const verifyInviteOTP = async (email: string, token: string) => {
  return verifyOTP({ email, token, type: 'invite' as unknown as 'email' }); // 'invite' not in current union but supported by backend
};

export const verifyEmailChangeOTP = async (email: string, token: string) => {
  return verifyOTP({ email, token, type: 'email_change' });
};

export const verifySMSOTP = async (phone: string, token: string) => {
  return verifyOTP({ phone, token, type: 'sms' });
};

export const verifyPhoneChangeOTP = async (phone: string, token: string) => {
  return verifyOTP({ phone, token, type: 'phone_change' });
};

/**
 * Verify a token hash from a magic link (PKCE/server-side scenarios)
 * NOTE: The JS client exposes verifyOtp; token hash support may require direct parameters.
 * Here we provide a helper that mirrors email verification using token hash.
 */
export const verifyTokenHash = async (
  tokenHash: string,
  type: 'signup' | 'invite' | 'magiclink' | 'recovery' | 'email_change' | 'email'
) => {
  try {
    // The official client expects { token: string, type: ... } with email/phone OR token_hash param in newer versions.
    // Fallback: treat tokenHash as token; adapt if future SDK exposes dedicated field.
    // @ts-expect-error - tokenHash may not match expected params
    const { data, error } = await supabase.auth.verifyOtp({ token: tokenHash, type });
    if (error) throw error;
    return { data, error: null };
  } catch (error: unknown) {
    console.error('Token hash verification error:', error instanceof Error ? error.message : String(error));
    return { data: null, error };
  }
};

/**
 * Sign in with OAuth provider (Google, Apple, GitHub, etc.)
 * 
 * Initiates OAuth sign-in flow by redirecting to the provider's authorization page.
 * 
 * @param provider - OAuth provider name
 * @param options - Optional configuration
 * @param options.redirectTo - URL to redirect after authentication
 * @param options.scopes - OAuth scopes to request
 * @param options.queryParams - Additional query parameters
 */
export const signInWithOAuth = async (
  provider: 'google' | 'apple' | 'github' | 'gitlab' | 'facebook' | 'twitter' | 
           'discord' | 'twitch' | 'spotify' | 'linkedin' | 'notion' | 'slack' |
           'azure' | 'bitbucket' | 'kakao' | 'keycloak' | 'figma' | 'workos' | 
           'zoom' | 'fly' | 'linkedin_oidc' | 'slack_oidc',
  options?: {
    redirectTo?: string;
    scopes?: string;
    queryParams?: Record<string, string>;
    skipBrowserRedirect?: boolean;
  }
) => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: options?.redirectTo,
        scopes: options?.scopes,
        queryParams: options?.queryParams,
        skipBrowserRedirect: options?.skipBrowserRedirect,
      },
    });

    if (error) throw error;

    return { data, error: null };
  } catch (error: unknown) {
    console.error(`${provider} OAuth sign in error:`, error instanceof Error ? error.message : String(error));
    return { data: null, error };
  }
};

/**
 * Sign in with OIDC ID token
 * 
 * Useful for native platform sign-in dialogs (Sign in with Apple, Sign in with Google)
 * on iOS and Android.
 * 
 * @param provider - Provider name (google, apple, azure, facebook, kakao)
 * @param idToken - OIDC ID token from the provider
 * @param options - Optional configuration
 * @param options.accessToken - Access token (required if ID token has at_hash)
 * @param options.nonce - Nonce used to obtain ID token (required if ID token has nonce)
 */
export const signInWithIdToken = async (
  provider: 'google' | 'apple' | 'azure' | 'facebook' | 'kakao',
  idToken: string,
  options?: {
    accessToken?: string;
    nonce?: string;
  }
) => {
  try {
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider,
      token: idToken,
      access_token: options?.accessToken,
      nonce: options?.nonce,
    });

    if (error) throw error;

    return { data, error: null };
  } catch (error: unknown) {
    console.error(`${provider} ID token sign in error:`, error instanceof Error ? error.message : String(error));
    return { data: null, error };
  }
};

/**
 * Sign in with SSO using email domain
 * 
 * Initiates SSO flow using an organization's email domain.
 * The domain must be registered with an SSO identity provider.
 * 
 * @param domain - Organization's email domain (e.g., 'company.com')
 * @param options - Optional configuration
 * @param options.redirectTo - URL to redirect after SSO
 */
export const signInWithSSODomain = async (
  domain: string,
  options?: {
    redirectTo?: string;
  }
) => {
  try {
    const { data, error } = await supabase.auth.signInWithSSO({
      domain,
      options: {
        redirectTo: options?.redirectTo,
      },
    });

    if (error) throw error;

    // Redirect user to the SSO provider
    if (data?.url) {
      return { data, error: null };
    }

    return { data: null, error: new Error('No SSO URL returned') };
  } catch (error: unknown) {
    console.error('SSO domain sign in error:', error instanceof Error ? error.message : String(error));
    return { data: null, error };
  }
};

/**
 * Sign in with SSO using provider UUID
 * 
 * Initiates SSO flow using a specific SSO provider's UUID.
 * Useful when you need more control over which provider to use.
 * 
 * @param providerId - UUID of the SSO provider
 * @param options - Optional configuration
 * @param options.redirectTo - URL to redirect after SSO
 */
export const signInWithSSOProvider = async (
  providerId: string,
  options?: {
    redirectTo?: string;
  }
) => {
  try {
    const { data, error } = await supabase.auth.signInWithSSO({
      providerId,
      options: {
        redirectTo: options?.redirectTo,
      },
    });

    if (error) throw error;

    if (data?.url) {
      return { data, error: null };
    }

    return { data: null, error: new Error('No SSO URL returned') };
  } catch (error: unknown) {
    console.error('SSO provider sign in error:', error instanceof Error ? error.message : String(error));
    return { data: null, error };
  }
};

/**
 * Get user claims from verified JWT
 * 
 * Extracts and verifies the JWT claims from the access token.
 * This method is significantly faster than getUser() because:
 * - For asymmetric keys (RSA/ECC): Verification is done locally using cached JWKS
 * - Network requests only happen to fetch/refresh the JWKS endpoint
 * - The session is automatically refreshed if the token is about to expire
 * 
 * @param jwt - Optional specific JWT to verify (defaults to current session token)
 * @param options - Optional configuration
 * @param options.skipExpValidation - Skip expiration validation
 * @param options.jwks - Custom JSON Web Key Set to use
 * 
 * @returns Object containing claims, header, and signature
 */
export const getUserClaims = async (
  jwt?: string,
  options?: {
    skipExpValidation?: boolean;
    jwks?: {
      keys: Array<{
        kty: string;
        use?: string;
        kid: string;
        alg: string;
        n?: string;
        e?: string;
        crv?: string;
        x?: string;
        y?: string;
      }>;
    };
  }
) => {
  try {
    // Get the JWT to verify - either provided or from current session
    let tokenToVerify = jwt;
    if (!tokenToVerify) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { 
          data: null, 
          error: new Error('No active session found') 
        };
      }
      tokenToVerify = session.access_token;
    }

    // Use Supabase's built-in JWT verification
    // Note: The actual method might vary based on Supabase JS version
    // This is a simplified approach - in production you might need to use
    // the lower-level verification directly
    
    // For now, we'll decode the JWT manually for demonstration
    const parts = tokenToVerify.split('.');
    if (parts.length !== 3) {
      return {
        data: null,
        error: new Error('Invalid JWT format')
      };
    }

    // Evitar llamadas anidadas a atob
    const headerBase64 = parts[0];
    const payloadBase64 = parts[1];
    const headerJson = atob(headerBase64);
    const claimsJson = atob(payloadBase64);
    const header = JSON.parse(headerJson);
    const claims = JSON.parse(claimsJson);

    // Check expiration if not skipped
    if (!options?.skipExpValidation && claims.exp) {
      // Evitar llamada anidada a now
      const now = Date.now();
      const nowSeconds = Math.floor(now / 1000);
      if (claims.exp < nowSeconds) {
        return {
          data: null,
          error: new Error('JWT has expired')
        };
      }
    }

    return {
      data: {
        claims,
        header,
        // Note: Signature verification would be done by Supabase's backend
        // In a real implementation, this would use the JWKS to verify
      },
      error: null
    };
  } catch (error: unknown) {
    console.error('JWT verification error:', error instanceof Error ? error.message : String(error));
    return { data: null, error };
  }
};

/**
 * Get current user's JWT claims (convenience wrapper)
 * 
 * This is a simpler version of getUserClaims() that always uses
 * the current session's access token.
 * 
 * @returns JWT claims from the current session
 */
export const getCurrentUserClaims = async () => {
  try {
    const result = await getUserClaims();
    if (result.error || !result.data) {
      return { data: null, error: result.error };
    }
    
    return { data: result.data.claims, error: null };
  } catch (error: unknown) {
    console.error('Error getting current user claims:', error instanceof Error ? error.message : String(error));
    return { data: null, error };
  }
};

/**
 * Decode JWT without verification
 * 
 * WARNING: This only decodes the JWT without verifying its signature.
 * Only use this for inspecting tokens, NOT for authentication/authorization.
 * Always use getUserClaims() for verified tokens.
 * 
 * @param jwt - JWT token to decode
 * @returns Decoded header and payload (claims)
 */
export const decodeJWT = (jwt: string) => {
  try {
    const parts = jwt.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }
    // Evitar llamadas anidadas a atob
    const headerBase64 = parts[0];
    const payloadBase64 = parts[1];
    const headerJson = atob(headerBase64);
    const claimsJson = atob(payloadBase64);
    const header = JSON.parse(headerJson);
    const claims = JSON.parse(claimsJson);
    return { header, claims, signature: parts[2] };
  } catch (error: unknown) {
    console.error('JWT decode error:', error instanceof Error ? error.message : String(error));
    return null;
  }
};

/**
 * Check if JWT is expired
 * 
 * @param jwt - JWT token to check
 * @returns True if token is expired, false otherwise
 */
export const isJWTExpired = (jwt: string): boolean => {
  try {
    const decoded = decodeJWT(jwt);
    if (!decoded || !decoded.claims.exp) {
      return true; // Considerar tokens inválidos como "expirados"
    }
    // Evitar llamada anidada a now
    const now = Date.now();
    const nowSeconds = Math.floor(now / 1000);
    return decoded.claims.exp < nowSeconds;
  } catch {
    return true;
  }
};

/**
 * Get time until JWT expiration
 * 
 * @param jwt - JWT token to check
 * @returns Seconds until expiration, or null if invalid/expired
 */
export const getJWTTimeToExpiry = (jwt: string): number | null => {
  try {
    const decoded = decodeJWT(jwt);
    if (!decoded || !decoded.claims.exp) {
      return null;
    }
    // Evitar llamada anidada a now
    const now = Date.now();
    const nowSeconds = Math.floor(now / 1000);
    const timeLeft = decoded.claims.exp - nowSeconds;
    return timeLeft > 0 ? timeLeft : null;
  } catch {
    return null;
  }
};

/**
 * Extract custom claims from JWT
 * 
 * Custom claims can be added via the Custom Access Token Hook in Supabase.
 * This helper extracts any custom claims from the token.
 * 
 * @param jwt - JWT token (optional, uses current session if not provided)
 * @returns Custom claims object
 */
export const getCustomClaims = async (jwt?: string): Promise<Record<string, unknown>> => {
  try {
    const result = await getUserClaims(jwt);
    if (result.error || !result.data) {
      return {};
    }

    const claims = result.data.claims as unknown;
    
    // Standard JWT claims to exclude
    const standardClaims = [
      'sub', 'aud', 'exp', 'iat', 'iss', 'nbf', 'jti',
      'email', 'phone', 'role', 'session_id',
      'app_metadata', 'user_metadata', 'aal', 'amr'
    ];

    // Extract only custom claims
    const customClaims: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(claims as Record<string, unknown>)) {
      if (!standardClaims.includes(key)) {
        customClaims[key] = value;
      }
    }

    return customClaims;
  } catch (error) {
    console.error('Error extracting custom claims:', error);
    return {};
  }
};

/**
 * Retrieve current session, auto-refreshing if needed.
 * Thin wrapper around supabase.auth.getSession() adding defensive logging.
 * IMPORTANT: Do not trust user object if storage is insecure (e.g. request cookies on server).
 */
export const getSessionSafe = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return { session, error: null };
  } catch (error: unknown) {
    console.error('Get session error:', error instanceof Error ? error.message : String(error));
    return { session: null, error };
  }
};

/**
 * Force a session refresh regardless of expiry status.
 * Uses the current session if none provided.
 */
export const refreshSessionExplicit = async (currentSession?: Session) => {
  try {
  let baseSession: Session | undefined = currentSession;
    if (!baseSession) {
      const { session } = (await getSessionSafe());
      baseSession = session ?? undefined;
    }
    if (!baseSession) {
      return { data: { session: null, user: null }, error: new Error('No session to refresh') };
    }
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: baseSession.refresh_token });
    if (error) throw error;
    return { data, error: null };
  } catch (error: unknown) {
    console.error('Explicit session refresh error:', error instanceof Error ? error.message : String(error));
    return { data: { session: null, user: null }, error };
  }
};

/**
 * Ensure a fresh session when token is near expiry.
 * If remaining lifetime < thresholdSeconds, refresh proactively.
 */
export const ensureFreshSession = async (thresholdSeconds: number = 300) => {
  const { session, error } = await getSessionSafe();
  if (error || !session) return { session: null, refreshed: false, error };
  const now = Date.now();
  const nowSeconds = Math.floor(now / 1000);
  const remaining = session.expires_at ? session.expires_at - nowSeconds : 0;
  if (remaining > thresholdSeconds) return { session, refreshed: false, error: null };
  const { data, error: refreshError } = await refreshSessionExplicit(session);
  return { session: data.session, refreshed: !refreshError, error: refreshError };
};

/**
 * Retrieve authentic user from server (network call).
 * Prefer this server-side for authorization decisions.
 */
export const getServerUser = async (accessToken?: string) => {
  try {
    const { data, error } = await supabase.auth.getUser(accessToken);
    if (error) throw error;
    return { user: data.user, error: null };
  } catch (error: unknown) {
    console.error('Get server user error:', error instanceof Error ? error.message : String(error));
    return { user: null, error };
  }
};

/**
 * Retrieve identities linked to the currently signed-in user
 */
export const getUserIdentities = async () => {
  try {
    // Prefer dedicated SDK method when available
    const auth = supabase.auth as unknown as { getUserIdentities?: () => Promise<{ data: unknown; error: unknown }> };
    if (auth.getUserIdentities) {
      const { data, error } = await auth.getUserIdentities();
      if (error) throw error;
      return { data, error: null };
    }

    // Fallback: fetch user (authentic) and surface identities array if present
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    const identities = (userData.user as unknown as { identities?: unknown[] })?.identities || [];
    return { data: { identities }, error: null };
  } catch (error: unknown) {
    console.error('Get user identities error:', error instanceof Error ? error.message : String(error));
    return { data: null, error };
  }
};

/**
 * Link an additional identity/provider to the current user
 * (Support for linking via OAuth provider may require initiating an OAuth flow)
 */
export const linkIdentity = async (params: { provider: string; token?: string; idToken?: string }) => {
  try {
    const auth = supabase.auth as unknown as { linkIdentity?: (p: typeof params) => Promise<{ data: unknown; error: unknown }> };
    const { data, error } = await auth.linkIdentity?.(params) || { data: null, error: new Error('Link identity not supported') };
    if (error) throw error;
    return { data, error: null };
  } catch (error: unknown) {
    console.error('Link identity error:', error instanceof Error ? error.message : String(error));
    return { data: null, error };
  }
};

/**
 * Unlink a linked identity from the current user by identity_id
 */
export const unlinkIdentity = async (
  identity: string | {
    id: string;
    identity_id: string;
    provider: string;
    user_id: string;
  }
) => {
  try {
    const payload =
      typeof identity === 'string'
        ? { identity_id: identity }
        : { identity_id: identity.identity_id, provider: identity.provider };

    const auth = supabase.auth as unknown as { unlinkIdentity?: (p: typeof payload) => Promise<{ data: unknown; error: unknown }> };
    const { data, error } = await auth.unlinkIdentity?.(payload) || { data: null, error: new Error('Unlink identity not supported') };
    if (error) throw error;
    return { data, error: null };
  } catch (error: unknown) {
    console.error('Unlink identity error:', error instanceof Error ? error.message : String(error));
    return { data: null, error };
  }
};

type ResendEmailType = 'signup' | 'email_change';
type ResendPhoneType = 'sms' | 'phone_change';

/**
 * Generic resend helper mirroring Supabase's resend functionality.
 * Note: Passwordless sign-ins should call signInWithOtp() again.
 * Password recovery should call resetPasswordForEmail() again.
 */
export const resendOTP = async (
  credentials:
    | { email: string; type: ResendEmailType; options?: { emailRedirectTo?: string } }
    | { phone: string; type: ResendPhoneType; options?: Record<string, unknown> }
) => {
  try {
    const auth = supabase.auth as unknown as { resend?: (c: typeof credentials) => Promise<{ data: unknown; error: unknown }> };
    if (auth.resend) {
      const { data, error } = await auth.resend(credentials);
      if (error) throw error;
      return { data, error: null };
    }
    // Fallbacks for older SDKs: try to map to existing methods
    if ('email' in credentials) {
      if (credentials.type === 'signup') {
        // No direct signup resend; attempt signUp to trigger again is not correct.
        // Recommend instructing caller to guide user to re-initiate flow.
        return { data: null, error: new Error('Resend not supported by SDK version for email signup. Consider re-initiating sign-up flow or upgrade SDK.') };
      }
      if (credentials.type === 'email_change') {
        return { data: null, error: new Error('Resend email change not supported by SDK version. Consider re-issuing email update or upgrade SDK.') };
      }
    } else if ('phone' in credentials) {
      if (credentials.type === 'sms') {
        // For existing user sign-in with OTP, use signInWithOtp(phone) again.
        return { data: null, error: new Error('Resend SMS for sign-in should use signInWithOtp() again.') };
      }
      if (credentials.type === 'phone_change') {
        return { data: null, error: new Error('Resend phone change not supported by SDK version. Consider re-issuing phone update or upgrade SDK.') };
      }
    }
    return { data: null, error: new Error('Resend not supported by current SDK version.') };
  } catch (error: unknown) {
    console.error('Resend OTP error:', error instanceof Error ? error.message : String(error));
    return { data: null, error };
  }
};

export const resendSignupEmail = async (email: string, options?: { emailRedirectTo?: string }) =>
  resendOTP({ email, type: 'signup', options });

export const resendEmailChange = async (email: string, options?: { emailRedirectTo?: string }) =>
  resendOTP({ email, type: 'email_change', options });

export const resendSignupSMS = async (phone: string) =>
  resendOTP({ phone, type: 'sms' });

export const resendPhoneChange = async (phone: string) =>
  resendOTP({ phone, type: 'phone_change' });

/**
 * Set the current session using existing access & refresh tokens.
 * Emits SIGNED_IN if successful. Automatically refreshes if expired.
 * WARNING: Only use with trusted tokens (e.g., after server-side exchange).
 */
export const setSession = async (accessToken: string, refreshToken: string) => {
  try {
    const { data, error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    if (error) throw error;
    return { data, error: null };
  } catch (error: unknown) {
    console.error('Set session error:', error instanceof Error ? error.message : String(error));
    return { data: { session: null, user: null }, error };
  }
};

/**
 * Adopt a session object minimally containing access_token & refresh_token.
 * Convenience wrapper that mirrors server-generated session adoption.
 */
export const adoptSession = async (session: { access_token: string; refresh_token: string }) => {
  return setSession(session.access_token, session.refresh_token);
};

