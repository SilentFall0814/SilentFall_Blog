"use client";

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Code, Heading1, Heading2, Heading3, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, Highlighter, Send, X, User, Mail
} from 'lucide-react';

export default function VisitorMomentEditor({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [author, setAuthor] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const savedAuthor = typeof window !== 'undefined' ? localStorage.getItem('vm_author') || '' : '';
  const savedEmail = typeof window !== 'undefined' ? localStorage.getItem('vm_email') || '' : '';

  useState(() => {
    if (savedAuthor) setAuthor(savedAuthor);
    if (savedEmail) setEmail(savedEmail);
  });

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Highlight,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: '写下你想说的话...' }),
    ],
    content: '',
  });

  const handleSubmit = useCallback(async () => {
    if (!author.trim()) {
      alert('请填写姓名');
      return;
    }
    if (!editor?.getText().trim()) {
      alert('请填写内容');
      return;
    }

    setSubmitting(true);
    try {
      localStorage.setItem('vm_author', author.trim());
      if (email.trim()) {
        localStorage.setItem('vm_email', email.trim());
      }

      const res = await fetch('/api/guest-moments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: author.trim(),
          email: email.trim(),
          content: editor.getHTML(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        editor.commands.clearContent();
        onClose();
        onSuccess();
        setTimeout(() => alert('提交成功！等待博主审核后就会显示哦~'), 300);
      } else {
        alert(data.message || '提交失败');
      }
    } catch {
      alert('网络错误，请稍后再试');
    } finally {
      setSubmitting(false);
    }
  }, [author, email, editor, onSuccess]);

  const ToolbarButton = ({ onClick, active, children, title }: any) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-lg transition-all text-slate-500 dark:text-slate-400 ${
        active ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400' : 'hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
      }`}
    >
      {children}
    </button>
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[999] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[32px] shadow-2xl border border-white/50 dark:border-white/10"
        >
          <div className="p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                <Send size={20} className="text-indigo-500" /> 发布访客说说
              </h2>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-200/50 dark:bg-slate-700/50 flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                  <User size={10} /> 姓名 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="你的昵称"
                  className="w-full bg-white/60 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                  <Mail size={10} /> 邮箱 <span className="text-slate-400 dark:text-slate-500">(选填)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="填写你的常用联系邮箱，没有或不方便则不填写"
                  className="w-full bg-white/60 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                />
              </div>
            </div>

            <div className="bg-white/60 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl overflow-hidden">
              <div className="flex items-center gap-0.5 px-3 py-2 border-b border-slate-200/50 dark:border-slate-700/50 flex-wrap">
                <ToolbarButton onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive('bold')} title="粗体">
                  <Bold size={14} />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive('italic')} title="斜体">
                  <Italic size={14} />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor?.chain().focus().toggleUnderline().run()} active={editor?.isActive('underline')} title="下划线">
                  <UnderlineIcon size={14} />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor?.chain().focus().toggleStrike().run()} active={editor?.isActive('strike')} title="删除线">
                  <Strikethrough size={14} />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor?.chain().focus().toggleHighlight().run()} active={editor?.isActive('highlight')} title="高亮">
                  <Highlighter size={14} />
                </ToolbarButton>
                <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />
                <ToolbarButton onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} active={editor?.isActive('heading', { level: 1 })} title="标题1">
                  <Heading1 size={14} />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} active={editor?.isActive('heading', { level: 2 })} title="标题2">
                  <Heading2 size={14} />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} active={editor?.isActive('heading', { level: 3 })} title="标题3">
                  <Heading3 size={14} />
                </ToolbarButton>
                <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />
                <ToolbarButton onClick={() => editor?.chain().focus().toggleBulletList().run()} active={editor?.isActive('bulletList')} title="无序列表">
                  <List size={14} />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor?.chain().focus().toggleOrderedList().run()} active={editor?.isActive('orderedList')} title="有序列表">
                  <ListOrdered size={14} />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor?.chain().focus().toggleCodeBlock().run()} active={editor?.isActive('codeBlock')} title="代码块">
                  <Code size={14} />
                </ToolbarButton>
                <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />
                <ToolbarButton onClick={() => editor?.chain().focus().setTextAlign('left').run()} active={editor?.isActive({ textAlign: 'left' })} title="左对齐">
                  <AlignLeft size={14} />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor?.chain().focus().setTextAlign('center').run()} active={editor?.isActive({ textAlign: 'center' })} title="居中">
                  <AlignCenter size={14} />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor?.chain().focus().setTextAlign('right').run()} active={editor?.isActive({ textAlign: 'right' })} title="右对齐">
                  <AlignRight size={14} />
                </ToolbarButton>
              </div>

              <EditorContent
                editor={editor}
                className="prose prose-sm dark:prose-invert max-w-none min-h-[200px] px-4 py-3 focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[200px] [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-slate-400 [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0 [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none"
              />
            </div>

            <div className="flex items-center justify-between mt-6">
              <p className="text-[11px] text-slate-400">提交后需博主审核才会显示</p>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-6 py-2.5 bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/30 hover:bg-indigo-600 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <Send size={14} />
                  {submitting ? '提交中...' : '发布说说'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
