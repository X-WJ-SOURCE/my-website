import { Hono } from 'hono'
import { getDb } from '../db.js'
import { authMiddleware } from '../auth.js'

const articlesRouter = new Hono()

articlesRouter.get('/', (c) => {
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

  const articles = getDb().prepare(query).all(...params) as any[]

  const countQuery = tag
    ? "SELECT COUNT(DISTINCT a.id) as count FROM articles a INNER JOIN article_tags at2 ON a.id = at2.article_id INNER JOIN tags t2 ON at2.tag_id = t2.id WHERE t2.name = ? AND a.visibility = 'public'"
    : "SELECT COUNT(*) as count FROM articles WHERE visibility = 'public'"

  const countParams = tag ? [tag] : []
  const total = (getDb().prepare(isAuth
    ? `SELECT COUNT(*) as count FROM articles`
    : countQuery
  ).get(...(isAuth ? [] : countParams)) as any).count

  const articlesWithTags = articles.map((a: any) => {
    const tags = getDb().prepare(
      'SELECT t.name FROM tags t INNER JOIN article_tags at ON t.id = at.tag_id WHERE at.article_id = ?'
    ).all(a.id) as any[]
    const viewCount = (getDb().prepare(
      'SELECT COUNT(*) as count FROM article_views WHERE article_id = ?'
    ).get(a.id) as any).count
    return { ...a, tags: tags.map((t: any) => t.name), view_count: viewCount }
  })

  return c.json({ articles: articlesWithTags, total, page, limit })
})

articlesRouter.get('/:id', (c) => {
  const id = c.req.param('id')
  const article = getDb().prepare('SELECT * FROM articles WHERE id = ?').get(id) as any

  if (!article) {
    return c.json({ error: 'Article not found' }, 404)
  }

  const isAuth = !!c.req.header('Authorization')
  if (article.visibility === 'private' && !isAuth) {
    return c.json({ error: 'Article not found' }, 404)
  }

  const visitorId = c.req.query('visitor_id')
  if (visitorId) {
    const recent = getDb().prepare(
      "SELECT id FROM article_views WHERE article_id = ? AND visitor_id = ? AND viewed_at > datetime('now', '-30 minutes')"
    ).get(id, visitorId)
    if (!recent) {
      getDb().prepare(
        'INSERT INTO article_views (article_id, visitor_id) VALUES (?, ?)'
      ).run(id, visitorId)
    }
  }

  const tags = getDb().prepare(
    'SELECT t.name FROM tags t INNER JOIN article_tags at ON t.id = at.tag_id WHERE at.article_id = ?'
  ).all(id) as any[]
  article.tags = tags.map((t: any) => t.name)

  const viewCount = (getDb().prepare(
    'SELECT COUNT(*) as count FROM article_views WHERE article_id = ?'
  ).get(id) as any).count
  article.view_count = viewCount

  return c.json(article)
})

articlesRouter.post('/', authMiddleware, (c) => c.req.json().then(({ title, content, visibility, tags }) => {
  if (!title || !content) {
    return c.json({ error: 'Title and content are required' }, 400)
  }
  const result = getDb().prepare(
    'INSERT INTO articles (title, content, visibility) VALUES (?, ?, ?)'
  ).run(title, content, visibility || 'public')

  const articleId = result.lastInsertRowid as number

  if (tags && Array.isArray(tags)) {
    for (const tagName of tags) {
      let tag = getDb().prepare('SELECT id FROM tags WHERE name = ?').get(tagName) as any
      if (!tag) {
        const tagResult = getDb().prepare('INSERT INTO tags (name) VALUES (?)').run(tagName)
        tag = { id: tagResult.lastInsertRowid }
      }
      getDb().prepare('INSERT OR IGNORE INTO article_tags (article_id, tag_id) VALUES (?, ?)').run(articleId, tag.id)
    }
  }

  return c.json({ id: articleId, message: 'Article created' }, 201)
}))

articlesRouter.put('/:id', authMiddleware, (c) => c.req.json().then(({ title, content, visibility, tags }) => {
  const id = c.req.param('id')
  const existing = getDb().prepare('SELECT id FROM articles WHERE id = ?').get(id)
  if (!existing) {
    return c.json({ error: 'Article not found' }, 404)
  }

  getDb().prepare('UPDATE articles SET title = ?, content = ?, visibility = ?, updated_at = datetime(\'now\') WHERE id = ?')
    .run(title, content, visibility, id)

  if (tags && Array.isArray(tags)) {
    getDb().prepare('DELETE FROM article_tags WHERE article_id = ?').run(id)
    for (const tagName of tags) {
      let tag = getDb().prepare('SELECT id FROM tags WHERE name = ?').get(tagName) as any
      if (!tag) {
        const tagResult = getDb().prepare('INSERT INTO tags (name) VALUES (?)').run(tagName)
        tag = { id: tagResult.lastInsertRowid }
      }
      getDb().prepare('INSERT OR IGNORE INTO article_tags (article_id, tag_id) VALUES (?, ?)').run(id, tag.id)
    }
  }

  return c.json({ message: 'Article updated' })
}))

articlesRouter.delete('/:id', authMiddleware, (c) => {
  const id = c.req.param('id')
  getDb().prepare('DELETE FROM articles WHERE id = ?').run(id)
  return c.json({ message: 'Article deleted' })
})

articlesRouter.get('/:id/views', (c) => {
  const id = c.req.param('id')
  const count = (getDb().prepare(
    'SELECT COUNT(*) as count FROM article_views WHERE article_id = ?'
  ).get(id) as any).count
  return c.json({ views: count })
})

export default articlesRouter
