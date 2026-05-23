import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Link from 'next/link';

import Navbar from '../components/Navbar';
import PageTransition from '../components/PageTransition';
import SearchBar from '../components/SearchBar';
import { siteConfig } from '../siteConfig';
import CloudPlayer from '../components/CloudPlayer';
import ThemeToggleBlock from '../components/ThemeToggleBlock';
import ProfileCard from '../components/ProfileCard';
import SiteDashboard from '../components/SiteDashboard';
import { albums } from '../data/albums';
import LyricBar from '../components/LyricBar';
import { ToastProvider } from '../components/ToastProvider';

import LatestPostsCarousel from '../components/LatestPostsCarousel';
import LatestChatterCarousel from '../components/LatestChatterCarousel';
import DanmakuBackground from '../components/DanmakuBackground';

function formatUpdateTime(dateString: string) {
  if (!dateString || dateString === '1970-01-01') return '刚刚更新';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    if (hours === '00' && mins === '00') return `${year}.${month}.${day}`;
    return `${year}.${month}.${day} ${hours}:${mins}`;
  } catch { return dateString; }
}

function readMdDir(dirPath: string) {
  const items: any[] = [];
  try {
    if (fs.existsSync(dirPath)) {
      const fileNames = fs.readdirSync(dirPath).filter(f => f.endsWith('.md'));
      fileNames.forEach(fileName => {
        const fullPath = path.join(dirPath, fileName);
        const { data, content } = matter(fs.readFileSync(fullPath, 'utf8'));
        const rawDate = data.date || '1970-01-01';
        items.push({
          slug: fileName.replace(/\.md$/, ''),
          ...data,
          title: data.title || '未命名文章',
          description: data.description || '',
          content: content || '',
          date: rawDate,
          formattedDate: formatUpdateTime(rawDate),
        });
      });
      items.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateB !== dateA) return dateB - dateA;
        return b.slug.localeCompare(a.slug);
      });
    }
  } catch (e) {}
  return items;
}

export default function Home() {
  // 文章数据：chatters 目录
  const chattersDirectory = path.join(process.cwd(), 'posts');
  const allArticles = readMdDir(chattersDirectory);
  const top5Articles = allArticles.length > 0 ? allArticles.slice(0, 5) : [{ slug: 'none', title: '暂无文章', description: '快去写第一篇吧！', cover: siteConfig.defaultPostCover, date: '', formattedDate: '' }];

  // 说说数据：moments 目录
  const momentsDirectory = path.join(process.cwd(), 'moments');
  const allMoments = readMdDir(momentsDirectory);
  const top5Moments = allMoments.length > 0 ? allMoments.slice(0, 5) : [{ slug: 'none', title: '暂无说说', description: '记录一段思绪...', cover: siteConfig.defaultPostCover, date: '', formattedDate: '' }];

  const articleCount = allArticles.length;
  const momentCount = allMoments.length;
  const realPhotoCount = albums.reduce((total, album) => total + album.photos.length, 0);
  const latestAlbum = albums.length > 0 ? albums[0] : { id: '', title: '照片墙', description: '查看摄影', cover: siteConfig.photoWallImage, date: '' };

  return (
    <div className="min-h-screen relative pb-10">
        <Navbar />
        <PageTransition>
          <div className="w-full max-w-6xl mx-auto mt-28 px-4 sm:px-10 relative z-10">
            <SearchBar posts={allArticles} />

            <main className="flex flex-col gap-6 w-full">
              {/* 第一行：个人信息 + 播放器 */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full items-stretch">
                <div className="md:col-span-7 flex">
                  <ProfileCard articleCount={articleCount} momentCount={momentCount} photoCount={realPhotoCount}/>
                </div>
                <div className="md:col-span-5 flex">
                  <CloudPlayer/>
                </div>
              </div>

              {/* 歌词栏 */}
              <div className="w-full mt-[-10px]"><LyricBar/></div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full items-stretch">
                {/* 左侧：文章轮播 */}
                <div className="md:col-span-4 h-full">
                  <LatestPostsCarousel posts={top5Articles} />
                </div>
                <div className="md:col-span-8 flex flex-col gap-6 h-full">
                  <Link href="/photowall" className="flex-1 rounded-3xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl overflow-hidden transition-all duration-700 hover:scale-[1.02] relative group min-h-[220px]">
                    <img src={latestAlbum.cover} className="w-full h-full absolute inset-0 object-cover transition-transform duration-700 group-hover:scale-105 opacity-90"/>
                    <div className="absolute inset-0 bg-black/20 dark:bg-black/50 group-hover:bg-transparent transition-colors duration-500"></div>
                    <div className="absolute bottom-6 left-6 right-6">
                      <h3 className="text-3xl font-bold text-white mb-2 underline decoration-pink-400">{latestAlbum.title}</h3>
                      <p className="text-white/90 text-lg line-clamp-1">{latestAlbum.description}</p>
                    </div>
                  </Link>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1 min-h-[220px] items-stretch">
                    {/* 说说轮播 */}
                    <div className="md:col-span-8 h-full">
                      <LatestChatterCarousel chatters={top5Moments} />
                    </div>
                    <div className="md:col-span-4 h-full flex">
                      <ThemeToggleBlock />
                    </div>
                  </div>
                </div>
              </div>

              {/* 底部数据面板 */}
              <div className="w-full mt-2"><SiteDashboard/></div>
            </main>
          </div>
        </PageTransition>
      </div>
  );
}
