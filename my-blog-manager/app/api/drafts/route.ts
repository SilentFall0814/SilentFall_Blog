import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.CMS_BACKEND_URL || 'http://127.0.0.1:8765';

// GET /api/drafts/all_tags
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const path = searchParams.get('path') || 'all_tags';
    const res = await fetch(`${BACKEND_URL}/api/drafts/${path}`, { cache: 'no-store' });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('草稿代理GET失败:', error);
    return NextResponse.json({ success: false, postTags: [], chatterTags: [] }, { status: 500 });
  }
}

// POST /api/drafts/save 或 /api/drafts/get
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const path = searchParams.get('path') || 'save';
    const body = await req.json();
    const res = await fetch(`${BACKEND_URL}/api/drafts/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('草稿代理POST失败:', error);
    return NextResponse.json({ success: false, message: '服务器错误' }, { status: 500 });
  }
}
