import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rmbjqyidvuvnnzirglpj.supabase.co'
// Anon key is public by design; falls back to a placeholder so the client doesn't crash on init
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'missing-anon-key'

export function createClient() {
  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)
}
