"use client";

import { getToken, clearToken } from "./auth";

const LOGIN_PATH = "/admin";

function shouldRedirect(url: string): boolean {
  if (typeof window === "undefined") return false;
  if (url.startsWith(LOGIN_PATH)) return false;
  if (url.startsWith("/api/auth")) return false;
  if (url.startsWith("/_next")) return false;
  return true;
}

type FetchOptions = RequestInit & { raw?: boolean };

export async function apiFetch(url: string, options: FetchOptions = {}) {
  const token = getToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401 && shouldRedirect(url)) {
    clearToken();
    if (typeof window !== "undefined" && window.location.pathname !== LOGIN_PATH) {
      window.location.href = LOGIN_PATH;
    }
  }

  if (options.raw) return res;
  return res;
}

export async function apiFetchJson<T = any>(url: string, options: FetchOptions = {}): Promise<T> {
  const res = await apiFetch(url, options);
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    return { success: res.ok, message: text } as unknown as T;
  }
}
