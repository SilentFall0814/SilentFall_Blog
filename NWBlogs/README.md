# NoWin_Blog 博客前端

基于 [XHBlogs](https://github.com/heiehiehi/XinghuisamaBlogs) 二次开发，使用 Next.js 16（App Router + Turbopack）构建的毛玻璃风格博客前端。

## 页面

| 页面 | 路径 | 说明 |
|------|------|------|
| 首页 | `/` | 文章列表、照片墙预览、最新动态 |
| 文章 | `/posts/[slug]` | Markdown 渲染，代码高亮 + KaTeX 公式 |
| 杂谈 | `/chatter` | 短内容列表与详情 |
| 说说 | `/moments` | 博主说说 + 访客说说混合展示 |
| 友链 | `/friends` | 友链展示与申请 |
| 照片墙 | `/photowall` | 图片展示 |
| 项目 | `/projects` | 个人项目列表 |
| 时间线 | `/timeline` | 建站历程 |
| 音乐 | `/music` | 网易云音乐播放器 |
| 关于 | `/about` | 博主介绍 |

## 核心组件

- **ThemeProvider** - 日间/夜间主题切换（默认日间模式）
- **VisitorMomentEditor** - 访客说说富文本编辑器（Tiptap）
- **Comments / MomentComments** - 评论系统（MongoDB + Cravatar 头像）
- **CyberCat** - AI 猫猫助理
- **CloudPlayer / FloatingPlayer** - 网易云音乐播放器
- **WeatherWidget** - 天气组件
- **DanmakuBackground** - 弹幕背景特效
- **Sakura / Fireflies / WindyGrass** - 背景装饰特效

## API 代理

前端通过 Next.js API Routes 代理到 Python 后端：

| 路由 | 后端接口 | 说明 |
|------|----------|------|
| `/api/comments` | `/api/comments/*` | 评论 CRUD |
| `/api/guest-moments` | `/api/guest_moments/*` | 访客说说提交与查询 |
| `/api/chat` | AI 接口 | AI 猫猫助理 |
| `/api/weather` | 天气 API | 天气数据 |

## 开发

```bash
npm install
npm run dev
```

访问 http://localhost:3000

## 生产构建

```bash
npm run build
```

构建产物在 `.next/standalone` 目录，可直接部署到服务器：

```bash
HOSTNAME=0.0.0.0 CMS_BACKEND_URL=http://127.0.0.1:8765 node .next/standalone/server.js
```

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `CMS_BACKEND_URL` | Python 后端地址 | `http://127.0.0.1:8765` |
| `GEMINI_API_KEY` | AI 猫猫助理 API 密钥 | 空 |
| `PORT` | 端口号 | `3000` |
