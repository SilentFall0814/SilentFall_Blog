# Standalone Content Root Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复 `SFBlogs` 在 Next.js `standalone` 生产运行时无法读取后台新同步内容的问题，并统一所有动态内容读取入口。

**Architecture:** 新增一个统一的内容根目录解析工具，让所有页面通过该工具定位 `posts`、`moments` 与 `app/about/about.md`。工具优先读取环境变量，其次自动识别 `.next/standalone` 场景并回退到真实 `SFBlogs` 根目录，最后通过生产回归测试验证“发布后立即可见”。

**Tech Stack:** Next.js 16、TypeScript、Node.js 文件系统 API、PowerShell、Python 回归脚本

---

### Task 1: 为内容根目录解析补失败测试

**Files:**
- Create: `e:\Project\Web_Project\SilentFall_Blog\SFBlogs\lib\contentRoot.test.js`
- Test: `e:\Project\Web_Project\SilentFall_Blog\SFBlogs\lib\contentRoot.test.js`

- [ ] **Step 1: 写失败测试，覆盖普通运行和 standalone 运行两种场景**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

test('普通运行目录下返回项目根目录', () => {
  const { resolveContentRoot } = require('./contentRoot');
  const root = resolveContentRoot({
    cwd: path.resolve(__dirname, '..'),
    env: {},
  });
  assert.equal(root, path.resolve(__dirname, '..'));
});

test('standalone 运行目录下跳出 .next/standalone 返回项目根目录', () => {
  const { resolveContentRoot } = require('./contentRoot');
  const root = resolveContentRoot({
    cwd: path.resolve(__dirname, '..', '.next', 'standalone'),
    env: {},
  });
  assert.equal(root, path.resolve(__dirname, '..'));
});
```

- [ ] **Step 2: 运行测试，确认当前实现确实失败**

Run: `node --test .\lib\contentRoot.test.js`

Expected: FAIL，错误应类似 “Cannot find module './contentRoot'” 或解析结果不等于真实项目根目录。

- [ ] **Step 3: 如果测试没有失败，先调整断言而不是提前写实现**

```js
assert.notEqual(root, path.resolve(__dirname, '..', '.next', 'standalone'));
```

- [ ] **Step 4: 再次运行测试，确认失败原因就是“内容根目录尚未实现”**

Run: `node --test .\lib\contentRoot.test.js`

Expected: FAIL，且失败原因与待实现功能直接相关。

- [ ] **Step 5: 提交本任务**

```bash
git add lib/contentRoot.test.js
git commit -m "test: add failing coverage for standalone content root"
```

### Task 2: 实现内容根目录工具并替换所有读取入口

**Files:**
- Create: `e:\Project\Web_Project\SilentFall_Blog\SFBlogs\lib\contentRoot.ts`
- Modify: `e:\Project\Web_Project\SilentFall_Blog\SFBlogs\app\page.tsx`
- Modify: `e:\Project\Web_Project\SilentFall_Blog\SFBlogs\app\posts\page.tsx`
- Modify: `e:\Project\Web_Project\SilentFall_Blog\SFBlogs\app\posts\[slug]\page.tsx`
- Modify: `e:\Project\Web_Project\SilentFall_Blog\SFBlogs\app\timeline\page.tsx`
- Modify: `e:\Project\Web_Project\SilentFall_Blog\SFBlogs\app\moments\page.tsx`
- Modify: `e:\Project\Web_Project\SilentFall_Blog\SFBlogs\app\about\page.tsx`
- Test: `e:\Project\Web_Project\SilentFall_Blog\SFBlogs\lib\contentRoot.test.js`

- [ ] **Step 1: 先写最小实现，让测试刚好可通过**

```ts
import fs from "fs";
import path from "path";

type ResolveOptions = {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
};

function hasProjectMarker(target: string): boolean {
  return fs.existsSync(path.join(target, "package.json"));
}

export function resolveContentRoot(options: ResolveOptions = {}): string {
  const cwd = options.cwd || process.cwd();
  const env = options.env || process.env;
  const configuredRoot = env.BLOG_CONTENT_ROOT?.trim() || env.BLOG_FRONTEND_PATH?.trim();

  if (configuredRoot) {
    const absoluteConfiguredRoot = path.resolve(configuredRoot);
    if (hasProjectMarker(absoluteConfiguredRoot)) {
      return absoluteConfiguredRoot;
    }
  }

  if (cwd.includes(`${path.sep}.next${path.sep}standalone`)) {
    return path.resolve(cwd, "..", "..");
  }

  return cwd;
}

