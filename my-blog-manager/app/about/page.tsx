import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';
import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';

export default async function AboutPage() {
  const aboutPath = path.join(process.cwd(), 'app', 'about', 'about.md');
  let content = '';

  if (fs.existsSync(aboutPath)) {
    const fileContents = fs.readFileSync(aboutPath, 'utf8');
    const result = matter(fileContents);
    const processedContent = await unified()
      .use(remarkParse)
      .use(remarkRehype)
      .use(rehypeHighlight)
      .use(rehypeStringify)
      .process(result.content);
    content = processedContent.toString();
  }

  return (
    <div className="min-h-screen relative pb-10">
      <Navbar />
      <PageTransition>
        <main className="w-[90%] max-w-4xl mx-auto mt-28 relative z-10">
          <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/50 dark:border-slate-800/50 rounded-[40px] p-10 shadow-2xl">
            <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
          </div>
        </main>
      </PageTransition>
    </div>
  );
}
