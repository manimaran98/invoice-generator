import { cookies } from 'next/headers';
import {
  NextRequest,
  NextResponse,
} from 'next/server';
import { ACCESS_TOKEN_COOKIE, internalApiBase } from '@/lib/internal-api';

export const dynamic = 'force-dynamic';

async function handle(
  req: NextRequest,
  segments: string[],
): Promise<NextResponse> {
  const path = segments.join('/');
  const src = new URL(req.url);
  const target = `${internalApiBase()}/${path}${src.search}`;
  const jar = await cookies();
  const token = jar.get(ACCESS_TOKEN_COOKIE)?.value;

  const headers = new Headers();
  const ct = req.headers.get('content-type');
  if (ct) {
    headers.set('content-type', ct);
  }
  const accept = req.headers.get('accept');
  if (accept) {
    headers.set('accept', accept);
  }
  if (token) {
    headers.set('authorization', `Bearer ${token}`);
  }

  const init: RequestInit = {
    method: req.method,
    headers,
    cache: 'no-store',
  };
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = await req.arrayBuffer();
  }

  const upstream = await fetch(target, init);
  const out = new NextResponse(upstream.body, { status: upstream.status });
  const pass = [
    'content-type',
    'content-disposition',
    'content-length',
  ] as const;
  for (const h of pass) {
    const v = upstream.headers.get(h);
    if (v) {
      out.headers.set(h, v);
    }
  }
  return out;
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return handle(req, path);
}
export async function POST(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return handle(req, path);
}
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return handle(req, path);
}
export async function PUT(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return handle(req, path);
}
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return handle(req, path);
}
