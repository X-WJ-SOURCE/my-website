import { Hono } from 'hono'
import { db } from '../db.js'

const drawingsRouter = new Hono()

drawingsRouter.get('/', async (c) => {
  const drawings = (await db().execute('SELECT * FROM wall_drawings ORDER BY created_at ASC')).rows
  return c.json(drawings)
})

drawingsRouter.post('/', async (c) => {
  const { stroke_data, color } = await c.req.json()
  if (!stroke_data || !color) return c.json({ error: 'Missing data' }, 400)
  await db().execute({
    sql: 'INSERT INTO wall_drawings (stroke_data, color) VALUES (?, ?)',
    args: [JSON.stringify(stroke_data), color]
  })
  return c.json({ message: 'Saved' }, 201)
})

drawingsRouter.delete('/:id', async (c) => {
  const id = c.req.param('id')
  await db().execute({ sql: 'DELETE FROM wall_drawings WHERE id = ?', args: [id] })
  return c.json({ message: 'Deleted' })
})

export default drawingsRouter
