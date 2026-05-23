"use client";

import dynamic from 'next/dynamic';

const CloudPlayer = dynamic(() => import('./CloudPlayer'), { ssr: false });
const LatestPostsCarousel = dynamic(() => import('./LatestPostsCarousel'), { ssr: false });
const LatestChatterCarousel = dynamic(() => import('./LatestChatterCarousel'), { ssr: false });
const SiteDashboard = dynamic(() => import('./SiteDashboard'), { ssr: false });
const LyricBar = dynamic(() => import('./LyricBar'), { ssr: false });

export { CloudPlayer, LatestPostsCarousel, LatestChatterCarousel, SiteDashboard, LyricBar };
