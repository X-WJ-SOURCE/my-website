import { Hono } from 'hono'
import { db } from '../db.js'
import { authMiddleware } from '../auth.js'

const adminRouter = new Hono()

adminRouter.use('*', authMiddleware)

adminRouter.get('/stats', async (c) => {
  const [articleCount, commentCount, guestbookCount, wallCount, threadCount] = (
    await Promise.all([
      db().execute('SELECT COUNT(*) as count FROM articles'),
      db().execute('SELECT COUNT(*) as count FROM comments'),
      db().execute('SELECT COUNT(*) as count FROM guestbook'),
      db().execute('SELECT COUNT(*) as count FROM wall_posts'),
      db().execute(
        'SELECT COUNT(DISTINCT thread_id) as count FROM private_messages WHERE is_admin = 0'
      ),
    ])
  ).map((r) => (r.rows[0] as any).count)

  return c.json({
    articles: articleCount,
    comments: commentCount,
    guestbook: guestbookCount,
    wall: wallCount,
    threads: threadCount,
  })
})

adminRouter.get('/comments', async (c) => {
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '20')
  const offset = (page - 1) * limit

  const rows = (await db().execute({
    sql: `SELECT c.*, a.title as article_title
          FROM comments c
          LEFT JOIN articles a ON c.article_id = a.id
          ORDER BY c.created_at DESC LIMIT ? OFFSET ?`,
    args: [limit, offset]
  })).rows

  const total = (await db().execute('SELECT COUNT(*) as count FROM comments')).rows[0].count

  return c.json({ comments: rows, total, page, limit })
})

adminRouter.get('/guestbook', async (c) => {
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '20')
  const offset = (page - 1) * limit

  const rows = (await db().execute({
    sql: 'SELECT * FROM guestbook ORDER BY created_at DESC LIMIT ? OFFSET ?',
    args: [limit, offset]
  })).rows

  const total = (await db().execute('SELECT COUNT(*) as count FROM guestbook')).rows[0].count

  return c.json({ entries: rows, total, page, limit })
})

adminRouter.get('/wall', async (c) => {
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '20')
  const offset = (page - 1) * limit

  const rows = (await db().execute({
    sql: 'SELECT * FROM wall_posts ORDER BY created_at DESC LIMIT ? OFFSET ?',
    args: [limit, offset]
  })).rows

  const total = (await db().execute('SELECT COUNT(*) as count FROM wall_posts')).rows[0].count

  return c.json({ posts: rows, total, page, limit })
})

export default adminRouter
