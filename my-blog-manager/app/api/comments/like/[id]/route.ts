import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, buildBackendHeaders } from '../../../../../lib/backendProxy';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const res = await fetch(getBackendUrl('/api/comments/like/' + id), {
      method: 'POST',
      headers: buildBackendHeaders(req),
    });
    if (res.status === 401) {
      return NextResponse.json(await res.json(), { status: 401 });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('点赞代理失败:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
