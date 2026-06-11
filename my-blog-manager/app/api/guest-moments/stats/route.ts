import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, buildBackendHeaders } from '../../../../lib/backendProxy';

export async function GET(req: NextRequest) {
  try {
    const res = await fetch(getBackendUrl('/api/guest_moments/admin/stats', req), {
      cache: 'no-store',
      headers: buildBackendHeaders(req),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : '服务器错误' }, { status: 500 });
  }
}
