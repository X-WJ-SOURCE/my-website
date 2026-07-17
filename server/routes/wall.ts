import { Hono } from 'hono'
import { getDb } from '../db.js'
import { authMiddleware } from '../auth.js'

const wallRouter = new Hono()

wallRouter.get('/', (c) => {
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '30')
  const offset = (page - 1) * limit

  const posts = getDb().prepare(
    'SELECT * FROM wall_posts ORDER BY created_at DESC LIMIT ? OFFSET ?'
  ).all(limit, offset)

  const total = (getDb().prepare('SELECT COUNT(*) as count FROM wall_posts').get() as any).count

  return c.json({ posts, total, page, limit })
})

wallRouter.post('/', async (c) => {
  const { nickname, content, image_url } = await c.req.json()

  if (!content && !image_url) {
    return c.json({ error: 'Content or image is required' }, 400)
  }

  const result = getDb().prepare(
    'INSERT INTO wall_posts (nickname, content, image_url) VALUES (?, ?, ?)'
  ).run(nickname || 'Anonymous', content || null, image_url || null)

  return c.json({ id: result.lastInsertRowid, message: 'Posted to wall' }, 201)
})

wallRouter.delete('/:id', authMiddleware, (c) => {
  const id = c.req.param('id')
  getDb().prepare('DELETE FROM wall_posts WHERE id = ?').run(id)
  return c.json({ message: 'Wall post deleted' })
})

export default wallRouter
