import { NextRequest, NextResponse } from 'next/server';
import { signIn } from '@/lib/auth';
import { COOKIE_NAME } from '@/lib/auth/session';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limiter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const rateLimit = checkRateLimit(`auth:login:${ip}`, 10);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Too many login attempts. Please wait ${rateLimit.retryAfterSeconds}s before retrying.` },
        { status: 429, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { email, password } = body;

    const result = await signIn(email, password);
    if (!result.success || !result.sessionToken) {
      return NextResponse.json(
        { error: result.error || 'Invalid credentials' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ success: true, user: result.user });
    response.cookies.set(COOKIE_NAME, result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
