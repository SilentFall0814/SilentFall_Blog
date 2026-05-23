"use client";

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Calendar, FileText, FolderGit2, MessageCircle, Tag } from 'lucide-react';

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

interface TimelineClientProps {
  items: TimelineItem[];
}

const typeConfig = {
  post: { icon: FileText, label: '文章', color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
  project: { icon: FolderGit2, label: '项目', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
  moment: { icon: MessageCircle, label: '说说', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
};

export default function TimelineClient({ items }: TimelineClientProps) {
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach(item => {
      const tags = item.tags.length > 0 ? item.tags : ['未分类'];
      tags.forEach(tag => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    return counts;
  }, [items]);

  const tagsArray = useMemo(() => {
    return Object.keys(tagCounts)
      .map(name => ({ name, count: tagCounts[name] }))
      .sort((a, b) => b.count - a.count);
  }, [tagCounts]);

  const filteredItems = useMemo(() => {
    if (!activeTag) return items;
    return items.filter(item => {
      const tags = item.tags.length > 0 ? item.tags : ['未分类'];
      return tags.includes(activeTag);
    });
  }, [items, activeTag]);

  const groupedByYear = useMemo(() => {
    const groups: { year: string; items: TimelineItem[] }[] = [];
    let currentYear = '';

    filteredItems.forEach(item => {
      const year = item.date ? item.date.split('-')[0] : '未知日期';
      if (year !== currentYear) {
        currentYear = year;
        groups.push({ year, items: [item] });
      } else {
        groups[groups.length - 1].items.push(item);
      }
    });

    return groups;
  }, [filteredItems]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return dateStr.split(' ')[0];
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-28 px-4 sm:px-8 relative z-10">

      {/* 页面标题区域 */}
      <div className="text-center mb-12">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-3"
        >
          归档与探索
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-slate-500 dark:text-slate-400 font-medium flex items-center justify-center gap-2"
        >
          <Calendar size={16} className="text-indigo-500" />
          总计 {items.length} 篇研究记录
        </motion.p>
      </div>

      {/* 标签过滤行 */}
      {tagsArray.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-2 mb-12"
        >
          <button
            onClick={() => setActiveTag(null)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              !activeTag
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                : 'bg-white/40 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60'
            }`}
          >
            全部档案
          </button>
          {tagsArray.map(tag => (
            <button
              key={tag.name}
              onClick={() => setActiveTag(activeTag === tag.name ? null : tag.name)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                activeTag === tag.name
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                  : 'bg-white/40 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <Tag size={10} />
              {tag.name}
              <span className="opacity-60">({tag.count})</span>
            </button>
          ))}
        </motion.div>
      )}

      {/* 垂直时间线 */}
      <div className="relative">
        {/* 时间轴竖线 */}
        <div className="absolute left-[19px] sm:left-[23px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500/40 via-indigo-400/20 to-transparent" />

        {groupedByYear.map((group, groupIdx) => (
          <div key={group.year}>
            {/* 年份分隔 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5 }}
              className="relative flex items-center gap-4 mb-8 mt-12 first:mt-0"
            >
              <div className="relative z-10 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
                <span className="text-white text-xs sm:text-sm font-black">{group.year}</span>
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-indigo-500/30 to-transparent" />
            </motion.div>

            {/* 该年份下的条目列表 */}
            <div className="flex flex-col gap-6 ml-10 sm:ml-14 mb-4">
              {group.items.map((item, idx) => {
                const config = typeConfig[item.type];
                const TypeIcon = config.icon;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.5, delay: idx * 0.05 }}
                    className="relative"
                  >
                    {/* 时间节点圆点 */}
                    <div className="absolute -left-10 sm:-left-14 top-4 sm:top-5 w-3 h-3 rounded-full bg-white dark:bg-slate-800 border-2 border-indigo-400 shadow-sm z-10" />

                    {/* 卡片 */}
                    <Link href={item.href} className="block group">
                      <div className="bg-white/60 dark:bg-slate-800/70 backdrop-blur-xl border border-white/50 dark:border-slate-700/50 rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 hover:border-indigo-300/50 dark:hover:border-indigo-500/30">

                        {/* 封面图（可选） */}
                        {item.cover && (
                          <div className="relative h-40 sm:h-48 overflow-hidden">
                            <img
                              src={item.cover}
                              alt={item.rawTitle}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                          </div>
                        )}

                        <div className="p-4 sm:p-5">
                          {/* 类型标签 */}
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-[10px] font-bold ${config.color} ${config.bg} px-2 py-0.5 rounded-md flex items-center gap-1`}>
                              <TypeIcon size={10} />
                              {config.label}
                            </span>
                          </div>

                          {/* 日期 */}
                          {item.date && (
                            <div className="text-[11px] font-mono font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1 mb-2">
                              <Calendar size={11} />
                              {formatDate(item.date)}
                            </div>
                          )}

                          {/* 标题 */}
                          <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 line-clamp-2 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors leading-snug mb-1.5">
                            {item.title}
                          </h3>

                          {/* 描述 */}
                          {item.description && (
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-2.5">
                              {item.description}
                            </p>
                          )}

                          {/* 标签 */}
                          {item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {item.tags.map(tag => (
                                <span
                                  key={tag}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setActiveTag(activeTag === tag ? null : tag);
                                  }}
                                  className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-md cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}

        {/* 空状态 */}
        {filteredItems.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <p className="text-slate-400 dark:text-slate-500 font-medium text-sm">
              还没有任何记录
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
