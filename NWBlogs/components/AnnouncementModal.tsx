"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Megaphone } from 'lucide-react';

interface Announcement {
  id: string;
  content: string;
  status: 'draft' | 'published';
  publish_time: string | null;
  created_at: string;
}

const SESSION_KEY = 'has_seen_announcement';

export default function AnnouncementModal() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  const formatTime = (isoStr: string | null) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await fetch('/api/announcements');
      const data = await res.json();
      if (data.success && data.data && data.data.length > 0) {
        setAnnouncements(data.data);
        // 检查 sessionStorage：仅在新会话（未标记过）时显示弹窗
        const seen = sessionStorage.getItem(SESSION_KEY);
        if (!seen) {
          setVisible(true);
        }
      }
    } catch {
      // 静默失败，不影响用户体验
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleClose = () => {
    // 标记当前会话已看过公告，关闭弹窗
    sessionStorage.setItem(SESSION_KEY, 'true');
    setVisible(false);
  };

  // SSR 阶段不渲染，避免 Hydration Mismatch
  if (!mounted) return null;

  // 没有已发布公告时不渲染任何内容
  if (announcements.length === 0) return null;

  return (
    <AnimatePresence>
      {visible && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6">
          {/* 半透明黑色遮罩层，点击不关闭弹窗 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* 居中弹窗主体 */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[32px] border border-white/30 dark:border-white/10 shadow-2xl overflow-hidden"
            style={{ maxHeight: '80vh' }}
          >
            {/* 顶部标题栏 */}
            <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-white/20 dark:border-white/5 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                  <Megaphone size={16} className="text-indigo-500" />
                </div>
                <h2 className="text-base font-black text-slate-800 dark:text-white tracking-wide">博客公告</h2>
              </div>
              {/* 叉号关闭按钮 */}
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                aria-label="关闭公告"
              >
                <X size={16} className="text-slate-500 dark:text-slate-400" />
              </button>
            </div>

            {/* 公告内容区域：多条公告垂直堆叠，超出时内部滚动 */}
            <div className="overflow-y-auto px-6 py-4" style={{ maxHeight: 'calc(80vh - 64px)' }}>
              <div className="space-y-4">
                {announcements.map((item, index) => (
                  <div
                    key={item.id}
                    className={`pb-4 ${index < announcements.length - 1 ? 'border-b border-slate-100 dark:border-slate-800' : ''}`}
                  >
                    {/* 发布时间 */}
                    {item.publish_time && (
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mb-2">
                        {formatTime(item.publish_time)}
                      </p>
                    )}
                    {/* 公告内容 */}
                    <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {item.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
