"use client";

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BackButton from '../../components/BackButton';
import { steamGamesData, SteamGame, GameStatus } from '../../data/steam';

const STATUS_MAP: Record<GameStatus, { label: string; color: string; bg: string }> = {
  not_installed: { label: '未安装', color: 'text-slate-400', bg: 'bg-slate-500/20' },
  installed: { label: '已安装', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  completed: { label: '已通关', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  perfect: { label: '完美通关', color: 'text-amber-400', bg: 'bg-amber-500/20' },
};

type FilterTab = 'all' | 'installed' | 'completed';

export default function SteamBoard() {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [currentTime, setCurrentTime] = useState("");
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const counts = useMemo(() => {
    const installed = steamGamesData.filter(g => g.status === 'installed' || g.status === 'completed' || g.status === 'perfect').length;
    const completed = steamGamesData.filter(g => g.status === 'completed' || g.status === 'perfect').length;
    return { total: steamGamesData.length, installed, completed };
  }, []);

  const filteredGames = useMemo(() => {
    let result = steamGamesData;

    if (activeTab === 'installed') {
      result = result.filter(g => g.status === 'installed' || g.status === 'completed' || g.status === 'perfect');
    } else if (activeTab === 'completed') {
      result = result.filter(g => g.status === 'completed' || g.status === 'perfect');
    }

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter(g => g.title.toLowerCase().includes(query));
    }

    return result;
  }, [searchQuery, activeTab]);

  const handleImgError = (id: string) => {
    setImgErrors(prev => new Set(prev).add(id));
  };

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: '所有游戏', count: counts.total },
    { key: 'installed', label: '已安装', count: counts.installed },
    { key: 'completed', label: '通关留念', count: counts.completed },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-10 py-10 relative z-10">

      <div className="mb-8 flex flex-col items-center md:items-start">
        <div className="w-full flex justify-start mb-6">
          <BackButton />
        </div>
        <div className="text-center md:text-left w-full">
          <h1 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white mb-2 md:mb-4 tracking-widest drop-shadow-sm uppercase">
            Steam Library
          </h1>
          <p className="text-slate-600 dark:text-slate-400 font-serif">
            游戏收藏、通关记录与数字世界的冒险足迹。
          </p>
        </div>
      </div>

      <div className="mb-8 flex flex-col gap-4 w-full">
        <div className="relative w-full sm:max-w-xs">
          <input
            type="text"
            placeholder="搜索游戏..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 rounded-full px-6 py-2.5 pl-11 text-sm text-slate-800 dark:text-white shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder-slate-500"
          />
          <svg className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex items-center gap-1 bg-white/30 dark:bg-slate-800/30 backdrop-blur-md rounded-full px-1.5 py-1 border border-white/20 dark:border-white/5 overflow-x-auto flex-shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              {tab.label} {tab.count}
            </button>
          ))}
        </div>

        <div className="hidden sm:flex items-center gap-2 ml-auto text-xs font-mono text-slate-500 dark:text-slate-400">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span>{currentTime}</span>
        </div>
      </div>

      <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        <AnimatePresence mode="popLayout">
          {mounted && filteredGames.map((game) => {
            const statusInfo = STATUS_MAP[game.status];
            const hasError = imgErrors.has(game.id);
            const Wrapper = game.storeLink ? 'a' : 'div';
            const wrapperProps = game.storeLink
              ? { href: game.storeLink, target: '_blank', rel: 'noopener noreferrer' }
              : {};

            return (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                key={game.id}
              >
                <Wrapper
                  {...wrapperProps}
                  className="group block relative rounded-xl overflow-hidden bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-lg hover:shadow-indigo-500/10 transition-all duration-500 hover:-translate-y-1.5 hover:scale-[1.03] cursor-pointer"
                >
                  <div className="relative aspect-[3/4] overflow-hidden">
                    {!hasError ? (
                      <img
                        src={game.cover}
                        alt={game.title}
                        onError={() => handleImgError(game.id)}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center p-3">
                        <span className="text-white/80 text-sm font-bold text-center leading-tight line-clamp-3">
                          {game.title}
                        </span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-3">
                      {game.playtime && (
                        <span className="text-[11px] text-white/90 font-mono mb-1">
                          ⏱ {game.playtime}
                        </span>
                      )}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block w-fit ${statusInfo.bg} ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>

                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md ${statusInfo.bg} ${statusInfo.color} border border-white/10`}>
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5">
                    <h3 className="text-xs font-bold text-slate-800 dark:text-white truncate">
                      {game.title}
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                      {game.purchaseDate}
                    </p>
                  </div>
                </Wrapper>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {filteredGames.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-24"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/20 dark:border-white/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-serif text-lg mb-2">
            {searchQuery ? `未找到与 "${searchQuery}" 相关的游戏` : '暂无游戏数据'}
          </p>
          <p className="text-slate-400 dark:text-slate-500 text-sm font-serif">
            {searchQuery ? '试试其他关键词吧' : '快去添加你的第一款游戏吧！'}
          </p>
        </motion.div>
      )}
    </div>
  );
}
