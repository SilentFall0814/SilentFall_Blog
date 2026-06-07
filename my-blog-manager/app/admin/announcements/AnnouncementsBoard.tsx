"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BackButton from '../../../components/BackButton';
import { useToast } from '../../../components/ToastProvider';
import { Plus, Pencil, Trash2, Megaphone, FileEdit, Eye, EyeOff, Save, X } from 'lucide-react';

interface Announcement {
  id: string;
  content: string;
  status: 'draft' | 'published';
  publish_time: string | null;
  created_at: string;
  updated_at: string;
}

export default function AnnouncementsBoard() {
  const { showToast } = useToast();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');

  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    mode: 'add' | 'edit';
    data: Partial<Announcement>;
  }>({ isOpen: false, mode: 'add', data: {} });

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    id: string | null;
  }>({ isOpen: false, id: null });

  const [stats, setStats] = useState({ total: 0, published: 0, draft: 0 });

  const getApiBase = useCallback(async () => {
    try {
      const configRes = await fetch(`/backend_config.json?t=${Date.now()}`);
      const config = await configRes.json();
      return `http://127.0.0.1:${config.api_port}`;
    } catch {
      return 'http://127.0.0.1:8765';
    }
  }, []);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const base = await getApiBase();
      const res = await fetch(`${base}/api/announcements/admin/all?status=${filterStatus}&page=1&page_size=100`);
      const data = await res.json();
      if (data.success) {
        setAnnouncements(data.data);
      }
    } catch (error: any) {
      showToast(`加载公告失败: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, getApiBase, showToast]);

  const fetchStats = useCallback(async () => {
    try {
      const base = await getApiBase();
      const res = await fetch(`${base}/api/announcements/admin/stats`);
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch {}
  }, [getApiBase]);

  useEffect(() => {
    fetchAnnouncements();
    fetchStats();
  }, [fetchAnnouncements, fetchStats]);

  const handleSave = async () => {
    const { mode, data } = editModal;
    if (!data.content?.trim()) {
      showToast("公告内容不能为空", "warning");
      return;
    }

    try {
      const base = await getApiBase();
      let res: Response;

      if (mode === 'add') {
        res = await fetch(`${base}/api/announcements/admin/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: data.content,
            status: data.status || 'draft',
          }),
        });
      } else {
        res = await fetch(`${base}/api/announcements/admin/update/${data.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: data.content,
            status: data.status,
          }),
        });
      }

      if (!res.ok) {
        let errorMsg = `HTTP ${res.status}`;
        try {
          const errData = await res.json();
          errorMsg += `: ${errData.message || errData.detail || JSON.stringify(errData)}`;
        } catch {}
        showToast(`操作失败: ${errorMsg}`, "error");
        return;
      }

      const result = await res.json();
      if (result.success) {
        showToast(mode === 'add' ? "✅ 公告创建成功" : "✅ 公告更新成功", "success");
        setEditModal({ isOpen: false, mode: 'add', data: {} });
        fetchAnnouncements();
        fetchStats();
      } else {
        showToast(`操作失败: ${result.message || '未知错误'}`, "error");
      }
    } catch (error: any) {
      showToast(`请求失败: ${error.message}`, "error");
    }
  };

  const handleToggleStatus = async (item: Announcement) => {
    const newStatus = item.status === 'published' ? 'draft' : 'published';
    try {
      const base = await getApiBase();
      const res = await fetch(`${base}/api/announcements/admin/update/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        let errorMsg = `HTTP ${res.status}`;
        try {
          const errData = await res.json();
          errorMsg += `: ${errData.message || errData.detail || JSON.stringify(errData)}`;
        } catch {}
        showToast(`操作失败: ${errorMsg}`, "error");
        return;
      }

      const result = await res.json();
      if (result.success) {
        showToast(newStatus === 'published' ? "📢 公告已发布" : "📝 公告已转为草稿", "success");
        fetchAnnouncements();
        fetchStats();
      } else {
        showToast(`操作失败: ${result.message || '未知错误'}`, "error");
      }
    } catch (error: any) {
      showToast(`请求失败: ${error.message}`, "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.id) return;
    try {
      const base = await getApiBase();
      const res = await fetch(`${base}/api/announcements/admin/${deleteModal.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        let errorMsg = `HTTP ${res.status}`;
        try {
          const errData = await res.json();
          errorMsg += `: ${errData.message || errData.detail || JSON.stringify(errData)}`;
        } catch {}
        showToast(`删除失败: ${errorMsg}`, "error");
        return;
      }

      const result = await res.json();
      if (result.success) {
        showToast("🗑️ 公告已删除", "success");
        setDeleteModal({ isOpen: false, id: null });
        fetchAnnouncements();
        fetchStats();
      } else {
        showToast(`删除失败: ${result.message || '未知错误'}`, "error");
      }
    } catch (error: any) {
      showToast(`请求失败: ${error.message}`, "error");
    }
  };

  const formatTime = (isoStr: string | null) => {
    if (!isoStr) return '—';
    const d = new Date(isoStr);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const truncate = (str: string, len: number) =>
    str.length > len ? str.slice(0, len) + '…' : str;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-10 py-10 relative z-10">

      {/* 删除确认弹窗 */}
      <AnimatePresence>
        {deleteModal.isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteModal({ isOpen: false, id: null })} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[40px] shadow-2xl border border-white/50 p-10 text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6"><Trash2 className="text-red-500" /></div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">删除公告？</h3>
              <p className="text-sm text-slate-500 mb-8">确认删除该公告吗？此操作不可撤销。</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteModal({ isOpen: false, id: null })} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-black uppercase">取消</button>
                <button onClick={handleDelete} className="flex-1 py-4 bg-red-500 text-white rounded-2xl text-xs font-black uppercase shadow-lg">确认删除</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 编辑/创建弹窗 */}
      <AnimatePresence>
        {editModal.isOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setEditModal({ ...editModal, isOpen: false })} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="relative w-full max-w-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[40px] border border-white/20 p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black dark:text-white flex items-center gap-2">
                  <Megaphone className="text-indigo-500" />
                  {editModal.mode === 'add' ? '创建公告' : '编辑公告'}
                </h2>
                <button onClick={() => setEditModal({ ...editModal, isOpen: false })} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  <X size={16} className="text-slate-500" />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">公告内容 *</label>
                  <textarea
                    value={editModal.data.content || ''}
                    onChange={e => setEditModal({ ...editModal, data: { ...editModal.data, content: e.target.value } })}
                    rows={6}
                    className="w-full bg-slate-100 dark:bg-black/20 rounded-2xl px-5 py-4 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 border-none resize-none leading-relaxed"
                    placeholder="输入公告内容（支持纯文本）..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">发布状态</label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setEditModal({ ...editModal, data: { ...editModal.data, status: 'draft' } })}
                      className={`flex-1 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${editModal.data.status === 'draft' ? 'bg-amber-500/20 text-amber-600 border-2 border-amber-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-2 border-transparent'}`}
                    >
                      <FileEdit size={16} /> 草稿
                    </button>
                    <button
                      onClick={() => setEditModal({ ...editModal, data: { ...editModal.data, status: 'published' } })}
                      className={`flex-1 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${editModal.data.status === 'published' ? 'bg-emerald-500/20 text-emerald-600 border-2 border-emerald-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-2 border-transparent'}`}
                    >
                      <Eye size={16} /> 发布
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button onClick={() => setEditModal({ ...editModal, isOpen: false })} className="flex-1 py-3 text-slate-500 font-bold uppercase text-xs">取消</button>
                <button onClick={handleSave} className="flex-1 py-4 bg-indigo-500 text-white rounded-2xl font-black shadow-lg flex items-center justify-center gap-2"><Save size={18} /> 保存</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 页面头部 */}
      <div className="mb-8 flex flex-col items-center md:items-start">
        <div className="w-full flex justify-start mb-6"><BackButton /></div>
        <div className="text-center md:text-left w-full">
          <h1 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white mb-2 md:mb-4 tracking-widest uppercase">Announcements</h1>
          <p className="text-slate-600 dark:text-slate-400 font-serif italic opacity-80 flex items-center justify-center md:justify-start gap-2">
            <Megaphone size={14} className="text-indigo-500" /> 公告管理 — 创建、发布与撤回
          </p>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: '全部', value: stats.total, color: 'text-slate-700 dark:text-slate-200', bg: 'bg-white/40 dark:bg-slate-800/40' },
          { label: '已发布', value: stats.published, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: '草稿', value: stats.draft, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} backdrop-blur-xl rounded-2xl border border-white/20 dark:border-white/10 p-4 text-center`}>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* 操作栏 */}
      <div className="mb-6 flex flex-col sm:flex-row items-center gap-4 w-full">
        <div className="flex bg-white/40 dark:bg-slate-800/40 backdrop-blur-md rounded-full p-1 border border-white/20 dark:border-white/10">
          {(['all', 'published', 'draft'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${filterStatus === s ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              {s === 'all' ? '全部' : s === 'published' ? '已发布' : '草稿'}
            </button>
          ))}
        </div>

        <div className="ml-auto">
          <button
            onClick={() => setEditModal({ isOpen: true, mode: 'add', data: { status: 'draft' } })}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 text-white rounded-full text-xs font-black shadow-lg shadow-indigo-500/30 hover:bg-indigo-600 transition-colors"
          >
            <Plus size={16} /> 创建公告
          </button>
        </div>
      </div>

      {/* 公告列表 */}
      {loading ? (
        <div className="text-center py-20 text-slate-400">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm font-serif">加载中...</p>
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/20 dark:border-white/10 flex items-center justify-center">
            <Megaphone className="w-10 h-10 text-slate-400" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-serif text-lg mb-2">暂无公告</p>
          <p className="text-slate-400 dark:text-slate-500 text-sm font-serif">点击上方按钮创建第一条公告</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {announcements.map(item => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="group bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl p-5 hover:shadow-lg transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${item.status === 'published' ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
                    {item.status === 'published' ? <Eye size={18} className="text-emerald-500" /> : <FileEdit size={18} className="text-amber-500" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800 dark:text-white leading-relaxed whitespace-pre-wrap">
                      {truncate(item.content, 120)}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400 font-mono">
                      <span>创建: {formatTime(item.created_at)}</span>
                      {item.publish_time && <span>发布: {formatTime(item.publish_time)}</span>}
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${item.status === 'published' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-500'}`}>
                        {item.status === 'published' ? '已发布' : '草稿'}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={() => handleToggleStatus(item)}
                      className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                      title={item.status === 'published' ? '转为草稿' : '发布'}
                    >
                      {item.status === 'published' ? <EyeOff size={14} className="text-amber-500" /> : <Eye size={14} className="text-emerald-500" />}
                    </button>
                    <button
                      onClick={() => setEditModal({ isOpen: true, mode: 'edit', data: item })}
                      className="w-8 h-8 rounded-lg bg-indigo-500 text-white flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteModal({ isOpen: true, id: item.id })}
                      className="w-8 h-8 rounded-lg bg-red-500 text-white flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
