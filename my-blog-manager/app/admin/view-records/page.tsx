"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FileText, Search, RotateCcw, Trash2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import Navbar from '../../../components/Navbar';
import PageTransition from '../../../components/PageTransition';
import { ToastProvider, useToast } from '../../../components/ToastProvider';

/* ========== 类型定义 ========== */

interface ViewRecord {
  id: string;
  pageTitle: string;
  pagePath: string;
  ipAddress: string;
  referer: string;
  viewTime: string;
}

interface ViewRecordPageData {
  records: ViewRecord[];
  total: number;
}

/* ========== API 工具 ========== */

async function fetchViewRecords(params: Record<string, string>): Promise<ViewRecordPageData | null> {
  try {
    const url = new URL('/api/view-records', window.location.origin);
    Object.entries(params).forEach(([k, v]) => {
      if (v) url.searchParams.set(k, v);
    });
    // 添加时间戳强制绕过浏览器缓存
    url.searchParams.set('_t', Date.now().toString());
    const res = await fetch(url.toString(), { cache: 'no-store' });
    const data = await res.json();
    if (data.success && data.data) return data.data as ViewRecordPageData;
    return null;
  } catch {
    return null;
  }
}

async function deleteViewRecords(ids: string[]): Promise<{ success: boolean; message: string; deletedCount?: number }> {
  try {
    const res = await fetch('/api/view-records', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    const data = await res.json();
    return { success: data.success === true, message: data.message, deletedCount: data.deletedCount };
  } catch (e: any) {
    return { success: false, message: e.message || '网络错误' };
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

function ViewRecordsContent() {
  const { showToast } = useToast();

  // 搜索表单
  const [searchForm, setSearchForm] = useState({
    pagePath: '', visitorId: '',
  });
  // 分页
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  // 数据
  const [records, setRecords] = useState<ViewRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  // 选中行
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await fetchViewRecords({
        page: page.toString(),
        pageSize: pageSize.toString(),
        pagePath: searchForm.pagePath,
        visitorId: searchForm.visitorId,
      });
      if (data) {
        setRecords(data.records ?? []);
        setTotal(data.total ?? 0);
      } else {
        setRecords([]);
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
    setSearchForm({ pagePath: '', visitorId: '' });
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
    if (selectedIds.size === records.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(records.map(r => r.id)));
    }
  };

  const handleDelete = async (ids: string[]) => {
    if (ids.length === 0) return;
    const result = await deleteViewRecords(ids);
    if (result.success) {
      showToast(result.message || '删除成功', 'success');
      setSelectedIds(new Set());
      // 删除后重新获取数据
      setLoading(true);
      setError(false);
      try {
        const data = await fetchViewRecords({
          page: '1',
          pageSize: pageSize.toString(),
          pagePath: searchForm.pagePath,
          visitorId: searchForm.visitorId,
        });
        if (data) {
          setRecords(data.records ?? []);
          setTotal(data.total ?? 0);
          setPage(1);
        } else {
          setRecords([]);
          setTotal(0);
          setPage(1);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    } else {
      showToast(result.message || '删除失败', 'error');
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
            <FileText size={28} className="text-violet-500" />
            <div>
              <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter">访问记录</h1>
              <p className="text-slate-500 text-sm mt-1 font-bold">浏览记录查询与管理</p>
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
                placeholder="搜索页面路径"
                value={searchForm.pagePath}
                onChange={e => setSearchForm(f => ({ ...f, pagePath: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="w-56 bg-white/50 dark:bg-slate-800/50 border border-white/30 dark:border-slate-700/30 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
              <input
                type="text"
                placeholder="访客 ID"
                value={searchForm.visitorId}
                onChange={e => setSearchForm(f => ({ ...f, visitorId: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="w-36 bg-white/50 dark:bg-slate-800/50 border border-white/30 dark:border-slate-700/30 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
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
                <button
                  onClick={() => handleDelete(Array.from(selectedIds))}
                  className="px-3 py-2 bg-red-500/10 text-red-600 rounded-xl text-xs font-bold hover:bg-red-500/20 transition-all flex items-center gap-1"
                >
                  <Trash2 size={12} /> 批量删除 ({selectedIds.size})
                </button>
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
            ) : records.length === 0 ? (
              <div className="flex items-center justify-center py-20 text-slate-400 text-sm font-bold">
                暂无访问记录
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200/50 dark:border-slate-700/50">
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedIds.size === records.length && records.length > 0}
                          onChange={toggleSelectAll}
                          className="rounded border-slate-300 text-indigo-500 focus:ring-indigo-500"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">页面标题</th>
                      <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">页面路径</th>
                      <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">访客 IP</th>
                      <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">来源</th>
                      <th className="px-4 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">浏览时间</th>
                      <th className="px-4 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map(r => (
                      <tr key={r.id} className="border-b border-slate-100/50 dark:border-slate-800/50 hover:bg-white/20 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(r.id)}
                            onChange={() => toggleSelect(r.id)}
                            className="rounded border-slate-300 text-indigo-500 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="px-4 py-3 text-slate-800 dark:text-white truncate max-w-[200px]" title={r.pageTitle}>
                          {r.pageTitle || '-'}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300 truncate max-w-[180px]" title={r.pagePath}>
                          {r.pagePath || '-'}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-800 dark:text-white">{r.ipAddress || '-'}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300 truncate max-w-[160px]" title={r.referer}>
                          {r.referer || '-'}
                        </td>
                        <td className="px-4 py-3 text-center text-xs text-slate-400">{fmtDate(r.viewTime)}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleDelete([r.id])}
                            className="px-3 py-1 bg-red-500/10 text-red-600 rounded-lg text-xs font-bold hover:bg-red-500/20 transition-all"
                          >
                            删除
                          </button>
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

export default function ViewRecordsPage() {
  return (
    <ToastProvider>
      <ViewRecordsContent />
    </ToastProvider>
  );
}
