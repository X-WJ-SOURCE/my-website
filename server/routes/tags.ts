import { Hono } from 'hono'
import { db } from '../db.js'

const tagRouter = new Hono()

tagRouter.get('/', async (c) => {
  const tags = (await db().execute({
    sql: `
    SELECT t.id, t.name, COUNT(at.article_id) as article_count
    FROM tags t
    LEFT JOIN article_tags at ON t.id = at.tag_id
    GROUP BY t.id
    ORDER BY article_count DESC
  `
  })).rows
  return c.json(tags)
})

export default tagRouter
