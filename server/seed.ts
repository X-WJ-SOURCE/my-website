import bcrypt from 'bcryptjs'
import { initDb, db } from './db.js'

const username = process.env.ADMIN_USER || 'admin'
const password = process.env.ADMIN_PASS || 'admin123'

async function seed() {
  await initDb()
  const hash = bcrypt.hashSync(password, 10)

  const existing = (await db().execute({ sql: 'SELECT id FROM admin WHERE username = ?', args: [username] })).rows[0]
  if (existing) {
    await db().execute({ sql: 'UPDATE admin SET password_hash = ? WHERE username = ?', args: [hash, username] })
    console.log(`Admin user "${username}" updated.`)
  } else {
    await db().execute({ sql: 'INSERT INTO admin (username, password_hash) VALUES (?, ?)', args: [username, hash] })
    console.log(`Admin user "${username}" created.`)
  }
}

seed().catch(err => { console.error(err); process.exit(1) })
