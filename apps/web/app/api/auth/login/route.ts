import { NextRequest, NextResponse } from 'next/server';
import {
  ACCESS_TOKEN_COOKIE,
  cookieMaxAgeSeconds,
  internalApiBase,
} from '@/lib/internal-api';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const r = await fetch(`${internalApiBase()}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    return NextResponse.json(data, { status: r.status });
  }
  const token = data.accessToken as string | undefined;
  if (!token) {
    return NextResponse.json({ message: 'Invalid auth response' }, { status: 502 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ACCESS_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: cookieMaxAgeSeconds(),
  });
  return res;
}
