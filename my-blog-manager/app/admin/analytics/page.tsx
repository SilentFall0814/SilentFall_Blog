"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Eye, Users, Wifi, MapPin, Activity, TrendingUp, Zap,
  RefreshCw, AlertCircle, FileText, MessageSquare, BookOpen,
  Clock, ShieldCheck, BarChart3, Calendar
} from 'lucide-react';
import Navbar from '../../../components/Navbar';
import PageTransition from '../../../components/PageTransition';
import { ToastProvider, useToast } from '../../../components/ToastProvider';
import { useECharts, EChartsOption } from '../../../hooks/useECharts';
import Link from 'next/link';

/* ========== 类型定义 ========== */

interface OverviewData {
  total_pv: number;
  total_uv: number;
  today_pv: number;
  today_uv: number;
  comments_count: number;
  pending_comments: number;
  guest_moments_count: number;
  pending_moments: number;
  total_article_count?: number;
  total_message_count?: number;
}

interface TrendItem {
  date: string;
  pv: number;
  uv: number;
}

interface IpLocation {
  city: string;
  count: number;
}

interface ProvinceItem {
  name: string;
  value: number;
}

interface ArticleTopItem {
  title: string;
  viewCount: number;
}

/* ========== API 工具函数 ========== */

async function fetchAnalytics<T>(path: string, params?: Record<string, string>): Promise<T | null> {
  try {
    const url = new URL('/api/analytics', window.location.origin);
    url.searchParams.set('path', path);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }
    const res = await fetch(url.toString(), { cache: 'no-store' });
    const data = await res.json();
    if (data.success && data.data !== null && data.data !== undefined) {
      return data.data as T;
    }
    return null;
  } catch {
    return null;
  }
}

/* ========== 日期工具 ========== */

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return formatDate(d);
}

/* ========== ECharts 配色主题（适配当前项目 indigo 风格） ========== */

const CHART_COLORS = {
  primary: '#6366f1',     // indigo-500
  secondary: '#a78bfa',   // violet-400
  accent: '#818cf8',      // indigo-400
  text: '#64748b',        // slate-500
  textLight: '#94a3b8',   // slate-400
  grid: '#e2e8f0',        // slate-200
  darkText: '#1e293b',    // slate-800
  pie: [
    '#6366f1', '#a78bfa', '#818cf8', '#c4b5fd', '#e0e7ff',
    '#4f46e5', '#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95'
  ],
};

/* ========== 图表子组件 ========== */

// 根据 begin/end 日期字符串计算天数差
function calcDays(begin: string, end: string): number {
  try {
    const b = new Date(begin);
    const e = new Date(end);
    const diff = Math.ceil((e.getTime() - b.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(diff, 1);
  } catch {
    return 7;
  }
}

// 浏览量趋势折线图
function ViewTrendChart({ begin, end }: { begin: string; end: string }) {
  const { chartRef, setOption } = useECharts();
  const [loading, setLoading] = useState(true);
  const [noData, setNoData] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNoData(false);

    const days = calcDays(begin, end);
    fetchAnalytics<TrendItem[]>('trend', { days: String(days) }).then(data => {
      if (cancelled) return;
      setLoading(false);
      if (!data || data.length === 0) {
        setNoData(true);
        return;
      }

      const categories = data.map(d => {
        const parts = d.date.split('-');
        return parts.length >= 3 ? `${parts[1]}/${parts[2]}` : d.date;
      });
      const pvData = data.map(d => d.pv);

      setOption({
        tooltip: { trigger: 'axis' },
        grid: { left: 45, right: 20, top: 20, bottom: 30 },
        xAxis: {
          type: 'category',
          data: categories,
          axisLine: { lineStyle: { color: CHART_COLORS.grid } },
          axisLabel: { color: CHART_COLORS.textLight, fontSize: 11 },
        },
        yAxis: {
          type: 'value',
          splitLine: { lineStyle: { color: '#f1f5f9' } },
          axisLabel: { color: CHART_COLORS.textLight, fontSize: 11 },
        },
        series: [{
          name: '浏览量',
          type: 'line',
          data: pvData,
          smooth: true,
          symbol: 'circle',
          symbolSize: 5,
          lineStyle: { color: CHART_COLORS.primary, width: 2 },
          itemStyle: { color: CHART_COLORS.primary },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: CHART_COLORS.primary + '33' },
                { offset: 1, color: CHART_COLORS.primary + '00' },
              ],
            },
          },
        }],
      });
    }).catch(() => {
      if (!cancelled) { setLoading(false); setNoData(true); }
    });

    return () => { cancelled = true; };
  }, [begin, end, setOption]);

  return (
    <ChartContainer loading={loading} noData={noData}>
      <div ref={chartRef} className="w-full h-[260px]" />
    </ChartContainer>
  );
}

