import { Hono } from 'hono'
import bcrypt from 'bcryptjs'
import { getDb } from '../db.js'
import { signToken, authMiddleware } from '../auth.js'

const authRouter = new Hono()

authRouter.post('/login', async (c) => {
  const { username, password } = await c.req.json()
  if (!username || !password) {
    return c.json({ error: 'Username and password are required' }, 400)
  }

  const admin = getDb().prepare('SELECT * FROM admin WHERE username = ?').get(username) as any
  if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  const token = signToken(username)
  return c.json({ token })
})

authRouter.post('/change-password', authMiddleware, async (c) => {
  const { currentPassword, newPassword } = await c.req.json()
  if (!currentPassword || !newPassword) {
    return c.json({ error: 'Current password and new password are required' }, 400)
  }
  if (newPassword.length < 6) {
    return c.json({ error: 'New password must be at least 6 characters' }, 400)
  }

  const admin = getDb().prepare('SELECT * FROM admin WHERE username = ?').get(c.get('username')) as any
  if (!admin || !bcrypt.compareSync(currentPassword, admin.password_hash)) {
    return c.json({ error: 'Current password is incorrect' }, 401)
  }

  const hash = bcrypt.hashSync(newPassword, 10)
  getDb().prepare('UPDATE admin SET password_hash = ? WHERE username = ?').run(hash, c.get('username'))
  return c.json({ message: 'Password changed successfully' })
})

export default authRouter
