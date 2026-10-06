import { NextRequest } from 'next/server';
import { proxyAuth } from '../_lib/proxy';

export async function POST(request: NextRequest) {
  return proxyAuth(request, '/auth/logout');
}
