import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from './database.types'

// Hardcoded so server works even if NEXT_PUBLIC_SUPABASE_URL env var is missing
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rmbjqyidvuvnnzirglpj.supabase.co'

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  // Fall back to service role key if anon key not set
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createServerClient<Database>(
    SUPABASE_URL,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}

export function createServiceClient() {
  return createSupabaseClient<Database>(
    SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