// 访客数趋势折线图
function VisitorTrendChart({ begin, end }: { begin: string; end: string }) {
  const { chartRef, setOption } = useECharts();
  const [loading, setLoading] = useState(true);
  const [noData, setNoData] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNoData(false);

    fetchAnalytics<TrendItem[]>('trend', { days: String(calcDays(begin, end)) }).then(data => {
      if (cancelled) return;
      setLoading(false);
      if (!data || data.length === 0) {
        setNoData(true);
        return;
      }

      const categories = data.map(d => {
        const parts = d.date.split('-');
        return parts.length >= 3 ? `${parts[1]}/${parts[2]}` : d.date;
      });
      const uvData = data.map(d => d.uv);

      setOption({
        tooltip: { trigger: 'axis' },
        grid: { left: 45, right: 20, top: 20, bottom: 30 },
        xAxis: {
          type: 'category',
          data: categories,
          axisLine: { lineStyle: { color: CHART_COLORS.grid } },
          axisLabel: { color: CHART_COLORS.textLight, fontSize: 11 },
        },
        yAxis: {
          type: 'value',
          splitLine: { lineStyle: { color: '#f1f5f9' } },
          axisLabel: { color: CHART_COLORS.textLight, fontSize: 11 },
        },
        series: [{
          name: '访客数',
          type: 'line',
          data: uvData,
          smooth: true,
          symbol: 'circle',
          symbolSize: 5,
          lineStyle: { color: CHART_COLORS.secondary, width: 2 },
          itemStyle: { color: CHART_COLORS.secondary },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: CHART_COLORS.secondary + '33' },
                { offset: 1, color: CHART_COLORS.secondary + '00' },
              ],
            },
          },
        }],
      });
    }).catch(() => {
      if (!cancelled) { setLoading(false); setNoData(true); }
    });

    return () => { cancelled = true; };
  }, [begin, end, setOption]);

  return (
    <ChartContainer loading={loading} noData={noData}>
      <div ref={chartRef} className="w-full h-[260px]" />
    </ChartContainer>
  );
}

// 文章阅读量 TOP10 柱状图
function ArticleTop10Chart() {
  const { chartRef, setOption } = useECharts();
  const [loading, setLoading] = useState(true);
  const [noData, setNoData] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchAnalytics<ArticleTopItem[]>('article_top10').then(data => {
      if (cancelled) return;
      setLoading(false);
      if (!data || data.length === 0) {
        setNoData(true);
        return;
      }

      const titles = data.slice(0, 10).reverse().map(d =>
        d.title && d.title.length > 14 ? d.title.slice(0, 14) + '…' : d.title
      );
      const counts = data.slice(0, 10).reverse().map(d => d.viewCount);

      setOption({
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: 130, right: 20, top: 16, bottom: 24 },
        xAxis: {
          type: 'value',
          splitLine: { lineStyle: { color: '#f1f5f9' } },
          axisLabel: { color: CHART_COLORS.textLight, fontSize: 11 },
        },
        yAxis: {
          type: 'category',
          data: titles,
          axisLabel: { color: CHART_COLORS.text, fontSize: 12 },
          axisLine: { lineStyle: { color: CHART_COLORS.grid } },
        },
        series: [{
          name: '阅读量',
          type: 'bar',
          data: counts,
          barMaxWidth: 20,
          itemStyle: {
            color: CHART_COLORS.primary,
            borderRadius: [0, 4, 4, 0],
          },
        }],
      });
    }).catch(() => {
      if (!cancelled) { setLoading(false); setNoData(true); }
    });

    return () => { cancelled = true; };
  }, [setOption]);

  return (
    <ChartContainer loading={loading} noData={noData}>
      <div ref={chartRef} className="w-full h-[260px]" />
    </ChartContainer>
  );
}

