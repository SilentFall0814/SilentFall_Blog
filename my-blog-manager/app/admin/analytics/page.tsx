"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Eye, Users, Wifi, MapPin, Activity, TrendingUp, Zap, RefreshCw, AlertCircle } from 'lucide-react';
import Navbar from '../../../components/Navbar';
import PageTransition from '../../../components/PageTransition';
import { ToastProvider, useToast } from '../../../components/ToastProvider';

interface OverviewData {
  total_pv: number;
  total_uv: number;
  today_pv: number;
  today_uv: number;
  comments_count: number;
  pending_comments: number;
  guest_moments_count: number;
  pending_moments: number;
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

async function fetchAnalytics<T>(path: string, params?: string): Promise<T | null> {
  try {
    const url = `/api/analytics?path=${path}${params ? `&${params}` : ''}`;
    const res = await fetch(url, { cache: 'no-store' });
    const data = await res.json();
    if (data.success && data.data !== null && data.data !== undefined) {
      return data.data as T;
    }
    return null;
  } catch {
    return null;
  }
}

function AnalyticsContent() {
  const { showToast } = useToast();

  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [trend, setTrend] = useState<TrendItem[]>([]);
  const [ipLocations, setIpLocations] = useState<IpLocation[]>([]);
  const [latency, setLatency] = useState<number | null>(null);
  const [onlineCount, setOnlineCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchAllData = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    setError(false);

    try {
      const [overviewData, trendData, ipData, latencyData, onlineData] = await Promise.all([
        fetchAnalytics<OverviewData>('overview'),
        fetchAnalytics<TrendItem[]>('trend', 'days=14'),
        fetchAnalytics<IpLocation[]>('ip_locations'),
        fetchAnalytics<{ latency_ms: number }>('latency'),
        fetchAnalytics<{ online: number }>('online'),
      ]);

      if (overviewData) setOverview(overviewData);
      if (trendData) setTrend(trendData);
      if (ipData) setIpLocations(ipData);
      if (latencyData) setLatency(latencyData.latency_ms);
      if (onlineData) setOnlineCount(onlineData.online);

      const hasAnyData = overviewData || trendData.length > 0 || ipData.length > 0;
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

  useEffect(() => {
    const interval = setInterval(() => {
      fetchAnalytics<TrendItem[]>('trend', 'days=14').then(d => {
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

  const statCards = [
    {
      label: '总访问量',
      value: overview?.total_pv?.toLocaleString() ?? '—',
      sub: overview ? `今日 ${overview.today_pv}` : '',
      icon: <Eye size={16} className="text-indigo-500" />,
      trend: overview && overview.today_pv > 0 ? `今日 +${overview.today_pv}` : '',
      trendColor: 'text-emerald-500',
    },
    {
      label: '访客数',
      value: overview?.total_uv?.toLocaleString() ?? '—',
      sub: overview ? `今日 ${overview.today_uv}` : '',
      icon: <Users size={16} className="text-violet-500" />,
      trend: overview && overview.today_uv > 0 ? `今日 +${overview.today_uv}` : '',
      trendColor: 'text-emerald-500',
    },
    {
      label: '网络延迟',
      value: latency !== null ? `${latency}ms` : '—',
      sub: '',
      icon: <Wifi size={16} className={latencyColor} />,
      trend: latencyLabel,
      trendColor: latencyColor,
    },
    {
      label: '在线人数',
      value: onlineCount !== null ? onlineCount.toString() : '—',
      sub: '',
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
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter">
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
                请确保 Python 后端服务已启动，且 MongoDB 数据库连接正常。
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

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="lg:col-span-2 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-slate-800/50 rounded-[40px] p-8 shadow-xl"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <Activity size={18} className="text-indigo-500" />
                      <h2 className="text-lg font-black text-slate-800 dark:text-white">访问趋势</h2>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                        <span className="text-[10px] text-slate-400 font-bold">PV</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-violet-400" />
                        <span className="text-[10px] text-slate-400 font-bold">UV</span>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <TrendingUp size={14} className="text-emerald-500" />
                        <span className="text-xs text-emerald-500 font-bold">近14天</span>
                      </div>
                    </div>
                  </div>

                  {trend.length > 0 ? (
                    <TrendChart data={trend} />
                  ) : (
                    <div className="flex items-center justify-center h-48 text-slate-400 text-sm font-bold">
                      暂无访问趋势数据
                    </div>
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-slate-800/50 rounded-[40px] p-8 shadow-xl"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <MapPin size={18} className="text-indigo-500" />
                    <h2 className="text-lg font-black text-slate-800 dark:text-white">IP 归属地</h2>
                  </div>

                  {ipLocations.length > 0 ? (
                    <div className="space-y-3">
                      {ipLocations.map(loc => (
                        <div
                          key={loc.city}
                          className="flex items-center justify-between bg-white/30 dark:bg-slate-800/30 rounded-2xl p-4 border border-white/20 dark:border-slate-700/30"
                        >
                          <div className="flex items-center gap-3">
                            <MapPin size={14} className="text-indigo-500" />
                            <span className="text-sm font-bold text-slate-800 dark:text-white">
                              {loc.city}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400 font-bold">{loc.count} 次</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-48 text-slate-400 text-sm font-bold">
                      暂无IP归属地数据
                    </div>
                  )}
                </motion.div>
              </div>

              {overview && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className="mt-6 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-slate-800/50 rounded-[40px] p-8 shadow-xl"
                >
                  <h2 className="text-lg font-black text-slate-800 dark:text-white mb-6">内容统计</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white/30 dark:bg-slate-800/30 rounded-2xl p-4 border border-white/20 dark:border-slate-700/30 text-center">
                      <div className="text-2xl font-black text-indigo-500">{overview.comments_count}</div>
                      <div className="text-[10px] text-slate-400 font-bold mt-1">已通过评论</div>
                    </div>
                    <div className="bg-white/30 dark:bg-slate-800/30 rounded-2xl p-4 border border-white/20 dark:border-slate-700/30 text-center">
                      <div className="text-2xl font-black text-amber-500">{overview.pending_comments}</div>
                      <div className="text-[10px] text-slate-400 font-bold mt-1">待审核评论</div>
                    </div>
                    <div className="bg-white/30 dark:bg-slate-800/30 rounded-2xl p-4 border border-white/20 dark:border-slate-700/30 text-center">
                      <div className="text-2xl font-black text-emerald-500">{overview.guest_moments_count}</div>
                      <div className="text-[10px] text-slate-400 font-bold mt-1">已通过说说</div>
                    </div>
                    <div className="bg-white/30 dark:bg-slate-800/30 rounded-2xl p-4 border border-white/20 dark:border-slate-700/30 text-center">
                      <div className="text-2xl font-black text-amber-500">{overview.pending_moments}</div>
                      <div className="text-[10px] text-slate-400 font-bold mt-1">待审核说说</div>
                    </div>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </main>
      </PageTransition>
    </div>
  );
}

function TrendChart({ data }: { data: TrendItem[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: 220 });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  if (data.length === 0 || dimensions.width === 0) return null;

  const padding = { top: 20, right: 20, bottom: 30, left: 45 };
  const chartW = dimensions.width - padding.left - padding.right;
  const chartH = dimensions.height - padding.top - padding.bottom;

  const allValues = data.flatMap(d => [d.pv, d.uv]);
  const maxVal = Math.max(...allValues, 1);
  const minVal = 0;
  const range = maxVal - minVal || 1;

  const xStep = chartW / (data.length - 1);

  const getX = (i: number) => padding.left + i * xStep;
  const getY = (val: number) => padding.top + chartH - ((val - minVal) / range) * chartH;

  const pvPoints = data.map((d, i) => `${getX(i)},${getY(d.pv)}`).join(' ');
  const uvPoints = data.map((d, i) => `${getX(i)},${getY(d.uv)}`).join(' ');

  const pvAreaPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${getX(i)},${getY(d.pv)}`).join(' ') +
    ` L${getX(data.length - 1)},${padding.top + chartH} L${getX(0)},${padding.top + chartH} Z`;

  const uvAreaPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${getX(i)},${getY(d.uv)}`).join(' ') +
    ` L${getX(data.length - 1)},${padding.top + chartH} L${getX(0)},${padding.top + chartH} Z`;

  const gridLines = 5;
  const yTicks = Array.from({ length: gridLines }, (_, i) => {
    const val = minVal + (range / (gridLines - 1)) * i;
    return Math.round(val);
  });

  const formatDateLabel = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length >= 3) return `${parts[1]}/${parts[2]}`;
    return dateStr;
  };

  return (
    <div ref={containerRef} className="w-full" style={{ height: dimensions.height }}>
      <svg
        width={dimensions.width}
        height={dimensions.height}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        className="overflow-visible"
      >
        <defs>
          <linearGradient id="pvGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="uvGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {yTicks.map((val, i) => {
          const y = getY(val);
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={dimensions.width - padding.right}
                y2={y}
                stroke="currentColor"
                strokeOpacity="0.06"
                strokeWidth="1"
              />
              <text
                x={padding.left - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-slate-400"
                fontSize="10"
                fontFamily="monospace"
                fontWeight="bold"
              >
                {val}
              </text>
            </g>
          );
        })}

        <path d={pvAreaPath} fill="url(#pvGradient)" />
        <path d={uvAreaPath} fill="url(#uvGradient)" />

        <polyline
          fill="none"
          stroke="#6366f1"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={pvPoints}
        />
        <polyline
          fill="none"
          stroke="#a78bfa"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="6 3"
          points={uvPoints}
        />

        {data.map((d, i) => (
          <g key={`pv-${i}`}>
            <circle cx={getX(i)} cy={getY(d.pv)} r="3.5" fill="#6366f1" stroke="white" strokeWidth="2" />
          </g>
        ))}
        {data.map((d, i) => (
          <g key={`uv-${i}`}>
            <circle cx={getX(i)} cy={getY(d.uv)} r="3" fill="#a78bfa" stroke="white" strokeWidth="1.5" />
          </g>
        ))}

        {data.map((d, i) => {
          const showLabel = data.length <= 14 ? i % 2 === 0 || i === data.length - 1 : i % 3 === 0 || i === data.length - 1;
          return showLabel ? (
            <text
              key={`label-${i}`}
              x={getX(i)}
              y={dimensions.height - 6}
              textAnchor="middle"
              className="fill-slate-400"
              fontSize="9"
              fontWeight="bold"
            >
              {formatDateLabel(d.date)}
            </text>
          ) : null;
        })}
      </svg>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <ToastProvider>
      <AnalyticsContent />
    </ToastProvider>
  );
}
