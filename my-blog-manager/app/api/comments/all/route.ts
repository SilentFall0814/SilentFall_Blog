import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, buildBackendHeaders } from '../../../../lib/backendProxy';

// GET: 获取所有评论（管理后台）
// ?page=1&page_size=20&status=all
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = searchParams.get('page') || '1';
    const page_size = searchParams.get('page_size') || '20';
    const status = searchParams.get('status') || 'all';
    const qs = new URLSearchParams({ page, page_size, status }).toString();
    const res = await fetch(getBackendUrl('/api/comments/all?' + qs), {
      cache: 'no-store',
      headers: buildBackendHeaders(req),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('评论列表代理失败:', error);
    return NextResponse.json({ success: false, data: [] }, { status: 500 });
  }
}
