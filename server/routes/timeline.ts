import { Hono } from 'hono'
import { db } from '../db.js'

const timelineRouter = new Hono()

timelineRouter.get('/', async (c) => {
  const year = c.req.query('year')

  let query = "SELECT id, title, strftime('%Y-%m-%d', created_at) as date, visibility FROM articles WHERE visibility = 'public'"
  const params: any[] = []

  if (year) {
    query += " AND strftime('%Y', created_at) = ?"
    params.push(year)
  }

  query += ' ORDER BY created_at DESC'

  const articles = (await db().execute({ sql: query, args: params })).rows

  const years = ((await db().execute(
    "SELECT DISTINCT strftime('%Y', created_at) as year FROM articles WHERE visibility = 'public' ORDER BY year DESC"
  )).rows as any[]).map((r: any) => r.year)

  return c.json({ articles, years })
})

export default timelineRouter
