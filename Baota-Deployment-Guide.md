# SilentFall 博客 — 宝塔面板私有化部署教程

本教程面向**零 Linux 基础**的新手，手把手教你用宝塔面板将 SilentFall 博客部署到自己的服务器上。按照顺序操作即可成功运行，所有命令均可直接复制粘贴。

---

## 一、环境准备

### 1.1 购买服务器

准备一台云服务器（推荐配置：2 核 CPU / 4G 内存 / 50G 系统盘），操作系统选择 **Ubuntu 22.04** 或 **CentOS 7.9**。在云服务商控制台开放以下端口：

| 端口 | 用途 |
|------|------|
| 80 | HTTP 网站访问 |
| 443 | HTTPS 网站访问 |
| 22 | SSH 远程连接 |

> MongoDB（27017）和 Redis（6379）**不要**对外开放，仅限服务器本地访问。

### 1.2 安装宝塔面板

使用 SSH 工具（如 Xshell、Termius 或云厂商自带的 WebShell）连接服务器，执行以下命令安装宝塔面板：

**Ubuntu/Debian 系统：**

```bash
wget -O install.sh https://download.bt.cn/install/install-ubuntu_6.0.sh && sudo bash install.sh ed8484bec
```

**CentOS 系统：**

```bash
yum install -y wget && wget -O install.sh https://download.bt.cn/install/install_6.0.sh && sh install.sh ed8484bec
```

安装完成后，终端会显示宝塔面板的**访问地址、账号、密码**，请妥善保存。用浏览器打开该地址，登录宝塔面板。

### 1.3 在宝塔软件商店安装必要软件

登录宝塔面板后，进入左侧菜单 **「软件商店」**，搜索并安装以下软件（点击「安装」按钮，安装方式选择默认即可）：

| 软件名称 | 建议版本 | 用途 |
|---------|---------|------|
| **Nginx** | 1.24 | 网站托管与反向代理 |
| **PM2管理器** | 5.x | 守护 Node.js / Java 进程 |
| **MongoDB** | 7.0 | 博客数据库 |
| **Redis** | 7.2 | 缓存服务 |

> **Java JDK 安装**：宝塔软件商店搜索 **「JDK」**，安装 **JDK 21**（如商店无 21 版本，安装 OpenJDK 21 即可）。若商店没有，可在 SSH 中执行：
> ```bash
> apt install -y openjdk-21-jdk    # Ubuntu
> yum install -y java-21-openjdk   # CentOS
> ```
> 安装后执行 `java -version` 确认输出 `openjdk version "21.x.x"`。

> **Maven 安装**：宝塔软件商店搜索 **「Maven」**，安装 **Maven 3.9.x**。若商店没有，在 SSH 中执行：
> ```bash
> apt install -y maven    # Ubuntu
> yum install -y maven    # CentOS
> ```
> 安装后执行 `mvn -version` 确认版本号。

> **Node.js 安装**：PM2管理器安装后会自带 Node.js。在 PM2管理器中点击「设置」→「Node版本」，切换到 **20.19.0** 或更高版本。

---

## 二、数据库初始化

### 2.1 启动 MongoDB 和 Redis

在宝塔软件商店找到已安装的 **MongoDB** 和 **Redis**，点击「设置」→「启动」，确保两者状态均为运行中。

### 2.2 创建 MongoDB 数据库

MongoDB 无需手动建库建表。SilentFall 后端启动时会自动连接 `silentfall` 数据库并创建所有集合与索引。

如需通过宝塔可视化管理 MongoDB，可在软件商店安装 **「phpMyAdmin for MongoDB」** 或使用 SSH 命令行：

```bash
# 进入 MongoDB 命令行
mongosh

# 在 MongoDB 命令行中执行以下命令创建数据库（后端会自动使用）
use silentfall

# 退出
exit
```

### 2.3 确认 Redis 状态

Redis 默认监听 `127.0.0.1:6379`，无密码，数据库编号 0。SilentFall 后端默认配置与此一致，无需额外修改。

---

## 三、项目构建与上传

### 3.1 在本地电脑构建后端

在你的开发电脑上（需已安装 JDK 21 和 Maven 3.9+），打开项目根目录的终端：

