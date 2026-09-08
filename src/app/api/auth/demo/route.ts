import { NextResponse } from 'next/server';
import { signInAsDemo } from '@/lib/auth';
import { COOKIE_NAME } from '@/lib/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const result = await signInAsDemo();
    if (!result.success || !result.sessionToken) {
      return NextResponse.json({ error: 'Failed to create demo session' }, { status: 500 });
    }

    const response = NextResponse.json({ success: true, user: result.user });
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
