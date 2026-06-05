"use client";

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../ToastProvider';
import { siteConfig } from '../../siteConfig';
import { Upload, Link2, Image as ImageIcon, X, Check, Copy, Trash2 } from 'lucide-react';

interface FloatingImageToolProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (url: string, width?: string) => void;
}

// 支持的图片格式
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/avif'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function FloatingImageTool({ isOpen, onClose, onInsert }: FloatingImageToolProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 验证文件格式
  const validateFile = useCallback((file: File): boolean => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        showToast(`不支持的文件格式：${file.name}，仅支持 ${ALLOWED_EXTENSIONS.join('、')}`, 'error');
        return false;
      }
    }
    if (file.size > MAX_FILE_SIZE) {
      showToast(`文件过大：${(file.size / 1024 / 1024).toFixed(2)}MB，最大支持 10MB`, 'error');
      return false;
    }
    return true;
  }, [showToast]);

  // 生成文件预览
  const generatePreview = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  // 处理文件上传逻辑
  const handleFileUpload = async (file: File) => {
    if (!validateFile(file)) return;

    generatePreview(file);

    const isLocal = (siteConfig as any).useLocalPicBed;
    const picUrl = (siteConfig as any).picBedUrl || "https://pic.dusays.com";
    const picToken = (siteConfig as any).picBedToken;

    if (!isLocal && !picToken) {
      showToast("未配置图床 Token！", "error");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    showToast(isLocal ? "正在上传到本地..." : "正在将图片传送至云端...", "success");

    // 模拟进度条
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 200);

    try {
      const configRes = await fetch(`/backend_config.json?t=${Date.now()}`);
      const configData = await configRes.json();
      const uploadData = new FormData();
      uploadData.append('file', file);
      
      let endpoint = `http://127.0.0.1:${configData.api_port}/api/picbed/upload`;
      
      if (isLocal) {
        endpoint = `http://127.0.0.1:${configData.api_port}/api/picbed/upload_local`;
      } else {
        uploadData.append('url', picUrl);
        uploadData.append('token', picToken);
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        body: uploadData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await res.json();
      if (data.success && data.url) {
        setUploadedUrl(data.url);
        showToast(isLocal ? "✅ 本地上传成功！" : "✅ 云端上传成功！", "success");
      } else {
        showToast(`上传失败: ${data.message || '未知错误'}`, "error");
        setPreviewImage(null);
      }
    } catch (error: any) {
      clearInterval(progressInterval);
      setUploadProgress(0);
      showToast(`连接异常: ${error.message}`, "error");
      setPreviewImage(null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, [handleFileUpload]);

  // 验证并确认外链图片
  const handleConfirmExternalUrl = () => {
    if (!externalUrl.trim()) {
      showToast("请输入有效的图片 URL", "warning");
      return;
    }
    setPreviewImage(externalUrl);
    setUploadedUrl(externalUrl);
    showToast("图片预览已生成", "success");
  };

  const copyUrlToClipboard = () => {
    if (uploadedUrl) {
      navigator.clipboard.writeText(uploadedUrl);
      showToast("链接已复制到剪贴板！", "success");
    }
  };

  // 插入图片到编辑器
  const handleInsertImage = () => {
    if (!uploadedUrl) {
      showToast("请先选择或上传图片", "warning");
      return;
    }
    onInsert(uploadedUrl);
    showToast("图片已插入到文章", "success");
    handleClose();
  };

  // 关闭并重置状态
  const handleClose = () => {
    setUploadedUrl('');
    setExternalUrl('');
    setPreviewImage(null);
    setUploadProgress(0);
    onClose();
  };

  // 重置选择
  const handleReset = () => {
    setUploadedUrl('');
    setExternalUrl('');
    setPreviewImage(null);
    setUploadProgress(0);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          drag
          dragMomentum={false}
          dragElastic={0}
          initial={{ opacity: 0, scale: 0.9, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          style={{ position: 'fixed', top: '15vh', right: '5vw', zIndex: 99999 }}
          className="w-[420px] bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl rounded-[32px] shadow-2xl border border-white/50 dark:border-white/10 overflow-hidden flex flex-col cursor-move"
        >
          {/* 标题栏 */}
          <div className="flex justify-between items-center p-5 border-b border-white/30 dark:border-slate-700/50 bg-white/50 dark:bg-slate-800/50">
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <ImageIcon size={18} className="text-indigo-500" />
              插入图片
            </h3>
            <button onClick={handleClose} className="w-8 h-8 rounded-full bg-white/50 dark:bg-slate-700/50 flex items-center justify-center text-slate-500 hover:bg-red-500 hover:text-white transition-all cursor-pointer shadow-sm">
              <X size={16} />
            </button>
          </div>

          <div className="p-6 cursor-default bg-white/20 dark:bg-slate-900/20">
            {/* 模式切换 Tab */}
            {!uploadedUrl && (
              <div className="flex bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-2xl mb-5">
                <button
                  onClick={() => setActiveTab('upload')}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'upload' ? 'bg-white dark:bg-slate-700 text-indigo-500 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <Upload size={14} />
                  {(siteConfig as any).useLocalPicBed ? '本地上传' : '云端上传'}
                </button>
                <button
                  onClick={() => setActiveTab('url')}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'url' ? 'bg-white dark:bg-slate-700 text-indigo-500 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <Link2 size={14} />
                  外链插入
                </button>
              </div>
            )}

            {!uploadedUrl ? (
              activeTab === 'upload' ? (
                // 上传模式
                <div className="space-y-4">
                  <div
                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => !isUploading && fileInputRef.current?.click()}
                    className={`w-full h-44 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all shadow-inner relative overflow-hidden ${isDragging ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-900/40' : 'border-slate-300/80 dark:border-slate-600/80 hover:bg-white/60 dark:hover:bg-slate-800/60'}`}
                  >
                    <input type="file" ref={fileInputRef} onChange={e => e.target.files && handleFileUpload(e.target.files[0])} accept="image/*" className="hidden" />
                    
                    {/* 上传进度条 */}
                    {isUploading && (
                      <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex flex-col items-center justify-center gap-3">
                        <div className="w-48 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${uploadProgress}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{Math.round(uploadProgress)}%</span>
                      </div>
                    )}
                    
                    {/* 本地预览 */}
                    {previewImage && !isUploading && (
                      <img src={previewImage} alt="preview" className="absolute inset-0 w-full h-full object-contain p-2" />
                    )}
                    
                    {!previewImage && !isUploading && (
                      <>
                        <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                          <Upload size={24} className="text-indigo-500" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">点击或拖拽图片</p>
                          <p className="text-[10px] text-slate-400 mt-1">支持 JPG、PNG、WebP、GIF 格式，最大 10MB</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                // 外链模式
                <div className="w-full space-y-4">
                  <div className="relative">
                    <textarea
                      value={externalUrl}
                      onChange={(e) => setExternalUrl(e.target.value)}
                      placeholder="粘贴图片链接 (https://...)"
                      className="w-full h-28 p-4 text-xs font-medium bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
                    />
                  </div>
                  <button
                    onClick={handleConfirmExternalUrl}
                    className="w-full py-3 bg-indigo-500 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-500/30 hover:bg-indigo-600 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Check size={14} />
                    确认图片链接
                  </button>
                </div>
              )
            ) : (
              // 预览与确认插入区
              <div className="flex flex-col gap-4">
                {/* 图片预览 */}
                <div className="w-full rounded-2xl overflow-hidden bg-white/50 dark:bg-slate-950/50 border border-white/40 dark:border-slate-700/50 flex items-center justify-center shadow-inner group relative">
                  <img src={uploadedUrl} alt="preview" className="w-full max-h-48 object-contain rounded-xl drop-shadow-md" />
                  {/* 重新选择按钮 */}
                  <button
                    onClick={handleReset}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-bold"
                  >
                    <Upload size={14} />
                    重新选择
                  </button>
                </div>

                {/* 操作按钮 */}
                <div className="grid grid-cols-3 gap-3">
                  <button onClick={copyUrlToClipboard} className="py-2.5 rounded-xl bg-white/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-white dark:hover:bg-slate-700 transition-all shadow-sm flex items-center justify-center gap-1">
                    <Copy size={12} />
                    复制
                  </button>
                  <button onClick={handleReset} className="py-2.5 rounded-xl bg-red-500/10 dark:bg-red-500/20 text-red-500 font-bold text-xs hover:bg-red-500/20 dark:hover:bg-red-500/30 transition-all shadow-sm flex items-center justify-center gap-1">
                    <Trash2 size={12} />
                    删除
                  </button>
                  <button onClick={handleInsertImage} className="py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-black text-xs shadow-lg shadow-indigo-500/30 hover:from-indigo-600 hover:to-purple-600 transition-all active:scale-95 flex items-center justify-center gap-1">
                    <ImageIcon size={12} />
                    插入
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
