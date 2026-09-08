import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPaymentGateway, PLANS } from '@/lib/billing/adapter';
import { PlanTier } from '@/lib/billing/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const planId: PlanTier = body.planId || 'pro';

    if (!PLANS[planId]) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }

    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const returnUrl = `${protocol}://${host}/dashboard`;

    const gateway = getPaymentGateway();
    const result = await gateway.createCheckoutSession({
      userId: user.id,
      userEmail: user.email,
      planId,
      returnUrl,
    });

    return NextResponse.json({ checkoutUrl: result.checkoutUrl, sessionId: result.sessionId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
