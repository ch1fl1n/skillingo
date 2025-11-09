import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

/**
 * Supabase client with TypeScript support
 * 
 * Replace SUPABASE_URL and SUPABASE_ANON_KEY with your actual values
 * You can find these in your Supabase project settings:
 * Project Settings > API
 */

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a typed Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Configure auth options here if needed
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