// 访客省份分布饼图
function ProvincePieChart() {
  const { chartRef, setOption } = useECharts();
  const [loading, setLoading] = useState(true);
  const [noData, setNoData] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchAnalytics<ProvinceItem[]>('province_distribution').then(data => {
      if (cancelled) return;
      setLoading(false);
      if (!data || data.length === 0) {
        setNoData(true);
        return;
      }

      const pieData = data.map(d => ({
        name: d.name || '未知',
        value: d.value,
      }));

      setOption({
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        color: CHART_COLORS.pie,
        legend: {
          orient: 'vertical',
          right: 10,
          top: 'center',
          textStyle: { color: CHART_COLORS.text, fontSize: 12 },
          icon: 'circle',
        },
        series: [{
          name: '访客省份',
          type: 'pie',
          radius: ['40%', '68%'],
          center: ['38%', '50%'],
          avoidLabelOverlap: true,
          label: { show: false },
          labelLine: { show: false },
          data: pieData,
          itemStyle: { borderColor: '#fff', borderWidth: 2 },
        }],
      });
    }).catch(() => {
      if (!cancelled) { setLoading(false); setNoData(true); }
    });

    return () => { cancelled = true; };
  }, [setOption]);

  return (
    <ChartContainer loading={loading} noData={noData}>
      <div ref={chartRef} className="w-full h-[260px]" />
    </ChartContainer>
  );
}

/* ========== 通用图表容器 ========== */

function ChartContainer({ loading, noData, children }: {
  loading: boolean; noData: boolean; children: React.ReactNode;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[260px]">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (noData) {
    return (
      <div className="flex items-center justify-center h-[260px] text-slate-400 text-sm font-bold">
        暂无数据
      </div>
    );
  }
  return <>{children}</>;
}

/* ========== 日期范围选择器 ========== */

