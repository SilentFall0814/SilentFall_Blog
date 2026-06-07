import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.CMS_BACKEND_URL || 'http://127.0.0.1:8765';

// GET /api/sync/config
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const path = searchParams.get('path') || 'config';
    const res = await fetch(`${BACKEND_URL}/api/sync/${path}`, { cache: 'no-store' });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('同步代理GET失败:', error);
    return NextResponse.json({ success: false, blogPath: '' }, { status: 500 });
  }
}

// POST /api/sync/publish_and_sync
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const path = searchParams.get('path') || 'publish_and_sync';
    const body = await req.json();
    const res = await fetch(`${BACKEND_URL}/api/sync/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60000),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('同步代理POST失败:', error);
    return NextResponse.json({ success: false, message: '服务器错误' }, { status: 500 });
  }
}
