import { NextRequest, NextResponse } from 'next/server';
import { getDashboardData, resetDashboardData, seedDemoLogs } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const data = await getDashboardData();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    if (body.action === 'seed') {
      await seedDemoLogs();
    } else {
      await resetDashboardData();
    }
    const freshData = await getDashboardData();
    return NextResponse.json(freshData);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to process analytics action' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await resetDashboardData();
    const freshData = await getDashboardData();
    return NextResponse.json(freshData);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to reset analytics' },
      { status: 500 }
    );
  }
}

