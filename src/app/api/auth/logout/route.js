import { NextResponse } from 'next/server';
import { clearTokenCookie } from '@/lib/auth';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  clearTokenCookie(res);
  return res;
}
