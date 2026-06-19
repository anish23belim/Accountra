import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // BYPASS LOGIN SYSTEM AS REQUESTED BY USER
  // We will allow all requests to proceed.
  
  const pathname = request.nextUrl.pathname;
  if (pathname !== '/companies' && pathname !== '/onboarding' && pathname !== '/api/cron/backup' && !pathname.startsWith('/api/')) {
    const companyId = request.cookies.get('companyId')?.value;
    if (!companyId) {
      return NextResponse.redirect(new URL('/companies', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Protect everything except login, api, static files
    "/((?!login|api|_next/static|_next/image|favicon.ico).*)",
  ]
};
