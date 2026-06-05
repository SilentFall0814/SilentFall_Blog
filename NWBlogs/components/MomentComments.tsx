"use client";

import { useState, useEffect, useCallback } from 'react';

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

interface MomentCommentsProps {
  id: string;
}

export default function MomentComments({ id }: MomentCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [author, setAuthor] = useState('');
  const [email, setEmail] = useState('');
  const [content, setContent] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/comments?page_id=${encodeURIComponent(id)}`);
      const data = await res.json();
      if (data.success) setComments(data.data);
    } catch {}
  }, [id]);

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
    if (!author.trim() || !content.trim()) {
      setErrorMsg('昵称和内容不能为空');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page_id: id,
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
        setExpanded(false);
        fetchComments();
      } else {
        setErrorMsg(data.message || '提交失败');
      }
    } catch (e) {
      setErrorMsg('网络错误，请稍后再试');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return '刚刚';
    if (mins < 60) return `${mins}分钟前`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}小时前`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div className="w-full relative mt-3">
      {comments.length > 0 && (
        <div className="space-y-2 mb-3">
          {comments.map(c => (
            <div key={c.id} className="flex gap-2 text-[13px]">
              <img
                src={c.avatar || `https://cravatar.cn/avatar/?d=mp&s=48`}
                alt=""
                className="w-5 h-5 rounded-full shrink-0 mt-0.5"
              />
              <div className="min-w-0">
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{c.author}</span>
                {c.reply_to && (
                  <span className="text-indigo-400 text-xs ml-1">
                    @{comments.find(x => x.id === c.reply_to)?.author || '某人'}
                  </span>
                )}
                <span className="text-slate-700 dark:text-slate-300 ml-1">{c.content}</span>
                <span className="text-slate-400 text-[11px] ml-2">{formatDate(c.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {!expanded ? (
        <button
          onClick={() => setExpanded(true)}
          className="text-xs text-indigo-500 hover:text-indigo-600 font-bold"
        >
          💬 评论
        </button>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={author}
              onChange={e => setAuthor(e.target.value)}
              placeholder="昵称"
              className="flex-1 bg-white/50 dark:bg-slate-900/50 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400 dark:text-slate-200"
            />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="填写你的常用联系邮箱，没有或不方便则不填写"
              className="flex-1 bg-white/50 dark:bg-slate-900/50 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400 dark:text-slate-200"
            />
          </div>

          {replyTo && (
            <div className="flex items-center gap-1 text-[11px] text-indigo-400">
              <span>回复 @{comments.find(c => c.id === replyTo)?.author}</span>
              <button onClick={() => { setReplyTo(null); setContent(''); }} className="text-slate-400 hover:text-red-400">✕</button>
            </div>
          )}

          {errorMsg && (
            <div className="text-[11px] text-red-500 bg-red-500/10 rounded px-2 py-1">{errorMsg}</div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="写评论..."
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && author.trim() && content.trim()) handleSubmit(); }}
              className="flex-1 bg-white/50 dark:bg-slate-900/50 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400 dark:text-slate-200"
            />
            <button
              onClick={handleSubmit}
              disabled={submitting || !author.trim() || !content.trim()}
              className="px-3 py-1.5 bg-indigo-500 text-white rounded-lg text-xs font-bold disabled:opacity-40"
            >
              {submitting ? '发送中...' : '发送'}
            </button>
            <button
              onClick={() => { setExpanded(false); setReplyTo(null); setContent(''); setErrorMsg(''); }}
              className="px-2 py-1.5 text-xs text-slate-400 hover:text-slate-600"
            >
              收起
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
