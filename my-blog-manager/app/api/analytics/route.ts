import { NextRequest, NextResponse } from 'next/server';

async function getBackendPort(): Promise<number> {
  try {
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'http';
    const host = process.env.NODE_ENV === 'development' ? 'localhost:3001' : 'localhost:3000';
    const configRes = await fetch(`${protocol}://${host}/backend_config.json?t=${Date.now()}`);
    const config = await configRes.json();
    return config.api_port || 8765;
  } catch {
    try {
      const fallbackRes = await fetch(`http://localhost:3000/backend_config.json?t=${Date.now()}`);
      const fallbackConfig = await fallbackRes.json();
      return fallbackConfig.api_port || 8765;
    } catch {
      return 8765;
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const port = await getBackendPort();
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || 'overview';
    const days = searchParams.get('days') || '14';

    const backendUrl = `http://127.0.0.1:${port}/api/analytics/${path}${path === 'trend' ? `?days=${days}` : ''}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(backendUrl, {
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
