import { NextRequest, NextResponse } from 'next/server';
import { signUp } from '@/lib/auth';
import { COOKIE_NAME } from '@/lib/auth/session';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limiter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const rateLimit = checkRateLimit(`auth:signup:${ip}`, 10);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Too many registration attempts. Please wait ${rateLimit.retryAfterSeconds}s before retrying.` },
        { status: 429, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { email, password, name } = body;

    const result = await signUp(email, password, name);
    if (!result.success || !result.sessionToken) {
      return NextResponse.json(
        { error: result.error || 'Failed to sign up' },
        { status: 400 }
      );
    }

    const response = NextResponse.json({ success: true, user: result.user }, { status: 201 });
    response.cookies.set(COOKIE_NAME, result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
