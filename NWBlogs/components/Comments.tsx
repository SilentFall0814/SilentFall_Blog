"use client";

import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { usePathname } from 'next/navigation';

interface Comment {
  id: string;
  page_id: string;
  author: string;
  email: string;
  avatar: string;
  content: string;
  reply_to: string | null;
  status: string;
  likes: number;
  created_at: string;
}

const formatDate = (d: string) => {
  const date = new Date(d);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins} 分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  return date.toLocaleDateString('zh-CN');
};

const CommentItem = memo(function CommentItem({
  c,
  onLike,
  onReply
}: {
  c: Comment & { children: Comment[] };
  onLike: (id: string) => void;
  onReply: (id: string, author: string) => void;
}) {
  return (
    <div className="flex gap-3 group">
      <img
        src={c.avatar || `https://cravatar.cn/avatar/?d=mp&s=80`}
        alt={c.author}
        className="w-9 h-9 rounded-full shrink-0 ring-2 ring-white/30 dark:ring-slate-700/50"
        loading="lazy"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-sm text-indigo-600 dark:text-indigo-400">{c.author}</span>
          <span className="text-[11px] text-slate-400">{formatDate(c.created_at)}</span>
        </div>
        <div className="mt-1.5 text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap break-words">
          {c.content}
        </div>
        <div className="flex items-center gap-4 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onLike(c.id)}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-500 transition-colors"
          >
            ❤️ {c.likes > 0 && c.likes}
          </button>
          <button
            onClick={() => onReply(c.id, c.author)}
            className="text-xs text-slate-400 hover:text-indigo-500 transition-colors"
          >
            回复
          </button>
        </div>
      </div>
    </div>
  );
});

export default function Comments() {
  const pathname = usePathname();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [author, setAuthor] = useState('');
  const [email, setEmail] = useState('');
  const [content, setContent] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const pageId = (pathname.replace(/\/$/, '') || '/').substring(0, 49);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/comments?page_id=${encodeURIComponent(pageId)}`);
      const data = await res.json();
      if (data.success) setComments(data.data);
    } catch {
      console.error('获取评论失败');
    } finally {
      setLoading(false);
    }
  }, [pageId]);

  useEffect(() => {
    const saved = localStorage.getItem('comment_user');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        setAuthor(u.author || '');
        setEmail(u.email || '');
      } catch {}
    }
  }, []);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async () => {
    if (!author.trim() || !content.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page_id: pageId,
          author: author.trim(),
          email: email.trim(),
          content: content.trim(),
          reply_to: replyTo,
        }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('comment_user', JSON.stringify({ author, email }));
        setContent('');
        setReplyTo(null);
        fetchComments();
      }
    } catch {
      console.error('提交评论失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (id: string) => {
    try {
      await fetch(`/api/comments/like/${id}`, { method: 'POST' });
      setComments(prev =>
        prev.map(c => (c.id === id ? { ...c, likes: c.likes + 1 } : c))
      );
    } catch {}
  };

  const buildTree = (flat: Comment[]): (Comment & { children: Comment[] })[] => {
    const map = new Map<string, Comment & { children: Comment[] }>();
    const roots: (Comment & { children: Comment[] })[] = [];
    flat.forEach(c => map.set(c.id, { ...c, children: [] }));
    flat.forEach(c => {
      const node = map.get(c.id)!;
      if (c.reply_to && map.has(c.reply_to)) {
        map.get(c.reply_to)!.children.push(node);
      } else {
        roots.push(node);
      }
    });
    return roots;
  };

  const renderComment = (c: Comment & { children: Comment[] }, depth = 0) => (
    <div key={c.id} className={depth > 0 ? 'ml-8 border-l-2 border-indigo-200/30 dark:border-indigo-500/20 pl-4' : ''}>
      <CommentItem c={c} onLike={handleLike} onReply={(id, author) => { setReplyTo(id); setContent(`@${author} `); }} />
      {c.children.length > 0 && (
        <div className="mt-3 space-y-3">
          {c.children.map(child => renderComment(child as Comment & { children: Comment[] }, depth + 1))}
        </div>
      )}
    </div>
  );

  const tree = buildTree(comments);

  return (
    <div className="w-full mt-16 relative">
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-indigo-500/10 dark:bg-indigo-500/20 blur-3xl rounded-full pointer-events-none z-0" />

      <div className="relative z-10 pt-6 border-t border-slate-200/50 dark:border-slate-700/50">
        <h3 className="text-lg font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2">
          💬 评论区
          <span className="text-xs font-normal text-slate-400">({comments.length})</span>
        </h3>

        <div className="bg-white/10 dark:bg-slate-800/30 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 rounded-2xl p-5 mb-6">
          <div className="flex gap-3 mb-3">
            <input
              type="text"
              value={author}
              onChange={e => setAuthor(e.target.value)}
              placeholder="昵称 *"
              className="flex-1 bg-white/50 dark:bg-slate-900/50 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400 dark:text-slate-200"
            />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="填写你的常用联系邮箱，没有或不方便则不填写"
              className="flex-[2] bg-white/50 dark:bg-slate-900/50 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400 dark:text-slate-200"
            />
          </div>

          {replyTo && (
            <div className="flex items-center gap-2 mb-2 text-xs text-indigo-500">
              <span>回复 @{comments.find(c => c.id === replyTo)?.author || '某人'}</span>
              <button onClick={() => { setReplyTo(null); setContent(''); }} className="text-slate-400 hover:text-red-400">✕</button>
            </div>
          )}

          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="写下你的评论... (支持 Markdown)"
            rows={3}
            className="w-full bg-white/50 dark:bg-slate-900/50 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400 dark:text-slate-200 resize-none transition-all"
          />

          <div className="flex justify-end mt-3">
            <button
              onClick={handleSubmit}
              disabled={submitting || !author.trim() || !content.trim()}
              className="px-6 py-2.5 bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/30 hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? '提交中...' : '发布评论'}
            </button>
          </div>
        </div>

        <div ref={listRef} className="space-y-5">
          {loading ? (
            <div className="text-center py-8 text-slate-400 text-sm">加载评论中...</div>
          ) : tree.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">还没有评论，来抢沙发吧~ 🛋️</div>
          ) : (
            tree.map(c => renderComment(c))
          )}
        </div>
      </div>
    </div>
  );
}
