## Context

当前项目是一个 React + Vite + Tailwind CSS v4 + TypeScript 的前端 SPA 模板。需要新增后端服务和完整的个人网站功能。项目结构需要从纯前端演变为前后端分离的单仓库架构。

**约束：**
- 单人管理员，无需复杂的多用户系统
- 无需外部数据库服务，SQLite 即可满足需求
- 部署应尽可能简单

## Goals / Non-Goals

**Goals:**
- 提供 RESTful API 支持所有前端功能
- Markdown 文章编辑和渲染
- 图片上传和静态文件服务
- 多种互动方式（评论、留言、私信、涂鸦墙）
- 明暗主题切换
- 管理员认证和后台管理

**Non-Goals:**
- 多用户系统/注册
- SEO/SSR（纯 SPA 即可）
- 实时推送/WebSocket
- 国际化
- 单元测试/E2E 测试（MVP 阶段）

## Decisions

### 1. 后端框架：Hono
**选择 Hono 而非 Express**

- Hono 是 TypeScript-first，与项目技术栈一致
- 更轻量，内置更好的 TypeScript 类型推导
- 支持 Vite 插件方式运行开发服务器，开发体验更好
- 路由性能优于 Express

### 2. 数据库：better-sqlite3
**选择 better-sqlite3 而非其他 SQLite 方案**

- 同步 API，代码更简洁，无需 async/await
- 性能优秀，适合单用户低并发场景
- 无需额外数据库进程或服务

### 3. 数据库表设计
```
articles: id, title, content, visibility, created_at, updated_at
tags: id, name
article_tags: article_id, tag_id
comments: id, article_id, nickname, content, image_url, created_at
guestbook: id, nickname, content, image_url, created_at
private_messages: id, thread_id, nickname, content, image_url, is_admin, created_at
wall_posts: id, nickname, content, image_url, created_at
reactions: id, article_id, emoji_type, visitor_id
article_views: id, article_id, visitor_id, viewed_at
admin: id, username, password_hash
```

### 4. 认证方案：JWT
**选择 JWT 而非 Session**

- SPA 架构下 JWT 更自然，无需服务端 session 存储
- Token 存在 localStorage，跨页面刷新保持登录
- 简单实现，无需 Redis 或 session 表

### 5. 文件上传方案
**选择本地磁盘存储 + multer**

- 图片上传到 `server/uploads/` 目录
- 通过 `/uploads/<filename>` 公共路由提供访问
- 10MB 大小限制，支持 JPG/PNG/GIF/WebP
- 使用 UUID 重命名避免冲突

### 6. 前端架构
**保持 React SPA 结构**

- 前端路由：React Router
- 页面组件：Home, ArticleList, ArticleDetail, Guestbook, GraffitiWall, Timeline, Login, Admin/*
- 主题：Tailwind CSS v4 的 dark: 变体 + CSS 变量
- Markdown 渲染：react-markdown + rehype/remark 插件

### 7. 项目结构
```
my-website/
├── server/                 # 后端
│   ├── index.ts            # 入口
│   ├── db.ts               # 数据库初始化
│   ├── auth.ts             # JWT 认证中间件
│   ├── routes/             # 路由模块
│   │   ├── articles.ts
│   │   ├── auth.ts
│   │   ├── comments.ts
│   │   ├── guestbook.ts
│   │   ├── messages.ts
│   │   ├── wall.ts
│   │   ├── upload.ts
│   │   ├── reactions.ts
│   │   └── timeline.ts
│   └── uploads/            # 上传文件目录
├── src/                    # 前端（现有）
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── lib/               # API client, utils
│   └── ...
└── ...
```

### 8. 开发流程
- 后端：`tsx watch server/index.ts` 热重载开发
- 前端：`vite` 开发服务器，配置代理到后端 API
- 构建：先构建后端（tsc），再构建前端（vite build）
- 生产运行：Node.js 运行后端 + 托管前端静态文件

## Risks / Trade-offs

- **[Risk] SQLite 并发限制** → 单用户低并发场景下不是问题。如需扩展可迁移到 PostgreSQL。
- **[Risk] 文件存储在本地磁盘** → 部署时需注意备份 uploads 目录。不适用于多实例部署。
- **[Risk] Markdown XSS** → react-markdown 默认安全，不渲染 raw HTML。
- **[Trade-off] 纯 SPA 无 SSR** → SEO 较弱，但个人网站 SEO 不是首要需求。
