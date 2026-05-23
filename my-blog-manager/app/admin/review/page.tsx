"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../../../components/Navbar';
import PageTransition from '../../../components/PageTransition';
import { ToastProvider } from '../../../components/ToastProvider';
import CommentSection from '../../../components/settings/CommentSection';
import GuestMomentSection from '../../../components/settings/GuestMomentSection';

function ReviewContent() {
  const [activeTab, setActiveTab] = useState<'comment' | 'guest_moment'>('comment');

  return (
    <div className="min-h-screen relative pb-10">
      <Navbar />
      <PageTransition>
        <main className="w-[95%] max-w-7xl mx-auto mt-24 flex flex-col gap-8 relative z-10">
          <div>
            <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter">
              审核中心
            </h1>
            <p className="text-slate-500 text-sm mt-2 font-bold">管理全站内容审核与评论审核</p>
          </div>

          <div className="flex gap-4 mb-8">
            <button
              onClick={() => setActiveTab('comment')}
              className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all ${
                activeTab === 'comment'
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                  : 'bg-white/40 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300'
              }`}
            >
              💬 评论审核
            </button>
            <button
              onClick={() => setActiveTab('guest_moment')}
              className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all ${
                activeTab === 'guest_moment'
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                  : 'bg-white/40 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300'
              }`}
            >
              ✏️ 访客说说审核
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'comment' && <CommentSection key="comment" />}
            {activeTab === 'guest_moment' && <GuestMomentSection key="guest_moment" />}
          </AnimatePresence>
        </main>
      </PageTransition>
    </div>
  );
}

export default function ReviewPage() {
  return (
    <ToastProvider>
      <ReviewContent />
    </ToastProvider>
  );
}
