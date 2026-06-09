"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "../../lib/auth";

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    // 已登录则直接跳首页（layout.tsx 会处理未登录的情况）
    if (isLoggedIn()) {
      router.push("/");
    }
  }, [router]);

  return null;
}
