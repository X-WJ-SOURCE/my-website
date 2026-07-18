import { Hono } from 'hono'
import { db } from '../db.js'
import { authMiddleware } from '../auth.js'

const commentsRouter = new Hono()

commentsRouter.get('/article/:articleId', async (c) => {
  const articleId = c.req.param('articleId')
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '20')
  const offset = (page - 1) * limit

  const comments = (await db().execute({
    sql: 'SELECT * FROM comments WHERE article_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
    args: [articleId, limit, offset]
  })).rows

  const total = ((await db().execute({
    sql: 'SELECT COUNT(*) as count FROM comments WHERE article_id = ?',
    args: [articleId]
  })).rows[0] as any).count

  return c.json({ comments, total, page, limit })
})

commentsRouter.post('/article/:articleId', async (c) => {
  const articleId = c.req.param('articleId')
  const { nickname, content, image_url } = await c.req.json()

  if (!content) {
    return c.json({ error: 'Content is required' }, 400)
  }

  const result = await db().execute({
    sql: 'INSERT INTO comments (article_id, nickname, content, image_url) VALUES (?, ?, ?, ?)',
    args: [articleId, nickname || 'Anonymous', content, image_url || null]
  })

  return c.json({ id: Number(result.lastInsertRowid), message: 'Comment posted' }, 201)
})

commentsRouter.delete('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id')
  await db().execute({ sql: 'DELETE FROM comments WHERE id = ?', args: [id] })
  return c.json({ message: 'Comment deleted' })
})

export default commentsRouter
