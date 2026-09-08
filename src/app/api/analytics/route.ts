import { NextResponse } from 'next/server';
import { getDashboardData } from '@/lib/supabase';

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
