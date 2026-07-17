import { Hono } from 'hono'
import { v4 as uuid } from 'uuid'
import { getDb } from '../db.js'
import { authMiddleware } from '../auth.js'

const messagesRouter = new Hono()

messagesRouter.post('/', async (c) => {
  const { nickname, content, image_url } = await c.req.json()

  if (!content) {
    return c.json({ error: 'Content is required' }, 400)
  }

  const threadId = uuid()
  getDb().prepare(
    'INSERT INTO private_messages (thread_id, nickname, content, image_url, is_admin) VALUES (?, ?, ?, ?, 0)'
  ).run(threadId, nickname || 'Anonymous', content, image_url || null)

  return c.json({ thread_id: threadId, message: 'Message sent' }, 201)
})

messagesRouter.get('/', authMiddleware, (c) => {
  const threads = (db.prepare(`
    SELECT thread_id as id, nickname, content, image_url, created_at
    FROM private_messages
    WHERE rowid IN (SELECT MIN(rowid) FROM private_messages WHERE is_admin = 0 GROUP BY thread_id)
    ORDER BY created_at DESC
  `).all() as any[]).map((t: any) => ({ ...t, thread_id: t.id }))

  return c.json(threads)
})

messagesRouter.get('/:threadId', (c) => {
  const threadId = c.req.param('threadId')
  const messages = getDb().prepare(
    'SELECT * FROM private_messages WHERE thread_id = ? ORDER BY created_at ASC'
  ).all(threadId)

  if (!messages.length) {
    return c.json({ error: 'Thread not found' }, 404)
  }

  return c.json(messages)
})

messagesRouter.post('/:threadId/reply', authMiddleware, async (c) => {
  const threadId = c.req.param('threadId')
  const { content } = await c.req.json()

  if (!content) {
    return c.json({ error: 'Content is required' }, 400)
  }

  getDb().prepare(
    'INSERT INTO private_messages (thread_id, nickname, content, is_admin) VALUES (?, ?, ?, 1)'
  ).run(threadId, 'Admin', content)

  return c.json({ message: 'Reply sent' }, 201)
})

messagesRouter.delete('/:threadId', authMiddleware, (c) => {
  const threadId = c.req.param('threadId')
  getDb().prepare('DELETE FROM private_messages WHERE thread_id = ?').run(threadId)
  return c.json({ message: 'Thread deleted' })
})

export default messagesRouter
