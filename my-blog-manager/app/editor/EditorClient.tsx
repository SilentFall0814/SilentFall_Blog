"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import RichTextEditor, { RichTextEditorHandle } from '../../components/editor/RichTextEditor';
import MetaMatrix from '../../components/editor/MetaMatrix';
import FloatingImageTool from '../../components/editor/FloatingImageTool';
import { useToast } from '../../components/ToastProvider';

export default function EditorClient({ historyPostTags, historyChatterTags, historyMoods }: any) {
  const searchParams = useSearchParams();
  const docId = searchParams.get('id') || 'new';
  const docType = (searchParams.get('type') as 'post' | 'chatter' | 'about') || 'post';

  const [title, setTitle] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [cover, setCover] = useState('');
  const [summary, setSummary] = useState('');
  const [mood, setMood] = useState('');
  const [content, setContent] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isImgToolOpen, setIsImgToolOpen] = useState(false);
  const { showToast } = useToast();
  const editorRef = useRef<RichTextEditorHandle>(null);

  // 【核心修复】：如果是 About 模式，初始化时强制锁定标题
  useEffect(() => {
    if (docType === 'about') {
      setTitle('关于我');
    }
  }, [docType]);

  const [blogPath, setBlogPath] = useState("");

  useEffect(() => {
    const savedPath = localStorage.getItem('targetBlogPath');
    if (savedPath) {
      setBlogPath(savedPath);
    }
  }, []);

  useEffect(() => {
    if (docId !== 'new') {
      const loadDraft = async () => {
        try {
          const configRes = await fetch('/backend_config.json');
          const config = await configRes.json();
          const res = await fetch(`http://127.0.0.1:${config.api_port}/api/drafts/get`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ blog_path: blogPath || "[REDACTED_LOCAL_PATH]", id: docId })
          });
          const data = await res.json();
          if (data.success) {
            // 如果是 about，依然强制覆盖标题
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
  }, [docId, docType]);

  const handleSave = async (isPublish: boolean) => {
    if (docType !== 'about' && !title.trim()) {
      showToast('标题不能为空，请输入文章标题', 'error');
      setIsSaving(false);
      return;
    }
    setIsSaving(true);
    const payload = {
      blog_path: blogPath || "[REDACTED_LOCAL_PATH]",
      id: docType === 'about' ? 'about' : (docId === 'new' ? null : docId),
      type: docType,
      title: docType === 'about' ? '关于我' : title,
      tags: docType === 'about' ? [] : tags,
      cover,
      mood: docType === 'chatter' ? mood : null,
      description: docType === 'about' ? '' : summary,
      content: editorRef.current?.getContent(),
      published: isPublish
    };

    try {
      // 先保存草稿到后端
      const configRes = await fetch('/backend_config.json');
      const config = await configRes.json();
      const saveRes = await fetch(`http://127.0.0.1:${config.api_port}/api/drafts/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: payload.id,
          type: payload.type,
          title: payload.title,
          tags: payload.tags,
          cover: payload.cover,
          mood: payload.mood,
          description: payload.description,
          content: payload.content,
          date: new Date().toISOString().split('T')[0],
        }),
      });
      const saveData = await saveRes.json();

      if (!saveData.success) {
        showToast(`保存失败: ${saveData.message}`, 'error');
        setIsSaving(false);
        return;
      }

      // 如果是发布，调用同步到本地
      if (isPublish) {
        const syncRes = await fetch(`http://127.0.0.1:${config.api_port}/api/drafts/sync_local`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            operations: [{
              type: 'publish_article',
              payload: {
                id: saveData.id,
                type: payload.type,
                title: payload.title,
                tags: payload.tags,
                cover: payload.cover,
                mood: payload.mood,
                description: payload.description,
                content: payload.content,
                date: new Date().toISOString().split('T')[0],
              },
            }],
          }),
        });
        const syncData = await syncRes.json();
        if (syncData.success) {
          showToast(isPublish ? '发布成功' : '草稿已保存', 'success');
        } else {
          showToast(`发布失败: ${syncData.message}`, 'error');
        }
      } else {
        showToast('草稿已保存', 'success');
      }
    } catch (e: any) {
      showToast(`保存失败: ${e.message}`, 'error');
    } finally {
      setIsSaving(false);
      setLastSaved(new Date().toLocaleTimeString());
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
          onOpenImageTool={() => setIsImgToolOpen(true)}
          // 【核心修复】：将锁定状态传给编辑器
          isTitleLocked={docType === 'about'}
        />
      </section>

      <aside className="w-[360px] shrink-0 h-full bg-white/30 dark:bg-slate-800/40 backdrop-blur-[60px] rounded-[50px] shadow-2xl border border-white/30 dark:border-white/10 flex flex-col overflow-hidden transition-all duration-700">
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
          isLoadingTags={false}
          onOpenImageTool={() => {}}
        />
      </aside>

      <FloatingImageTool isOpen={isImgToolOpen} onClose={() => setIsImgToolOpen(false)} onInsert={(url) => editorRef.current?.insertImage(url)} />
    </main>
  );
}