# SilentFall_Blog - 自托管个人博客系统

SilentFall_Blog 是一个由博客用户端、管理端与 FastAPI 后端组成的自托管博客项目。项目以文件化内容管理为核心，结合 MongoDB 存储评论、访客说说、公告与访问统计数据，适合部署到个人服务器并长期维护。

## 页面预览

- 用户端包含首页、文章详情页、说说页、友链页、项目页、Steam 展示页、时间线等完整内容展示页面。
- 管理端包含审核中心、公告管理、访客统计、访问记录、内容编辑器、设置中心等后台页面。
- 页面截图资源位于项目根目录的 `Screenshot/` 目录，可用于快速了解界面风格。

## 核心功能

### 内容管理

- 文章、关于页、里程碑、博主说说均采用文件化方式管理，最终以 Markdown 或 TypeScript 数据文件落盘。
- 管理端提供富文本编辑器、封面设置、标签设置、摘要设置与自动保存能力。
- 发布时支持一键执行“本地写入 + 同步到用户端”链路，避免手工复制文件。
- 删除文章或里程碑时，会同步清理用户端目标文件，并尝试清理关联评论。

### 博客公告

- 后端提供公告草稿、发布、更新、删除与列表查询接口。
- 用户端通过公告接口拉取已发布内容，并在前台进行展示。
- 管理端支持分页管理全部公告状态。

### 评论系统

- 用户端文章页与说说页均支持评论提交、回复与点赞。
- 评论数据存储于 MongoDB 的 `comments` 集合，默认进入待审核状态。
- 管理端支持评论分页、状态切换、统计与删除操作。
- 评论头像基于邮箱生成 Cravatar 地址，无邮箱时保持空头像。

### 访客说说

- 用户端访客可提交昵称、邮箱、位置与内容，数据写入 `guest_moments` 集合。
- 访客说说默认进入待审核状态，仅审核通过后才会展示到前台。
- 管理端支持审核、删除与统计查询。

### Steam 游戏库

- 用户端展示 Steam 游戏数据列表，并支持按状态浏览。
- 管理端可维护游戏封面、名称、状态、购买时间、游玩时长与商店链接。
- 游戏数据最终同步到 `data/steam.ts`，由用户端静态读取展示。

### 主题系统

- 用户端支持明暗主题切换与本地持久化。
- 页面广泛使用毛玻璃、动态背景、粒子与过渡动画等视觉效果。
- 管理端可维护站点标题、头像、背景图、页脚徽章、弹幕与社交链接配置。

### 音乐系统

- 管理端可通过歌曲 ID 查询并维护播放列表。
- 用户端包含播放器、歌词栏与相关动态组件。
- 音乐查询由 FastAPI 转发第三方接口，前端不直接暴露后端服务地址。

### 图床与上传

- 支持本地上传模式，图片保存到 `public/uploads/` 目录。
- 支持配置第三方图床参数，用于富文本编辑器与封面选择。
- 同步到用户端时会复制 `public/uploads/` 目录，但会过滤 `siteConfig.ts` 中的图床敏感字段。

### 友链与展示数据

- 友链、项目、相册、Steam 数据通过管理端维护，并写入用户端 `data/` 目录。
- 用户端直接使用同步后的静态数据进行展示，适合服务端渲染与静态增量更新。

### 其他功能

- 用户端包含天气、时间线、照片墙、项目展示、全局工具箱等页面与组件。
- 后端提供访问统计、访客概览、访问记录去重查询等分析接口。
- 管理端内置鉴权、操作队列、同步控制与全局提示反馈。
- API 请求统一通过 Next.js Route Handler 代理到 FastAPI，减少前端直连后端带来的跨域与地址暴露问题。

## 性能优化

