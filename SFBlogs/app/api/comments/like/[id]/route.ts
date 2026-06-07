import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.CMS_BACKEND_URL || 'http://127.0.0.1:8765';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const res = await fetch(`${BACKEND_URL}/api/comments/like/${id}`, { method: 'POST' });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('点赞代理失败:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
