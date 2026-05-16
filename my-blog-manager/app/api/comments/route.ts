import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.CMS_BACKEND_URL || 'http://127.0.0.1:8765';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page_id = searchParams.get('page_id') || '';
    const status = searchParams.get('status') || 'approved';
    const qs = new URLSearchParams({ page_id, status }).toString();
    const res = await fetch(`${BACKEND_URL}/api/comments/list?${qs}`, { cache: 'no-store' });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('评论列表代理失败:', error);
    return NextResponse.json({ success: false, data: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch(`${BACKEND_URL}/api/comments/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('创建评论代理失败:', error);
    return NextResponse.json({ success: false, message: '服务器错误' }, { status: 500 });
  }
}
