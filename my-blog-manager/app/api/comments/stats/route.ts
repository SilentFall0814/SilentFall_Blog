import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, buildBackendHeaders } from '../../../../lib/backendProxy';

// GET: 获取评论统计
export async function GET(req: NextRequest) {
  try {
    const res = await fetch(getBackendUrl('/api/comments/stats'), {
      cache: 'no-store',
      headers: buildBackendHeaders(req),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('评论统计代理失败:', error);
    return NextResponse.json({ success: false, data: { total: 0, approved: 0, pending: 0, hidden: 0 } }, { status: 500 });
  }
}
