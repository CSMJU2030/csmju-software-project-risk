import { NextRequest } from 'next/server';
import { proxyAuth } from '../_lib/proxy';

export async function GET(request: NextRequest) {
  return proxyAuth(request, '/auth/login');
}
