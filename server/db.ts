import { createClient, type Client } from '@libsql/client'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function getClient(): Client {
  const url = process.env.TURSO_URL
  const token = process.env.TURSO_TOKEN

  if (url && token) {
    return createClient({ url, authToken: token })
  }

  const dataDir = process.env.DATA_DIR || path.join(__dirname, '..')
  const dbPath = path.join(dataDir, 'local.db')
  return createClient({ url: `file:${dbPath}` })
}

let _client: Client | null = null

export function db(): Client {
  if (!_client) _client = getClient()
  return _client
}

export async function initDb() {
  const c = db()
  await c.executeMultiple(`BEGIN;
    CREATE TABLE IF NOT EXISTS admin (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      visibility TEXT NOT NULL DEFAULT 'public' CHECK(visibility IN ('public', 'private')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  COMMIT;`)
  try { await c.execute('ALTER TABLE articles ADD COLUMN cover_url TEXT') } catch (_) {}
  try { await c.execute('ALTER TABLE articles ADD COLUMN decor_images TEXT') } catch (_) {}
  try { await c.execute('ALTER TABLE comments ADD COLUMN visitor_id TEXT') } catch (_) {}
  try { await c.execute('ALTER TABLE comments ADD COLUMN edited_at TEXT') } catch (_) {}
  try { await c.execute('ALTER TABLE guestbook ADD COLUMN visitor_id TEXT') } catch (_) {}
  try { await c.execute('ALTER TABLE guestbook ADD COLUMN edited_at TEXT') } catch (_) {}
  try { await c.execute('ALTER TABLE wall_posts ADD COLUMN visitor_id TEXT') } catch (_) {}
  try { await c.execute('ALTER TABLE wall_posts ADD COLUMN edited_at TEXT') } catch (_) {}
  try { await c.execute('ALTER TABLE comments ADD COLUMN images TEXT') } catch (_) {}
  await c.executeMultiple(`BEGIN;
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );
    CREATE TABLE IF NOT EXISTS article_tags (
      article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
      tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (article_id, tag_id)
    );
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
      nickname TEXT DEFAULT 'Anonymous',
      content TEXT NOT NULL,
      image_url TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS guestbook (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nickname TEXT DEFAULT 'Anonymous',
      content TEXT NOT NULL,
      image_url TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS private_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      thread_id TEXT NOT NULL,
      nickname TEXT DEFAULT 'Anonymous',
      content TEXT NOT NULL,
      image_url TEXT,
      is_admin INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_messages_thread ON private_messages(thread_id);
    CREATE TABLE IF NOT EXISTS wall_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nickname TEXT DEFAULT 'Anonymous',
      content TEXT,
      image_url TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS reactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
      emoji_type TEXT NOT NULL,
      visitor_id TEXT NOT NULL,
      UNIQUE(article_id, emoji_type, visitor_id)
    );
    CREATE TABLE IF NOT EXISTS article_views (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
      visitor_id TEXT NOT NULL,
      viewed_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS uploads (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      data BLOB NOT NULL
    );
  COMMIT;`)
}
