import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getDb } from '../db/database.js';

const router = Router();
router.use(authenticate);

// Get current user preferences
router.get('/preferences', (req, res) => {
  const db = getDb();
  const user = db.prepare(`
    SELECT u.id, u.email, u.preferences, u.default_location_id AS defaultLocationId,
           sl.name AS defaultLocationName, sl.lat AS defaultLocationLat, sl.lon AS defaultLocationLon
    FROM users u
    LEFT JOIN saved_locations sl ON u.default_location_id = sl.id
    WHERE u.id = ?
  `).get(req.userId);

  if (!user) return res.status(404).json({ error: 'User not found' });

  const prefs = JSON.parse(user.preferences || '{}');
  res.json({
    id: user.id,
    email: user.email,
    tempUnit: prefs.tempUnit || 'celsius',
    theme: prefs.theme || 'light',
    defaultLocationId: user.defaultLocationId,
    defaultLocationName: user.defaultLocationName,
    defaultLocationLat: user.defaultLocationLat,
    defaultLocationLon: user.defaultLocationLon,
  });
});

// Update preferences (temp unit, theme, and/or default location)
router.put('/preferences', (req, res) => {
  const { tempUnit, theme, defaultLocationId } = req.body;
  const db = getDb();

  // Load existing preferences
  const current = db.prepare('SELECT preferences FROM users WHERE id = ?').get(req.userId);
  const prefs = JSON.parse(current?.preferences || '{}');

  if (tempUnit !== undefined) {
    if (!['celsius', 'fahrenheit'].includes(tempUnit)) {
      return res.status(400).json({ error: 'tempUnit must be celsius or fahrenheit' });
    }
    prefs.tempUnit = tempUnit;
  }

  if (theme !== undefined) {
    if (!['light', 'dark'].includes(theme)) {
      return res.status(400).json({ error: 'theme must be light or dark' });
    }
    prefs.theme = theme;
  }

  // Write updated preferences JSON
  db.prepare('UPDATE users SET preferences = ? WHERE id = ?').run(JSON.stringify(prefs), req.userId);

  if (defaultLocationId !== undefined) {
    // Allow null to clear default
    if (defaultLocationId !== null) {
      const loc = db.prepare('SELECT id FROM saved_locations WHERE id = ? AND user_id = ?').get(defaultLocationId, req.userId);
      if (!loc) return res.status(400).json({ error: 'Location not found in your saved locations' });
    }
    db.prepare('UPDATE users SET default_location_id = ? WHERE id = ?').run(defaultLocationId, req.userId);
  }

  const updated = db.prepare('SELECT id, email, preferences, default_location_id AS defaultLocationId FROM users WHERE id = ?').get(req.userId);
  const updatedPrefs = JSON.parse(updated.preferences || '{}');
  res.json({
    id: updated.id,
    email: updated.email,
    tempUnit: updatedPrefs.tempUnit || 'celsius',
    theme: updatedPrefs.theme || 'light',
    defaultLocationId: updated.defaultLocationId,
  });
});

// Delete account
router.delete('/account', (req, res) => {
  const db = getDb();

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  // Clear default_location_id first to avoid FK constraint issues
  db.prepare('UPDATE users SET default_location_id = NULL WHERE id = ?').run(req.userId);
  db.prepare('DELETE FROM saved_locations WHERE user_id = ?').run(req.userId);
  db.prepare('DELETE FROM users WHERE id = ?').run(req.userId);

  res.json({ message: 'Account deleted' });
});

export default router;
