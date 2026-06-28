<p align="center">
  <img src="https://img.shields.io/badge/Spring%20Boot-3.5-green?style=flat-square&logo=springboot" alt="Spring Boot">
  <img src="https://img.shields.io/badge/Java-21-orange?style=flat-square&logo=openjdk" alt="Java">
  <img src="https://img.shields.io/badge/Vue-3.5-brightgreen?style=flat-square&logo=vuedotjs" alt="Vue">
  <img src="https://img.shields.io/badge/Vite-7-blueviolet?style=flat-square&logo=vite" alt="Vite">
  <img src="https://img.shields.io/badge/MongoDB-7-green?style=flat-square&logo=mongodb" alt="MongoDB">
  <img src="https://img.shields.io/badge/Redis-7-red?style=flat-square&logo=redis" alt="Redis">
</p>

# SilentFall — 个人博客系统

一套基于 **Spring Boot 3 + Vue 3** 的全栈个人博客解决方案，包含博客前台和后台管理两个子站点与一个统一后端服务。所有数据完全自主托管，使用 **MongoDB** 存储博客数据、**本地磁盘** 存储上传文件，不依赖任何第三方云服务。

---

## 技术栈概览

### 后端

- **Spring Boot 3.5** — 应用框架
- **Java 21** — 开发语言（启用虚拟线程）
- **Spring Data MongoDB** — 文档数据访问层
- **MongoDB 7** — 文档数据库（文章、评论、访客等）
- **Redis 7** — 缓存 + Token 管理 + 浏览量缓冲
- **Spring Cache** — 缓存抽象（按业务差异化 TTL）
- **JWT (JJWT 0.12)** — 认证授权
- **Knife4j (OpenAPI 3)** — API 文档
- **WebSocket** — 实时在线人数统计
- **Bucket4j** — 接口限流（令牌桶 + IP/指纹双维度）
- **CommonMark + Jsoup** — Markdown 解析 + HTML XSS 清洗
- **Thumbnailator** — 图片自动压缩 + 缩略图生成

### 前端

- **Vue 3.5** — 前端框架
- **Vite 7** — 构建工具（Terser 压缩 + 代码分割）
- **Vue Router 4** — 路由（全懒加载）
- **Pinia 3 + Persisted State** — 状态管理 + 持久化
- **Element Plus** — UI 组件库（按需自动导入）
- **md-editor-v3** — Markdown 编辑/预览
- **ECharts** — 数据可视化（管理端仪表盘）
- **Axios** — HTTP 客户端
- **Sass** — CSS 预处理器

---

## 核心功能清单

### 用户端 (Frontend-Blog)

- Markdown 文章渲染（与编辑器预览效果一致）
- 文章分类 / 标签 / 归档 / 关键词搜索
- 评论系统（嵌套回复、Markdown 支持、悄悄话模式）
- 留言板（独立于文章的留言系统）
- 友情链接展示
- 文章点赞（访客指纹防重复）
- 自动目录提取（TOC 侧边栏）
- 暗黑模式（跟随系统 / 手动切换）
- 响应式设计（移动端适配）
- 访客指纹识别（无需登录即可评论/点赞）
- 音乐播放器（头部嵌入）
- 上一篇 / 下一篇导航、相关文章推荐
- Sitemap 自动生成
- 光影画廊（相册展示、照片网格浏览、Lightbox 大图查看、跨相册搜索）
- 公告栏（侧边栏卡片展示生效公告，无公告时自动隐藏）

### 管理端 (Frontend-Admin)

- 仪表盘总览（浏览量、访客数、文章数、待审核数）
- 文章管理（Markdown 编辑器、封面上传、草稿/发布、置顶）
- 分类与标签管理
- 评论 / 留言审核管理（批量审核、回复、删除）
- 友情链接管理
- 公告管理（文本公告发布、列表展示、删除）
- 音乐管理（音频上传、歌词关联）
- 光影画廊管理（相册 CRUD、批量上传照片、照片描述编辑、封面上传）
- 访客管理（封禁/解封、地理位置分布）
- 浏览记录查看
- 数据看板（ECharts 浏览/访客趋势图、省份分布、文章热度 Top10）
- 系统配置（站点设置、关于页面内容）
- 个人资料管理
- 操作日志审计

---

## 项目预览

![博客展示1](./Screenshot/1.png)

![博客展示2](./Screenshot/2.png)

![博客展示3](./Screenshot/3.png)

---

## 目录结构说明

