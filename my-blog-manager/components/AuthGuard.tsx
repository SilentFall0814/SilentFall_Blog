"use client";

import { useEffect, useState, type ReactNode } from "react";
import { isLoggedIn, saveToken } from "../lib/auth";
import { useToast } from "./ToastProvider";

export default function AuthGuard({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { showToast } = useToast();

  useEffect(() => {
    if (isLoggedIn()) {
      setAuthed(true);
    }
    setChecking(false);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError("请输入密码");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", password }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.accessToken) {
        saveToken(data.accessToken);
        setAuthed(true);
        showToast("验证通过", "success");
      } else {
        setError(data.detail || "凭证错误，请重试");
      }
    } catch {
      setError("网络异常，请稍后再试");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-400 text-sm">正在检查登录状态...</p>
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-md rounded-3xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-2xl p-10 space-y-6"
        >
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tighter">
              身份验证
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              请输入管理员密码以进入后台
            </p>
          </div>

          <div className="space-y-2">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-600 bg-white/80 dark:bg-slate-900/60 px-4 py-3 text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-400 transition-colors"
              placeholder="请输入密码"
            />
          </div>

          {error && (
            <div className="text-sm text-rose-500 bg-rose-500/10 rounded-xl px-4 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/30"
          >
            {loading ? "验证中..." : "进入管理中枢"}
          </button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
