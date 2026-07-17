import jwt from 'jsonwebtoken'
import type { Context, Next } from 'hono'

const JWT_SECRET = process.env.JWT_SECRET || 'my-website-secret-key-change-in-production'

export function signToken(username: string): string {
  return jwt.sign({ username }, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): { username: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { username: string }
  } catch {
    return null
  }
}

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  const token = authHeader.slice(7)
  const payload = verifyToken(token)
  if (!payload) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  c.set('username', payload.username)
  await next()
}