```bash
cd Backend
mvn clean package -DskipTests
```

构建成功后，产物位于：

```
Backend/SilentFall-server/target/SilentFall-server-1.0-SNAPSHOT.jar
```

将这个 `.jar` 文件单独保存，稍后上传到服务器。

### 3.2 在本地电脑构建前端

需已安装 Node.js 20+ 和 pnpm。打开终端：

```bash
# 构建博客前台
cd Frontend-Blog
pnpm install
pnpm build

# 构建管理后台
cd ../Frontend-Admin
pnpm install
pnpm build
```

构建成功后，产物分别位于：

```
Frontend-Blog/dist/       ← 博客前台静态文件
Frontend-Admin/dist/      ← 管理后台静态文件
```

将这两个 `dist` 文件夹分别压缩为 `blog-dist.zip` 和 `admin-dist.zip`。

### 3.3 上传文件到服务器

在宝塔面板左侧点击 **「文件」**，进入目录 `/www/wwwroot/`，新建以下文件夹结构：

```
/www/wwwroot/
└── SilentFall_Blog/
    ├── backend/          ← 存放后端 jar 包
    ├── uploads/          ← 存放上传的文件（自动生成）
    ├── Blog-Pages/       ← 存放博客前台静态文件
    └── Admin-Pages/      ← 存放管理后台静态文件
```

操作步骤：

1. 在 `/www/wwwroot/` 下新建文件夹 `SilentFall_Blog`，进入后再新建 `backend`、`uploads`、`Blog-Pages`、`Admin-Pages` 四个子文件夹
2. 将本地的 `SilentFall-server-1.0-SNAPSHOT.jar` 上传到 `/www/wwwroot/SilentFall_Blog/backend/`
3. 将 `blog-dist.zip` 上传到 `/www/wwwroot/SilentFall_Blog/Blog-Pages/` 并右键解压，确保 `index.html` 直接在该目录下
4. 将 `admin-dist.zip` 上传到 `/www/wwwroot/SilentFall_Blog/Admin-Pages/` 并右键解压，确保 `index.html` 直接在该目录下

### 3.4 创建后端配置文件

在宝塔文件管理器中，进入 `/www/wwwroot/SilentFall_Blog/backend/`，新建文件 `application-prod.yml`，写入以下内容（无需修改，直接复制）：

```yaml
silentfall:
  mongodb:
    uri: mongodb://localhost:27017/silentfall
  redis:
    host: localhost
    port: 6379
    password:
    database: 0
  jwt:
    ttl: 604800000
  local-storage:
    base-path: /www/wwwroot/SilentFall_Blog/uploads
    url-prefix: /uploads
  # 访客验证码（主配置模板中存在该占位符，必须提供否则启动报错；当前代码暂未使用，任意值即可）
  visitor:
    verify-code: silentfall
  website:
    title: SilentFall
    home: https://blog.ljb666.xyz
    admin: https://admin.ljb666.xyz
    blog: https://blog.ljb666.xyz
```

> 说明：`base-path` 指向步骤 3.3 创建的 uploads 目录，`website` 下的域名对应后续创建的站点域名。如果你的域名不同，将 `blog.ljb666.xyz` 和 `admin.ljb666.xyz` 替换为你的实际域名即可。

---

## 四、站点与反向代理配置

### 4.1 创建博客前台站点

1. 宝塔面板左侧点击 **「网站」** → **「添加站点」**
2. 域名填写：`blog.ljb666.xyz`
3. 根目录选择：`/www/wwwroot/SilentFall_Blog/Blog-Pages`
4. PHP版本选择：**纯静态**
5. 点击「提交」

### 4.2 创建管理后台站点

重复上述步骤，域名填 `admin.ljb666.xyz`，根目录选 `/www/wwwroot/SilentFall_Blog/Admin-Pages`。

### 4.3 配置博客前台 Nginx

在网站列表找到 `blog.ljb666.xyz`，点击「设置」→「配置文件」，将整个配置文件内容替换为以下内容（直接复制粘贴）：

