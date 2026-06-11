import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '../../../lib/backendTarget';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const res = await fetch(getBackendUrl('/api/guest_moments/submit', request), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : '服务器错误' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const res = await fetch(getBackendUrl('/api/guest_moments/list_approved', request), { cache: 'no-store' });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : '服务器错误' }, { status: 500 });
  }
}
