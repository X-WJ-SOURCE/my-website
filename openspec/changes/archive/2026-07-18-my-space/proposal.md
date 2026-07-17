## Why

用户需要一个个人空间来记录生平趣事和秘密，同时让访客能够互动交流。当前项目只是一个空白模板，需要构建一个功能完整的个人博客 + 互动社区。

## What Changes

- 新增文章系统：支持公开/私密文章、Markdown 编辑、标签分类、图片插入
- 新增管理员认证：单人管理员，JWT 登录
- 新增互动功能：文章评论、公共留言板、匿名私信（可回复）、文章表情反应、阅读量统计
- 新增公共涂鸦墙：访客可自由张贴文字和图片，形成拼贴式视觉墙
- 新增管理后台：发布/编辑文章、管理评论/留言/私信/涂鸦墙
- 新增时光轴：按时间顺序展示所有公开文章
- 新增主题切换：明暗主题
- 新增后端服务：Hono + SQLite，文件上传支持

## Capabilities

### New Capabilities

- `article-system`: 文章 CRUD、公开/私密切换、标签分类、Markdown 渲染
- `admin-auth`: 管理员登录/登出、JWT 认证、会话管理
- `comments`: 文章评论区，支持文字和图片
- `guestbook`: 公共留言板，支持文字和图片
- `private-messages`: 匿名私信，管理员可回复，支持图片
- `graffiti-wall`: 公共涂鸦墙，自由张贴文字和图片
- `admin-panel`: 管理后台界面，文章管理、内容审核
- `file-upload`: 图片上传、存储、访问
- `timeline`: 时光轴，按时间线展示文章
- `article-interactions`: 文章表情反应、阅读量统计
- `theme-system`: 明暗主题切换，持久化偏好

### Modified Capabilities

<!-- 无现有 capability 需要修改 -->

## Impact

- 新增后端服务 (`server/`)，使用 Hono 框架 + SQLite 数据库
- 前端 React SPA 将大幅扩展页面和组件
- 新增依赖：hono, better-sqlite3, jsonwebtoken, multer 等
- 开发/部署脚本更新
