import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.CMS_BACKEND_URL || 'http://127.0.0.1:8765';

// GET /api/config — 代理到后端配置查询接口
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const path = searchParams.get('path') || 'get';
    const res = await fetch(`${BACKEND_URL}/api/config/${path}`, { cache: 'no-store' });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('配置代理GET失败:', error);
    return NextResponse.json({ success: false, message: '服务器错误' }, { status: 500 });
  }
}

// POST /api/config — 代理到后端配置更新接口
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const path = searchParams.get('path') || 'update';
    const body = await req.json();
    const res = await fetch(`${BACKEND_URL}/api/config/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('配置代理POST失败:', error);
    return NextResponse.json({ success: false, message: '服务器错误' }, { status: 500 });
  }
}
