"use client";

import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BackButton from '../../components/BackButton';
import { steamGamesData as initialGames, SteamGame, GameStatus } from '../../data/steam';
import { Plus, Pencil, Trash2, AlertTriangle, Save, Edit3, Gamepad2, Upload, Link } from 'lucide-react';
import { useOperations } from '../../context/OperationContext';
import { useToast } from '../../components/ToastProvider';
import { siteConfig } from '../../siteConfig';

const STATUS_OPTIONS: { value: GameStatus; label: string }[] = [
  { value: 'not_installed', label: '未安装' },
  { value: 'installed', label: '已安装' },
  { value: 'completed', label: '已通关' },
  { value: 'perfect', label: '完美通关' },
];

const STATUS_MAP: Record<GameStatus, { label: string; color: string; bg: string }> = {
  not_installed: { label: '未安装', color: 'text-slate-400', bg: 'bg-slate-500/20' },
  installed: { label: '已安装', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  completed: { label: '已通关', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  perfect: { label: '完美通关', color: 'text-amber-400', bg: 'bg-amber-500/20' },
};

type CoverInputMode = 'url' | 'upload';

export default function SteamBoard() {
  const { addOperation } = useOperations();
  const { showToast } = useToast();

  const [editableGames, setEditableGames] = useState<SteamGame[]>(initialGames);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<'date_desc' | 'date_asc' | 'name_asc'>('date_desc');
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());

  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null; name: string | null }>({ isOpen: false, id: null, name: null });
  const [gameModal, setGameModal] = useState<{ isOpen: boolean; mode: 'add' | 'edit'; data: Partial<SteamGame> }>({ isOpen: false, mode: 'add', data: {} });

  const [coverMode, setCoverMode] = useState<CoverInputMode>('url');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const coverFileRef = useRef<HTMLInputElement>(null);

  const filteredGames = useMemo(() => {
    let result = editableGames;
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter(g => g.title.toLowerCase().includes(query));
    }

    result = [...result].sort((a, b) => {
      if (sortOrder === 'date_desc') return b.purchaseDate.localeCompare(a.purchaseDate);
      if (sortOrder === 'date_asc') return a.purchaseDate.localeCompare(b.purchaseDate);
      return a.title.localeCompare(b.title);
    });

    return result;
  }, [searchQuery, editableGames, sortOrder]);

  const syncToQueue = (nextList: SteamGame[]) => {
    addOperation({
      type: "sync_steam",
      label: "同步 Steam 游戏库变更",
      value: nextList
    });
    showToast("📍 变更已加入待处理队列，请在 Navbar 点击更新本地", "info");
  };

  const handleCoverUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast("请选择图片文件", "warning");
      return;
    }

    const isLocal = (siteConfig as any).useLocalPicBed;
    const picUrl = (siteConfig as any).picBedUrl || "";
    const picToken = (siteConfig as any).picBedToken;

    if (!isLocal && !picToken) {
      showToast("未配置图床 Token，请先在设置中配置", "error");
      return;
    }

    setIsUploading(true);
    showToast(isLocal ? "正在上传封面..." : "正在上传至云端...", "info");

    try {
      const configRes = await fetch(`/backend_config.json?t=${Date.now()}`);
      const configData = await configRes.json();
      const uploadData = new FormData();
      uploadData.append('file', file);

      let endpoint = `http://127.0.0.1:${configData.api_port}/api/picbed/upload_local`;

      if (!isLocal) {
        endpoint = `http://127.0.0.1:${configData.api_port}/api/picbed/upload`;
        uploadData.append('url', picUrl);
        uploadData.append('token', picToken);
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        body: uploadData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        setGameModal(prev => ({ ...prev, data: { ...prev.data, cover: data.url } }));
        showToast(isLocal ? "✅ 封面上传成功！" : "✅ 云端上传成功！", "success");
      } else {
        showToast(`上传失败: ${data.message || '未知错误'}`, "error");
      }
    } catch (error: any) {
      showToast(`上传异常: ${error.message}`, "error");
    } finally {
      setIsUploading(false);
      if (coverFileRef.current) coverFileRef.current.value = '';
    }
  };

  const handleCoverDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleCoverUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSaveGame = () => {
    const { mode, data } = gameModal;
    if (!data.title || !data.cover || !data.purchaseDate) {
      showToast("游戏名称、封面图和购买时间为必填项", "warning");
      return;
    }

    let next;
    if (mode === 'add') {
      const newGame: SteamGame = {
        id: `game_${Date.now()}`,
        title: data.title!,
        cover: data.cover!,
        status: data.status || 'not_installed',
        purchaseDate: data.purchaseDate!,
        storeLink: data.storeLink || '',
        playtime: data.playtime || '',
      };
      next = [newGame, ...editableGames];
    } else {
      next = editableGames.map(g => g.id === data.id ? { ...g, ...data } as SteamGame : g);
    }
    setEditableGames(next);
    syncToQueue(next);
    setGameModal({ isOpen: false, mode: 'add', data: {} });
    setCoverMode('url');
  };

  const confirmDelete = () => {
    if (!deleteModal.id) return;
    const next = editableGames.filter(g => g.id !== deleteModal.id);
    setEditableGames(next);
    syncToQueue(next);
    setDeleteModal({ isOpen: false, id: null, name: null });
  };

  const handleImgError = (id: string) => {
    setImgErrors(prev => new Set(prev).add(id));
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-10 py-10 relative z-10">

      <AnimatePresence>
        {deleteModal.isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-sm bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[40px] shadow-2xl border border-white/50 p-10 text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6"><AlertTriangle className="text-red-500" /></div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">移除游戏？</h3>
              <p className="text-sm text-slate-500 mb-8 leading-relaxed text-balance">确认从游戏库中移除 <span className="font-bold text-red-500">"{deleteModal.name}"</span> 吗？</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-black uppercase">保留</button>
                <button onClick={confirmDelete} className="flex-1 py-4 bg-red-500 text-white rounded-2xl text-xs font-black uppercase shadow-lg">确认移除</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {gameModal.isOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => { setGameModal({ ...gameModal, isOpen: false }); setCoverMode('url'); }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="relative w-full max-w-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[40px] border border-white/20 p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-black mb-6 dark:text-white flex items-center gap-2"><Gamepad2 className="text-indigo-500" /> {gameModal.mode === 'add' ? '添加新游戏' : '编辑游戏'}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">游戏名称 *</label>
                  <input type="text" value={gameModal.data.title || ''} onChange={e => setGameModal({ ...gameModal, data: { ...gameModal.data, title: e.target.value } })} className="w-full bg-slate-100 dark:bg-black/20 rounded-2xl px-5 py-3 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 border-none" placeholder="如：Elden Ring" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">游戏封面 *</label>
                    <div className="flex bg-slate-200/50 dark:bg-slate-800/50 p-0.5 rounded-lg">
                      <button
                        onClick={() => setCoverMode('url')}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all flex items-center gap-1 ${coverMode === 'url' ? 'bg-white dark:bg-slate-700 text-indigo-500 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                      >
                        <Link size={10} /> URL
                      </button>
                      <button
                        onClick={() => setCoverMode('upload')}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all flex items-center gap-1 ${coverMode === 'upload' ? 'bg-white dark:bg-slate-700 text-indigo-500 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                      >
                        <Upload size={10} /> 上传
                      </button>
                    </div>
                  </div>

                  {coverMode === 'url' ? (
                    <input type="text" value={gameModal.data.cover || ''} onChange={e => setGameModal({ ...gameModal, data: { ...gameModal.data, cover: e.target.value } })} className="w-full bg-slate-100 dark:bg-black/20 rounded-2xl px-5 py-3 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 border-none" placeholder="https://cdn.akamai.steamstatic.com/..." />
                  ) : (
                    <div
                      onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleCoverDrop}
                      onClick={() => coverFileRef.current?.click()}
                      className={`w-full border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all min-h-[120px] ${isDragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-300 dark:border-slate-600 hover:border-indigo-400 hover:bg-indigo-500/5'}`}
                    >
                      <input type="file" ref={coverFileRef} onChange={e => e.target.files && handleCoverUpload(e.target.files[0])} accept="image/*" className="hidden" />
                      {isUploading ? (
                        <>
                          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">正在上传...</p>
                        </>
                      ) : (
                        <>
                          <Upload size={24} className="text-slate-400" />
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">点击或拖拽图片上传</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500">{(siteConfig as any).useLocalPicBed ? '本地存储' : '云端图床'}</p>
                        </>
                      )}
                    </div>
                  )}

                  {gameModal.data.cover && (
                    <div className="mt-2 flex items-start gap-3">
                      <div className="w-16 aspect-[3/4] rounded-lg overflow-hidden border border-white/10 shrink-0">
                        <img src={gameModal.data.cover} alt="预览" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono truncate">{gameModal.data.cover}</p>
                        <button
                          onClick={() => setGameModal(prev => ({ ...prev, data: { ...prev.data, cover: '' } }))}
                          className="mt-1 text-[10px] text-red-400 hover:text-red-500 font-bold"
                        >
                          移除封面
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">游戏状态 *</label>
                  <select value={gameModal.data.status || 'not_installed'} onChange={e => setGameModal({ ...gameModal, data: { ...gameModal.data, status: e.target.value as GameStatus } })} className="w-full bg-slate-100 dark:bg-black/20 rounded-2xl px-5 py-3 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 border-none appearance-none cursor-pointer">
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">购买/入库时间 *</label>
                  <input type="date" value={gameModal.data.purchaseDate || ''} onChange={e => setGameModal({ ...gameModal, data: { ...gameModal.data, purchaseDate: e.target.value } })} className="w-full bg-slate-100 dark:bg-black/20 rounded-2xl px-5 py-3 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 border-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Steam 商店链接</label>
                  <input type="text" value={gameModal.data.storeLink || ''} onChange={e => setGameModal({ ...gameModal, data: { ...gameModal.data, storeLink: e.target.value } })} className="w-full bg-slate-100 dark:bg-black/20 rounded-2xl px-5 py-3 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 border-none" placeholder="https://store.steampowered.com/app/..." />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">游玩时间</label>
                  <input type="text" value={gameModal.data.playtime || ''} onChange={e => setGameModal({ ...gameModal, data: { ...gameModal.data, playtime: e.target.value } })} className="w-full bg-slate-100 dark:bg-black/20 rounded-2xl px-5 py-3 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 border-none" placeholder="如：120小时" />
                </div>
              </div>
              <div className="mt-8 flex gap-3">
                <button onClick={() => { setGameModal({ ...gameModal, isOpen: false }); setCoverMode('url'); }} className="flex-1 py-3 text-slate-500 font-bold uppercase text-xs">取消</button>
                <button onClick={handleSaveGame} className="flex-1 py-4 bg-indigo-500 text-white rounded-2xl font-black shadow-lg flex items-center justify-center gap-2"><Save size={18} /> 加入暂存</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="mb-8 flex flex-col items-center md:items-start">
        <div className="w-full flex justify-start mb-6"><BackButton /></div>
        <div className="text-center md:text-left w-full">
          <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-widest uppercase">Steam Library</h1>
          <p className="text-slate-600 dark:text-slate-400 font-serif italic opacity-80 flex items-center justify-center md:justify-start gap-2">
            <Gamepad2 size={14} className="text-indigo-500" /> 游戏库后台管理 — 添加、编辑与移除
          </p>
        </div>
      </div>

      <div className="mb-8 flex flex-col sm:flex-row items-center gap-4 w-full">
        <div className="relative w-full sm:max-w-xs group">
          <input type="text" placeholder="搜索游戏名称..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/40 dark:border-white/10 rounded-full px-6 py-3 pl-12 text-slate-800 dark:text-white shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-serif" />
          <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>

        <select value={sortOrder} onChange={e => setSortOrder(e.target.value as typeof sortOrder)} className="bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-full px-5 py-3 text-sm dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer">
          <option value="date_desc">时间降序</option>
          <option value="date_asc">时间升序</option>
          <option value="name_asc">名称排序</option>
        </select>

        <div className="ml-auto flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-mono">共 {filteredGames.length} 款游戏</span>
        </div>
      </div>

      <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 relative">

        <motion.div layout onClick={() => { setGameModal({ isOpen: true, mode: 'add', data: { status: 'not_installed' } }); setCoverMode('url'); }} className="group cursor-pointer flex flex-col items-center justify-center min-h-[280px] rounded-2xl border-4 border-dashed border-slate-300 dark:border-slate-700 bg-white/10 hover:border-indigo-500 hover:bg-indigo-500/5 transition-all duration-500">
          <div className="w-14 h-14 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-md group-hover:rotate-90">
            <Plus size={32} />
          </div>
          <span className="mt-3 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 group-hover:text-indigo-500">ADD GAME</span>
        </motion.div>

        <AnimatePresence mode="popLayout">
          {filteredGames.map((game) => {
            const statusInfo = STATUS_MAP[game.status];
            const hasError = imgErrors.has(game.id);

            return (
              <motion.div layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} key={game.id} className="relative group">

                <div className="absolute top-2 right-2 z-30 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all -translate-y-2 group-hover:translate-y-0">
                  <button onClick={() => { setGameModal({ isOpen: true, mode: 'edit', data: game }); setCoverMode('url'); }} className="w-8 h-8 rounded-lg bg-indigo-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"><Edit3 size={14} /></button>
                  <button onClick={() => setDeleteModal({ isOpen: true, id: game.id, name: game.title })} className="w-8 h-8 rounded-lg bg-red-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"><Trash2 size={14} /></button>
                </div>

                <div className="block rounded-2xl bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-lg overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-indigo-500/10">
                  <div className="relative aspect-[3/4] overflow-hidden">
                    {!hasError ? (
                      <img
                        src={game.cover}
                        alt={game.title}
                        onError={() => handleImgError(game.id)}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center p-3">
                        <span className="text-white/80 text-sm font-bold text-center leading-tight line-clamp-3">{game.title}</span>
                      </div>
                    )}

                    <div className="absolute top-2 left-2">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md ${statusInfo.bg} ${statusInfo.color} border border-white/10`}>
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5">
                    <h3 className="text-xs font-bold text-slate-800 dark:text-white truncate">{game.title}</h3>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{game.purchaseDate}</p>
                      {game.playtime && (
                        <p className="text-[10px] text-indigo-500 font-mono">{game.playtime}</p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {filteredGames.length === 0 && searchQuery && (
        <div className="text-center py-20 text-slate-500 font-serif italic">
          未找到与 &quot;{searchQuery}&quot; 相关的游戏...
        </div>
      )}

      {editableGames.length === 0 && !searchQuery && (
        <div className="text-center py-24">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl border border-white/20 dark:border-white/10 flex items-center justify-center">
            <Gamepad2 className="w-10 h-10 text-slate-400" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-serif text-lg mb-2">暂无游戏数据</p>
          <p className="text-slate-400 dark:text-slate-500 text-sm font-serif">点击上方虚线卡片添加你的第一款游戏！</p>
        </div>
      )}
    </div>
  );
}
