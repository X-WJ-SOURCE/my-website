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

  const total = (await db().execute('SELECT COUNT(*) as count FROM wall_posts')).rows[0] as any

  return c.json({ posts, total: total.count, page, limit })
})

wallRouter.post('/', async (c) => {
  const { nickname, content, image_url, visitor_id } = await c.req.json()
  if (!content && !image_url) return c.json({ error: 'Content or image is required' }, 400)

  const result = await db().execute({
    sql: 'INSERT INTO wall_posts (nickname, content, image_url, visitor_id) VALUES (?, ?, ?, ?)',
    args: [nickname || 'Anonymous', content || null, image_url || null, visitor_id || null]
  })
  return c.json({ id: Number(result.lastInsertRowid), message: 'Posted to wall' }, 201)
})

wallRouter.put('/:id', async (c) => {
  const id = c.req.param('id')
  const { content, visitor_id } = await c.req.json()
  if (!content || !visitor_id) return c.json({ error: 'Missing fields' }, 400)

  const existing = (await db().execute({ sql: 'SELECT visitor_id FROM wall_posts WHERE id = ?', args: [id] })).rows[0] as any
  if (!existing) return c.json({ error: 'Post not found' }, 404)
  if (existing.visitor_id !== visitor_id) return c.json({ error: 'Not your post' }, 403)

  await db().execute({
    sql: "UPDATE wall_posts SET content = ?, edited_at = datetime('now') WHERE id = ?",
    args: [content, id]
  })
  return c.json({ message: 'Post updated' })
})

wallRouter.delete('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id')
  await db().execute({ sql: 'DELETE FROM wall_posts WHERE id = ?', args: [id] })
  return c.json({ message: 'Wall post deleted' })
})

wallRouter.delete('/:id/own', async (c) => {
  const id = c.req.param('id')
  const visitor_id = c.req.query('visitor_id')
  if (!visitor_id) return c.json({ error: 'Missing visitor_id' }, 400)
  const existing = (await db().execute({ sql: 'SELECT visitor_id FROM wall_posts WHERE id = ?', args: [id] })).rows[0] as any
  if (!existing) return c.json({ error: 'Not found' }, 404)
  if (existing.visitor_id !== visitor_id) return c.json({ error: 'Not your post' }, 403)
  await db().execute({ sql: 'DELETE FROM wall_posts WHERE id = ?', args: [id] })
  return c.json({ message: 'Wall post deleted' })
})

export default wallRouter
