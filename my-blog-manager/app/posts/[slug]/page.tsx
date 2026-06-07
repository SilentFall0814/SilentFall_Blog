import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import css from 'highlight.js/lib/languages/css';
import xml from 'highlight.js/lib/languages/xml';
import bash from 'highlight.js/lib/languages/bash';
import json from 'highlight.js/lib/languages/json';
import yaml from 'highlight.js/lib/languages/yaml';
import markdown from 'highlight.js/lib/languages/markdown';
import sql from 'highlight.js/lib/languages/sql';
import java from 'highlight.js/lib/languages/java';
import csharp from 'highlight.js/lib/languages/csharp';
import cpp from 'highlight.js/lib/languages/cpp';
import rust from 'highlight.js/lib/languages/rust';
import go from 'highlight.js/lib/languages/go';
import ruby from 'highlight.js/lib/languages/ruby';
import php from 'highlight.js/lib/languages/php';
import 'highlight.js/styles/atom-one-dark.css';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('css', css);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('json', json);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('java', java);
hljs.registerLanguage('csharp', csharp);
hljs.registerLanguage('cpp', cpp);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('go', go);
hljs.registerLanguage('ruby', ruby);
hljs.registerLanguage('php', php);

import Navbar from '../../../components/Navbar';
import PageTransition from '../../../components/PageTransition';
import { siteConfig } from '../../../siteConfig';
import ClientSocials from '../../../components/ClientSocials';
import ClientTOC from '../../../components/ClientTOC';
import BackButton from '../../../components/BackButton';
import Comments from '../../../components/Comments';
import SidebarLyric from '../../../components/SidebarLyric';

export async function generateStaticParams() {
  const postsDirectory = path.join(process.cwd(), 'posts');
  if (!fs.existsSync(postsDirectory)) return [];
  const filenames = fs.readdirSync(postsDirectory);
  return filenames
    .filter((name) => name.endsWith('.md'))
    .map((name) => ({
      slug: name.replace(/\.md$/, ''),
    }));
}

function extractToc(content: string) {
  const headingRegex = /^(#{1,3})\s+(.+)$/gm;
  const toc = [];
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    toc.push({
      level: match[1].length,
      text: match[2].trim(),
      id: match[2].trim().toLowerCase().replace(/\s+/g, '-')
    });
  }
  return toc;
}

async function getPostData(slug: string) {
  const fullPath = path.join(process.cwd(), 'posts', `${slug}.md`);
  if (!fs.existsSync(fullPath)) {
    notFound();
  }
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
    toc: extractToc(content),
    ...data,
    title: data.title || '无标题文章',
    date: data.date || '1970-01-01',
    tags: data.tags || [],
    cover: data.cover || siteConfig.defaultPostCover
  } as any;
}

export default async function Post({ params }: { params: { slug: string } }) {
  const { slug } = await params;
  const postData = await getPostData(slug);

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <main className="w-[95%] max-w-7xl mx-auto mt-28 flex flex-col lg:flex-row gap-10 items-start relative z-10">
          <article className="flex-1 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-slate-800/50 rounded-[40px] p-8 md:p-16 shadow-2xl overflow-hidden relative">
            <header className="mb-12 border-b border-slate-300/30 dark:border-slate-700/50 pb-10 relative">
              <h1 className="text-2xl md:text-4xl lg:text-6xl font-black text-slate-900 dark:text-white mb-4 md:mb-8 tracking-tighter leading-tight pr-12 md:pr-20">
                {postData.title}
              </h1>

              <Link
                href={`/editor?id=${postData.slug}&type=post`}
                className="absolute top-0 right-0 p-3 rounded-2xl bg-white/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-indigo-500 hover:text-white transition-all shadow-sm border border-slate-200 dark:border-slate-700 group flex items-center gap-2 active:scale-95 z-50"
              >
                <span className="text-lg">✏️</span>
                <span className="text-sm font-bold hidden group-hover:inline-block">修改此篇</span>
              </Link>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold bg-indigo-500/5 dark:bg-indigo-400/10 px-4 py-2 rounded-2xl text-sm border border-indigo-500/10">
                  <span className="opacity-70">📅</span> {postData.date}
                </div>
                {postData.tags.map((tag: string) => (
                  <div key={tag} className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-bold bg-slate-500/5 dark:bg-slate-400/10 px-4 py-2 rounded-2xl text-sm border border-slate-500/10">
                    <span className="text-xs opacity-70">#</span> {tag}
                  </div>
                ))}
              </div>
            </header>

            <div className="relative">
              <style>{`
                .prose pre { background-color: #282c34 !important; color: #abb2bf !important; padding: 1.25rem !important; border-radius: 0.75rem !important; overflow-x: auto !important; box-shadow: inset 0 0 10px rgba(0,0,0,0.3) !important; margin-top: 1.5rem !important; margin-bottom: 1.5rem !important; }
                .prose pre code { background-color: transparent !important; padding: 0 !important; color: inherit !important; font-size: 0.9em !important; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important; }
                .prose code::before, .prose code::after { content: none !important; }
                .prose p code, .prose li code { background-color: rgba(99, 102, 241, 0.1) !important; color: #6366f1 !important; padding: 0.2rem 0.4rem !important; border-radius: 0.375rem !important; font-weight: 600 !important; }
                .dark .prose p code, .dark .prose li code { background-color: rgba(99, 102, 241, 0.2) !important; color: #818cf8 !important; }
                .prose h1 { font-size: 3rem !important; font-weight: 950 !important; margin-bottom: 2rem !important; margin-top: 3rem !important; line-height: 1.1 !important; color: inherit !important; }
                .prose h2 { font-size: 2.2rem !important; font-weight: 800 !important; margin-bottom: 1.5rem !important; margin-top: 2rem !important; color: inherit !important; }
                .prose h3 { font-size: 1.5rem !important; font-weight: 700 !important; margin-bottom: 1rem !important; color: inherit !important; }
                .prose p { font-size: 1.15rem !important; line-height: 1.85 !important; color: inherit !important; overflow-wrap: break-word !important; word-break: break-word !important; }
                .prose ul { list-style-type: disc !important; padding-left: 1.5rem !important; }
                .prose ol { list-style-type: decimal !important; padding-left: 1.5rem !important; }
                .prose img { display: block !important; margin: 2rem auto !important; border-radius: 2rem !important; box-shadow: 0 20px 50px rgba(0,0,0,0.15) !important; max-width: 100% !important; height: auto !important; }
                .prose img[style*="width"] { max-width: none !important; }
                .prose { overflow-wrap: break-word !important; word-break: break-word !important; }
              `}</style>
              <div className="prose dark:prose-invert max-w-none prose-indigo break-words" dangerouslySetInnerHTML={{ __html: postData.contentHtml }} />
            </div>

            <div className="mt-20 pt-10 border-t border-slate-300/30 dark:border-slate-700/50">
              <Comments />
            </div>
          </article>

          <aside className="w-full lg:w-80 flex flex-col gap-8 sticky top-28">
            <BackButton />
            <ClientTOC toc={postData.toc} />
            <ClientSocials />
            <SidebarLyric />
          </aside>
        </main>
      </PageTransition>
    </div>
  );
}
