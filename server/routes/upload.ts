import { Hono } from 'hono'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { v4 as uuid } from 'uuid'
import { authMiddleware } from '../auth.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = process.env.DATA_DIR || path.join(__dirname, '..')
const uploadsDir = path.join(dataDir, 'uploads')

const uploadRouter = new Hono()

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_SIZE = 10 * 1024 * 1024

async function handleUpload(c: any) {
  const body = await c.req.parseBody()
  const file = body.file as File | undefined

  if (!file) {
    return c.json({ error: 'No file provided' }, 400)
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return c.json({ error: 'Invalid file type. Allowed: JPG, PNG, GIF, WebP' }, 400)
  }

  if (file.size > MAX_SIZE) {
    return c.json({ error: 'File too large. Max 10MB' }, 400)
  }

  if (!existsSync(uploadsDir)) {
    await mkdir(uploadsDir, { recursive: true })
  }

  const ext = file.name.includes('.') ? file.name.split('.').pop() : 'jpg'
  const filename = `${uuid()}.${ext}`
  const filePath = path.join(uploadsDir, filename)

  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(filePath, buffer)

  return c.json({ url: `/uploads/${filename}` })
}

uploadRouter.post('/', handleUpload)
uploadRouter.post('/admin', authMiddleware, handleUpload)

export default uploadRouter
