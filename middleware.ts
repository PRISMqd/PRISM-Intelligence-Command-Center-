import { NextResponse, type NextRequest } from 'next/server'

// Auth is enforced in app/(dashboard)/layout.tsx via createServerSupabaseClient.
// Middleware only handles the simple cookie-presence redirect to avoid a flash.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Let auth callback, login, and API routes through unconditionally
  if (pathname.startsWith('/login') || pathname.startsWith('/auth') || pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Check for any Supabase session cookie (sb-*-auth-token)
  const hasSession = request.cookies.getAll().some((c) => c.name.includes('-auth-token'))

  if (!hasSession) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