```nginx
server {
    listen 80;
    server_name blog.ljb666.xyz;
    root /www/wwwroot/SilentFall_Blog/Blog-Pages;
    index index.html;

    # 前端路由 history 模式支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 反向代理（使用 ^~ 提升匹配优先级，避免被下方的静态资源正则规则拦截 /api/uploads/ 等路径）
    location ^~ /api/ {
        proxy_pass http://127.0.0.1:5922/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        # 上传文件大小限制（与后端一致）
        client_max_body_size 120m;
    }

    # 上传文件静态资源（Nginx 直接托管，性能更好）
    location /uploads/ {
        alias /www/wwwroot/SilentFall_Blog/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # WebSocket 支持（在线人数统计）
    location ^~ /api/ws/online {
        proxy_pass http://127.0.0.1:5922/ws/online;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|webp)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    access_log /www/wwwlogs/blog.ljb666.xyz.log;
    error_log /www/wwwlogs/blog.ljb666.xyz.error.log;
}
```

点击「保存」。

### 4.4 配置管理后台 Nginx

在网站列表找到 `admin.ljb666.xyz`，点击「设置」→「配置文件」，替换为以下内容：

```nginx
server {
    listen 80;
    server_name admin.ljb666.xyz;
    root /www/wwwroot/SilentFall_Blog/Admin-Pages;
    index index.html;

    # 前端路由 history 模式支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 反向代理（使用 ^~ 提升匹配优先级，避免被下方的静态资源正则规则拦截 /api/uploads/ 等路径）
    # 上传接口单独配置长超时，避免大文件/批量上传时 Nginx 先于后端返回 504
    location ^~ /api/admin/common/upload {
        proxy_pass http://127.0.0.1:5922/admin/common/upload;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 500m;
        proxy_connect_timeout 60s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;
        proxy_buffering off;
    }

    location ^~ /api/admin/photo/batch {
        proxy_pass http://127.0.0.1:5922/admin/photo/batch;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 500m;
        proxy_connect_timeout 60s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;
        proxy_buffering off;
    }

    location ^~ /api/ {
        proxy_pass http://127.0.0.1:5922/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        # 上传文件大小限制（与后端一致）
        client_max_body_size 500m;
        proxy_connect_timeout 30s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 上传文件静态资源
    location /uploads/ {
        alias /www/wwwroot/SilentFall_Blog/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    access_log /www/wwwlogs/admin.ljb666.xyz.log;
    error_log /www/wwwlogs/admin.ljb666.xyz.error.log;
}
```

点击「保存」。

### 4.5 配置 SSL 证书（推荐）

为两个站点配置 HTTPS：

1. 在站点设置中点击 **「SSL」** → **「Let's Encrypt」**
2. 勾选域名，点击「申请」
3. 申请成功后开启 **「强制 HTTPS」**

> 申请 SSL 证书前，请确保域名已解析到服务器 IP，且 80 端口可正常访问。

---

## 五、启动后端服务

### 5.1 使用 PM2 管理器启动

1. 宝塔面板左侧点击 **「软件商店」** → 找到 **「PM2管理器」** → 点击「设置」
2. 切换到 **「模块管理」** 标签页
3. 点击 **「添加项目」**，填写以下信息：
   - **项目名称**：`silentfall-backend`
   - **运行目录**：`/www/wwwroot/SilentFall_Blog/backend`
   - **启动文件/命令**：`java -Xmx512m -jar SilentFall-server-1.0-SNAPSHOT.jar --spring.profiles.active=prod`

   > **重要**：`-Xmx512m` 指定 JVM 最大堆内存为 512MB。图片上传压缩时需要将图片解码为 BufferedImage 占用较多内存，不指定堆内存会导致默认值过小（通常 256MB），上传多张大图时触发 `OutOfMemoryError: Java heap space`。如服务器内存充裕可调大到 `-Xmx1g`。
   - **Node版本**：任意（此项目用 Java 运行，Node 版本不影响）
4. 点击「提交」

PM2 会自动守护进程，服务器重启后也会自动启动。

### 5.2 验证后端启动

在 SSH 中执行以下命令，确认后端已启动并监听 5922 端口：

```bash
curl http://127.0.0.1:5922/health
```

如果返回类似 `{"code":1,"data":"Server is running"}` 的 JSON，说明后端启动成功。

