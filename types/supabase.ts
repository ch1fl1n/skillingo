import { Database } from './database.types'

/**
 * Helper types for working with Supabase
 * These types make it easier to work with tables, joins, and queries
 */

// Shorthand for accessing table types
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

// Shorthand for accessing enum types
export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T]

// Helper type for database responses
export type DbResult<T> = T extends PromiseLike<infer U> ? U : never
export type DbResultOk<T> = T extends PromiseLike<{ data: infer U }> ? Exclude<U, null> : never
export type DbResultErr = { error: Error }
