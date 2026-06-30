import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SECRET = 'prism-setup-2026-icc'

// URL known from project config; only SUPABASE_SERVICE_ROLE_KEY needed at runtime
const SUPABASE_URL = 'https://rmbjqyidvuvnnzirglpj.supabase.co'

async function createUser(email: string, password: string) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) return { error: 'SUPABASE_SERVICE_ROLE_KEY not set' }
  const supabase = createClient(SUPABASE_URL, serviceKey)
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error) return { error: error.message }
  return { user_id: data.user?.id, email: data.user?.email }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  if (searchParams.get('secret') !== SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (searchParams.get('debug') === '1') {
    return NextResponse.json({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'MISSING',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'set' : 'MISSING',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'MISSING',
    })
  }

  const email = searchParams.get('email')
  const password = searchParams.get('password')
  if (!email || !password) {
    return NextResponse.json({ error: 'email and password required' }, { status: 400 })
  }
  const result = await createUser(email, password)
  return NextResponse.json(result, { status: 'error' in result ? 400 : 200 })
}
