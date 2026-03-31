import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import {
  ACCESS_TOKEN_COOKIE,
  cookieMaxAgeSeconds,
  internalApiBase,
} from '@/lib/internal-api';

export async function POST(req: NextRequest) {
  const jar = await cookies();
  const token = jar.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json();
  const r = await fetch(`${internalApiBase()}/auth/switch-organization`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    return NextResponse.json(data, { status: r.status });
  }
  const nextToken = data.accessToken as string | undefined;
  if (!nextToken) {
    return NextResponse.json({ message: 'Invalid auth response' }, { status: 502 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ACCESS_TOKEN_COOKIE, nextToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: cookieMaxAgeSeconds(),
  });
  return res;
}