export function getPostsDirectory(): string {
  return path.join(resolveContentRoot(), "posts");
}

export function getMomentsDirectory(): string {
  return path.join(resolveContentRoot(), "moments");
}

export function getAboutMarkdownPath(): string {
  return path.join(resolveContentRoot(), "app", "about", "about.md");
}
```

- [ ] **Step 2: 运行测试，确认变绿**

Run: `node --test .\lib\contentRoot.test.js`

Expected: PASS，两个场景都解析到真实 `SFBlogs` 根目录。

- [ ] **Step 3: 把首页读取入口改为统一工具**

```ts
import { getMomentsDirectory, getPostsDirectory } from "../lib/contentRoot";

const chattersDirectory = getPostsDirectory();
const momentsDirectory = getMomentsDirectory();
```

- [ ] **Step 4: 把文章列表和文章详情页改为统一工具**

```ts
import { getPostsDirectory } from "../../../lib/contentRoot";

const postsDirectory = getPostsDirectory();
const fullPath = path.join(getPostsDirectory(), `${slug}.md`);
```

- [ ] **Step 5: 把时间线、说说页、关于页改为统一工具**

```ts
import { getAboutMarkdownPath, getMomentsDirectory, getPostsDirectory } from "../../lib/contentRoot";

const fullPath = getAboutMarkdownPath();
const candidateDirs = [
  path.join(getPostsDirectory(), "moments"),
  getMomentsDirectory(),
];
```

- [ ] **Step 6: 运行针对性构建，确认没有类型或路径报错**

Run: `npm run build`

Expected: BUILD SUCCESS，且不再新增与内容目录解析相关的错误。

- [ ] **Step 7: 提交本任务**

```bash
git add lib/contentRoot.ts app/page.tsx app/posts/page.tsx app/posts/[slug]/page.tsx app/timeline/page.tsx app/moments/page.tsx app/about/page.tsx lib/contentRoot.test.js
git commit -m "fix: resolve content root for standalone runtime"
```

### Task 3: 执行生产回归验证

**Files:**
- Modify: `e:\Project\Web_Project\SilentFall_Blog\SFBlogs\lib\contentRoot.ts`
- Test: `e:\Project\Web_Project\SilentFall_Blog\SFBlogs\lib\contentRoot.test.js`

- [ ] **Step 1: 重建用户端，确保 standalone 产物更新**

Run: `npm run build`

Expected: BUILD SUCCESS，`.next/standalone/server.js` 存在。

- [ ] **Step 2: 启动用户端 standalone 服务**

Run:

```powershell
$env:CMS_BACKEND_URL='http://127.0.0.1:8765'
$env:HOSTNAME='127.0.0.1'
$env:PORT='3100'
node .next/standalone/server.js
```

Expected: 服务监听 `http://127.0.0.1:3100`。

- [ ] **Step 3: 通过管理端发布同步一篇新文章**

```python
operations = [{
    "type": "publish_article",
    "payload": {
        "type": "post",
        "id": "new",
        "title": "deploy-sync-check-fix",
        "date": "2026-06-11 21:00:00",
        "tags": ["deploy", "sync", "fix"],
        "mood": "修复验证",
        "cover": "/uploads/default-post-cover.png",
        "description": "验证 standalone 修复是否生效",
        "content": "<p>修复后应当可以立即访问。</p>"
    }
}]
```

- [ ] **Step 4: 立即访问新文章页面，验证无需重建即可返回 200**

Run:

```bash
python -c "import urllib.request;print(urllib.request.urlopen('http://127.0.0.1:3100/posts/deploy-sync-check-fix').status)"
```

Expected: 输出 `200`，页面正文包含“修复后应当可以立即访问”。

- [ ] **Step 5: 再验证评论与访客说说接口没有被本次改动影响**

Run:

```bash
python -c "import json,urllib.request;req=urllib.request.Request('http://127.0.0.1:3100/api/comments',data=json.dumps({'page_id':'deploy-sync-check-fix','author':'联调测试','email':'test@example.com','content':'修复后评论仍可提交'}).encode(),headers={'Content-Type':'application/json'},method='POST');print(urllib.request.urlopen(req).status)"
```

Expected: 输出 `200`。

- [ ] **Step 6: 若首页或时间线仍读取旧内容，再补一个最小修复并重新构建验证**

```ts
// 继续通过 getPostsDirectory() / getMomentsDirectory() 收敛剩余入口，
// 不允许重新引入 process.cwd() 直接读取内容目录。
```

- [ ] **Step 7: 提交本任务**

```bash
git add .
git commit -m "test: verify standalone sync flow end to end"
```
