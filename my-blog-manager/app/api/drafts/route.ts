import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, buildBackendHeaders } from '../../../lib/backendProxy';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const path = searchParams.get('path') || 'all_tags';
    const res = await fetch(getBackendUrl('/api/drafts/' + path), {
      cache: 'no-store',
      headers: buildBackendHeaders(req),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('草稿代理GET失败:', error);
    return NextResponse.json({ success: false, postTags: [], chatterTags: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const path = searchParams.get('path') || 'save';
    const body = await req.json();
    const res = await fetch(getBackendUrl('/api/drafts/' + path), {
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
    console.error('草稿代理POST失败:', error);
    return NextResponse.json({ success: false, message: '服务器错误' }, { status: 500 });
  }
}
