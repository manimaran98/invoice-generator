import { NextResponse } from 'next/server';
import { ACCESS_TOKEN_COOKIE } from '@/lib/internal-api';

export function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ACCESS_TOKEN_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return res;
}
