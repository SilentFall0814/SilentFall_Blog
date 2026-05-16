"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Eye, EyeOff, CheckCircle, RefreshCw, PenLine } from 'lucide-react';

interface GuestMoment {
  id: string;
  author: string;
  email: string;
  avatar: string;
  content: string;
  status: string;
  created_at: string;
}

export default function GuestMomentSection() {
  const [moments, setMoments] = useState<GuestMoment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, rejected: 0 });
  const pageSize = 20;

  const fetchMoments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/guest-moments?status=${filter}&page=${page}&page_size=${pageSize}`);
      const data = await res.json();
      if (data.success) {
        setMoments(data.data);
        setTotal(data.total);
      }
    } catch (e) {
      console.error('获取访客说说失败', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/guest-moments/stats');
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch {}
  };

  useEffect(() => {
    fetchMoments();
    fetchStats();
  }, [page, filter]);

  const handleStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/guest-moments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        fetchMoments();
        fetchStats();
      }
    } catch {}
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条访客说说吗？此操作不可恢复！')) return;
    try {
      const res = await fetch(`/api/guest-moments/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchMoments();
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
      rejected: { label: '已拒绝', cls: 'bg-red-500/10 text-red-500' },
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
              <PenLine size={22} className="text-indigo-500" /> 访客说说审核
            </h2>
            <p className="text-slate-500 text-sm mt-1 font-bold">审核访客发布的说说内容，通过后将在前台显示</p>
          </div>
          <button
            onClick={() => { fetchMoments(); fetchStats(); }}
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
            { label: '已拒绝', value: stats.rejected, color: 'text-red-500', key: 'rejected' },
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
          ) : moments.length === 0 ? (
            <div className="text-center py-12 text-slate-400">暂无访客说说</div>
          ) : (
            moments.map(m => (
              <div
                key={m.id}
                className="bg-white/30 dark:bg-slate-800/30 rounded-2xl p-4 border border-white/20 dark:border-slate-700/30"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={m.avatar || `https://cravatar.cn/avatar/?d=mp&s=64`}
                    alt=""
                    className="w-9 h-9 rounded-full shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-800 dark:text-white">{m.author}</span>
                      {m.email && <span className="text-[10px] text-slate-400">{m.email}</span>}
                      {statusBadge(m.status)}
                      <span className="text-[11px] text-slate-400 ml-auto">{formatDate(m.created_at)}</span>
                    </div>
                    <div
                      className="text-sm text-slate-700 dark:text-slate-300 mt-2 leading-relaxed prose prose-sm dark:prose-invert max-w-none [&_p]:mb-1 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_ul]:list-disc [&_ol]:list-decimal [&_pre]:bg-slate-100 [&_pre]:dark:bg-slate-800 [&_pre]:rounded-lg [&_pre]:p-2 [&_code]:text-indigo-500"
                      dangerouslySetInnerHTML={{ __html: m.content }}
                    />
                    <div className="flex items-center gap-2 mt-3">
                      {m.status !== 'approved' && (
                        <button
                          onClick={() => handleStatus(m.id, 'approved')}
                          className="flex items-center gap-1 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-bold hover:bg-emerald-500/20"
                        >
                          <CheckCircle size={12} /> 通过
                        </button>
                      )}
                      {m.status !== 'rejected' && (
                        <button
                          onClick={() => handleStatus(m.id, 'rejected')}
                          className="flex items-center gap-1 px-3 py-1 bg-red-500/10 text-red-500 rounded-lg text-xs font-bold hover:bg-red-500/20"
                        >
                          <EyeOff size={12} /> 拒绝
                        </button>
                      )}
                      {m.status !== 'pending' && (
                        <button
                          onClick={() => handleStatus(m.id, 'pending')}
                          className="flex items-center gap-1 px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg text-xs font-bold hover:bg-amber-500/20"
                        >
                          <Eye size={12} /> 待审核
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(m.id)}
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