| 类别 | 实际实现 |
| --- | --- |
| 部署模式 | 两个 Next.js 应用均启用 `standalone` 输出，便于 Node.js 独立部署 |
| 页面缓存 | 首页与文章列表使用 `revalidate = 600`，文章详情使用 `revalidate = 60`，时间线使用 `revalidate = 3600` |
| 静态资源 | `/_next/static/` 与 `/uploads/` 设置长缓存响应头 |
| 图片处理 | 两个 Next.js 应用均关闭内建图片优化，避免独立部署下的额外依赖 |
| 动态加载 | 用户端通过 `DynamicImports.tsx`、`HomeDynamicImports.tsx`、`DynamicComments.tsx` 拆分重型组件 |
| 压缩策略 | 用户端启用 `compress: true` 与 DNS Prefetch 响应头 |

## 项目结构

```text
SilentFall_Blog/
├── SFBlogs/                      # 博客用户端（Next.js 16）
│   ├── app/                      # 页面与 Route Handler
│   │   ├── api/                  # 用户端代理接口
│   │   ├── posts/                # 文章列表与文章详情
│   │   ├── moments/              # 说说页面
│   │   ├── friends/              # 友链页面
│   │   ├── projects/             # 项目页面
│   │   ├── steam/                # Steam 页面
│   │   ├── timeline/             # 时间线页面
│   │   └── about/                # 关于页面
│   ├── components/               # 用户端组件
│   ├── data/                     # 相册、友链、项目、Steam 静态数据
│   ├── posts/                    # 用户端文章 Markdown
│   ├── milestones/               # 用户端里程碑 Markdown
│   ├── lib/backendTarget.ts      # 用户端后端地址解析
│   └── siteConfig.ts             # 用户端站点配置
├── my-blog-manager/              # 管理端（Next.js 16）
│   ├── app/                      # 管理页面与代理接口
│   │   ├── admin/                # 审核、监控、公告、访客与访问记录页面
│   │   ├── editor/               # 内容编辑器
│   │   ├── settings/             # 设置中心
│   │   ├── posts/                # 文章管理
│   │   ├── moments/              # 说说管理
│   │   ├── projects/             # 项目管理
│   │   └── api/                  # 管理端代理接口
│   ├── cms_core/                 # FastAPI 后端
│   │   ├── api/                  # 后端业务接口
│   │   ├── database.py           # MongoDB 连接与启动期检查
│   │   ├── path_utils.py         # 同步目标路径解析
│   │   ├── security.py           # 鉴权、输入净化、限流与 CORS 白名单
│   │   └── main.py               # FastAPI 入口
│   ├── data/deploy_config.json   # 用户端同步目标目录配置
│   ├── manager_data/drafts/      # 草稿文件目录
│   ├── lib/backendProxy.ts       # 管理端后端地址解析
│   └── siteConfig.ts             # 管理端本地配置源
├── README.md
└── 如何用服务器的宝塔面板将博客项目部署到你的服务器中.md
```

## 技术栈

| 层级 | 技术 |
| --- | --- |
| 用户端与管理端 | Next.js 16、React 19、TypeScript |
| 样式与动画 | Tailwind CSS 4、Framer Motion、Lucide React |
| 富文本编辑 | Tiptap |
| 后端服务 | FastAPI、Uvicorn |
| 数据库 | MongoDB、PyMongo |
| 安全能力 | JWT、bcrypt、输入净化、登录速率限制 |
| 数据图表 | ECharts |
| Markdown 能力 | gray-matter、remark、rehype、markdownify、PyYAML |

## 环境要求

- Node.js 18 及以上
- Python 3.10 及以上
- MongoDB 6.0 及以上
- npm 10 及以上
- Linux 服务器建议至少 2 核 2G 内存

## 快速开始

### 1. 安装依赖

```bash
# 用户端
cd SFBlogs
npm install

# 管理端
cd ../my-blog-manager
npm install

# Python 后端依赖
pip3 install fastapi uvicorn pymongo python-jose[cryptography] bcrypt python-multipart pyyaml markdown markdownify httpx requests
```

### 2. 启动 MongoDB

```bash
# Linux
sudo systemctl start mongod

# Windows
net start MongoDB
```

### 3. 启动服务

```bash
# 终端 1：启动 FastAPI 后端
cd my-blog-manager
python -m uvicorn cms_core.main:app --host 0.0.0.0 --port 8765

# 终端 2：启动用户端
cd SFBlogs
npm run dev

# 终端 3：启动管理端
cd my-blog-manager
npm run dev
```

