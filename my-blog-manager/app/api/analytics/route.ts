import { NextRequest, NextResponse } from 'next/server';

// 获取后端端口配置
async function getBackendPort(): Promise<number> {
  try {
    const host = process.env.NODE_ENV === 'development' ? 'localhost:3001' : 'localhost:3000';
    const configRes = await fetch(`http://${host}/backend_config.json?t=${Date.now()}`);
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

// GET 请求处理：代理到 Python 后端的 analytics 接口
export async function GET(request: NextRequest) {
  try {
    const port = await getBackendPort();
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || 'overview';

    // 构建后端 URL，将所有查询参数透传
    const backendUrl = new URL(`http://127.0.0.1:${port}/api/analytics/${path}`);
    searchParams.forEach((value, key) => {
      if (key !== 'path') {
        backendUrl.searchParams.set(key, value);
      }
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
