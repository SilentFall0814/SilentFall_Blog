import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '../../../../../lib/backendTarget';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const res = await fetch(getBackendUrl(`/api/comments/like/${id}`, req), { method: 'POST' });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('点赞代理失败:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
