import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 生成独立部署的 Node.js 服务器（standalone 模式）
  output: 'standalone',

  // 【必须项】：standalone 模式下 Next.js 自带的图片压缩服务不可用，必须关闭
  images: {
    unoptimized: true,
  },
  // 屏蔽 TypeScript 类型报错
  typescript: {
    ignoreBuildErrors: true,
  },

  // 屏蔽 ESLint 语法检查
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
