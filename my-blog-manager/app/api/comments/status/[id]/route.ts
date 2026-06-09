import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, buildBackendHeaders } from '../../../../../lib/backendProxy';

// PUT: 更新评论状态
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const res = await fetch(getBackendUrl('/api/comments/status/' + id), {
      method: 'PUT',
      headers: buildBackendHeaders(request),
      body: JSON.stringify(body),
    });
    if (res.status === 401) {
      return NextResponse.json(await res.json(), { status: 401 });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