function DateRangePicker({
  begin, end, onChange,
}: {
  begin: string; end: string;
  onChange: (begin: string, end: string) => void;
}) {
  const shortcuts = [
    { label: '近7天', days: 7 },
    { label: '近14天', days: 14 },
    { label: '近30天', days: 30 },
  ];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {shortcuts.map(s => (
        <button
          key={s.days}
          onClick={() => onChange(daysAgo(s.days - 1), formatDate(new Date()))}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
            begin === daysAgo(s.days - 1)
              ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30'
              : 'bg-white/30 dark:bg-slate-800/30 text-slate-500 hover:bg-indigo-500/10 hover:text-indigo-500'
          }`}
        >
          {s.label}
        </button>
      ))}
      <div className="flex items-center gap-1 text-xs text-slate-400">
        <Calendar size={12} />
        <span>{begin} ~ {end}</span>
      </div>
    </div>
  );
}

/* ========== 主内容组件 ========== */

function AnalyticsContent() {
  const { showToast } = useToast();

  // 概览数据
  const [overview, setOverview] = useState<OverviewData | null>(null);
  // 趋势数据
  const [trend, setTrend] = useState<TrendItem[]>([]);
  // IP 归属地
  const [ipLocations, setIpLocations] = useState<IpLocation[]>([]);
  // 延迟和在线
  const [latency, setLatency] = useState<number | null>(null);
  const [onlineCount, setOnlineCount] = useState<number | null>(null);
  // 日期范围
  const [viewDateRange, setViewDateRange] = useState<[string, string]>([daysAgo(6), formatDate(new Date())]);
  const [visitorDateRange, setVisitorDateRange] = useState<[string, string]>([daysAgo(6), formatDate(new Date())]);
  // 状态
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // 获取所有数据
  const fetchAllData = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    setError(false);

    try {
      const [overviewData, trendData, ipData, latencyData, onlineData] = await Promise.all([
        fetchAnalytics<OverviewData>('overview'),
        fetchAnalytics<TrendItem[]>('trend', { days: '14' }),
        fetchAnalytics<IpLocation[]>('ip_locations'),
        fetchAnalytics<{ latency_ms: number }>('latency'),
        fetchAnalytics<{ online: number }>('online'),
      ]);

      if (overviewData) setOverview(overviewData);
      if (trendData) setTrend(trendData);
      if (ipData) setIpLocations(ipData);
      if (latencyData) setLatency(latencyData.latency_ms);
      if (onlineData) setOnlineCount(onlineData.online);

      const hasAnyData = overviewData || (trendData && trendData.length > 0) || (ipData && ipData.length > 0);
      if (!hasAnyData && !latencyData && !onlineData) {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  }, []);

  useEffect(() => {
    fetchAllData(true);
  }, [fetchAllData]);

  // 延迟和在线人数自动刷新（10秒）
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAnalytics<{ latency_ms: number }>('latency').then(d => {
        if (d) setLatency(d.latency_ms);
      });
      fetchAnalytics<{ online: number }>('online').then(d => {
        if (d) setOnlineCount(d.online);
      });
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // 趋势数据自动刷新（60秒）
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAnalytics<TrendItem[]>('trend', { days: '14' }).then(d => {
        if (d) setTrend(d);
      });
      fetchAnalytics<OverviewData>('overview').then(d => {
        if (d) setOverview(d);
      });
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    showToast('正在刷新数据...', 'info');
    fetchAllData(true);
  };

  const latencyColor = latency === null ? 'text-slate-400' : latency < 50 ? 'text-emerald-500' : latency < 100 ? 'text-amber-500' : 'text-red-500';
  const latencyLabel = latency === null ? '未知' : latency < 50 ? '正常' : latency < 100 ? '偏慢' : '异常';

  // 概览卡片配置
  const statCards = [
    {
      label: '总访问量',
      value: overview?.total_pv?.toLocaleString() ?? '—',
      icon: <Eye size={16} className="text-indigo-500" />,
      trend: overview && overview.today_pv > 0 ? `今日 +${overview.today_pv}` : '',
      trendColor: 'text-emerald-500',
    },
    {
      label: '访客数',
      value: overview?.total_uv?.toLocaleString() ?? '—',
      icon: <Users size={16} className="text-violet-500" />,
      trend: overview && overview.today_uv > 0 ? `今日 +${overview.today_uv}` : '',
      trendColor: 'text-emerald-500',
    },
    {
      label: '网络延迟',
      value: latency !== null ? `${latency}ms` : '—',
      icon: <Wifi size={16} className={latencyColor} />,
      trend: latencyLabel,
      trendColor: latencyColor,
    },
    {
      label: '在线人数',
      value: onlineCount !== null ? onlineCount.toString() : '—',
      icon: <Zap size={16} className="text-amber-500" />,
      trend: '实时',
      trendColor: 'text-indigo-500',
    },
  ];

  return (
    <div className="min-h-screen relative pb-10">
      <Navbar />
      <PageTransition>
        <main className="w-[95%] max-w-7xl mx-auto mt-24 relative z-10">
          {/* 页面标题 */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tighter">
                运行监控
              </h1>
              <p className="text-slate-500 text-sm mt-2 font-bold">
                博客运行数据与实时状态监控面板
                {lastRefresh && (
                  <span className="text-slate-400 ml-2">
                    · 上次刷新 {lastRefresh.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl text-sm font-bold hover:bg-indigo-500/20 transition-colors flex items-center gap-2"
            >
              <RefreshCw size={14} /> 刷新
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-32">
              <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-slate-400 font-bold text-sm">正在连接后端服务...</span>
              </div>
            </div>
          ) : error ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-32"
            >
              <div className="w-16 h-16 bg-red-500/10 rounded-3xl flex items-center justify-center mb-6">
                <AlertCircle size={32} className="text-red-500" />
              </div>
              <h2 className="text-xl font-black text-slate-800 dark:text-white mb-2">无法连接后端服务</h2>
              <p className="text-slate-500 text-sm mb-6 text-center max-w-md">
                请确保 Python 后端服务已启动，且数据库连接正常。
                <br />后端端口配置在 <code className="text-indigo-500">public/backend_config.json</code>
              </p>
              <button
                onClick={handleRefresh}
                className="px-6 py-3 bg-indigo-500 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-500/30 hover:bg-indigo-600 transition-all"
              >
                重新连接
              </button>
            </motion.div>
          ) : (
            <>
              {/* 概览卡片 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {statCards.map((card, index) => (
                  <motion.div
                    key={card.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-xl"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {card.label}
                      </span>
                      {card.icon}
                    </div>
                    <div className="text-3xl font-black text-slate-800 dark:text-white">
                      {card.value}
                    </div>
                    <div className={`text-xs font-bold mt-2 ${card.trendColor}`}>
                      {card.trend}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* 内容统计卡片（来自参考项目概览） */}
              {overview && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="mb-8 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-slate-800/50 rounded-[40px] p-8 shadow-xl"
                >
                  <h2 className="text-lg font-black text-slate-800 dark:text-white mb-6">内容统计</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white/30 dark:bg-slate-800/30 rounded-2xl p-4 border border-white/20 dark:border-slate-700/30 text-center">
                      <div className="text-2xl font-black text-indigo-500">{overview.total_article_count ?? '—'}</div>
                      <div className="text-[10px] text-slate-400 font-bold mt-1">文章总数</div>
                    </div>
                    <div className="bg-white/30 dark:bg-slate-800/30 rounded-2xl p-4 border border-white/20 dark:border-slate-700/30 text-center">
                      <div className="text-2xl font-black text-emerald-500">{overview.comments_count}</div>
                      <div className="text-[10px] text-slate-400 font-bold mt-1">已通过评论</div>
                    </div>
                    <div className="bg-white/30 dark:bg-slate-800/30 rounded-2xl p-4 border border-white/20 dark:border-slate-700/30 text-center">
                      <div className="text-2xl font-black text-amber-500">{overview.pending_comments}</div>
                      <div className="text-[10px] text-slate-400 font-bold mt-1">待审核评论</div>
                    </div>
                    <div className="bg-white/30 dark:bg-slate-800/30 rounded-2xl p-4 border border-white/20 dark:border-slate-700/30 text-center">
                      <div className="text-2xl font-black text-violet-500">{overview.guest_moments_count}</div>
                      <div className="text-[10px] text-slate-400 font-bold mt-1">已通过说说</div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 浏览量趋势 + 访客数趋势（ECharts 折线图） */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-slate-800/50 rounded-[40px] p-8 shadow-xl"
                >
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <Activity size={18} className="text-indigo-500" />
                      <h2 className="text-lg font-black text-slate-800 dark:text-white">浏览量趋势</h2>
                    </div>
                    <DateRangePicker
                      begin={viewDateRange[0]}
                      end={viewDateRange[1]}
                      onChange={(b, e) => setViewDateRange([b, e])}
                    />
                  </div>
                  <ViewTrendChart begin={viewDateRange[0]} end={viewDateRange[1]} />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-slate-800/50 rounded-[40px] p-8 shadow-xl"
                >
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <Users size={18} className="text-violet-500" />
                      <h2 className="text-lg font-black text-slate-800 dark:text-white">访客数趋势</h2>
                    </div>
                    <DateRangePicker
                      begin={visitorDateRange[0]}
                      end={visitorDateRange[1]}
                      onChange={(b, e) => setVisitorDateRange([b, e])}
                    />
                  </div>
                  <VisitorTrendChart begin={visitorDateRange[0]} end={visitorDateRange[1]} />
                </motion.div>
              </div>

              {/* 文章 TOP10 + 省份分布 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                  className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-slate-800/50 rounded-[40px] p-8 shadow-xl"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <BarChart3 size={18} className="text-indigo-500" />
                    <h2 className="text-lg font-black text-slate-800 dark:text-white">阅读量 TOP 10</h2>
                  </div>
                  <ArticleTop10Chart />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                  className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-slate-800/50 rounded-[40px] p-8 shadow-xl"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <MapPin size={18} className="text-violet-500" />
                    <h2 className="text-lg font-black text-slate-800 dark:text-white">访客省份分布</h2>
                  </div>
                  <ProvincePieChart />
                </motion.div>
              </div>

              {/* IP 归属地列表 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.5 }}
                className="mb-6 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-slate-800/50 rounded-[40px] p-8 shadow-xl"
              >
                <div className="flex items-center gap-3 mb-6">
                  <MapPin size={18} className="text-indigo-500" />
                  <h2 className="text-lg font-black text-slate-800 dark:text-white">IP 归属地</h2>
                </div>

                {ipLocations.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {ipLocations.map(loc => (
                      <div
                        key={loc.city}
                        className="flex items-center justify-between bg-white/30 dark:bg-slate-800/30 rounded-2xl p-4 border border-white/20 dark:border-slate-700/30"
                      >
                        <div className="flex items-center gap-2">
                          <MapPin size={12} className="text-indigo-500" />
                          <span className="text-sm font-bold text-slate-800 dark:text-white truncate">
                            {loc.city}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 font-bold ml-2 whitespace-nowrap">{loc.count} 次</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-24 text-slate-400 text-sm font-bold">
                    暂无IP归属地数据
                  </div>
                )}
              </motion.div>

              {/* 快捷入口 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0, duration: 0.5 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <Link
                  href="/admin/visitors"
                  className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-slate-800/50 rounded-[32px] p-6 shadow-xl hover:shadow-2xl transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                      <Users size={20} className="text-indigo-500" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-800 dark:text-white">访客管理</h3>
                      <p className="text-xs text-slate-400 mt-1">查看访客列表、封禁/解封操作</p>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/admin/view-records"
                  className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-slate-800/50 rounded-[32px] p-6 shadow-xl hover:shadow-2xl transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-violet-500/10 rounded-2xl flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
                      <FileText size={20} className="text-violet-500" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-800 dark:text-white">访问记录</h3>
                      <p className="text-xs text-slate-400 mt-1">浏览记录查询与管理</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            </>
          )}
        </main>
      </PageTransition>
    </div>
  );
}

/* ========== 导出页面组件 ========== */

export default function AnalyticsPage() {
  return (
    <ToastProvider>
      <AnalyticsContent />
    </ToastProvider>
  );
}
