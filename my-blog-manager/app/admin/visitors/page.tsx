"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, RotateCcw, ShieldOff, ShieldCheck, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import Navbar from '../../../components/Navbar';
import PageTransition from '../../../components/PageTransition';
import { ToastProvider, useToast } from '../../../components/ToastProvider';

/* ========== 类型定义 ========== */

interface Visitor {
  id: string;
  ip: string;
  country: string;
  province: string;
  city: string;
  totalViews: number;
  isBlocked: boolean;
  firstVisitTime: string;
  lastVisitTime: string;
  expiresAt: string | null;
}

interface VisitorPageData {
  records: Visitor[];
  total: number;
}

/* ========== API 工具 ========== */

async function fetchVisitors(params: Record<string, string>): Promise<VisitorPageData | null> {
  try {
    const url = new URL('/api/visitors', window.location.origin);
    Object.entries(params).forEach(([k, v]) => {
      if (v) url.searchParams.set(k, v);
    });
    const res = await fetch(url.toString(), { cache: 'no-store' });
    const data = await res.json();
    if (data.success && data.data) return data.data as VisitorPageData;
    return null;
  } catch {
    return null;
  }
}

async function blockVisitor(ids: string[], action: 'block' | 'unblock'): Promise<boolean> {
  try {
    const res = await fetch('/api/visitors', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ids }),
    });
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}

/* ========== 格式化工具 ========== */

function fmtDate(d: string | null | undefined): string {
  if (!d) return '-';
  try {
    return new Date(d).toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return '-';
  }
}

/* ========== 主内容组件 ========== */

