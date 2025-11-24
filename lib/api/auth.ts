import { z } from 'zod';
import { supabase } from '@/lib/supabase';

// Input validation schemas
const emailSchema = z.string().email();
const passwordSchema = z.string().min(8, 'La contraseña debe tener al menos 8 caracteres');

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  username: z.string().min(3).max(32),
});

export async function signUp(input: z.infer<typeof signUpSchema>) {
  const parsed = signUpSchema.parse(input);
  const { email, password, username } = parsed;
  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
  if (authError) throw authError;
  const user = authData.user;
  if (!user) throw new Error('Error creando usuario');
  // Insert profile row (RLS ensures user can only write own row)
  const { error: profileError } = await supabase.from('users').upsert({
    id: user.id,
    email,
    username,
    total_xp: 0,
    level: 0,
    role: 'learner',
  });
  if (profileError) throw profileError;
  return user;
}

export const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export async function signIn(input: z.infer<typeof signInSchema>) {
  const parsed = signInSchema.parse(input);
  const { data, error } = await supabase.auth.signInWithPassword(parsed);
  if (error) throw error;
  return data.session;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function resetPasswordForEmail(email: string) {
  const parsed = emailSchema.parse(email);
  const { data, error } = await supabase.auth.resetPasswordForEmail(parsed, {
    redirectTo: 'https://example.com/password-reset-complete',
  });
  if (error) throw error;
  return data;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}
