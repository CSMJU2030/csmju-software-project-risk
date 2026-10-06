import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://127.0.0.1:4232';

function copySetCookies(source: Response, target: NextResponse): void {
  const headers = source.headers as Headers & { getSetCookie?: () => string[] };
  const cookies = headers.getSetCookie?.() ?? [];
  if (cookies.length > 0) {
    for (const cookie of cookies) target.headers.append('set-cookie', cookie);
    return;
  }
  const cookie = source.headers.get('set-cookie');
  if (cookie) target.headers.set('set-cookie', cookie);
}

export async function proxyAuth(request: NextRequest, path: string): Promise<NextResponse> {
  const backendUrl = new URL(path, BACKEND_URL);
  backendUrl.search = request.nextUrl.search;

  const headers = new Headers();
  const cookie = request.headers.get('cookie');
  if (cookie) headers.set('cookie', cookie);

  const response = await fetch(backendUrl, {
    method: request.method,
    headers,
    redirect: 'manual',
    cache: 'no-store',
  });

  const location = response.headers.get('location');
  const result = new NextResponse(
    request.method === 'POST' ? null : await response.text(),
    { status: response.status },
  );

  if (location) result.headers.set('location', location);
  copySetCookies(response, result);
  result.headers.set('cache-control', 'no-store');
  return result;
}
