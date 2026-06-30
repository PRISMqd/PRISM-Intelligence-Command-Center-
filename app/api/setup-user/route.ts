import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

const SECRET = 'prism-setup-2026-icc'

async function createUser(email: string, password: string) {
  const supabase = createServiceClient()
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error) return { error: error.message }
  return { user_id: data.user?.id, email: data.user?.email }
}

// GET ?secret=...&email=...&password=... for tooling that only supports GET
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  if (searchParams.get('secret') !== SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const email = searchParams.get('email')
  const password = searchParams.get('password')
  if (!email || !password) {
    return NextResponse.json({ error: 'email and password required' }, { status: 400 })
  }
  const result = await createUser(email, password)
  return NextResponse.json(result, { status: 'error' in result ? 400 : 200 })
}

export async function POST(request: Request) {
  const secret = request.headers.get('x-setup-secret')
  if (secret !== SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { email, password } = await request.json()
  if (!email || !password) {
    return NextResponse.json({ error: 'email and password required' }, { status: 400 })
  }
  const result = await createUser(email, password)
  return NextResponse.json(result, { status: 'error' in result ? 400 : 200 })
}
