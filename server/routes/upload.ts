import { Hono } from 'hono'
import { v4 as uuid } from 'uuid'
import { db } from '../db.js'

const uploadRouter = new Hono()

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg']
const MAX_SIZE = 10 * 1024 * 1024

async function handleUpload(c: any) {
  const body = await c.req.parseBody()
  const file = body.file as File | undefined

  if (!file) return c.json({ error: 'No file provided' }, 400)
  if (!ALLOWED_TYPES.includes(file.type)) return c.json({ error: 'Invalid file type' }, 400)
  if (file.size > MAX_SIZE) return c.json({ error: 'File too large. Max 10MB' }, 400)

  const ext = file.name.includes('.') ? file.name.split('.').pop() : 'jpg'
  const id = `${uuid()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())
  const base64 = buffer.toString('base64')

  await db().execute({
    sql: 'INSERT INTO uploads (id, filename, mime_type, data) VALUES (?, ?, ?, ?)',
    args: [id, file.name, file.type, base64]
  })

  return c.json({ url: `/uploads/${id}` })
}

uploadRouter.post('/', handleUpload)

export default uploadRouter
