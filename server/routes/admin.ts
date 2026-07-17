import { Hono } from 'hono'
import { getDb } from '../db.js'
import { authMiddleware } from '../auth.js'

const adminRouter = new Hono()

adminRouter.use('*', authMiddleware)

adminRouter.get('/stats', (c) => {
  const articleCount = (getDb().prepare('SELECT COUNT(*) as count FROM articles').get() as any).count
  const commentCount = (getDb().prepare('SELECT COUNT(*) as count FROM comments').get() as any).count
  const guestbookCount = (getDb().prepare('SELECT COUNT(*) as count FROM guestbook').get() as any).count
  const wallCount = (getDb().prepare('SELECT COUNT(*) as count FROM wall_posts').get() as any).count
  const threadCount = (getDb().prepare(
    'SELECT COUNT(DISTINCT thread_id) as count FROM private_messages WHERE is_admin = 0'
  ).get() as any).count

  return c.json({
    articles: articleCount,
    comments: commentCount,
    guestbook: guestbookCount,
    wall: wallCount,
    threads: threadCount,
  })
})

adminRouter.get('/comments', (c) => {
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '20')
  const offset = (page - 1) * limit

  const rows = getDb().prepare(`
    SELECT c.*, a.title as article_title
    FROM comments c
    LEFT JOIN articles a ON c.article_id = a.id
    ORDER BY c.created_at DESC LIMIT ? OFFSET ?
  `).all(limit, offset)

  const total = (getDb().prepare('SELECT COUNT(*) as count FROM comments').get() as any).count

  return c.json({ comments: rows, total, page, limit })
})

adminRouter.get('/guestbook', (c) => {
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '20')
  const offset = (page - 1) * limit

  const rows = getDb().prepare(
    'SELECT * FROM guestbook ORDER BY created_at DESC LIMIT ? OFFSET ?'
  ).all(limit, offset)

  const total = (getDb().prepare('SELECT COUNT(*) as count FROM guestbook').get() as any).count

  return c.json({ entries: rows, total, page, limit })
})

adminRouter.get('/wall', (c) => {
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '20')
  const offset = (page - 1) * limit

  const rows = getDb().prepare(
    'SELECT * FROM wall_posts ORDER BY created_at DESC LIMIT ? OFFSET ?'
  ).all(limit, offset)

  const total = (getDb().prepare('SELECT COUNT(*) as count FROM wall_posts').get() as any).count

  return c.json({ posts: rows, total, page, limit })
})

export default adminRouter
