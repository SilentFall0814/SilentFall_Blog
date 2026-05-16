import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Link from 'next/link';

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

import 'highlight.js/styles/atom-one-dark.css';

import Navbar from '../../../components/Navbar';
import PageTransition from '../../../components/PageTransition';
import { siteConfig } from '../../../siteConfig';
import ClientSocials from '../../../components/ClientSocials';
import SidebarLyric from '../../../components/SidebarLyric';
import BackButton from '../../../components/BackButton';
import Comments from '../../../components/Comments';

export async function generateStaticParams() {
  const chattersDirectory = path.join(process.cwd(), 'chatters');
  if (!fs.existsSync(chattersDirectory)) return [];
  const filenames = fs.readdirSync(chattersDirectory);
  return filenames
    .filter((name) => name.endsWith('.md'))
    .map((name) => ({
      slug: name.replace(/\.md$/, ''),
    }));
}

async function getChatterData(slug: string) {
  const fullPath = path.join(process.cwd(), 'chatters', `${slug}.md`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  const processedContent = await unified()
    .use(remarkParse)
    .use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeHighlight, { ignoreMissing: true })
    .use(rehypeKatex)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(content);

  return {
    slug,
    contentHtml: processedContent.toString(),
    title: data.title || '碎片记录',
    date: data.date || '1970-01-01',
    mood: data.mood,
    tags: data.tags && Array.isArray(data.tags) ? data.tags : [],
    cover: data.cover || siteConfig.defaultPostCover
  };
}

export default async function ChatterPost({ params }: { params: { slug: string } }) {
  const { slug } = await params;
  const chatterData = await getChatterData(slug);

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <main className="w-[95%] max-w-5xl mx-auto mt-28 relative z-10">
          <article className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-slate-800/50 rounded-[40px] p-8 md:p-16 shadow-2xl overflow-hidden relative">
            <header className="mb-10 border-b border-slate-300/30 dark:border-slate-700/50 pb-8 relative">
              <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tight transition-colors duration-700 pr-24 leading-tight">
                {chatterData.title}
              </h1>

              <Link
                href={`/editor?id=${chatterData.slug}&type=chatter`}
                className="absolute top-0 right-0 p-3 rounded-2xl bg-white/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-indigo-500 hover:text-white transition-all shadow-sm border border-slate-200 dark:border-slate-700 group flex items-center gap-2 active:scale-95 z-50"
              >
                <span className="text-lg">✏️</span>
                <span className="text-sm font-bold hidden group-hover:inline-block">修改此篇</span>
              </Link>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold bg-indigo-500/5 dark:bg-indigo-400/10 px-4 py-2 rounded-2xl text-sm border border-indigo-500/10">
                  <span className="opacity-70">📅</span> {chatterData.date}
                </div>
                {chatterData.mood && (
                  <div className="flex items-center gap-2 text-pink-600 dark:text-pink-400 font-black bg-pink-500/5 dark:bg-pink-400/10 px-4 py-2 rounded-2xl text-sm border border-pink-500/10">
                    ✨ 心情：{chatterData.mood}
                  </div>
                )}
                {chatterData.tags.map((tag: string) => (
                  <div key={tag} className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-bold bg-slate-500/5 dark:bg-slate-400/10 px-4 py-2 rounded-2xl text-sm border border-slate-500/10">
                    # {tag}
                  </div>
                ))}
              </div>
            </header>

            <div className="relative">
              <style>{`
                .prose pre { background-color: #282c34 !important; color: #abb2bf !important; padding: 1.25rem !important; border-radius: 0.75rem !important; overflow-x: auto !important; box-shadow: inset 0 0 10px rgba(0,0,0,0.3) !important; margin-top: 1.5rem !important; margin-bottom: 1.5rem !important; }
                .prose pre code { background-color: transparent !important; padding: 0 !important; color: inherit !important; font-size: 0.9em !important; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important; }
                .prose p { font-size: 1.1rem !important; line-height: 1.8 !important; }
                .prose img { border-radius: 1.5rem !important; box-shadow: 0 10px 30px rgba(0,0,0,0.1) !important; margin: 2rem auto !important; }
              `}</style>
              <div className="prose dark:prose-invert max-w-none prose-indigo" dangerouslySetInnerHTML={{ __html: chatterData.contentHtml }} />
            </div>

            <div className="mt-20 pt-10 border-t border-slate-300/30 dark:border-slate-700/50">
              <Comments />
            </div>
          </article>

          <div className="mt-8 flex justify-between items-center px-4">
             <BackButton />
             <ClientSocials />
          </div>
        </main>
      </PageTransition>
      <SidebarLyric />
    </div>
  );
}
