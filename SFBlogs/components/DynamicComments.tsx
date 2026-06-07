"use client";

import dynamic from 'next/dynamic';

const Comments = dynamic(() => import('./Comments'), {
  ssr: false,
  loading: () => <div className="w-full mt-16 pt-6 border-t border-slate-200/50 dark:border-slate-700/50"><div className="text-center py-8 text-slate-400 text-sm">加载评论中...</div></div>
});

export default Comments;
