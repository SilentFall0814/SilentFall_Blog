import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, buildBackendHeaders } from '../../../lib/backendProxy';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const path = searchParams.get('path') || 'config';
    const res = await fetch(getBackendUrl('/api/sync/' + path), {
      cache: 'no-store',
      headers: buildBackendHeaders(req),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('同步代理GET失败:', error);
    return NextResponse.json({ success: false, blogPath: '' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const path = searchParams.get('path') || 'publish_and_sync';
    const body = await req.json();
    const res = await fetch(getBackendUrl('/api/sync/' + path), {
      method: 'POST',
      headers: buildBackendHeaders(req),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60000),
    });
    if (res.status === 401) {
      return NextResponse.json(await res.json(), { status: 401 });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('同步代理POST失败:', error);
    return NextResponse.json({ success: false, message: '服务器错误' }, { status: 500 });
  }
}
