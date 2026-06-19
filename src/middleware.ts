import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('next-auth.session-token')?.value || 
                request.cookies.get('__Secure-next-auth.session-token')?.value;
  
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const pathname = request.nextUrl.pathname;
  if (pathname !== '/companies' && pathname !== '/onboarding' && pathname !== '/api/cron/backup') {
    const companyId = request.cookies.get('companyId')?.value;
    if (!companyId) {
      return NextResponse.redirect(new URL('/companies', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Protect everything except /login and /api/auth
    "/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)",
  ]
};
