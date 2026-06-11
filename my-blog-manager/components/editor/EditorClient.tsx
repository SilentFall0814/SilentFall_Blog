"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import RichTextEditor, { RichTextEditorHandle } from '../../components/editor/RichTextEditor';
import MetaMatrix from '../../components/editor/MetaMatrix';
import FloatingImageTool from '../../components/editor/FloatingImageTool';
import { apiFetch } from '../../lib/apiFetch';

interface EditorClientProps {
  historyPostTags: string[];
  historyChatterTags: string[];
  historyMoods: string[];
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : '未知错误';
}

export default function EditorClient({ historyPostTags, historyChatterTags, historyMoods }: EditorClientProps) {
  const searchParams = useSearchParams();

  // 使用 state 追踪当前文档 ID，以便新建草稿保存后更新 ID
  const [currentDocId, setCurrentDocId] = useState(searchParams.get('id') || 'new');
  const docType = (searchParams.get('type') as 'post' | 'chatter' | 'about') || 'post';

  const [title, setTitle] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [cover, setCover] = useState('');
  const [summary, setSummary] = useState('');
  const [mood, setMood] = useState('');
  const [content, setContent] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<string>("");

  // 💡 图床状态路由：区分当前打开的图床是给谁用的
  const [isImgToolOpen, setIsImgToolOpen] = useState(false);
  const [imgToolTarget, setImgToolTarget] = useState<'editor' | 'cover'>('editor');

  const editorRef = useRef<RichTextEditorHandle>(null);

  // 锁定 About 标题
  useEffect(() => {
    if (docType === 'about') setTitle('关于我');
  }, [docType]);

  // 从草稿箱加载旧数据
  useEffect(() => {
    if (currentDocId !== 'new') {
      const loadDraft = async () => {
        try {
          const res = await apiFetch('/api/drafts?path=get', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: currentDocId, type: docType })
          });
          const data = await res.json();
          if (data.success) {
            setTitle(docType === 'about' ? '关于我' : (data.draft.title || ''));
            setTags(data.draft.tags || []);
            setCover(data.draft.cover || '');
            setSummary(data.draft.description || '');
            setMood(data.draft.mood || '');
            setContent(data.draft.content || '');
          }
        } catch (e) { console.error("读取草稿失败", e); }
      };
      loadDraft();
    }
  }, []); // 仅组件挂载时执行一次，防止保存更新 ID 后死循环重复拉取

  // 💾 真实物理落盘接口
  const handleSave = async (isPublish: boolean) => {
    if (!title.trim() && docType !== 'about') {
      alert("⚠️ 请填写文章标题后再保存！");
      return;
    }

    setIsSaving(true);

    const payload = {
      blog_path: localStorage.getItem('targetBlogPath') || "",
      id: docType === 'about' ? 'about' : (currentDocId === 'new' ? null : currentDocId),
      type: docType,
      title: docType === 'about' ? '关于我' : title,
      tags: docType === 'about' ? [] : tags,
      cover,
      mood: docType === 'chatter' ? mood : null,
      description: docType === 'about' ? '' : summary,
      content: editorRef.current?.getContent() || '',
      published: isPublish
    };

    try {
      const res = await apiFetch('/api/drafts?path=save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.success) {
        setLastSaved(new Date().toLocaleTimeString());

        // 如果是新文，保存后获得了真实的 ID，触发无感刷新
        if (currentDocId === 'new' && data.id) {
          setCurrentDocId(data.id); // 更新组件内存 ID
          window.history.replaceState(null, '', `/editor?id=${data.id}&type=${docType}`);
        }

        // 🌟 如果是正式发布，自动触发一键同步到博客
        if (isPublish) {
          await handleAutoSyncAfterSave(data.id || currentDocId);
        } else {
          alert("✅ 草稿保存成功！");
        }
      } else {
        alert("❌ 保存失败: " + (data.message || JSON.stringify(data)));
      }
    } catch (e) {
      console.error("落盘崩溃:", e);
      alert("❌ 引擎连接失败，请检查 Python 后端是否启动！");
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * 🌟 保存后自动同步到博客（绕过操作队列，直接调用 publish_and_sync）
   */
  const handleAutoSyncAfterSave = async (savedId: string) => {
    setIsSyncing(true);
    setSyncProgress("💾 草稿已保存，正在同步到博客...");

    try {
      // 获取目标博客路径
      const syncConfigRes = await apiFetch('/api/sync?path=config');
      let blogPath = "";
      if (syncConfigRes.ok) {
        const syncConfigData = await syncConfigRes.json();
        blogPath = syncConfigData.blogPath || "";
      }

      // 构建单条发布操作
      const publishOp = {
        type: "publish_article",
        payload: {
          type: docType,
          id: savedId,
          title: docType === 'about' ? '关于我' : title,
          tags: docType === 'about' ? [] : tags,
          cover,
          mood: docType === 'chatter' ? mood : null,
          description: docType === 'about' ? '' : summary,
          content: editorRef.current?.getContent() || '',
          date: new Date().toISOString().slice(0, 19).replace('T', ' ')
        }
      };

      setSyncProgress("🚀 正在同步到博客目录...");

      const res = await apiFetch('/api/sync?path=publish_and_sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operations: [publishOp],
          blogPath: blogPath
        }),
        signal: AbortSignal.timeout(60000)
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      if (data.success) {
        setSyncProgress("✅ 发布并同步成功！");
        alert("✅ 文章已发布并同步到博客！");
      } else {
        if (data.step === "sync_failed") {
          setSyncProgress("⚠️ 本地已保存，同步失败");
          alert(`✅ 文章已保存到本地\n❌ 同步失败：${data.sync_error || '未知错误'}\n💡 请在管理页重试同步`);
        } else {
          setSyncProgress("❌ 同步失败");
          alert(`❌ ${data.message}`);
        }
      }
    } catch (error: unknown) {
      setSyncProgress("❌ 网络异常");
      if (error instanceof Error && error.name === 'TimeoutError') {
        alert("⏱️ 网络连接超时，文章已保存到本地，请稍后重试同步");
      } else {
        alert(`🌐 同步异常：${getErrorMessage(error)}`);
      }
    } finally {
      setIsSyncing(false);
      setSyncProgress("");
    }
  };

  return (
    <main className="mx-auto w-[96%] max-w-[1750px] flex flex-row gap-6 z-10 relative" style={{ marginTop: '112px', height: 'calc(100vh - 112px - 32px)', marginBottom: '32px' }}>

      <section className="flex-1 min-w-0 h-full bg-white/30 dark:bg-slate-800/40 backdrop-blur-[60px] rounded-[50px] shadow-2xl border border-white/30 dark:border-white/10 flex flex-col overflow-hidden transition-all duration-700">
        <RichTextEditor
          ref={editorRef}
          title={title}
          setTitle={setTitle}
          initialContent={content}
          onOpenImageTool={() => {
            setImgToolTarget('editor');
            setIsImgToolOpen(true);
          }}
          isTitleLocked={docType === 'about'}
        />
      </section>

      <aside className="w-full md:w-[360px] shrink-0 md:h-full bg-white/30 dark:bg-slate-800/40 backdrop-blur-[60px] rounded-[24px] md:rounded-[50px] shadow-2xl border border-white/30 dark:border-white/10 flex flex-col overflow-hidden transition-all duration-700">
        <MetaMatrix
          type={docType}
          tags={tags} setTags={setTags}
          cover={cover} setCover={setCover}
          summary={summary} setSummary={setSummary}
          mood={mood} setMood={setMood}
          allHistoryPostTags={historyPostTags}
          allHistoryChatterTags={historyChatterTags}
          allHistoryMoods={historyMoods}
          onSave={handleSave}
          isSaving={isSaving}
          lastSaved={lastSaved}
          onOpenImageTool={() => {
            setImgToolTarget('cover');
            setIsImgToolOpen(true);
          }}
          isSyncing={isSyncing}
          syncProgress={syncProgress}
        />
      </aside>

      {/* 图床智能分发 */}
      <FloatingImageTool
        isOpen={isImgToolOpen}
        onClose={() => setIsImgToolOpen(false)}
        onInsert={(url) => {
          if (imgToolTarget === 'editor') {
            editorRef.current?.insertImage(url);
            if (!cover) setCover(url); // 如果给正文插图时封面为空，顺便自动当封面
          } else if (imgToolTarget === 'cover') {
            setCover(url);
            setIsImgToolOpen(false); // 封面设置完直接关掉弹窗，提升体验
          }
        }}
      />
    </main>
  );
}
