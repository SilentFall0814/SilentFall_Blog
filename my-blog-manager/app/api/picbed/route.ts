import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, buildBackendHeaders } from '../../../lib/backendProxy';

// POST: 图床上传/删除/测试
// ?path=upload_local  (FormData)
// ?path=upload        (FormData)
// ?path=delete_local  (JSON)
// ?path=test          (JSON)
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const path = searchParams.get('path') || 'upload';

    // 图床上传接口使用 FormData，不能手动设置 Content-Type
    if (path === 'upload' || path === 'upload_local') {
      const formData = await req.formData();
      const backendUrl = getBackendUrl('/api/picbed/' + path, req);
      const headers: Record<string, string> = {};
      const auth = req.headers.get('authorization');
      if (auth) headers['Authorization'] = auth;
      // 不设置 Content-Type，让浏览器自动设置 multipart boundary
      const res = await fetch(backendUrl, {
        method: 'POST',
        headers,
        body: formData,
      });
      const data = await res.json();
      return NextResponse.json(data);
    }

    // 其他接口使用 JSON
    const body = await req.json();
    const res = await fetch(getBackendUrl('/api/picbed/' + path, req), {
      method: 'POST',
      headers: buildBackendHeaders(req),
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('图床代理POST失败:', error);
    return NextResponse.json({ success: false, message: '服务器错误' }, { status: 500 });
  }
}
