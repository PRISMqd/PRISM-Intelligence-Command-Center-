import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

// Temporary one-time setup endpoint — will be removed after use
export async function POST(request: Request) {
  const secret = request.headers.get('x-setup-secret')
  if (secret !== 'prism-setup-2026-icc') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { email, password } = await request.json()
  if (!email || !password) {
    return NextResponse.json({ error: 'email and password required' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ user_id: data.user?.id, email: data.user?.email })
}
