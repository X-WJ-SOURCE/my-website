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

  const total = (await db().execute({
    sql: 'SELECT COUNT(*) as count FROM comments WHERE article_id = ?',
    args: [articleId]
  })).rows[0] as any

  return c.json({ comments, total: total.count, page, limit })
})

commentsRouter.post('/article/:articleId', async (c) => {
  const articleId = c.req.param('articleId')
  const { nickname, content, image_url, visitor_id } = await c.req.json()

  if (!content) return c.json({ error: 'Content is required' }, 400)

  const result = await db().execute({
    sql: 'INSERT INTO comments (article_id, nickname, content, image_url, visitor_id) VALUES (?, ?, ?, ?, ?)',
    args: [articleId, nickname || 'Anonymous', content, image_url || null, visitor_id || null]
  })

  return c.json({ id: Number(result.lastInsertRowid), message: 'Comment posted' }, 201)
})

commentsRouter.put('/:id', async (c) => {
  const id = c.req.param('id')
  const { content, visitor_id } = await c.req.json()

  if (!content || !visitor_id) return c.json({ error: 'Missing fields' }, 400)

  const existing = (await db().execute({ sql: 'SELECT visitor_id FROM comments WHERE id = ?', args: [id] })).rows[0] as any
  if (!existing) return c.json({ error: 'Comment not found' }, 404)
  if (existing.visitor_id !== visitor_id) return c.json({ error: 'Not your comment' }, 403)

  await db().execute({
    sql: "UPDATE comments SET content = ?, edited_at = datetime('now') WHERE id = ?",
    args: [content, id]
  })
  return c.json({ message: 'Comment updated' })
})

commentsRouter.delete('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id')
  await db().execute({ sql: 'DELETE FROM comments WHERE id = ?', args: [id] })
  return c.json({ message: 'Comment deleted' })
})

commentsRouter.delete('/:id/own', async (c) => {
  const id = c.req.param('id')
  const visitor_id = c.req.query('visitor_id')
  if (!visitor_id) return c.json({ error: 'Missing visitor_id' }, 400)
  const existing = (await db().execute({ sql: 'SELECT visitor_id FROM comments WHERE id = ?', args: [id] })).rows[0] as any
  if (!existing) return c.json({ error: 'Not found' }, 404)
  if (existing.visitor_id !== visitor_id) return c.json({ error: 'Not your comment' }, 403)
  await db().execute({ sql: 'DELETE FROM comments WHERE id = ?', args: [id] })
  return c.json({ message: 'Comment deleted' })
})

export default commentsRouter
