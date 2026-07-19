import { Hono } from 'hono'
import { db } from '../db.js'
import { authMiddleware } from '../auth.js'

const articlesRouter = new Hono()

articlesRouter.get('/', async (c) => {
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '10')
  const tag = c.req.query('tag')
  const offset = (page - 1) * limit
  const isAuth = !!c.req.header('Authorization')

  let query: string
  let params: any[] = []

  if (isAuth) {
    query = 'SELECT DISTINCT a.* FROM articles a'
  } else {
    query = "SELECT DISTINCT a.* FROM articles a WHERE a.visibility = 'public'"
  }

  if (tag) {
    query += ' INNER JOIN article_tags at2 ON a.id = at2.article_id INNER JOIN tags t2 ON at2.tag_id = t2.id WHERE t2.name = ?'
    params.push(tag)
    if (!isAuth) {
      query = query.replace('WHERE', 'AND')
    }
  }

  query += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?'
  params.push(limit, offset)

  const articles = (await db().execute({ sql: query, args: params })).rows as any[]

  const countQuery = tag
    ? "SELECT COUNT(DISTINCT a.id) as count FROM articles a INNER JOIN article_tags at2 ON a.id = at2.article_id INNER JOIN tags t2 ON at2.tag_id = t2.id WHERE t2.name = ? AND a.visibility = 'public'"
    : "SELECT COUNT(*) as count FROM articles WHERE visibility = 'public'"

  const countParams = tag ? [tag] : []
  const countResult = isAuth
    ? (await db().execute({ sql: 'SELECT COUNT(*) as count FROM articles' })).rows[0]
    : (await db().execute({ sql: countQuery, args: countParams })).rows[0]
  const total = (countResult as any).count

  const articlesWithTags = await Promise.all(articles.map(async (a: any) => {
    const tags = (await db().execute({
      sql: 'SELECT t.name FROM tags t INNER JOIN article_tags at ON t.id = at.tag_id WHERE at.article_id = ?',
      args: [a.id]
    })).rows as any[]
    const viewCount = ((await db().execute({
      sql: 'SELECT COUNT(*) as count FROM article_views WHERE article_id = ?',
      args: [a.id]
    })).rows[0] as any).count
    return { ...a, tags: tags.map((t: any) => t.name), view_count: viewCount }
  }))

  return c.json({ articles: articlesWithTags, total, page, limit })
})

articlesRouter.get('/:id', async (c) => {
  const id = c.req.param('id')
  const article = (await db().execute({ sql: 'SELECT * FROM articles WHERE id = ?', args: [id] })).rows[0] as any

  if (!article) {
    return c.json({ error: 'Article not found' }, 404)
  }

  const isAuth = !!c.req.header('Authorization')
  if (article.visibility === 'private' && !isAuth) {
    return c.json({ error: 'Article not found' }, 404)
  }

  const visitorId = c.req.query('visitor_id')
  if (visitorId) {
    const recent = (await db().execute({
      sql: "SELECT id FROM article_views WHERE article_id = ? AND visitor_id = ? AND viewed_at > datetime('now', '-30 minutes')",
      args: [id, visitorId]
    })).rows[0]
    if (!recent) {
      await db().execute({
        sql: 'INSERT INTO article_views (article_id, visitor_id) VALUES (?, ?)',
        args: [id, visitorId]
      })
    }
  }

  const tags = (await db().execute({
    sql: 'SELECT t.name FROM tags t INNER JOIN article_tags at ON t.id = at.tag_id WHERE at.article_id = ?',
    args: [id]
  })).rows as any[]
  article.tags = tags.map((t: any) => t.name)

  const viewCount = ((await db().execute({
    sql: 'SELECT COUNT(*) as count FROM article_views WHERE article_id = ?',
    args: [id]
  })).rows[0] as any).count
  article.view_count = viewCount

  return c.json(article)
})

articlesRouter.post('/', authMiddleware, async (c) => {
  const { title, content, visibility, tags, cover_url, decor_images } = await c.req.json()

  if (!title || !content) {
    return c.json({ error: 'Title and content are required' }, 400)
  }
  const result = await db().execute({
    sql: 'INSERT INTO articles (title, content, visibility, cover_url, decor_images) VALUES (?, ?, ?, ?, ?)',
    args: [title, content, visibility || 'public', cover_url || null, decor_images ? JSON.stringify(decor_images) : null]
  })

  const articleId = Number(result.lastInsertRowid)

  if (tags && Array.isArray(tags)) {
    for (const tagName of tags) {
      let tag = (await db().execute({
        sql: 'SELECT id FROM tags WHERE name = ?',
        args: [tagName]
      })).rows[0] as any
      if (!tag) {
        const tagResult = await db().execute({
          sql: 'INSERT INTO tags (name) VALUES (?)',
          args: [tagName]
        })
        tag = { id: Number(tagResult.lastInsertRowid) }
      }
      await db().execute({
        sql: 'INSERT OR IGNORE INTO article_tags (article_id, tag_id) VALUES (?, ?)',
        args: [articleId, tag.id]
      })
    }
  }

  return c.json({ id: articleId, message: 'Article created' }, 201)
})

articlesRouter.put('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id')
  const { title, content, visibility, tags, cover_url, decor_images, music_url, music_title } = await c.req.json()

  const existing = (await db().execute({ sql: 'SELECT id FROM articles WHERE id = ?', args: [id] })).rows[0]
  if (!existing) {
    return c.json({ error: 'Article not found' }, 404)
  }

  await db().execute({
    sql: "UPDATE articles SET title = ?, content = ?, visibility = ?, cover_url = ?, decor_images = ?, updated_at = datetime('now') WHERE id = ?",
    args: [title, content, visibility, cover_url || null, decor_images ? JSON.stringify(decor_images) : null, id]
  })

  if (tags && Array.isArray(tags)) {
    await db().execute({ sql: 'DELETE FROM article_tags WHERE article_id = ?', args: [id] })
    for (const tagName of tags) {
      let tag = (await db().execute({
        sql: 'SELECT id FROM tags WHERE name = ?',
        args: [tagName]
      })).rows[0] as any
      if (!tag) {
        const tagResult = await db().execute({
          sql: 'INSERT INTO tags (name) VALUES (?)',
          args: [tagName]
        })
        tag = { id: Number(tagResult.lastInsertRowid) }
      }
      await db().execute({
        sql: 'INSERT OR IGNORE INTO article_tags (article_id, tag_id) VALUES (?, ?)',
        args: [id, tag.id]
      })
    }
  }

  return c.json({ message: 'Article updated' })
})

articlesRouter.delete('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id')
  await db().execute({ sql: 'DELETE FROM articles WHERE id = ?', args: [id] })
  return c.json({ message: 'Article deleted' })
})

articlesRouter.get('/:id/views', async (c) => {
  const id = c.req.param('id')
  const count = ((await db().execute({
    sql: 'SELECT COUNT(*) as count FROM article_views WHERE article_id = ?',
    args: [id]
  })).rows[0] as any).count
  return c.json({ views: count })
})

export default articlesRouter
