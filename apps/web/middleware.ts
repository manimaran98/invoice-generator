import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ACCESS_TOKEN_COOKIE } from '@/lib/internal-api';

export function middleware(req: NextRequest) {
  if (!req.cookies.get(ACCESS_TOKEN_COOKIE)) {
    const login = new URL('/login', req.url);
    login.searchParams.set('from', req.nextUrl.pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