### 4. 访问服务

- 用户端默认地址：`http://127.0.0.1:3000`
- 管理端默认地址：`http://127.0.0.1:3001`
- 后端状态接口：`http://127.0.0.1:8765/api/status`

## 环境变量

| 变量名 | 说明 | 默认值 | 是否必填 |
| --- | --- | --- | --- |
| `CMS_BACKEND_URL` | Next.js 代理直连 FastAPI 的完整地址 | 空 | 否 |
| `CMS_BACKEND_BASE_PATH` | 未设置 `CMS_BACKEND_URL` 时，按同域反向代理访问的后端前缀 | `/cms-api` | 否 |
| `CMS_ALLOWED_ORIGINS` | FastAPI 允许的跨域来源，多个用逗号分隔 | `*` | 生产环境必填 |
| `MONGO_URI` | MongoDB 连接串 | `mongodb://localhost:27017` | 生产环境建议显式设置 |
| `MONGO_DB_NAME` | MongoDB 数据库名 | `silentfall_blog` | 否 |
| `CMS_SECRET_KEY` | JWT 密钥 | 随机生成 | 生产环境必填 |
| `CMS_ADMIN_PASSWORD_HASH` | 管理端登录密码 bcrypt 哈希 | 空 | 是 |
| `CMS_ADMIN_USERNAME` | 管理员用户名 | `admin` | 否 |
| `BLOG_FRONTEND_PATH` | 管理端同步到用户端时的目标目录 | 自动推断同级 `SFBlogs` | 否 |
| `SFBLOGS_PATH` | 与 `BLOG_FRONTEND_PATH` 等价的兼容变量 | 自动推断同级 `SFBlogs` | 否 |

## 数据存储

- `comments`：评论数据，包含状态、点赞数、IP、User-Agent 等字段。
- `guest_moments`：访客说说数据，默认待审核。
- `announcements`：公告数据，支持草稿与发布状态。
- `page_views`、`unique_visitors`：访问统计与访客分析数据。
- `my-blog-manager/manager_data/drafts/`：管理端草稿文件。
- `my-blog-manager/posts/`、`moments/`、`milestones/`：管理端本地发布结果。
- `SFBlogs/posts/`、`milestones/`、`data/`、`public/uploads/`：同步后的用户端内容。

## 服务器部署（生产环境）

生产环境建议采用以下结构：

- 用户端：Node.js 进程或 PM2 进程，监听 `3000`
- 管理端：Node.js 进程或 PM2 进程，监听 `3001`
- FastAPI：Uvicorn 进程，监听 `8765`
- Nginx：对外提供 HTTPS 入口，并将 `/cms-api/` 反向代理到 FastAPI

### 1. 构建

```bash
# 构建用户端
cd SFBlogs
npm run build

# 构建管理端
cd ../my-blog-manager
npm run build
```

构建完成后，两个 Next.js 项目都需要补齐 `standalone` 运行目录中的静态文件：

```bash
# 用户端
cd /path/to/SFBlogs
cp -r .next/static .next/standalone/.next/
cp -r public .next/standalone/

# 管理端
cd /path/to/my-blog-manager
cp -r .next/static .next/standalone/.next/
cp -r public .next/standalone/
```

### 2. 配置 Nginx 反向代理

推荐至少配置三个入口：

- `blog.your_domain.com` -> 用户端 `3000`
- `admin.your_domain.com` -> 管理端 `3001`
- `blog.your_domain.com/cms-api/` 与 `admin.your_domain.com/cms-api/` -> FastAPI `8765`

### 3. 使用进程管理器

可以使用 PM2 或 systemd 运行两个 Next.js 应用，并使用 systemd 或 PM2 启动 Uvicorn。核心原则是：

- Node.js 服务重启后自动恢复
- FastAPI 独立于前端进程运行
- Nginx 统一对外暴露端口 80/443

## 许可协议

项目当前未声明独立许可证文件。如需开源分发或对外商用，请在发布前补充明确的许可证说明。