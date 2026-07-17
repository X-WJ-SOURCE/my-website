import bcrypt from 'bcryptjs'
import { initDb, getDb } from './db.js'

const username = process.env.ADMIN_USER || 'admin'
const password = process.env.ADMIN_PASS || 'admin123'

const hash = bcrypt.hashSync(password, 10)

await initDb()

const existing = getDb().prepare('SELECT id FROM admin WHERE username = ?').get(username) as any
if (existing) {
  getDb().prepare('UPDATE admin SET password_hash = ? WHERE username = ?').run(hash, username)
  console.log(`Admin user "${username}" updated.`)
} else {
  getDb().prepare('INSERT INTO admin (username, password_hash) VALUES (?, ?)').run(username, hash)
  console.log(`Admin user "${username}" created.`)
}
