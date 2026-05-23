"use client";

import dynamic from 'next/dynamic';

const BackgroundEffects = dynamic(() => import('./BackgroundEffects'), { ssr: false });
const DanmakuBackground = dynamic(() => import('./DanmakuBackground'), { ssr: false });
const ClickEffect = dynamic(() => import('./ClickEffect'), { ssr: false });
const SplashScreen = dynamic(() => import('./SplashScreen'), { ssr: false });
const FloatingPlayer = dynamic(() => import('./FloatingPlayer'), { ssr: false });
const GlobalToolbox = dynamic(() => import('./GlobalToolbox'), { ssr: false });
const BackgroundSlider = dynamic(() => import('./BackgroundSlider'), { ssr: false });

export { BackgroundEffects, DanmakuBackground, ClickEffect, SplashScreen, FloatingPlayer, GlobalToolbox, BackgroundSlider };
