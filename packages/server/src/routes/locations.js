import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getDb } from '../db/database.js';

const router = Router();
router.use(authenticate);

// List saved locations
router.get('/', (req, res) => {
  const db = getDb();
  const locations = db.prepare('SELECT * FROM saved_locations WHERE user_id = ? ORDER BY created_at DESC').all(req.userId);
  res.json(locations);
});

// Save a new location
router.post('/', (req, res) => {
  const { name, lat, lon, country, state } = req.body;

  if (!name || lat == null || lon == null) {
    return res.status(400).json({ error: 'name, lat, and lon are required' });
  }

  const db = getDb();

  // Prevent duplicates (same user + roughly same coordinates)
  const existing = db.prepare(
    'SELECT id FROM saved_locations WHERE user_id = ? AND ABS(lat - ?) < 0.001 AND ABS(lon - ?) < 0.001'
  ).get(req.userId, lat, lon);
  if (existing) {
    return res.status(409).json({ error: 'Location already saved' });
  }

  const result = db.prepare(
    'INSERT INTO saved_locations (user_id, name, lat, lon, country, state) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(req.userId, name, lat, lon, country || null, state || null);

  const location = db.prepare('SELECT * FROM saved_locations WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(location);
});

// Delete a saved location
router.delete('/:id', (req, res) => {
  const db = getDb();
  const location = db.prepare('SELECT * FROM saved_locations WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);

  if (!location) {
    return res.status(404).json({ error: 'Location not found' });
  }

  // If this was the default location, clear it
  db.prepare('UPDATE users SET default_location_id = NULL WHERE id = ? AND default_location_id = ?').run(req.userId, location.id);
  db.prepare('DELETE FROM saved_locations WHERE id = ?').run(location.id);

  res.json({ message: 'Location removed' });
});

export default router;
