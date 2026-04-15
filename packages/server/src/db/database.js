import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createDb(dbPath) {
  let resolvedPath = dbPath || process.env.DB_PATH || './data/agriwatch.db';
  // Resolve relative paths against the server package root, not CWD
  if (resolvedPath !== ':memory:' && !path.isAbsolute(resolvedPath)) {
    resolvedPath = path.resolve(__dirname, '..', '..', resolvedPath);
  }
  const dir = path.dirname(resolvedPath);
  if (resolvedPath !== ':memory:' && !fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(resolvedPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      preferences TEXT NOT NULL DEFAULT '{"tempUnit":"celsius","theme":"light"}',
      default_location_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (default_location_id) REFERENCES saved_locations(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS saved_locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      lat REAL NOT NULL,
      lon REAL NOT NULL,
      country TEXT,
      state TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  return db;
}

// Singleton for the app
let _db;
export function getDb() {
  if (!_db) {
    _db = createDb();
  }
  return _db;
}

export function closeDb() {
  if (_db) {
    _db.close();
    _db = null;
  }
}
