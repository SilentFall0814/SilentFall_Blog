import { NextResponse } from 'next/server';

const BACKEND = process.env.CMS_BACKEND_URL || 'http://127.0.0.1:8765';

export async function GET() {
  try {
    const res = await fetch(`${BACKEND}/api/announcements/published`, {
      cache: 'no-store',
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
