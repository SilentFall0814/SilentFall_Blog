import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, buildBackendHeaders } from '../../../lib/backendProxy';

// POST: 说说保存/删除
// ?path=save
// ?path=delete
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const path = searchParams.get('path') || 'save';
    const body = await req.json();
    const res = await fetch(getBackendUrl('/api/moments/' + path), {
      method: 'POST',
      headers: buildBackendHeaders(req),
      body: JSON.stringify(body),
    });
    if (res.status === 401) {
      return NextResponse.json(await res.json(), { status: 401 });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('说说代理POST失败:', error);
    return NextResponse.json({ success: false, message: '服务器错误' }, { status: 500 });
  }
}