```
SilentFall_Blog/
├── Backend/                              # Spring Boot 后端
│   ├── pom.xml                           # 父 POM
│   ├── SilentFall-common/                # 公共模块（工具/常量/异常/属性）
│   │   └── src/main/java/com/silentfall/blog/
│   │       ├── config/                   # 本地存储配置
│   │       ├── constant/                 # 常量定义
│   │       ├── context/                  # 线程上下文
│   │       ├── enumeration/              # 枚举
│   │       ├── exception/                # 自定义异常
│   │       ├── json/                     # Jackson 序列化配置
│   │       ├── properties/               # 配置属性类
│   │       ├── result/                   # 统一返回结果
│   │       └── utils/                    # 工具类（JWT、IP、图片压缩、Markdown 等）
│   ├── SilentFall-pojo/                  # 实体/DTO/VO 层
│   │   └── src/main/java/com/silentfall/blog/
│   │       ├── dto/                      # 数据传输对象（37 个）
│   │       ├── entity/                   # MongoDB 文档实体（21 个）
│   │       └── vo/                       # 视图对象（28 个）
│   └── SilentFall-server/                # 主服务
│       └── src/main/
│           ├── java/com/silentfall/blog/
│           │   ├── annotation/           # 自定义注解（操作日志、限流）
│           │   ├── aspect/               # AOP 切面（操作日志、限流）
│           │   ├── config/               # 配置类（Redis、虚拟线程、WebSocket 等）
│           │   ├── controller/           # 控制器（admin/blog/common/cv/home）
│           │   ├── handler/              # 全局异常处理
│           │   ├── interceptor/          # JWT 拦截器
│           │   ├── repository/           # MongoDB Repository（21 个）
│           │   ├── service/              # 业务逻辑层（32 个接口 + impl）
│           │   ├── task/                 # 定时任务（浏览量同步）
│           │   ├── wesocket/             # WebSocket 在线统计
│           │   └── SilentFallBlogApplication.java
│           └── resources/
│               ├── application.yml       # 主配置
│               ├── application-dev.yml   # 开发环境配置
│               ├── application-docker.yml # Docker 环境配置
│               └── logback-spring.xml    # 日志配置
├── Frontend-Blog/                        # 博客前台
│   └── src/
│       ├── api/                          # API 请求封装（15 个模块）
│       ├── assets/                       # 静态资源（字体/图片/样式/表情）
│       ├── components/                   # 公共组件（9 个，含 gallery 子目录）
│       ├── router/                       # 路由配置（全懒加载）
│       ├── stores/                       # Pinia 状态管理（blog/theme/visitor）
│       ├── utils/                        # 工具（请求封装/访客指纹）
│       └── view/                         # 页面（12 个视图目录）
├── Frontend-Admin/                       # 管理后台
│   └── src/
│       ├── api/                          # API 请求封装（15 个模块）
│       ├── assets/                       # 静态资源（字体/样式/表情）
│       ├── components/                   # 公共组件（EmojiPicker）
│       ├── router/                       # 路由配置（全懒加载 + 鉴权守卫）
│       ├── stores/                       # Pinia 状态管理（12 个模块）
│       ├── utils/                        # 工具（请求封装）
│       └── view/                         # 页面（19 个视图目录）
├── Screenshot/                           # 项目截图
├── docker/                               # Docker 部署配置
├── Dockerfile                            # 后端镜像构建
├── docker-compose.yml                    # 容器编排
└── README.md
```

---

## 快速开始

### 环境要求

| 环境 | 版本要求 |
|---|---|
| JDK | 21+ |
| Maven | 3.9+ |
| Node.js | 20.19+ 或 22.12+ |
| pnpm | 9+ |
| MongoDB | 7+ |
| Redis | 7+ |

### 1. 启动 MongoDB 和 Redis

```bash
# MongoDB
mongod --dbpath /path/to/data

# Redis
redis-server
```

MongoDB 无需手动建表，Spring Data MongoDB 会在应用启动时自动创建集合和索引。

### 2. 配置并启动后端

```bash
cd Backend
mvn clean package -DskipTests
java -jar SilentFall-server/target/SilentFall-server-1.0-SNAPSHOT.jar --spring.profiles.active=dev
```

后端启动后监听 **5922** 端口，API 文档地址：http://localhost:5922/doc.html

### 3. 启动前端

```bash
# 博客端
cd Frontend-Blog
pnpm install
pnpm dev

# 管理端
cd Frontend-Admin
pnpm install
pnpm dev
```

前端通过 Vite 代理将 `/api` 请求转发到 `http://localhost:5922`。

### 4. 访问

| 服务 | 地址 |
|---|---|
| 博客端 | http://localhost:5173 |
| 管理端 | http://localhost:5174 |
| 后端 API 文档 | http://localhost:5922/doc.html |

---

## 本地文件存储

本项目使用**本地磁盘存储**管理上传文件（文章封面、相册照片、音频等），完全不依赖第三方云存储。

- 上传文件保存在服务器本地目录（默认 `./uploads/`）
- 通过 Spring Boot 静态资源映射或 Nginx 直接提供访问
- 文件按类型自动分类存储（image/thumb/audio/video/document 等）
- 图片智能压缩（WebP 格式输出，按原图大小自适应选择压缩质量，仅对超过 1MB 的图片压缩）并生成缩略图（原图 + 600px 宽缩略图双版本存储）

---

## 生产部署

生产环境部署请参考 [Baota-Deployment-Guide.md](./Baota-Deployment-Guide.md)（宝塔面板保姆级教程），或使用 Docker Compose 一键部署：

```bash
docker-compose up -d
```

---

## 开源协议

本项目采用 MIT 协议开源。