function VisitorsContent() {
  const { showToast } = useToast();

  // 搜索表单
  const [searchForm, setSearchForm] = useState({
    country: '', province: '', city: '', status: '',
  });
  // 分页
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  // 数据
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  // 选中行
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await fetchVisitors({
        page: page.toString(),
        pageSize: pageSize.toString(),
        country: searchForm.country,
        province: searchForm.province,
        city: searchForm.city,
        status: searchForm.status,
      });
      if (data) {
        setVisitors(data.records ?? []);
        setTotal(data.total ?? 0);
      } else {
        setVisitors([]);
        setTotal(0);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchForm]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = () => {
    setPage(1);
    setSelectedIds(new Set());
    loadData();
  };

  const handleReset = () => {
    setSearchForm({ country: '', province: '', city: '', status: '' });
    setPage(1);
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === visitors.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visitors.map(v => v.id)));
    }
  };

  const handleBlock = async (ids: string[]) => {
    if (ids.length === 0) return;
    const ok = await blockVisitor(ids, 'block');
    if (ok) {
      showToast('封禁成功', 'success');
      loadData();
    } else {
      showToast('封禁失败', 'error');
    }
  };

  const handleUnblock = async (ids: string[]) => {
    if (ids.length === 0) return;
    const ok = await blockVisitor(ids, 'unblock');
    if (ok) {
      showToast('解封成功', 'success');
      loadData();
    } else {
      showToast('解封失败', 'error');
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="min-h-screen relative pb-10">
      <Navbar />
      <PageTransition>
        <main className="w-[95%] max-w-7xl mx-auto mt-24 relative z-10">
          {/* 标题 */}
          <div className="flex items-center gap-3 mb-8">
            <Users size={28} className="text-indigo-500" />
            <div>
              <h1 className="text-2xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tighter">访客管理</h1>
              <p className="text-slate-500 text-sm mt-1 font-bold">查看访客列表、封禁/解封操作</p>
            </div>
          </div>

          {/* 搜索栏 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-slate-800/50 rounded-[32px] p-6 shadow-xl mb-6"
          >
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                placeholder="搜索国家"
                value={searchForm.country}
                onChange={e => setSearchForm(f => ({ ...f, country: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="w-40 bg-white/50 dark:bg-slate-800/50 border border-white/30 dark:border-slate-700/30 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
              <input
                type="text"
                placeholder="搜索省份"
                value={searchForm.province}
                onChange={e => setSearchForm(f => ({ ...f, province: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="w-40 bg-white/50 dark:bg-slate-800/50 border border-white/30 dark:border-slate-700/30 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
              <input
                type="text"
                placeholder="搜索城市"
                value={searchForm.city}
                onChange={e => setSearchForm(f => ({ ...f, city: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="w-40 bg-white/50 dark:bg-slate-800/50 border border-white/30 dark:border-slate-700/30 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
              <select
                value={searchForm.status}
                onChange={e => setSearchForm(f => ({ ...f, status: e.target.value }))}
                className="w-32 bg-white/50 dark:bg-slate-800/50 border border-white/30 dark:border-slate-700/30 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              >
                <option value="">全部状态</option>
                <option value="0">正常</option>
                <option value="1">已封禁</option>
              </select>
              <button
                onClick={handleSearch}
                className="px-4 py-2.5 bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/30 hover:bg-indigo-600 transition-all flex items-center gap-2"
              >
                <Search size={14} /> 查询
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2.5 bg-white/30 dark:bg-slate-800/30 text-slate-500 rounded-xl text-sm font-bold hover:bg-white/50 transition-all flex items-center gap-2"
              >
                <RotateCcw size={14} /> 重置
              </button>

              <div className="flex-1" />

              {selectedIds.size > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUnblock(Array.from(selectedIds))}
                    className="px-3 py-2 bg-emerald-500/10 text-emerald-600 rounded-xl text-xs font-bold hover:bg-emerald-500/20 transition-all flex items-center gap-1"
                  >
                    <ShieldCheck size={12} /> 批量解封 ({selectedIds.size})
                  </button>
                  <button
                    onClick={() => handleBlock(Array.from(selectedIds))}
                    className="px-3 py-2 bg-red-500/10 text-red-600 rounded-xl text-xs font-bold hover:bg-red-500/20 transition-all flex items-center gap-1"
                  >
                    <ShieldOff size={12} /> 批量封禁 ({selectedIds.size})
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          {/* 表格 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-slate-800/50 rounded-[32px] shadow-xl overflow-hidden"
          >
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20">
                <AlertCircle size={32} className="text-red-500 mb-4" />
                <p className="text-slate-500 text-sm font-bold">加载失败，请重试</p>
              </div>
            ) : visitors.length === 0 ? (
              <div className="flex items-center justify-center py-20 text-slate-400 text-sm font-bold">
                暂无访客数据
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200/50 dark:border-slate-700/50">
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedIds.size === visitors.length && visitors.length > 0}
                          onChange={toggleSelectAll}
                          className="rounded border-slate-300 text-indigo-500 focus:ring-indigo-500"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">IP 地址</th>
                      <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">国家</th>
                      <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">省份</th>
                      <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">城市</th>
                      <th className="px-4 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">浏览次数</th>
                      <th className="px-4 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">状态</th>
                      <th className="px-4 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">首次访问</th>
                      <th className="px-4 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">最近访问</th>
                      <th className="px-4 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visitors.map(v => (
                      <tr key={v.id} className="border-b border-slate-100/50 dark:border-slate-800/50 hover:bg-white/20 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(v.id)}
                            onChange={() => toggleSelect(v.id)}
                            className="rounded border-slate-300 text-indigo-500 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-800 dark:text-white">{v.ip}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300 truncate max-w-[80px]">{v.country || '-'}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300 truncate max-w-[100px]">{v.province || '-'}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300 truncate max-w-[100px]">{v.city || '-'}</td>
                        <td className="px-4 py-3 text-center font-bold text-slate-800 dark:text-white">{v.totalViews}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-black ${
                            v.isBlocked
                              ? 'bg-red-500/10 text-red-500'
                              : 'bg-emerald-500/10 text-emerald-500'
                          }`}>
                            {v.isBlocked ? '已封禁' : '正常'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-xs text-slate-400">{fmtDate(v.firstVisitTime)}</td>
                        <td className="px-4 py-3 text-center text-xs text-slate-400">{fmtDate(v.lastVisitTime)}</td>
                        <td className="px-4 py-3 text-center">
                          {v.isBlocked ? (
                            <button
                              onClick={() => handleUnblock([v.id])}
                              className="px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-500/20 transition-all"
                            >
                              解封
                            </button>
                          ) : (
                            <button
                              onClick={() => handleBlock([v.id])}
                              className="px-3 py-1 bg-red-500/10 text-red-600 rounded-lg text-xs font-bold hover:bg-red-500/20 transition-all"
                            >
                              封禁
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 分页 */}
            {!loading && !error && total > 0 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200/50 dark:border-slate-700/50">
                <span className="text-xs text-slate-400 font-bold">共 {total} 条</span>
                <div className="flex items-center gap-2">
                  <select
                    value={pageSize}
                    onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                    className="bg-white/50 dark:bg-slate-800/50 border border-white/30 dark:border-slate-700/30 rounded-lg px-2 py-1 text-xs outline-none"
                  >
                    {[10, 15, 20, 50].map(s => (
                      <option key={s} value={s}>{s} 条/页</option>
                    ))}
                  </select>
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="p-1.5 rounded-lg bg-white/30 dark:bg-slate-800/30 text-slate-500 hover:bg-indigo-500/10 hover:text-indigo-500 disabled:opacity-30 transition-all"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="text-xs text-slate-500 font-bold">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="p-1.5 rounded-lg bg-white/30 dark:bg-slate-800/30 text-slate-500 hover:bg-indigo-500/10 hover:text-indigo-500 disabled:opacity-30 transition-all"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </main>
      </PageTransition>
    </div>
  );
}

export default function VisitorsPage() {
  return (
    <ToastProvider>
      <VisitorsContent />
    </ToastProvider>
  );
}
