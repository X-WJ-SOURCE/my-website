import { Hono } from 'hono'
import { db } from '../db.js'
import { authMiddleware } from '../auth.js'

const wallRouter = new Hono()

wallRouter.get('/', async (c) => {
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '30')
  const offset = (page - 1) * limit

  const posts = (await db().execute({
    sql: 'SELECT * FROM wall_posts ORDER BY created_at DESC LIMIT ? OFFSET ?',
    args: [limit, offset]
  })).rows

  const total = (await db().execute('SELECT COUNT(*) as count FROM wall_posts')).rows[0].count

  return c.json({ posts, total, page, limit })
})

wallRouter.post('/', async (c) => {
  const { nickname, content, image_url } = await c.req.json()

  if (!content && !image_url) {
    return c.json({ error: 'Content or image is required' }, 400)
  }

  const result = await db().execute({
    sql: 'INSERT INTO wall_posts (nickname, content, image_url) VALUES (?, ?, ?)',
    args: [nickname || 'Anonymous', content || null, image_url || null]
  })

  return c.json({ id: Number(result.lastInsertRowid), message: 'Posted to wall' }, 201)
})

wallRouter.delete('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id')
  await db().execute({ sql: 'DELETE FROM wall_posts WHERE id = ?', args: [id] })
  return c.json({ message: 'Wall post deleted' })
})

export default wallRouter
