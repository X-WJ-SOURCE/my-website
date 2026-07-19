import { Hono } from 'hono'
import { db } from '../db.js'
import { authMiddleware } from '../auth.js'

const tagSongsRouter = new Hono()

tagSongsRouter.get('/tag/:tagId', async (c) => {
  const tagId = c.req.param('tagId')
  const songs = (await db().execute({
    sql: 'SELECT * FROM tag_songs WHERE tag_id = ? ORDER BY created_at ASC',
    args: [tagId]
  })).rows
  return c.json(songs)
})

tagSongsRouter.post('/tag/:tagId', authMiddleware, async (c) => {
  const tagId = c.req.param('tagId')
  const { title, url, highlight_time } = await c.req.json()
  if (!title || !url) return c.json({ error: 'Title and URL required' }, 400)
  const result = await db().execute({
    sql: 'INSERT INTO tag_songs (tag_id, title, url, highlight_time) VALUES (?, ?, ?, ?)',
    args: [tagId, title, url, highlight_time || null]
  })
  return c.json({ id: Number(result.lastInsertRowid) }, 201)
})

tagSongsRouter.delete('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id')
  await db().execute({ sql: 'DELETE FROM tag_songs WHERE id = ?', args: [id] })
  return c.json({ message: 'Deleted' })
})

export default tagSongsRouter
