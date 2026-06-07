"use client";

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useOperations } from '../context/OperationContext';
import { useToast } from './ToastProvider';
import { AlertTriangle, ChevronDown, Home, Gamepad2, Image, Music, MessageSquare, FileText, Users, Info, Clock, ShieldCheck, Megaphone, BarChart3, Settings, Layers, Eye } from 'lucide-react';
import { siteConfig } from '../siteConfig';

interface NavGroup {
  label: string;
  icon: React.ReactNode;
  items: { name: string; href: string; icon: React.ReactNode }[];
}

export default function Navbar() {
  const [showNav, setShowNav] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isOpBoxOpen, setIsOpBoxOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const groupRef = useRef<HTMLDivElement>(null);

  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [targetBlogPath, setTargetBlogPath] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishProgress, setPublishProgress] = useState<string>("");

  const pathname = usePathname();
  const { operations, removeOperation, clearOperations } = useOperations();
  const { showToast } = useToast();

  useEffect(() => {
    const fetchPath = async () => {
      try {
        const configRes = await fetch(`/backend_config.json?t=${Date.now()}`);
        const config = await configRes.json();
        const res = await fetch(`http://127.0.0.1:${config.api_port}/api/sync/config`);
        if (res.ok) {
          const data = await res.json();
          if (data.blogPath) {
            setTargetBlogPath(data.blogPath);
            localStorage.setItem('targetBlogPath', data.blogPath);
          }
        }
      } catch (e) {
        const path = localStorage.getItem('targetBlogPath') || "[REDACTED_LOCAL_PATH]";
        setTargetBlogPath(path);
      }
    };
    fetchPath();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 80) setShowNav(false);
      else setShowNav(true);
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (groupRef.current && !groupRef.current.contains(e.target as Node)) {
        setActiveGroup(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navGroups: NavGroup[] = [
    {
      label: '内容',
      icon: <Layers size={14} />,
      items: [
        { name: '首页', href: '/', icon: <Home size={14} /> },
        { name: '文章', href: '/posts', icon: <FileText size={14} /> },
        { name: '说说', href: '/moments', icon: <MessageSquare size={14} /> },
        { name: '友链', href: '/friends', icon: <Users size={14} /> },
        { name: '关于', href: '/about', icon: <Info size={14} /> },
      ],
    },
    {
      label: '展示',
      icon: <Image size={14} />,
      items: [
        { name: '项目', href: '/projects', icon: <Layers size={14} /> },
        { name: 'Steam', href: '/steam', icon: <Gamepad2 size={14} /> },
        { name: '照片墙', href: '/photowall', icon: <Image size={14} /> },
        { name: '音乐', href: '/music', icon: <Music size={14} /> },
        { name: '归档', href: '/timeline', icon: <Clock size={14} /> },
      ],
    },
    {
      label: '管理',
      icon: <ShieldCheck size={14} />,
      items: [
        { name: '审核区', href: '/admin/review', icon: <ShieldCheck size={14} /> },
        { name: '公告', href: '/admin/announcements', icon: <Megaphone size={14} /> },
        { name: '监控', href: '/admin/analytics', icon: <BarChart3 size={14} /> },
        { name: '访客', href: '/admin/visitors', icon: <Users size={14} /> },
        { name: '访问记录', href: '/admin/view-records', icon: <Eye size={14} /> },
        { name: '设置', href: '/settings', icon: <Settings size={14} /> },
      ],
    },
  ];

  const getCurrentGroupName = () => {
    for (const group of navGroups) {
      if (group.items.some(item => item.href === pathname)) return group.label;
    }
    return null;
  };

  const handleMinimize = () => {
    if (typeof window !== 'undefined' && (window as any).pywebview?.api) {
      (window as any).pywebview.api.minimize_window();
    }
  };
  const handleMaximize = () => {
    if (typeof window !== 'undefined' && (window as any).pywebview?.api) {
      (window as any).pywebview.api.maximize_window();
    }
  };
  const handleClose = () => {
    if (typeof window !== 'undefined' && (window as any).pywebview?.api) {
      (window as any).pywebview.api.close_window();
    }
  };

  /**
   * 🌟 一键发布并同步：合并「更新本地」+「同步 Blog」为单步操作
   * 流程：
   * 1. 将操作队列发送到后端
   * 2. 后端自动写入本地（草稿→MD文件等）
   * 3. 后端自动同步到目标博客目录
   * 4. 返回结果并刷新页面
   */
  const handlePublishAndSync = async () => {
    if (operations.length === 0) {
      showToast("队列中没有待处理的变更", "warning");
      return;
    }

    setIsPublishing(true);
    setPublishProgress("📦 正在准备发布...");

    try {
      const configRes = await fetch(`/backend_config.json?t=${Date.now()}`);
      const configData = await configRes.json();
      const apiBase = `http://127.0.0.1:${configData.api_port}`;

      // 将操作队列转换为后端期望的格式
      const formattedOps = operations.map(op => {
        let type = op.type;
        let payload = op.payload || op.value;

        // 映射前端操作类型到后端类型
        switch (op.type) {
          case 'sync_photowall':
            type = 'sync_photowall';
            payload = { albums: op.value };
            break;
          case 'sync_friends':
            type = 'sync_friends';
            payload = { friends: op.value };
            break;
          case 'sync_projects':
            type = 'sync_projects';
            payload = { projects: op.value };
            break;
          case 'sync_steam':
            type = 'sync_steam';
            payload = { games: op.value };
            break;
          case 'CONFIG':
            type = 'CONFIG';
            payload = { updates: op.payload };
            break;
          case 'create_moment':
            type = 'create_moment';
            payload = op.payload;
            break;
          default:
            type = 'publish_article';
            payload = { type: op.type, ...payload };
            break;
        }

        return { type, payload };
      });

      // 阶段 1：写入本地
      setPublishProgress("💾 正在保存本地...");
      await new Promise(resolve => setTimeout(resolve, 300));

      const res = await fetch(`${apiBase}/api/sync/publish_and_sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operations: formattedOps,
          blogPath: targetBlogPath
        }),
        // 设置超时，防止长时间挂起
        signal: AbortSignal.timeout(60000)
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();

      if (data.success) {
        // 阶段 2：同步完成
        setPublishProgress("✅ 发布成功！正在刷新...");
        showToast(`🎉 ${data.message}`, "success");
        clearOperations();
        setIsOpBoxOpen(false);

        // 延迟刷新让用户看到成功提示
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        // 部分失败（本地成功但同步失败）
        if (data.step === "sync_failed") {
          setPublishProgress("⚠️ 本地已保存，同步失败");
          showToast(
            `✅ 数据已保存到本地\n❌ 同步失败：${data.sync_error || '未知错误'}\n💡 你可以稍后重试同步`,
            "warning"
          );
          // 不清空操作队列，允许用户重试
        } else {
          setPublishProgress("❌ 发布失败");
          showToast(`❌ ${data.message}`, "error");
        }
      }
    } catch (error: any) {
      setPublishProgress("❌ 网络异常");
      if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
        showToast("⏱️ 网络连接超时，数据已保存至本地，请稍后重试同步", "error");
      } else {
        showToast(`🌐 发布异常：${error.message}`, "error");
      }
    } finally {
      setIsPublishing(false);
      setPublishProgress("");
    }
  };

  // 保留旧方法以兼容（但不再在 UI 中显示）
  const handleUpdateLocal = async () => {
      if (operations.length === 0) {
        showToast("队列中没有待处理的操作", "warning");
        return;
      }

      try {
        showToast(`🔍 正在准备发送 ${operations.length} 个任务...`, "info");

        const configRes = await fetch(`/backend_config.json?t=${Date.now()}`);
        const configData = await configRes.json();
        const apiBase = `http://127.0.0.1:${configData.api_port}`;

        for (const op of operations) {
          let apiUrl = '';
          let body = {};

          switch (op.type) {
            case 'sync_photowall':
              apiUrl = `${apiBase}/api/gallery/sync`;
              body = { albums: op.value };
              break;
            case 'sync_friends':
              apiUrl = `${apiBase}/api/friends/sync`;
              body = { friends: op.value };
              break;
            case 'sync_projects':
              apiUrl = `${apiBase}/api/projects/sync`;
              body = { projects: op.value };
              break;
            case 'sync_steam':
              apiUrl = `${apiBase}/api/steam/sync`;
              body = { games: op.value };
              break;
            case 'CONFIG':
              apiUrl = `${apiBase}/api/config/update`;
              body = { updates: op.payload };
              break;
            case 'create_moment':
              apiUrl = `${apiBase}/api/moments/save`;
              body = op.payload;
              break;
            default:
              apiUrl = `${apiBase}/api/drafts/sync_local`;
              body = { operations: [{ type: op.type, payload: op.payload || op.value }] };
              break;
          }

          showToast(`🚀 正在请求后端: ${apiUrl}`, "info");

          const res = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          });

          if (!res.ok) {
            let errorMsg = `HTTP ${res.status}`;
            try {
              const errData = await res.json();
              errorMsg += `: ${errData.message || errData.detail || JSON.stringify(errData)}`;
            } catch {}
            showToast(`❌ 任务执行失败: ${errorMsg}`, "error");
            return;
          }

          const data = await res.json();
          if (!data.success) {
            showToast(`❌ 任务执行失败: ${data.message || data.detail || '未知错误'}`, "error");
            return;
          }
        }

        showToast("✅ 任务已全部执行，本地数据已写入！", "success");
        clearOperations();
        setIsOpBoxOpen(false);

        setTimeout(() => {
          window.location.reload();
        }, 2000);

      } catch (error: any) {
        showToast(`后端连接异常: ${error.message}`, "error");
      }
    };

  const handleSyncBlogClick = () => {
    if (!targetBlogPath) {
       const fallback = localStorage.getItem('targetBlogPath') || "[REDACTED_LOCAL_PATH]";
       setTargetBlogPath(fallback);
    }
    setIsOpBoxOpen(false);
    setSyncModalOpen(true);
  };

  const executeSyncBlog = async () => {
    setSyncModalOpen(false);

    try {
      const configRes = await fetch(`/backend_config.json?t=${Date.now()}`);
      const configData = await configRes.json();
      showToast("🚀 正在镜像数据至目标项目，请稍候...", "info");

      const res = await fetch(`http://127.0.0.1:${configData.api_port}/api/sync/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blogPath: targetBlogPath })
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message, "success");
      } else {
        showToast(`❌ 同步失败: ${data.message}`, "error");
      }
    } catch (error) {
      showToast("无法连接到 Python 桌面核心引擎进行同步", "error");
    }
  };

  return (
    <>
      <header className={`w-full fixed top-0 left-0 right-0 z-[100] transition-all duration-500 border-b ${showNav ? 'translate-y-0' : '-translate-y-full'} bg-white/40 dark:bg-slate-900/50 backdrop-blur-xl border-white/20 dark:border-white/5 shadow-sm pywebview-drag-region`}>
        <div className="w-[95%] max-w-7xl mx-auto h-16 flex items-center justify-between px-4 box-border">

          <Link href="/" className="text-xl font-black text-slate-800 dark:text-white tracking-tighter">
            {siteConfig.navTitle}
            <span className="text-indigo-500 mx-1">
              {siteConfig.navSuffix || 'の'}
            </span>
            {siteConfig.navAfter}
          </Link>

          <div className="flex items-center gap-4">
            {/* 桌面端分组导航 */}
            <nav className="hidden lg:flex items-center gap-1" ref={groupRef}>
              {navGroups.map((group) => {
                const isActive = group.items.some(item => item.href === pathname);
                const isExpanded = activeGroup === group.label;

                return (
                  <div key={group.label} className="relative">
                    <button
                      onClick={() => setActiveGroup(isExpanded ? null : group.label)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-all ${isActive ? 'text-indigo-600 bg-indigo-500/10' : 'text-slate-600 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-slate-800/40'}`}
                    >
                      {group.icon}
                      <span>{group.label}</span>
                      <ChevronDown size={12} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, y: 4, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 4, scale: 0.98 }}
                          transition={{ duration: 0.15 }}
                          className="absolute top-full left-0 mt-2 w-44 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-white/40 dark:border-slate-700/60 rounded-2xl shadow-2xl p-2 z-50"
                        >
                          {group.items.map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setActiveGroup(null)}
                              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${pathname === item.href ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50'}`}
                            >
                              {item.icon}
                              <span>{item.name}</span>
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </nav>

            {/* 移动端/平板端：当前页面标识 + 下拉 */}
            <div className="lg:hidden relative" ref={groupRef}>
              <button
                onClick={() => setActiveGroup(activeGroup ? null : 'mobile')}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/20 dark:border-white/10 text-sm font-bold text-slate-700 dark:text-slate-200"
              >
                {navGroups.flatMap(g => g.items).find(item => item.href === pathname)?.name || '导航'}
                <ChevronDown size={12} className={`transition-transform duration-200 ${activeGroup === 'mobile' ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {activeGroup === 'mobile' && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    className="absolute top-full right-0 mt-2 w-56 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-white/40 dark:border-slate-700/60 rounded-2xl shadow-2xl p-3 z-50 max-h-[70vh] overflow-y-auto"
                  >
                    {navGroups.map((group) => (
                      <div key={group.label} className="mb-3 last:mb-0">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 mb-1.5">{group.label}</p>
                        {group.items.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setActiveGroup(null)}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${pathname === item.href ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50'}`}
                          >
                            {item.icon}
                            <span>{item.name}</span>
                          </Link>
                        ))}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative">
              <button onClick={() => setIsOpBoxOpen(!isOpBoxOpen)} className="relative w-10 h-10 rounded-xl bg-white/50 dark:bg-slate-800/50 flex items-center justify-center text-lg hover:scale-105 transition-all border border-white/20 shadow-sm cursor-pointer">
                📥
                {operations.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 text-[10px] font-black text-white items-center justify-center border-2 border-white dark:border-slate-900">
                      {operations.length}
                    </span>
                  </span>
                )}
              </button>

              <AnimatePresence>
                {isOpBoxOpen && (
                  <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute right-0 mt-3 w-80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-4 z-50 cursor-default op-queue-dropdown">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">待处理操作</h3>
                      <button onClick={clearOperations} className="text-[10px] text-red-500 font-bold hover:underline">清空全部</button>
                    </div>

                    <div className="flex flex-col gap-2 max-h-64 overflow-y-auto mb-4 custom-scrollbar">
                      {operations.length === 0 ? (
                        <p className="text-center py-6 text-sm text-slate-400 font-medium">暂无积攒的操作</p>
                      ) : (
                        operations.map(op => (
                          <div key={op.id} className="bg-white/50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700 flex justify-between items-center group">
                            <div className="flex flex-col">
                              <span className="text-[13px] font-bold text-slate-700 dark:text-slate-200">{op.label}</span>
                              <span className="text-[10px] text-slate-400">{op.timestamp}</span>
                            </div>
                            <button onClick={() => removeOperation(op.id)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all text-lg">✕</button>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      {isPublishing ? (
                        <button
                          disabled
                          className="py-3 rounded-xl bg-indigo-500/50 text-white text-xs font-black shadow-lg cursor-wait flex items-center justify-center gap-2"
                        >
                          <span className="animate-spin">⏳</span>
                          {publishProgress || "正在发布..."}
                        </button>
                      ) : (
                        <button
                          onClick={handlePublishAndSync}
                          className="py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-black shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:from-indigo-600 hover:to-purple-600 transition-all flex items-center justify-center gap-2"
                        >
                          🚀 发布变更
                          {operations.length > 0 && (
                            <span className="bg-white/20 px-1.5 py-0.5 rounded-md text-[10px]">
                              {operations.length} 项
                            </span>
                          )}
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-2 ml-2 pl-4 border-l border-slate-300/50 dark:border-slate-600/50 window-controls">
              <button onClick={handleMinimize} className="w-3.5 h-3.5 rounded-full bg-yellow-400 hover:bg-yellow-500 flex items-center justify-center group transition-colors shadow-sm cursor-pointer z-[101]">
                <span className="opacity-0 group-hover:opacity-100 text-[8px] text-yellow-900 font-black">-</span>
              </button>
              <button onClick={handleMaximize} className="w-3.5 h-3.5 rounded-full bg-green-400 hover:bg-green-500 flex items-center justify-center group transition-colors shadow-sm cursor-pointer z-[101]">
                <span className="opacity-0 group-hover:opacity-100 text-[8px] text-green-900 font-black">+</span>
              </button>
              <button onClick={handleClose} className="w-3.5 h-3.5 rounded-full bg-red-400 hover:bg-red-500 flex items-center justify-center group transition-colors shadow-sm cursor-pointer z-[101]">
                <span className="opacity-0 group-hover:opacity-100 text-[8px] text-red-900 font-black">×</span>
              </button>
            </div>

          </div>
        </div>
      </header>

      <AnimatePresence>
        {syncModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSyncModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[40px] shadow-2xl border border-white/50 p-10 text-center sync-modal">
              <div className="w-16 h-16 bg-amber-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="text-amber-500" size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">系统镜像覆盖</h3>
              <p className="text-sm text-slate-500 mb-8 leading-relaxed text-balance">
                确认将管理端数据覆盖至<br />
                <span className="font-bold text-amber-500 break-all">{targetBlogPath}</span> 吗？<br />
                <span className="text-xs opacity-80 text-red-400 font-bold mt-2 block">此操作将清空目标项目的旧文章与配置！</span>
              </p>
              <div className="flex gap-3">
                <button onClick={() => setSyncModalOpen(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-black uppercase transition-colors hover:bg-slate-200 dark:hover:bg-slate-700">取消</button>
                <button onClick={executeSyncBlog} className="flex-1 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-xs font-black uppercase shadow-lg shadow-amber-500/30 transition-all">确认覆盖</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
