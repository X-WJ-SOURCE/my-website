import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from '@hono/node-server/serve-static'
import path from 'path'
import { fileURLToPath } from 'url'

import authRouter from './routes/auth.js'
import articlesRouter from './routes/articles.js'
import tagsRouter from './routes/tags.js'
import commentsRouter from './routes/comments.js'
import guestbookRouter from './routes/guestbook.js'
import messagesRouter from './routes/messages.js'
import wallRouter from './routes/wall.js'
import uploadRouter from './routes/upload.js'
import reactionsRouter from './routes/reactions.js'
import timelineRouter from './routes/timeline.js'
import adminRouter from './routes/admin.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isProduction = process.env.NODE_ENV === 'production'

const app = new Hono()

app.use('/*', cors({
  origin: isProduction ? ['*'] : ['http://localhost:5173'],
  credentials: true,
}))

app.use('/uploads/*', async (c) => {
  const filename = c.req.path.replace('/uploads/', '')
  if (!filename) return c.notFound()

  const row = (await db().execute({
    sql: 'SELECT mime_type, data FROM uploads WHERE id = ?',
    args: [filename]
  })).rows[0] as any

  if (!row) return c.notFound()

  const buffer = Buffer.from(row.data, 'base64')
  c.header('Content-Type', row.mime_type)
  c.header('Cache-Control', 'public, max-age=31536000')
  return c.body(buffer as any)
})

app.get('/api/health', (c) => c.json({ status: 'ok' }))

app.route('/api/auth', authRouter)
app.route('/api/articles', articlesRouter)
app.route('/api/tags', tagsRouter)
app.route('/api/comments', commentsRouter)
app.route('/api/guestbook', guestbookRouter)
app.route('/api/messages', messagesRouter)
app.route('/api/wall', wallRouter)
app.route('/api/upload', uploadRouter)
app.route('/api/reactions', reactionsRouter)
app.route('/api/timeline', timelineRouter)
app.route('/api/admin', adminRouter)

app.get('/api/stats', async (c) => {
  const stats = {
    articles: (await db().execute('SELECT COUNT(*) as count FROM articles WHERE visibility = ?', ['public'])).rows[0].count,
    comments: (await db().execute('SELECT COUNT(*) as count FROM comments')).rows[0].count,
    guestbook: (await db().execute('SELECT COUNT(*) as count FROM guestbook')).rows[0].count,
    wall: (await db().execute('SELECT COUNT(*) as count FROM wall_posts')).rows[0].count,
  }
  return c.json(stats)
})

if (isProduction) {
  const distDir = path.join(__dirname, '..', 'dist')
  app.use('/*', serveStatic({ root: distDir }))
  app.get('*', serveStatic({ root: distDir, path: 'index.html' }))
}

import { initDb, db } from './db.js'
import { serve } from '@hono/node-server'

export default app

const PORT = parseInt(process.env.PORT || '3000')

initDb().then(() => {
  serve({ fetch: app.fetch, port: PORT })
  console.log(`Server running on port ${PORT}`)
}).catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
