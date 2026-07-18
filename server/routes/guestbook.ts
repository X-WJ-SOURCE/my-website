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

  const total = ((await db().execute({ sql: 'SELECT COUNT(*) as count FROM guestbook' })).rows[0] as any).count

  return c.json({ entries, total, page, limit })
})

guestbookRouter.post('/', async (c) => {
  const { nickname, content, image_url } = await c.req.json()

  if (!content) {
    return c.json({ error: 'Content is required' }, 400)
  }

  const result = await db().execute({
    sql: 'INSERT INTO guestbook (nickname, content, image_url) VALUES (?, ?, ?)',
    args: [nickname || 'Anonymous', content, image_url || null]
  })

  return c.json({ id: Number(result.lastInsertRowid), message: 'Guestbook entry posted' }, 201)
})

guestbookRouter.delete('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id')
  await db().execute({ sql: 'DELETE FROM guestbook WHERE id = ?', args: [id] })
  return c.json({ message: 'Entry deleted' })
})

export default guestbookRouter
