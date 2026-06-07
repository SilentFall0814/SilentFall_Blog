"use client";

import { useEffect, useState } from 'react';

/**
 * 页面访问记录 Hook
 * 在客户端渲染时自动记录访问到后端 analytics 接口（含页面标题）
 */
export function useTrackVisit(pageTitle?: string) {
  const [recorded, setRecorded] = useState(false);

  useEffect(() => {
    // 只在客户端执行
    if (typeof window === 'undefined' || recorded) return;

    const recordVisit = async () => {
      try {
        const page_id = window.location.pathname;
        // 优先使用传入的标题，否则从 document.title 提取
        const title = pageTitle || document.title.split(' | ')[0].trim();
        await fetch('/api/analytics/record', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ page_id, page_title: title }),
          // 使用 keepalive 确保页面关闭时请求能发出
          keepalive: true,
        });
      } catch {
        // 静默失败，不影响用户体验
      }
      setRecorded(true);
    };

    recordVisit();
  }, [recorded, pageTitle]);
}

/**
 * 页面访问记录组件
 * 在组件中渲染一次即可自动记录访问
 */
export function VisitTracker({ pageTitle }: { pageTitle?: string } = {}) {
  useTrackVisit(pageTitle);
  return null;
}
