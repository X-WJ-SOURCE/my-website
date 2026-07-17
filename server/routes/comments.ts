import { Hono } from 'hono'
import { getDb } from '../db.js'
import { authMiddleware } from '../auth.js'

const commentsRouter = new Hono()

commentsRouter.get('/article/:articleId', (c) => {
  const articleId = c.req.param('articleId')
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '20')
  const offset = (page - 1) * limit

  const comments = getDb().prepare(
    'SELECT * FROM comments WHERE article_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
  ).all(articleId, limit, offset)

  const total = (getDb().prepare(
    'SELECT COUNT(*) as count FROM comments WHERE article_id = ?'
  ).get(articleId) as any).count

  return c.json({ comments, total, page, limit })
})

commentsRouter.post('/article/:articleId', async (c) => {
  const articleId = c.req.param('articleId')
  const { nickname, content, image_url } = await c.req.json()

  if (!content) {
    return c.json({ error: 'Content is required' }, 400)
  }

  const result = getDb().prepare(
    'INSERT INTO comments (article_id, nickname, content, image_url) VALUES (?, ?, ?, ?)'
  ).run(articleId, nickname || 'Anonymous', content, image_url || null)

  return c.json({ id: result.lastInsertRowid, message: 'Comment posted' }, 201)
})

commentsRouter.delete('/:id', authMiddleware, (c) => {
  const id = c.req.param('id')
  getDb().prepare('DELETE FROM comments WHERE id = ?').run(id)
  return c.json({ message: 'Comment deleted' })
})

export default commentsRouter
