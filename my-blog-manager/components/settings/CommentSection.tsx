"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Trash2, Eye, EyeOff, CheckCircle, MessageSquare, RefreshCw } from 'lucide-react';
import { apiFetch } from '../../lib/apiFetch';

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

export default function CommentSection() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, hidden: 0 });
  const pageSize = 20;

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(
        `/api/comments/all?page=${page}&page_size=${pageSize}&status=${filter}`
      );
      const data = await res.json();
      if (data.success) {
        setComments(data.data);
        setTotal(data.total);
      }
    } catch (e) {
      console.error('获取评论失败', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await apiFetch('/api/comments/stats');
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch {}
  };

  useEffect(() => {
    fetchComments();
    fetchStats();
  }, [page, filter]);

  const handleStatus = async (id: string, status: string) => {
    try {
      const res = await apiFetch(`/api/comments/status/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        fetchComments();
        fetchStats();
      }
    } catch {}
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条评论吗？此操作不可恢复！')) return;
    try {
      const res = await apiFetch(`/api/comments/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        fetchComments();
        fetchStats();
      }
    } catch {}
  };

  const formatDate = (d: string) => {
    return new Date(d).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      approved: { label: '已通过', cls: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
      pending: { label: '待审核', cls: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
      hidden: { label: '已隐藏', cls: 'bg-slate-500/10 text-slate-500' },
    };
    const s = map[status] || map.pending;
    return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.cls}`}>{s.label}</span>;
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col gap-6"
    >
      <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-slate-800/50 rounded-[40px] p-8 shadow-xl">
        <div className="flex justify-between items-center mb-8 border-b border-white/30 dark:border-slate-700/50 pb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
              <span>💬</span> 评论管理
            </h2>
            <p className="text-slate-500 text-sm mt-1 font-bold">管理全站评论，审核、隐藏或删除</p>
          </div>
          <button
            onClick={() => { fetchComments(); fetchStats(); }}
            className="px-4 py-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl text-sm font-bold hover:bg-indigo-500/20 transition-colors flex items-center gap-2"
          >
            <RefreshCw size={14} /> 刷新
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: '全部', value: stats.total, color: 'text-slate-800 dark:text-white', key: 'all' },
            { label: '已通过', value: stats.approved, color: 'text-emerald-500', key: 'approved' },
            { label: '待审核', value: stats.pending, color: 'text-amber-500', key: 'pending' },
            { label: '已隐藏', value: stats.hidden, color: 'text-slate-400', key: 'hidden' },
          ].map(s => (
            <button
              key={s.key}
              onClick={() => { setFilter(s.key); setPage(1); }}
              className={`p-4 rounded-2xl border transition-all ${
                filter === s.key
                  ? 'bg-indigo-500/10 border-indigo-500/30'
                  : 'bg-white/30 dark:bg-slate-800/30 border-white/20 dark:border-slate-700/50 hover:bg-white/50'
              }`}
            >
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-xs text-slate-400 font-bold mt-1">{s.label}</div>
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12 text-slate-400">加载中...</div>
          ) : comments.length === 0 ? (
            <div className="text-center py-12 text-slate-400">暂无评论</div>
          ) : (
            comments.map(c => (
              <div
                key={c.id}
                className="bg-white/30 dark:bg-slate-800/30 rounded-2xl p-4 border border-white/20 dark:border-slate-700/30"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={c.avatar || `https://cravatar.cn/avatar/?d=mp&s=64`}
                    alt=""
                    className="w-9 h-9 rounded-full shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-800 dark:text-white">{c.author}</span>
                      {c.email && <span className="text-[10px] text-slate-400">{c.email}</span>}
                      {statusBadge(c.status)}
                      <span className="text-[11px] text-slate-400 ml-auto">{formatDate(c.created_at)}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">页面: {c.page_id}</div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 mt-2 leading-relaxed">{c.content}</p>
                    <div className="flex items-center gap-2 mt-3">
                      {c.status !== 'approved' && (
                        <button
                          onClick={() => handleStatus(c.id, 'approved')}
                          className="flex items-center gap-1 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-bold hover:bg-emerald-500/20"
                        >
                          <CheckCircle size={12} /> 通过
                        </button>
                      )}
                      {c.status !== 'hidden' && (
                        <button
                          onClick={() => handleStatus(c.id, 'hidden')}
                          className="flex items-center gap-1 px-3 py-1 bg-slate-500/10 text-slate-500 rounded-lg text-xs font-bold hover:bg-slate-500/20"
                        >
                          <EyeOff size={12} /> 隐藏
                        </button>
                      )}
                      {c.status !== 'pending' && (
                        <button
                          onClick={() => handleStatus(c.id, 'pending')}
                          className="flex items-center gap-1 px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg text-xs font-bold hover:bg-amber-500/20"
                        >
                          <Eye size={12} /> 待审核
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="flex items-center gap-1 px-3 py-1 bg-red-500/10 text-red-500 rounded-lg text-xs font-bold hover:bg-red-500/20 ml-auto"
                      >
                        <Trash2 size={12} /> 删除
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-4 py-2 bg-white/30 dark:bg-slate-800/30 rounded-xl text-sm font-bold disabled:opacity-30"
            >
              上一页
            </button>
            <span className="text-sm text-slate-400">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-4 py-2 bg-white/30 dark:bg-slate-800/30 rounded-xl text-sm font-bold disabled:opacity-30"
            >
              下一页
            </button>
          </div>
        )}
      </div>
    </motion.section>
  );
}
