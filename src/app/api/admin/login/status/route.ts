import { NextRequest, NextResponse } from 'next/server';
import { getClientIp, getLoginStatus } from '@/lib/login-limiter';

// GET /api/admin/login/status - Tentativi di login rimasti per questo client
export async function GET(request: NextRequest) {
  return NextResponse.json(getLoginStatus(getClientIp(request)), {
    headers: { 'Cache-Control': 'no-store' },
  });
}
