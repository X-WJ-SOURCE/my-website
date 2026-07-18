import { Hono } from 'hono'
import { db } from '../db.js'
import { authMiddleware } from '../auth.js'

const wallCommentsRouter = new Hono()

wallCommentsRouter.get('/wall/:wallId', async (c) => {
  const wallId = c.req.param('wallId')
  const comments = (await db().execute({
    sql: 'SELECT * FROM wall_comments WHERE wall_id = ? ORDER BY created_at ASC',
    args: [wallId]
  })).rows
  return c.json(comments)
})

wallCommentsRouter.post('/wall/:wallId', async (c) => {
  const wallId = c.req.param('wallId')
  const { nickname, content, visitor_id } = await c.req.json()
  if (!content) return c.json({ error: 'Content is required' }, 400)

  const result = await db().execute({
    sql: 'INSERT INTO wall_comments (wall_id, nickname, content, visitor_id) VALUES (?, ?, ?, ?)',
    args: [wallId, nickname || 'Anonymous', content, visitor_id || null]
  })
  return c.json({ id: Number(result.lastInsertRowid) }, 201)
})

wallCommentsRouter.put('/:id', async (c) => {
  const id = c.req.param('id')
  const { content, visitor_id } = await c.req.json()
  if (!content || !visitor_id) return c.json({ error: 'Missing fields' }, 400)

  const existing = (await db().execute({ sql: 'SELECT visitor_id FROM wall_comments WHERE id = ?', args: [id] })).rows[0] as any
  if (!existing) return c.json({ error: 'Not found' }, 404)
  if (existing.visitor_id !== visitor_id) return c.json({ error: 'Not your comment' }, 403)

  await db().execute({
    sql: "UPDATE wall_comments SET content = ?, edited_at = datetime('now') WHERE id = ?",
    args: [content, id]
  })
  return c.json({ message: 'Updated' })
})

wallCommentsRouter.delete('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id')
  await db().execute({ sql: 'DELETE FROM wall_comments WHERE id = ?', args: [id] })
  return c.json({ message: 'Deleted' })
})

wallCommentsRouter.delete('/:id/own', async (c) => {
  const id = c.req.param('id')
  const visitor_id = c.req.query('visitor_id')
  if (!visitor_id) return c.json({ error: 'Missing visitor_id' }, 400)
  const existing = (await db().execute({ sql: 'SELECT visitor_id FROM wall_comments WHERE id = ?', args: [id] })).rows[0] as any
  if (!existing) return c.json({ error: 'Not found' }, 404)
  if (existing.visitor_id !== visitor_id) return c.json({ error: 'Not your comment' }, 403)
  await db().execute({ sql: 'DELETE FROM wall_comments WHERE id = ?', args: [id] })
  return c.json({ message: 'Deleted' })
})

export default wallCommentsRouter
