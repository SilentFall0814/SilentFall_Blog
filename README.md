# NoWin_Blog - 自托管个人博客系统

基于 [XHBlogs](https://github.com/heiehiehi/XinghuisamaBlogs) 二次开发，使用 Next.js + Python FastAPI 构建的高颜值毛玻璃风格个人博客系统。**完全自托管，无需 GitHub/Vercel。**

> 🙏 **致谢**：本项目由 [XHBlogs](https://github.com/heiehiehi/XinghuisamaBlogs) 二改而来，感谢原作者 [heiehiehi](https://github.com/heiehiehi) 的优秀作品。

## 核心功能

### 📝 内容管理

- **文章**：Markdown 写作，支持代码高亮、数学公式（KaTeX）、目录导航
- **杂谈**：短内容发布，支持封面图和摘要
- **说说**：博主说说（Markdown 文件）+ 访客说说（MongoDB）混合展示，按时间排序
- **草稿**：后台草稿箱，暂存未发布内容
- **操作暂存区**：修改设置 → 暂存到操作队列 → 更新本地 → 同步 Blog

### 💬 评论系统

自建评论系统，数据存储在 MongoDB，支持：
- 昵称 + 邮箱评论（自动生成 Cravatar 头像）
- 评论回复（树状嵌套）
- 评论点赞
- 后台管理面板（审核、隐藏、删除）
- 统计数据（总数、已审核、待审核、已隐藏）

### ✏️ 访客说说

访客可以在说说页面发布自己的内容，支持：
- 富文本编辑器（Tiptap：加粗、斜体、高亮、下划线、对齐等）
- 填写昵称、邮箱、内容
- 提交后进入**待审核**状态，前台不显示
- 博主在后台审核面板中可**通过/拒绝/删除**
- 审核通过后在前台说说列表中与博主说说混合展示
- 访客说说带有"访客"标识，与博主说说区分
- 后台说说页面同步展示访客说说，支持独立删除

### 🎨 主题系统

- 日间/夜间模式切换（**默认日间模式**）
- 主题偏好持久化到 localStorage
- 毛玻璃风格 UI
- 多种背景特效：樱花、萤火虫、弹幕、天气效果、风草等

### 🤖 AI 猫猫助理

内置 AI 驱动的猫猫助理，在后台管理器设置中配置 API 密钥即可启用：
- 支持 OpenAI 兼容接口（DeepSeek、Gemini 等）
- 可自定义模型、系统提示词、温度等参数
- 前台与管理端均可使用

### 🎵 网易云音乐

- 在后台管理器音乐设置中输入网易云音乐歌曲 ID
- 前台浮动播放器 + 歌词栏
- 支持 APlayer 播放模式

### 🖼️ 图床

- 内置图床上传功能，支持"去不图床"等标准 API 图床
- 支持本地存储模式
- 支持直接插入图片外链

### 🔗 友链系统

- 友链展示页面
- 访客可复制申请格式申请友链
- 后台管理友链列表

### 📊 其他功能

- **照片墙**：图片展示
- **项目展示**：个人项目列表
- **时间线**：建站历程
- **天气组件**：实时天气显示
- **全局工具箱**：计算器等小工具
- **搜索功能**：文章搜索
- **点击特效**：互动反馈

## 项目结构

```
NoWin_Blog/
├── NWBlogs/                  # 博客前端（Next.js 16）
│   ├── app/                  # 页面路由
│   │   ├── about/            # 关于页
│   │   ├── api/              # API 代理层
│   │   │   ├── chat/         # AI 猫猫助理
│   │   │   ├── comments/     # 评论接口
│   │   │   ├── guest-moments/# 访客说说接口
│   │   │   └── weather/      # 天气接口
│   │   ├── chatter/          # 云端杂谈
│   │   ├── friends/          # 友链
│   │   ├── moments/          # 说说（博主 + 访客混合展示）
│   │   ├── music/            # 音乐
│   │   ├── photowall/        # 照片墙
│   │   ├── posts/            # 文章
│   │   ├── projects/         # 项目
│   │   └── timeline/         # 时间线
│   ├── components/           # UI 组件
│   │   ├── VisitorMomentEditor.tsx  # 访客说说富文本编辑器
│   │   ├── Comments.tsx      # 评论系统
│   │   ├── MomentComments.tsx # 说说评论
│   │   ├── ThemeProvider.tsx  # 主题切换（默认日间模式）
│   │   ├── CyberCat.tsx      # AI 猫猫助理
│   │   ├── CloudPlayer.tsx   # 网易云音乐播放器
│   │   ├── WeatherWidget.tsx # 天气组件
│   │   ├── DanmakuBackground.tsx # 弹幕背景
│   │   └── ...               # 其他 UI 组件
│   ├── data/                 # 数据文件（友链、图库、项目）
│   ├── siteConfig.ts         # 站点配置
│   ├── deploy.sh             # Linux 服务器一键部署脚本
│   └── next.config.ts        # Next.js 配置（standalone 输出）
│
└── my-blog-manager/          # 后台管理器（Next.js 16 + Python FastAPI）
    ├── app/                  # 管理页面
    │   ├── admin/            # 管理面板
    │   ├── api/              # API 代理层
    │   │   ├── chat/         # AI 猫猫助理
    │   │   ├── comments/     # 评论管理接口
    │   │   └── guest-moments/# 访客说说管理接口
    │   ├── editor/           # 文章/杂谈编辑器
    │   ├── moments/          # 说说管理（博主 + 访客混合展示）
    │   ├── settings/         # 设置页面
    │   │   └── GuestMomentSection.tsx  # 访客说说审核面板
    │   └── ...               # 其他管理页面
    ├── components/
    │   ├── editor/           # 富文本编辑器（Tiptap）
    │   ├── settings/         # 设置模块
    │   │   ├── AICatSection.tsx      # AI 猫猫配置
    │   │   ├── BackgroundSection.tsx # 背景配置
    │   │   ├── CommentSection.tsx    # 评论管理
    │   │   ├── GuestMomentSection.tsx # 访客说说审核
    │   │   ├── MusicSection.tsx      # 音乐配置
    │   │   ├── ProfileSection.tsx    # 个人资料
    │   │   └── ...                   # 其他设置模块
    │   └── ...               # 其他组件
    ├── cms_core/             # Python 后端核心
    │   ├── api/              # API 路由
    │   │   ├── comments.py   # 评论 API
    │   │   ├── guest_moments.py  # 访客说说 API
    │   │   ├── config.py     # 配置 API
    │   │   ├── drafts.py     # 草稿 API
    │   │   ├── friends.py    # 友链 API
    │   │   ├── gallery.py    # 图库 API
    │   │   ├── moments.py    # 说说 API
    │   │   ├── music.py      # 音乐 API
    │   │   ├── picbed.py     # 图床 API
    │   │   ├── projects.py   # 项目 API
    │   │   └── sync.py       # 同步 API
    │   ├── database.py       # MongoDB 连接模块
    │   └── main.py           # FastAPI 入口
    ├── data/                 # 数据存储
    │   └── deploy_config.json # 部署配置
    └── siteConfig.ts         # 管理端站点配置
```

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | Next.js 16（App Router + Turbopack） |
| UI | React 19 + Tailwind CSS 4 + Framer Motion |
| 富文本编辑 | Tiptap（StarterKit + Highlight + Underline + TextAlign 等） |
| 后端 | Python FastAPI + Uvicorn |
| 数据库 | MongoDB（评论 + 访客说说数据） |
| 头像 | Cravatar（Gravatar 国内镜像） |
| AI | OpenAI 兼容接口（DeepSeek 等） |

## 环境要求

- **Node.js** v18+（前端运行与构建）
- **Python** 3.10+（后端 API 服务）
- **MongoDB** 6.0+（评论与访客说说数据存储）
- **npm**（包管理器）

## 快速开始

### 1. 安装依赖

```bash
# 前端依赖
cd NWBlogs
npm install

# 后端 Python 依赖
cd ../my-blog-manager
pip install fastapi uvicorn python-multipart PyYAML markdown markdownify httpx requests pymongo
```

### 2. 启动 MongoDB

```bash
# Linux
sudo systemctl start mongod

# Windows（安装 MongoDB 后）
net start MongoDB

# macOS
brew services start mongodb-community
```

### 3. 启动服务

**方式一：Linux 服务器一键部署**

```bash
cd NWBlogs
# 首次需要构建
npm run build

# 设置环境变量
export MONGO_URI="mongodb://localhost:27017"
export MONGO_DB_NAME="nowin_blog"
export CMS_BACKEND_URL="http://127.0.0.1:8765"
export GEMINI_API_KEY="你的key"   # AI 猫猫助理，可选

# 启动
chmod +x deploy.sh
./deploy.sh
```

**方式二：本地开发调试**

```bash
# 终端1：启动 Python 后端
cd my-blog-manager
python -c "from cms_core.main import app; import uvicorn; uvicorn.run(app, host='0.0.0.0', port=8765)"

# 终端2：启动博客前端
cd NWBlogs
npm run dev

# 终端3：启动后台管理器
cd my-blog-manager
npm run dev
```

### 4. 访问服务

| 服务 | 地址 |
|------|------|
| 博客前端 | http://localhost:3000 |
| 后台管理 | http://localhost:3001 |
| Python 后端 API | http://localhost:8765/api/status |

## 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `MONGO_URI` | MongoDB 连接地址 | `mongodb://localhost:27017` |
| `MONGO_DB_NAME` | MongoDB 数据库名 | `nowin_blog` |
| `CMS_BACKEND_URL` | Python 后端地址 | `http://127.0.0.1:8765` |
| `GEMINI_API_KEY` | AI 猫猫助理 API 密钥 | 空 |
| `PORT` | 前端端口号 | `3000` |

## 数据存储

| 数据类型 | 存储方式 | 说明 |
|----------|----------|------|
| 博客文章 | Markdown 文件 | `NWBlogs/posts/` 目录 |
| 杂谈 | Markdown 文件 | `NWBlogs/chatters/` 目录 |
| 博主说说 | Markdown 文件 | `NWBlogs/moments/` 目录 |
| 评论 | MongoDB | `comments` 集合 |
| 访客说说 | MongoDB | `guest_moments` 集合 |
| 友链/图库/项目 | TypeScript 数据文件 | `data/` 目录 |
| 站点配置 | TypeScript 配置文件 | `siteConfig.ts` |

## 服务器部署（生产环境）

> 📘 **详细部署教程**：如果你使用宝塔面板部署，请阅读 [如何用服务器的宝塔面板将博客项目部署到你的服务器中.md](./如何用服务器的宝塔面板将博客项目部署到你的服务器中.md)，里面有从零开始的超详细图文步骤，适合新手。

### 1. 构建

```bash
cd NWBlogs
npm run build
```

构建产物在 `.next/standalone` 目录下，可直接部署。

### 2. 配置 Nginx 反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8765/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 3. 使用 systemd 管理服务（推荐）

```ini
# /etc/systemd/system/nowin-blog-web.service
[Unit]
Description=NoWin_Blog Frontend
After=network.target

[Service]
WorkingDirectory=/path/to/NWBlogs/.next/standalone
ExecStart=/usr/bin/node server.js
Environment=HOSTNAME=0.0.0.0
Environment=CMS_BACKEND_URL=http://127.0.0.1:8765
Restart=always

[Install]
WantedBy=multi-user.target
```

```ini
# /etc/systemd/system/nowin-blog-api.service
[Unit]
Description=NoWin_Blog Backend API
After=network.target mongod.service

[Service]
WorkingDirectory=/path/to/my-blog-manager
ExecStart=/usr/bin/python3 -c "from cms_core.main import app; import uvicorn; uvicorn.run(app, host='0.0.0.0', port=8765)"
Environment=MONGO_URI=mongodb://localhost:27017
Environment=MONGO_DB_NAME=nowin_blog
Environment=GEMINI_API_KEY=your_key
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable nowin-blog-web nowin-blog-api
sudo systemctl start nowin-blog-web nowin-blog-api
```

## 许可协议

[![License: CC BY-NC 4.0](https://img.shields.io/badge/License-CC%20BY--NC%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc/4.0/)

本项目采用 [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/) 许可协议。允许免费学习、分享和二次修改后发布（二次开源发布需提及原作者），但**严禁用于任何商业用途**。
