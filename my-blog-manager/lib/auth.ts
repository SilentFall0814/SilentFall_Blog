"use client";

const TOKEN_KEY = "cms_access_token";
const EXPIRY_KEY = "cms_token_expiry";

export function saveToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  const expiry = Date.now() + 23 * 60 * 60 * 1000; // 23 小时，略短于 JWT 24 小时
  localStorage.setItem(EXPIRY_KEY, String(expiry));
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem(TOKEN_KEY);
  const expiry = Number(localStorage.getItem(EXPIRY_KEY) || "0");
  if (!token) return null;
  if (expiry && Date.now() > expiry) {
    clearToken();
    return null;
  }
  return token;
}

export function clearToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EXPIRY_KEY);
}

export function isLoggedIn(): boolean {
  return !!getToken();
}
