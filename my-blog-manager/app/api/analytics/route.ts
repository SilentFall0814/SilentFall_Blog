import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, buildBackendHeaders } from '../../../lib/backendProxy';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || 'overview';

    const backendUrl = new URL(getBackendUrl('/api/analytics/' + path, request));
    searchParams.forEach((value, key) => {
      if (key !== 'path') {
        backendUrl.searchParams.set(key, value);
      }
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(backendUrl.toString(), {
      cache: 'no-store',
      headers: buildBackendHeaders(request),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, message: `后端连接失败: ${error instanceof Error ? error.message : '服务器错误'}`, data: null },
      { status: 502 }
    );
  }
}
