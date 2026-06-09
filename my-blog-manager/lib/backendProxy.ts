import { NextRequest } from "next/server";

const BACKEND_URL = process.env.CMS_BACKEND_URL || "http://127.0.0.1:8765";

export function getBackendUrl(pathPart: string): string {
  return `${BACKEND_URL}${pathPart}`;
}

export function buildBackendHeaders(req: NextRequest): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const auth = req.headers.get("authorization");
  if (auth) headers["Authorization"] = auth;
  return headers;
}

export { BACKEND_URL };
