import { Hono } from 'hono'
import { db } from '../db.js'
import { authMiddleware } from '../auth.js'

const guestbookRouter = new Hono()

guestbookRouter.get('/', async (c) => {
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '20')
  const offset = (page - 1) * limit

  const entries = (await db().execute({
    sql: 'SELECT * FROM guestbook ORDER BY created_at DESC LIMIT ? OFFSET ?',
    args: [limit, offset]
  })).rows

  const total = (await db().execute('SELECT COUNT(*) as count FROM guestbook')).rows[0] as any

  return c.json({ entries, total: total.count, page, limit })
})

guestbookRouter.post('/', async (c) => {
  const { nickname, content, image_url, visitor_id } = await c.req.json()
  if (!content) return c.json({ error: 'Content is required' }, 400)

  const result = await db().execute({
    sql: 'INSERT INTO guestbook (nickname, content, image_url, visitor_id) VALUES (?, ?, ?, ?)',
    args: [nickname || 'Anonymous', content, image_url || null, visitor_id || null]
  })
  return c.json({ id: Number(result.lastInsertRowid), message: 'Guestbook entry posted' }, 201)
})

guestbookRouter.put('/:id', async (c) => {
  const id = c.req.param('id')
  const { content, visitor_id } = await c.req.json()
  if (!content || !visitor_id) return c.json({ error: 'Missing fields' }, 400)

  const existing = (await db().execute({ sql: 'SELECT visitor_id FROM guestbook WHERE id = ?', args: [id] })).rows[0] as any
  if (!existing) return c.json({ error: 'Entry not found' }, 404)
  if (existing.visitor_id !== visitor_id) return c.json({ error: 'Not your entry' }, 403)

  await db().execute({
    sql: "UPDATE guestbook SET content = ?, edited_at = datetime('now') WHERE id = ?",
    args: [content, id]
  })
  return c.json({ message: 'Entry updated' })
})

guestbookRouter.delete('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id')
  await db().execute({ sql: 'DELETE FROM guestbook WHERE id = ?', args: [id] })
  return c.json({ message: 'Entry deleted' })
})

guestbookRouter.delete('/:id/own', async (c) => {
  const id = c.req.param('id')
  const visitor_id = c.req.query('visitor_id')
  if (!visitor_id) return c.json({ error: 'Missing visitor_id' }, 400)
  const existing = (await db().execute({ sql: 'SELECT visitor_id FROM guestbook WHERE id = ?', args: [id] })).rows[0] as any
  if (!existing) return c.json({ error: 'Not found' }, 404)
  if (existing.visitor_id !== visitor_id) return c.json({ error: 'Not your entry' }, 403)
  await db().execute({ sql: 'DELETE FROM guestbook WHERE id = ?', args: [id] })
  return c.json({ message: 'Entry deleted' })
})

export default guestbookRouter
