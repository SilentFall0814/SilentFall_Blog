"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '../../components/ToastProvider';
import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const router = useRouter();
  const { showToast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '123456') {
      localStorage.setItem('blog_admin_token', 'true');
      showToast('验证成功', 'success');
      router.push('/');
    } else {
      showToast('凭据无效', 'error');
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center">
      <Navbar />
      <PageTransition>
        <form onSubmit={handleLogin} className="p-10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-slate-800/50 rounded-[40px] shadow-2xl flex flex-col gap-6 w-full max-w-sm">
          <h1 className="text-3xl font-black text-center mb-4 tracking-tighter">身份验证</h1>
          <input 
            type="password" 
            placeholder="请输入管理员密钥" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white/50 dark:bg-slate-800/50 border border-white/50 dark:border-white/10 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
          <button type="submit" className="w-full py-4 bg-indigo-500 text-white rounded-2xl font-black shadow-lg shadow-indigo-500/30 hover:bg-indigo-600 transition-all">
            进入管理中枢
          </button>
        </form>
      </PageTransition>
    </div>
  );
}
