"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import BackButton from '../../components/BackButton';
import { Pencil } from 'lucide-react';
import { useToast } from '../../components/ToastProvider';
import { apiFetch } from '../../lib/apiFetch';

export default function AboutBoard() {
  const router = useRouter();
  const { showToast } = useToast();
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAbout = async () => {
      try {
        const res = await apiFetch('/api/drafts?path=get', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: 'about', type: 'about' })
        });
        const data = await res.json();
        if (data.success && data.draft) {
          setContent(data.draft.content || '');
        }
      } catch (error) {
        showToast("加载关于页面内容失败", "error");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAbout();
  }, []);

  const handleEdit = () => {
    router.push('/editor?type=about&id=about');
  };

  return (
    <div className="min-h-screen relative pb-10">
      <Navbar />
      <PageTransition>
        <main className="w-[90%] max-w-4xl mx-auto mt-28 relative z-10">
          <div className="flex items-center justify-between mb-6">
            <BackButton />
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95"
            >
              <Pencil size={16} />
              编辑内容
            </button>
          </div>

          <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-slate-800/50 rounded-[40px] p-10 shadow-2xl">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : content ? (
              <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
            ) : (
              <div className="text-center py-20">
                <p className="text-slate-500 dark:text-slate-400 font-serif text-lg mb-2">暂无内容</p>
                <p className="text-slate-400 dark:text-slate-500 text-sm font-serif">点击右上角"编辑内容"开始编写</p>
              </div>
            )}
          </div>
        </main>
      </PageTransition>
    </div>
  );
}
