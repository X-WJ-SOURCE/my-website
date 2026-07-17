import initSqlJs, { type Database as SqlJsDatabase } from 'sql.js'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = process.env.DATA_DIR || path.join(__dirname, '..')
const dbPath = path.join(dataDir, 'data.db')

let _db: SqlJsDatabase | null = null

function lastInsertRowId(): number {
  const result = _db!.exec('SELECT last_insert_rowid() as id')
  return result[0].values[0][0] as number
}

function changes(): number {
  return _db!.getRowsModified()
}

class Statement {
  private stmt: any
  private bound: boolean = false

  constructor(private db: SqlJsDatabase, private sql: string) {
    this.stmt = db.prepare(sql)
  }

  run(...params: any[]) {
    if (params.length > 0) this.stmt.bind(params)
    this.bound = true
    while (this.stmt.step()) {}
    const result = { lastInsertRowid: lastInsertRowId(), changes: changes() }
    this.stmt.free()
    saveDb()
    return result
  }

  get(...params: any[]): any {
    if (params.length > 0) this.stmt.bind(params)
    this.bound = true
    let row: any = null
    if (this.stmt.step()) {
      const cols = this.stmt.getColumnNames()
      const vals = this.stmt.get()
      row = {}
      cols.forEach((c: string, i: number) => { row[c] = vals[i] })
    }
    this.stmt.free()
    return row
  }

  all(...params: any[]): any[] {
    if (params.length > 0) this.stmt.bind(params)
    this.bound = true
    const rows: any[] = []
    while (this.stmt.step()) {
      const cols = this.stmt.getColumnNames()
      const vals = this.stmt.get()
      const row: any = {}
      cols.forEach((c: string, i: number) => { row[c] = vals[i] })
      rows.push(row)
    }
    this.stmt.free()
    return rows
  }
}

class Database {
  private db: SqlJsDatabase

  constructor(db: SqlJsDatabase) {
    this.db = db
  }

  prepare(sql: string): Statement {
    return new Statement(this.db, sql)
  }

  exec(sql: string) {
    this.db.run(sql)
  }

  pragma(_pragma: string) {}

  exportDb(): Uint8Array {
    return this.db.export()
  }
}

let dbInstance: Database | null = null

async function initDb(): Promise<Database> {
  if (dbInstance) return dbInstance

  const SQL = await initSqlJs()

  let sqlDb: SqlJsDatabase
  if (existsSync(dbPath)) {
    const buffer = readFileSync(dbPath)
    sqlDb = new SQL.Database(buffer)
  } else {
    sqlDb = new SQL.Database()
  }

  _db = sqlDb
  dbInstance = new Database(sqlDb)

  dbInstance.pragma('journal_mode = WAL')
  dbInstance.pragma('foreign_keys = ON')

  dbInstance.exec(`
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
  `)

  saveDb()
  return dbInstance
}

function saveDb() {
  if (_db) {
    writeFileSync(dbPath, Buffer.from(_db.export()))
  }
}

function getDb(): Database {
  if (!dbInstance) throw new Error('Database not initialized. Call initDb() first.')
  return dbInstance
}

export { initDb, getDb, saveDb, type Database }
