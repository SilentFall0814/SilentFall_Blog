import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.CMS_BACKEND_URL || 'http://127.0.0.1:8765';

/**
 * 记录页面访问
 * POST /api/analytics/record
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch(`${BACKEND_URL}/api/analytics/record`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    // 静默失败，不影响用户体验
    console.error('访问记录代理失败:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
