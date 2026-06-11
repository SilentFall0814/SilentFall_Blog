import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import PostsBoard from '../../components/PostsBoard';
import { getPostsDirectory } from '../../lib/contentRoot';


export const dynamic = 'force-dynamic';

export const metadata = {
  title: "文章 | SilentFall の 博客",
  description: "日常碎片与灵感记录",
};

export default function PostsPage() {
  const postsDirectory = getPostsDirectory();
  let posts = [];

  try {
    if (!fs.existsSync(postsDirectory)) {
      fs.mkdirSync(postsDirectory);
    }

    const fileNames = fs.readdirSync(postsDirectory).filter(fileName => fileName.endsWith('.md'));

    posts = fileNames.map(fileName => {
      const slug = fileName.replace(/\.md$/, '');
      const fileContents = fs.readFileSync(path.join(postsDirectory, fileName), 'utf8');
      const { data, content } = matter(fileContents);

      return {
        slug,
        title: data.title || '',
        date: data.date || '未知时间',
        tags: data.tags || [],
        mood: data.mood || '',
        cover: data.cover || '',
        content: content.replace(/^#+ .*\n/m, '')
      };
    }).sort((a, b) => (new Date(b.date).getTime() - new Date(a.date).getTime()));
  } catch (e) {
    console.error("读取文章文件失败:", e);
  }

  return (
    <div className="min-h-screen relative pb-10">
      <Navbar />
      <PageTransition>
        <PostsBoard posts={posts} />
      </PageTransition>
    </div>
  );
}