如果返回连接失败，查看启动日志：

```bash
pm2 logs silentfall-backend --lines 50
```

常见问题：
- **端口被占用**：执行 `lsof -i:5922` 查看占用进程，`kill -9 进程ID` 杀掉后重启
- **MongoDB 连接失败**：确认 MongoDB 已启动，执行 `systemctl status mongod` 查看
- **Redis 连接失败**：确认 Redis 已启动，执行 `systemctl status redis` 查看

### 5.3 首次登录管理后台

后端首次启动时会自动创建默认管理员账号：

| 项目 | 值 |
|------|-----|
| 用户名 | `SilentFall` |
| 密码 | `LJBljb0814` |

打开浏览器访问 `https://admin.ljb666.xyz`（替换为你的域名），使用上述账号登录。**登录后请立即在「个人资料」页面修改密码。**

---

## 六、域名解析

在你的域名注册商处（如阿里云、腾讯云、Cloudflare），为两个域名添加 A 记录解析：

| 记录类型 | 主机记录 | 记录值 |
|---------|---------|--------|
| A | blog | 你的服务器公网 IP |
| A | admin | 你的服务器公网 IP |

例如域名为 `ljb666.xyz`，则添加：
- `blog.ljb666.xyz` → 服务器 IP
- `admin.ljb666.xyz` → 服务器 IP

解析生效后（通常几分钟到几小时），即可通过域名访问博客。

---

## 七、日常维护

### 7.1 更新博客代码

当项目代码更新后，重新在本地构建，然后上传新文件覆盖：

**后端更新：**

```bash
# 本地重新构建
cd Backend
mvn clean package -DskipTests

# 上传新的 SilentFall-server-1.0-SNAPSHOT.jar 到
# /www/wwwroot/SilentFall_Blog/backend/
```

然后在 PM2 管理器中点击 `silentfall-backend` 项目的「重启」按钮。

**前端更新：**

```bash
# 本地重新构建
cd Frontend-Blog && pnpm build
cd ../Frontend-Admin && pnpm build

# 将 dist 目录内容上传覆盖到对应站点目录
# /www/wwwroot/SilentFall_Blog/Blog-Pages/
# /www/wwwroot/SilentFall_Blog/Admin-Pages/
```

### 7.2 查看日志

```bash
# 后端实时日志
pm2 logs silentfall-backend

# Nginx 访问日志
tail -f /www/wwwlogs/blog.ljb666.xyz.log

# Nginx 错误日志
tail -f /www/wwwlogs/blog.ljb666.xyz.error.log
```

### 7.3 备份数据

**备份 MongoDB：**

```bash
# 导出整个数据库到 /www/backup/
mongodump --db silentfall --out /www/backup/mongodb-$(date +%Y%m%d)
```

**备份上传文件：**

在宝塔文件管理器中，将 `/www/wwwroot/SilentFall_Blog/uploads/` 目录压缩下载保存。

建议在宝塔面板的 **「计划任务」** 中添加定时备份，每天自动执行 MongoDB 导出。

### 7.4 服务管理命令速查

| 操作 | 命令 |
|------|------|
| 启动后端 | `pm2 start silentfall-backend` |
| 停止后端 | `pm2 stop silentfall-backend` |
| 重启后端 | `pm2 restart silentfall-backend` |
| 查看后端状态 | `pm2 status` |
| 重载 Nginx | `nginx -s reload` |
| 重启 MongoDB | `systemctl restart mongod` |
| 重启 Redis | `systemctl restart redis` |

---

## 八、部署检查清单

部署完成后，逐项确认以下功能正常：

- [ ] 访问 `https://blog.ljb666.xyz` 能看到博客首页
- [ ] 访问 `https://admin.ljb666.xyz` 能看到管理后台登录页
- [ ] 使用默认账号能登录管理后台
- [ ] 在管理后台发布一篇文章，博客前台能看到
- [ ] 在博客前台评论一篇文章，管理后台能看到待审核评论
- [ ] 在管理后台上传一张文章封面图，图片正常显示
- [ ] 暗黑模式切换正常
- [ ] 手机访问博客页面布局正常

以上全部通过，说明部署成功。
