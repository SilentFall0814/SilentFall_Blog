"use client";

import { useEffect, useState } from 'react';

/**
 * 文章访问记录组件
 * 在文章页面中渲染，自动记录对该文章的访问（含文章标题）
 */
export function ArticleVisitTracker({ slug, title }: { slug: string; title: string }) {
  const [recorded, setRecorded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || recorded) return;

    const recordVisit = async () => {
      try {
        await fetch('/api/analytics/record', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ page_id: `/posts/${slug}`, page_title: title }),
          keepalive: true,
        });
      } catch {
        // 静默失败
      }
      setRecorded(true);
    };

    recordVisit();
  }, [slug, title, recorded]);

  return null;
}
