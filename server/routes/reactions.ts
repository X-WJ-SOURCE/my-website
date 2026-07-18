import { Hono } from 'hono'
import { db } from '../db.js'

const reactionsRouter = new Hono()

const EMOJIS = ['❤️', '😂', '👍', '😮', '😢']

reactionsRouter.get('/article/:articleId', async (c) => {
  const articleId = c.req.param('articleId')
  const visitorId = c.req.query('visitor_id') || ''

  const counts = (await db().execute({
    sql: `SELECT emoji_type, COUNT(*) as count
          FROM reactions WHERE article_id = ?
          GROUP BY emoji_type`,
    args: [articleId]
  })).rows

  let userReactions: string[] = []
  if (visitorId) {
    userReactions = ((await db().execute({
      sql: 'SELECT emoji_type FROM reactions WHERE article_id = ? AND visitor_id = ?',
      args: [articleId, visitorId]
    })).rows as any[]).map((r: any) => r.emoji_type)
  }

  return c.json({ reactions: counts, user_reactions: userReactions, available_emojis: EMOJIS })
})

reactionsRouter.post('/article/:articleId', async (c) => {
  const articleId = c.req.param('articleId')
  const { emoji_type, visitor_id } = await c.req.json()

  if (!emoji_type || !visitor_id || !EMOJIS.includes(emoji_type)) {
    return c.json({ error: 'Invalid request' }, 400)
  }

  const existing = (await db().execute({
    sql: 'SELECT id FROM reactions WHERE article_id = ? AND emoji_type = ? AND visitor_id = ?',
    args: [articleId, emoji_type, visitor_id]
  })).rows[0] as any

  if (existing) {
    await db().execute({ sql: 'DELETE FROM reactions WHERE id = ?', args: [existing.id] })
    return c.json({ action: 'removed' })
  } else {
    await db().execute({
      sql: 'INSERT INTO reactions (article_id, emoji_type, visitor_id) VALUES (?, ?, ?)',
      args: [articleId, emoji_type, visitor_id]
    })
    return c.json({ action: 'added' })
  }
})

export default reactionsRouter
