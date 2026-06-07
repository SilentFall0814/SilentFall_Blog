import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import { siteConfig } from '../../siteConfig';
import TimelineClient from '../../components/TimelineClient';
import { projectsData } from '../../data/projects';

export const revalidate = 3600;

export const metadata = {
  title: "归档 | SilentFall の 博客",
  description: "归档与探索，记录每一篇文章、项目与瞬间",
};

interface TimelineItem {
  id: string;
  type: 'post' | 'project' | 'moment';
  title: string;
  rawTitle: string;
  date: string;
  description: string;
  cover: string;
  tags: string[];
  href: string;
}

export default function Timeline() {
  const items: TimelineItem[] = [];
  const seenIds = new Set<string>();

  function addUnique(item: TimelineItem) {
    if (!seenIds.has(item.id)) {
      seenIds.add(item.id);
      items.push(item);
    }
  }

  // 读取文章数据（posts 目录）
  const chattersDirectory = path.join(process.cwd(), 'posts');
  try {
    if (fs.existsSync(chattersDirectory)) {
      const fileNames = fs.readdirSync(chattersDirectory).filter(f => f.endsWith('.md'));
      fileNames.forEach(fileName => {
        const slug = fileName.replace(/\.md$/, '');
        const fullPath = path.join(chattersDirectory, fileName);
        const fileContents = fs.readFileSync(fullPath, 'utf8');
        const { data, content } = matter(fileContents);

        if (!data.title || !data.title.trim() || data.title === '未命名草稿') return;

        addUnique({
          id: `post-${slug}`,
          type: 'post',
          title: `发布文章：${data.title}`,
          rawTitle: data.title,
          date: data.date || '',
          description: data.description || '',
          cover: data.cover || siteConfig.defaultPostCover,
          tags: Array.isArray(data.tags) ? data.tags : [],
          href: `/posts/${slug}`,
        });
      });
    }
  } catch (e) {
    console.error("读取文章数据失败", e);
  }

  // 读取项目数据
  try {
    projectsData.forEach(project => {
      addUnique({
        id: `project-${project.id}`,
        type: 'project',
        title: `新增项目：${project.name}`,
        rawTitle: project.name,
        date: project.date || '',
        description: project.description || '',
        cover: '',
        tags: project.tags || [],
        href: '/projects',
      });
    });
  } catch (e) {
    console.error("读取项目数据失败", e);
  }

  // 读取说说数据（检查多个可能的目录）
  const momentDirs = [
    path.join(process.cwd(), 'moments'),
    path.join(process.cwd(), 'posts', 'moments'),
  ];

  momentDirs.forEach(dir => {
    try {
      if (fs.existsSync(dir)) {
        const fileNames = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
        fileNames.forEach(fileName => {
          const id = fileName.replace(/\.md$/, '');
          const fullPath = path.join(dir, fileName);
          const fileContents = fs.readFileSync(fullPath, 'utf8');
          const { data, content } = matter(fileContents);

          const textContent = content.trim().replace(/[#*`>\-\[\]()!]/g, '');
          const summary = textContent.length > 20 ? textContent.slice(0, 20) + '...' : textContent;

          addUnique({
            id: `moment-${id}`,
            type: 'moment',
            title: `发布说说：${summary}`,
            rawTitle: summary,
            date: data.date || '',
            description: textContent.length > 60 ? textContent.slice(0, 60) + '...' : textContent,
            cover: (Array.isArray(data.images) && data.images.length > 0) ? data.images[0] : '',
            tags: [],
            href: '/moments',
          });
        });
      }
    } catch (e) {
      console.error("读取说说数据失败", e);
    }
  });

  // 排序：按日期倒序，没有日期的排在最后
  items.sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateB - dateA;
  });

  return (
    <div className="min-h-screen relative pb-32">
      <Navbar />
      <PageTransition>
        <TimelineClient items={items} />
      </PageTransition>
    </div>
  );
}
