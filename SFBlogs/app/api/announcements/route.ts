import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '../../../lib/backendTarget';

export async function GET(req: NextRequest) {
  try {
    const res = await fetch(getBackendUrl('/api/announcements/published', req), {
      cache: 'no-store',
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : '服务器错误' }, { status: 500 });
  }
}
