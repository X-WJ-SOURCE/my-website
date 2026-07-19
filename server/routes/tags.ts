import { Hono } from 'hono'
import { db } from '../db.js'
import { authMiddleware } from '../auth.js'

const tagRouter = new Hono()

tagRouter.get('/', async (c) => {
  const tags = (await db().execute({
    sql: `
    SELECT t.id, t.name, t.music_url, t.music_title, COUNT(at.article_id) as article_count
    FROM tags t
    LEFT JOIN article_tags at ON t.id = at.tag_id
    GROUP BY t.id
    ORDER BY article_count DESC
  `
  })).rows
  return c.json(tags)
})

tagRouter.put('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id')
  const { music_url, music_title } = await c.req.json()
  await db().execute({
    sql: 'UPDATE tags SET music_url = ?, music_title = ? WHERE id = ?',
    args: [music_url || null, music_title || null, id]
  })
  return c.json({ message: 'Updated' })
})

export default tagRouter
