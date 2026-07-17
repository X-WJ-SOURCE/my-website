import { Hono } from 'hono'
import { getDb } from '../db.js'
import { authMiddleware } from '../auth.js'

const tagRouter = new Hono()

tagRouter.get('/', (c) => {
  const tags = getDb().prepare(`
    SELECT t.id, t.name, COUNT(at.article_id) as article_count
    FROM tags t
    LEFT JOIN article_tags at ON t.id = at.tag_id
    GROUP BY t.id
    ORDER BY article_count DESC
  `).all()
  return c.json(tags)
})

export default tagRouter
