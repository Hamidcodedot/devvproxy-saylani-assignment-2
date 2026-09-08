import { NextRequest, NextResponse } from 'next/server';
import { createNewApiKey, getDashboardData, revokeApiKey } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const { keys } = await getDashboardData();
  return NextResponse.json({ keys });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const name = body.name || 'New Virtual Key';
    const result = await createNewApiKey(name);
    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to generate key' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing key id' }, { status: 400 });
    }
    await revokeApiKey(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to revoke key' },
      { status: 500 }
    );
  }
}
