import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createDb } from '../src/db/database.js';
import bcrypt from 'bcryptjs';

let db;

beforeAll(() => {
  db = createDb(':memory:');
});

afterAll(() => {
  db.close();
});

describe('Database', () => {
  it('should create tables', () => {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    const names = tables.map((t) => t.name);
    expect(names).toContain('users');
    expect(names).toContain('saved_locations');
  });

  it('should insert and retrieve a user', () => {
    const hash = bcrypt.hashSync('testpass', 10);
    db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)').run('test@example.com', hash);
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get('test@example.com');

    expect(user).toBeDefined();
    expect(user.email).toBe('test@example.com');
    const prefs = JSON.parse(user.preferences);
    expect(prefs.tempUnit).toBe('celsius');
    expect(prefs.theme).toBe('light');
    expect(bcrypt.compareSync('testpass', user.password_hash)).toBe(true);
  });

  it('should enforce unique email', () => {
    const hash = bcrypt.hashSync('pass', 10);
    expect(() => {
      db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)').run('test@example.com', hash);
    }).toThrow();
  });

  it('should insert and retrieve saved locations', () => {
    const user = db.prepare('SELECT id FROM users WHERE email = ?').get('test@example.com');
    db.prepare('INSERT INTO saved_locations (user_id, name, lat, lon, country) VALUES (?, ?, ?, ?, ?)')
      .run(user.id, 'Lausanne', 46.5197, 6.6323, 'Switzerland');

    const locations = db.prepare('SELECT * FROM saved_locations WHERE user_id = ?').all(user.id);
    expect(locations).toHaveLength(1);
    expect(locations[0].name).toBe('Lausanne');
  });

  it('should cascade delete locations when user is deleted', () => {
    const user = db.prepare('SELECT id FROM users WHERE email = ?').get('test@example.com');
    db.prepare('DELETE FROM users WHERE id = ?').run(user.id);
    const locations = db.prepare('SELECT * FROM saved_locations WHERE user_id = ?').all(user.id);
    expect(locations).toHaveLength(0);
  });
});
