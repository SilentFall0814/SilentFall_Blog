import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '../../../lib/backendTarget';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page_id = searchParams.get('page_id') || '';
    const status = searchParams.get('status') || 'approved';
    const qs = new URLSearchParams({ page_id, status }).toString();
    const res = await fetch(getBackendUrl(`/api/comments/list?${qs}`, req), {
      cache: 'no-store'
    });
    const data = await res.json();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('评论列表代理失败:', error);
    return NextResponse.json({ success: false, data: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch(getBackendUrl('/api/comments/create', req), {
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
