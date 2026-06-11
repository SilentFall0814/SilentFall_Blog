import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, buildBackendHeaders } from '../../../lib/backendProxy';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const page = searchParams.get('page') || '1';
    const page_size = searchParams.get('page_size') || '20';
    const res = await fetch(
      getBackendUrl('/api/guest_moments/admin/all?status=' + status + '&page=' + page + '&page_size=' + page_size, request),
      { cache: 'no-store', headers: buildBackendHeaders(request) }
    );
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : '服务器错误' }, { status: 500 });
  }
}
