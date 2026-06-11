import { NextRequest } from "next/server";

const DEV_BACKEND_URL = "http://127.0.0.1:8765";

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}

function getRequestOrigin(req: NextRequest): string {
  const forwardedProto = req.headers.get("x-forwarded-proto");
  const forwardedHost = req.headers.get("x-forwarded-host") || req.headers.get("host");
  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }
  return req.nextUrl.origin;
}

function resolveBackendBaseUrl(req: NextRequest): string {
  const envBackendUrl = process.env.CMS_BACKEND_URL?.trim();
  if (envBackendUrl) {
    return normalizeBaseUrl(envBackendUrl);
  }

  const backendBasePath = (process.env.CMS_BACKEND_BASE_PATH || "/cms-api").trim();
  if (backendBasePath) {
    const normalizedBasePath = backendBasePath.startsWith("/")
      ? backendBasePath
      : `/${backendBasePath}`;
    return `${normalizeBaseUrl(getRequestOrigin(req))}${normalizedBasePath}`;
  }

  if (process.env.NODE_ENV !== "production") {
    return DEV_BACKEND_URL;
  }

  throw new Error("未配置 CMS_BACKEND_URL，且当前请求无法推断后端地址");
}

export function getBackendUrl(pathPart: string, req: NextRequest): string {
  return `${resolveBackendBaseUrl(req)}${pathPart}`;
}
