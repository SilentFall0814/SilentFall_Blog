import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl } from "../../../lib/backendProxy";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action;

    if (action === "login") {
      const backendRes = await fetch(getBackendUrl("/api/auth/login", req), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: body.password }),
      });
      const data = await backendRes.json();
      return NextResponse.json(data, { status: backendRes.status });
    }

    if (action === "me") {
      const token = req.headers.get("authorization");
      const backendRes = await fetch(getBackendUrl("/api/auth/me", req), {
        method: "GET",
        headers: token ? { Authorization: token } : {},
      });
      const data = await backendRes.json();
      return NextResponse.json(data, { status: backendRes.status });
    }

    return NextResponse.json({ success: false, message: "未知操作" }, { status: 400 });
  } catch (error) {
    console.error("auth 代理失败:", error);
    return NextResponse.json({ success: false, message: "服务器错误" }, { status: 500 });
  }
}
