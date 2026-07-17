import { Hono } from 'hono'
import { getDb } from '../db.js'
import { authMiddleware } from '../auth.js'

const guestbookRouter = new Hono()

guestbookRouter.get('/', (c) => {
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '20')
  const offset = (page - 1) * limit

  const entries = getDb().prepare(
    'SELECT * FROM guestbook ORDER BY created_at DESC LIMIT ? OFFSET ?'
  ).all(limit, offset)

  const total = (getDb().prepare('SELECT COUNT(*) as count FROM guestbook').get() as any).count

  return c.json({ entries, total, page, limit })
})

guestbookRouter.post('/', async (c) => {
  const { nickname, content, image_url } = await c.req.json()

  if (!content) {
    return c.json({ error: 'Content is required' }, 400)
  }

  const result = getDb().prepare(
    'INSERT INTO guestbook (nickname, content, image_url) VALUES (?, ?, ?)'
  ).run(nickname || 'Anonymous', content, image_url || null)

  return c.json({ id: result.lastInsertRowid, message: 'Guestbook entry posted' }, 201)
})

guestbookRouter.delete('/:id', authMiddleware, (c) => {
  const id = c.req.param('id')
  getDb().prepare('DELETE FROM guestbook WHERE id = ?').run(id)
  return c.json({ message: 'Entry deleted' })
})

export default guestbookRouter
