import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, buildBackendHeaders } from '../../../lib/backendProxy';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const backendUrl = new URL(getBackendUrl('/api/analytics/view-records', request));
    searchParams.forEach((value, key) => {
      backendUrl.searchParams.set(key, value);
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
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, message: `后端连接失败: ${error instanceof Error ? error.message : '服务器错误'}`, data: null },
      { status: 502 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = body;

    const backendUrl = getBackendUrl('/api/analytics/view-records', request);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(backendUrl, {
      method: 'DELETE',
      headers: buildBackendHeaders(request),
      body: JSON.stringify({ ids }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.status === 401) {
      return NextResponse.json(await res.json(), { status: 401 });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, message: `后端连接失败: ${error instanceof Error ? error.message : '服务器错误'}`, data: null },
      { status: 502 }
    );
  }
}
