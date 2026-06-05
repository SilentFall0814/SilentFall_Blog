import { NextRequest, NextResponse } from 'next/server';

async function getBackendPort(): Promise<number> {
  try {
    const host = process.env.NODE_ENV === 'development' ? 'localhost:3001' : 'localhost:3000';
    const configRes = await fetch(`http://${host}/backend_config.json?t=${Date.now()}`);
    const config = await configRes.json();
    return config.api_port || 8765;
  } catch {
    return 8765;
  }
}

// 获取访客列表
export async function GET(request: NextRequest) {
  try {
    const port = await getBackendPort();
    const { searchParams } = new URL(request.url);

    const backendUrl = new URL(`http://127.0.0.1:${port}/api/analytics/visitors`);
    searchParams.forEach((value, key) => {
      backendUrl.searchParams.set(key, value);
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(backendUrl.toString(), {
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: `后端连接失败: ${error.message}`, data: null },
      { status: 502 }
    );
  }
}

// 封禁/解封访客
export async function PUT(request: NextRequest) {
  try {
    const port = await getBackendPort();
    const body = await request.json();
    const { action, ids } = body; // action: 'block' | 'unblock'

    const backendUrl = `http://127.0.0.1:${port}/api/analytics/visitors/${action}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(backendUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: `后端连接失败: ${error.message}`, data: null },
      { status: 502 }
    );
  }
}
