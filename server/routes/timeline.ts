import { Hono } from 'hono'
import { getDb } from '../db.js'

const timelineRouter = new Hono()

timelineRouter.get('/', (c) => {
  const year = c.req.query('year')

  let query = "SELECT id, title, strftime('%Y-%m-%d', created_at) as date, visibility FROM articles WHERE visibility = 'public'"
  const params: any[] = []

  if (year) {
    query += " AND strftime('%Y', created_at) = ?"
    params.push(year)
  }

  query += ' ORDER BY created_at DESC'

  const articles = getDb().prepare(query).all(...params) as any[]

  const years = (getDb().prepare(
    "SELECT DISTINCT strftime('%Y', created_at) as year FROM articles WHERE visibility = 'public' ORDER BY year DESC"
  ).all() as any[]).map((r: any) => r.year)

  return c.json({ articles, years })
})

export default timelineRouter
