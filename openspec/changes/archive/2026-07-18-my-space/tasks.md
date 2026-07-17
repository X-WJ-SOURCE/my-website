## 1. Backend Project Setup

- [x] 1.1 Initialize server directory with TypeScript config and package.json
- [x] 1.2 Install dependencies: hono, better-sqlite3, jsonwebtoken, bcryptjs, multer, uuid
- [x] 1.3 Create database initialization module with SQLite schema (all tables)
- [x] 1.4 Create Hono server entry point with CORS and JSON middleware
- [x] 1.5 Configure Vite proxy to forward /api and /uploads to backend

## 2. Authentication

- [x] 2.1 Create admin seed script (insert default admin with hashed password)
- [x] 2.2 Implement POST /api/auth/login endpoint with JWT token generation
- [x] 2.3 Implement JWT verification middleware
- [x] 2.4 Implement POST /api/auth/change-password endpoint (protected)

## 3. File Upload

- [x] 3.1 Create uploads directory and multer configuration (file size, type filter, UUID naming)
- [x] 3.2 Implement POST /api/upload endpoint (protected and public variants)
- [x] 3.3 Serve uploaded files via GET /uploads/:filename

## 4. Article System

- [x] 4.1 Implement CRUD API: GET/POST/PUT/DELETE /api/articles
- [x] 4.2 Implement tag management: POST /api/tags, GET /api/tags
- [x] 4.3 Add article-tag association in article endpoints
- [x] 4.4 Add public article list endpoint with pagination and tag filter
- [x] 4.5 Add private article filter based on auth status
- [x] 4.6 Install react-markdown and create Markdown renderer component
- [x] 4.7 Build article list page with pagination and tag filter UI
- [x] 4.8 Build article detail page with Markdown rendering

## 5. Comments

- [x] 5.1 Implement POST /api/articles/:id/comments (public)
- [x] 5.2 Implement GET /api/articles/:id/comments (public)
- [x] 5.3 Implement DELETE /api/comments/:id (protected)
- [x] 5.4 Build comment section component under article detail

## 6. Guestbook

- [x] 6.1 Implement POST /api/guestbook (public)
- [x] 6.2 Implement GET /api/guestbook with pagination (public)
- [x] 6.3 Implement DELETE /api/guestbook/:id (protected)
- [x] 6.4 Build guestbook page UI

## 7. Private Messages

- [x] 7.1 Implement POST /api/messages (public, returns thread_id)
- [x] 7.2 Implement GET /api/messages (protected, admin view all threads)
- [x] 7.3 Implement GET /api/messages/:threadId (public with thread_id)
- [x] 7.4 Implement POST /api/messages/:threadId/reply (protected, admin reply)
- [x] 7.5 Implement DELETE /api/messages/:threadId (protected)
- [x] 7.6 Build private message send form on public page
- [x] 7.7 Build private message thread view with thread_id link

## 8. Graffiti Wall

- [x] 8.1 Implement POST /api/wall (public)
- [x] 8.2 Implement GET /api/wall with pagination (public)
- [x] 8.3 Implement DELETE /api/wall/:id (protected)
- [x] 8.4 Build graffiti wall page with masonry/grid layout

## 9. Article Interactions

- [x] 9.1 Implement POST /api/articles/:id/reactions (public, toggle)
- [x] 9.2 Implement GET /api/articles/:id/reactions (public)
- [x] 9.3 Implement view count increment on GET /api/articles/:id
- [x] 9.4 Implement GET /api/articles/:id/views (public)
- [x] 9.5 Add reaction buttons component to article detail page
- [x] 9.6 Add view count display to article list and detail pages

## 10. Timeline

- [x] 10.1 Implement GET /api/timeline with optional year filter (public)
- [x] 10.2 Build timeline page UI with vertical timeline layout

## 11. Admin Panel

- [x] 11.1 Implement GET /api/admin/stats dashboard overview endpoint
- [x] 11.2 Implement GET /api/admin/comments (protected, all comments list)
- [x] 11.3 Implement GET /api/admin/guestbook (protected, all entries)
- [x] 11.4 Implement GET /api/admin/wall (protected, all wall posts)
- [x] 11.5 Build admin login page
- [x] 11.6 Build admin dashboard page with stats overview
- [x] 11.7 Build admin article management page (list/create/edit with Markdown editor)
- [x] 11.8 Build admin comments management page
- [x] 11.9 Build admin guestbook management page
- [x] 11.10 Build admin private messages page with reply interface
- [x] 11.11 Build admin wall management page

## 12. Frontend Shell

- [x] 12.1 Install react-router-dom and set up routing
- [x] 12.2 Build site header with navigation (Home, Timeline, Guestbook, Wall, Login/Admin)
- [x] 12.3 Build site footer
- [x] 12.4 Build home page with recent articles and site intro

## 13. Theme System

- [x] 13.1 Configure Tailwind CSS v4 dark mode
- [x] 13.2 Build theme toggle button component
- [x] 13.3 Implement theme persistence in localStorage and system preference detection
- [x] 13.4 Apply theme styles to all pages and components

## 14. Integration & Polish

- [x] 14.1 Update package.json scripts for dev and build with backend
- [x] 14.2 Create API client module (shared fetch wrapper with auth header injection)
- [x] 14.3 Wire up all pages with API calls
- [x] 14.4 Add loading states and error handling across all pages
- [x] 14.5 Polish responsive design for mobile
