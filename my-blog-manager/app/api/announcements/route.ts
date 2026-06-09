import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl, buildBackendHeaders } from '../../../lib/backendProxy';

// GET: 获取公告列表或统计
// ?path=admin/all&status=xxx&page=1&page_size=100
// ?path=admin/stats
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const path = searchParams.get('path') || 'admin/all';
    const qs = searchParams.toString().replace(/path=[^&]*&?/, '').replace(/&$/, '');
    const url = getBackendUrl('/api/announcements/' + path + (qs ? '?' + qs : ''));
    const res = await fetch(url, {
      cache: 'no-store',
      headers: buildBackendHeaders(req),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('公告代理GET失败:', error);
    return NextResponse.json({ success: false, message: '服务器错误' }, { status: 500 });
  }
}

// POST: 创建公告
// ?path=admin/create
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const path = searchParams.get('path') || 'admin/create';
    const body = await req.json();
    const res = await fetch(getBackendUrl('/api/announcements/' + path), {
      method: 'POST',
      headers: buildBackendHeaders(req),
      body: JSON.stringify(body),
    });
    if (res.status === 401) {
      return NextResponse.json(await res.json(), { status: 401 });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('公告代理POST失败:', error);
    return NextResponse.json({ success: false, message: '服务器错误' }, { status: 500 });
  }
}

// PUT: 更新公告
// ?path=admin/update/{id}
export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const path = searchParams.get('path') || '';
    if (!path) {
      return NextResponse.json({ success: false, message: '缺少 path 参数' }, { status: 400 });
    }
    const body = await req.json();
    const res = await fetch(getBackendUrl('/api/announcements/' + path), {
      method: 'PUT',
      headers: buildBackendHeaders(req),
      body: JSON.stringify(body),
    });
    if (res.status === 401) {
      return NextResponse.json(await res.json(), { status: 401 });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('公告代理PUT失败:', error);
    return NextResponse.json({ success: false, message: '服务器错误' }, { status: 500 });
  }
}

// DELETE: 删除公告
// ?path=admin/{id}
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const path = searchParams.get('path') || '';
    if (!path) {
      return NextResponse.json({ success: false, message: '缺少 path 参数' }, { status: 400 });
    }
    const res = await fetch(getBackendUrl('/api/announcements/' + path), {
      method: 'DELETE',
      headers: buildBackendHeaders(req),
    });
    if (res.status === 401) {
      return NextResponse.json(await res.json(), { status: 401 });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('公告代理DELETE失败:', error);
    return NextResponse.json({ success: false, message: '服务器错误' }, { status: 500 });
  }
}
