import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Link from 'next/link';

import Navbar from '../components/Navbar';
import PageTransition from '../components/PageTransition';
import SearchBar from '../components/SearchBar';
import { siteConfig } from '../siteConfig';
import ThemeToggleBlock from '../components/ThemeToggleBlock';
import ProfileCard from '../components/ProfileCard';
import { albums } from '../data/albums';
import { ToastProvider } from '../components/ToastProvider';

import { CloudPlayer, LatestPostsCarousel, LatestChatterCarousel, SiteDashboard, LyricBar } from '../components/HomeDynamicImports';
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

function readMdDir(dirPath: string, type: 'article' | 'moment' = 'article') {
  const items: any[] = [];
  try {
    if (fs.existsSync(dirPath)) {
      const fileNames = fs.readdirSync(dirPath).filter(f => f.endsWith('.md'));
      fileNames.forEach(fileName => {
        const fullPath = path.join(dirPath, fileName);
        const { data, content } = matter(fs.readFileSync(fullPath, 'utf8'));
        const rawDate = data.date || '1970-01-01';
        // 说说如果没有标题，从内容中提取前20个字作为标题
        let displayTitle = data.title;
        if (!displayTitle && type === 'moment' && content) {
          const plainText = content.replace(/[#*`~\-\[\]()!]/g, '').trim();
          displayTitle = plainText.slice(0, 20) || '无内容';
        }
        items.push({
          slug: fileName.replace(/\.md$/, ''),
          ...data,
          title: displayTitle || (type === 'moment' ? '无标题说说' : '未命名文章'),
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

export const revalidate = 600;

export default function Home() {
  const chattersDirectory = path.join(process.cwd(), 'posts');
  const allArticles = readMdDir(chattersDirectory);
  const top5Articles = allArticles.length > 0 ? allArticles.slice(0, 5) : [{ slug: 'none', title: '暂无文章', description: '快去写第一篇吧！', cover: siteConfig.defaultPostCover, date: '', formattedDate: '' }];

  // 说说数据：moments 目录
  const momentsDirectory = path.join(process.cwd(), 'moments');
  const allMoments = readMdDir(momentsDirectory, 'moment');
  const top5Moments = allMoments.length > 0 ? allMoments.slice(0, 5) : [{ slug: 'none', title: '暂无说说', description: '记录一段思绪...', cover: siteConfig.defaultPostCover, date: '', formattedDate: '' }];

  const articleCount = allArticles.length;
  const momentCount = allMoments.length;
  const realPhotoCount = albums.reduce((total, album) => total + album.photos.length, 0);
  const latestAlbum = albums.length > 0 ? albums[0] : { id: '', title: '照片墙', description: '查看摄影', cover: siteConfig.photoWallImage, date: '' };

  return (
    <ToastProvider>
      <div className="min-h-screen relative pb-10">
        <Navbar />
        <PageTransition>
          <div className="w-full max-w-6xl mx-auto mt-24 sm:mt-28 px-4 sm:px-6 lg:px-10 relative z-10">
            <SearchBar posts={allArticles} />

            <main className="flex flex-col gap-6 w-full mt-6">

              {/* 第一行：个人信息 + 播放器 */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
                <div className="col-span-1 lg:col-span-7 flex flex-col">
                  <ProfileCard articleCount={articleCount} momentCount={momentCount} photoCount={realPhotoCount}/>
                </div>
                <div className="col-span-1 lg:col-span-5 flex flex-col">
                  <CloudPlayer/>
                </div>
              </div>

              {/* 歌词栏 */}
              <div className="w-full mt-[-10px]"><LyricBar/></div>

              {/* 第二行：文章轮播 + 照片墙 + 说说 + 主题切换 */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">

                {/* 左侧：文章轮播 */}
                <div className="col-span-1 lg:col-span-4 flex flex-col min-h-[300px]">
                  <LatestPostsCarousel posts={top5Articles} />
                </div>

                {/* 右侧：组合面板 */}
                <div className="col-span-1 lg:col-span-8 flex flex-col gap-6">

                  {/* 照片墙大海报 */}
                  <Link href="/photowall" className="w-full rounded-3xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl overflow-hidden transition-all duration-700 hover:scale-[1.02] relative group min-h-[200px] sm:min-h-[220px] flex-shrink-0">
                    <img src={latestAlbum.cover} width={800} height={400} className="w-full h-full absolute inset-0 object-cover transition-transform duration-700 group-hover:scale-105 opacity-90"/>
                    <div className="absolute inset-0 bg-black/30 dark:bg-black/50 group-hover:bg-black/10 transition-colors duration-500"></div>
                    <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 right-6">
                      <h3 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2 underline decoration-pink-400">{latestAlbum.title}</h3>
                      <p className="text-white/90 text-sm sm:text-lg line-clamp-1">{latestAlbum.description}</p>
                    </div>
                  </Link>

                  {/* 底层网格：说说轮播 + 主题切换器 */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full flex-1">
                    <div className="sm:col-span-2 flex flex-col min-h-[200px]">
                      <LatestChatterCarousel chatters={top5Moments} />
                    </div>
                    <div className="sm:col-span-1 flex flex-col min-h-[120px]">
                      <ThemeToggleBlock />
                    </div>
                  </div>

                </div>
              </div>

              {/* 底部数据面板 */}
              <div className="w-full mt-4"><SiteDashboard/></div>
            </main>
          </div>
        </PageTransition>
      </div>
    </ToastProvider>
  );
}
