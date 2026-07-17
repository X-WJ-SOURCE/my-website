import { Hono } from 'hono'
import { v4 as uuid } from 'uuid'
import { getDb } from '../db.js'

const reactionsRouter = new Hono()

const EMOJIS = ['❤️', '😂', '👍', '😮', '😢']

reactionsRouter.get('/article/:articleId', (c) => {
  const articleId = c.req.param('articleId')
  const visitorId = c.req.query('visitor_id') || ''

  const counts = getDb().prepare(`
    SELECT emoji_type, COUNT(*) as count
    FROM reactions WHERE article_id = ?
    GROUP BY emoji_type
  `).all(articleId) as any[]

  let userReactions: string[] = []
  if (visitorId) {
    userReactions = (getDb().prepare(
      'SELECT emoji_type FROM reactions WHERE article_id = ? AND visitor_id = ?'
    ).all(articleId, visitorId) as any[]).map((r: any) => r.emoji_type)
  }

  return c.json({ reactions: counts, user_reactions: userReactions, available_emojis: EMOJIS })
})

reactionsRouter.post('/article/:articleId', async (c) => {
  const articleId = c.req.param('articleId')
  const { emoji_type, visitor_id } = await c.req.json()

  if (!emoji_type || !visitor_id || !EMOJIS.includes(emoji_type)) {
    return c.json({ error: 'Invalid request' }, 400)
  }

  const existing = getDb().prepare(
    'SELECT id FROM reactions WHERE article_id = ? AND emoji_type = ? AND visitor_id = ?'
  ).get(articleId, emoji_type, visitor_id)

  if (existing) {
    getDb().prepare('DELETE FROM reactions WHERE id = ?').run((existing as any).id)
    return c.json({ action: 'removed' })
  } else {
    getDb().prepare(
      'INSERT INTO reactions (article_id, emoji_type, visitor_id) VALUES (?, ?, ?)'
    ).run(articleId, emoji_type, visitor_id)
    return c.json({ action: 'added' })
  }
})

export default reactionsRouter
