import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createDb } from '../src/db/database.js';

// We need to mock getDb to use our in-memory database
let db;
vi.mock('../src/db/database.js', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    getDb: () => db,
  };
});

// Import routes after mock
const { default: authRoutes } = await import('../src/routes/auth.js');
const { default: userRoutes } = await import('../src/routes/user.js');
const { default: locationRoutes } = await import('../src/routes/locations.js');

let app;
let token;
let userId;

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret';
  db = createDb(':memory:');

  app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/user', userRoutes);
  app.use('/api/locations', locationRoutes);
});

afterAll(() => {
  db.close();
});

describe('Auth Routes', () => {
  it('POST /api/auth/register - creates a user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'agent@farm.co', password: 'secret123' });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('agent@farm.co');
    token = res.body.token;
    userId = res.body.user.id;
  });

  it('POST /api/auth/register - rejects duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'agent@farm.co', password: 'otherpass' });

    expect(res.status).toBe(409);
  });

  it('POST /api/auth/register - rejects short password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'new@farm.co', password: '123' });

    expect(res.status).toBe(400);
  });

  it('POST /api/auth/login - authenticates user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'agent@farm.co', password: 'secret123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.tempUnit).toBe('celsius');
  });

  it('POST /api/auth/login - rejects wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'agent@farm.co', password: 'wrongpass' });

    expect(res.status).toBe(401);
  });
});

describe('Location Routes', () => {
  let locationId;

  it('POST /api/locations - saves a location', async () => {
    const res = await request(app)
      .post('/api/locations')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Zurich', lat: 47.3769, lon: 8.5417, country: 'Switzerland' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Zurich');
    locationId = res.body.id;
  });

  it('POST /api/locations - prevents duplicate coordinates', async () => {
    const res = await request(app)
      .post('/api/locations')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Zurich Again', lat: 47.3769, lon: 8.5417 });

    expect(res.status).toBe(409);
  });

  it('GET /api/locations - lists saved locations', async () => {
    const res = await request(app)
      .get('/api/locations')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('DELETE /api/locations/:id - removes a location', async () => {
    const res = await request(app)
      .delete(`/api/locations/${locationId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it('GET /api/locations - empty after deletion', async () => {
    const res = await request(app)
      .get('/api/locations')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body).toHaveLength(0);
  });
});

describe('User Preferences', () => {
  it('GET /api/user/preferences - returns defaults', async () => {
    const res = await request(app)
      .get('/api/user/preferences')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.tempUnit).toBe('celsius');
    expect(res.body.theme).toBe('light');
    expect(res.body.defaultLocationId).toBeNull();
  });

  it('PUT /api/user/preferences - updates temp unit', async () => {
    const res = await request(app)
      .put('/api/user/preferences')
      .set('Authorization', `Bearer ${token}`)
      .send({ tempUnit: 'fahrenheit' });

    expect(res.status).toBe(200);
    expect(res.body.tempUnit).toBe('fahrenheit');
  });

  it('PUT /api/user/preferences - updates theme', async () => {
    const res = await request(app)
      .put('/api/user/preferences')
      .set('Authorization', `Bearer ${token}`)
      .send({ theme: 'dark' });

    expect(res.status).toBe(200);
    expect(res.body.theme).toBe('dark');
  });

  it('PUT /api/user/preferences - rejects invalid unit', async () => {
    const res = await request(app)
      .put('/api/user/preferences')
      .set('Authorization', `Bearer ${token}`)
      .send({ tempUnit: 'kelvin' });

    expect(res.status).toBe(400);
  });

  it('PUT /api/user/preferences - rejects invalid theme', async () => {
    const res = await request(app)
      .put('/api/user/preferences')
      .set('Authorization', `Bearer ${token}`)
      .send({ theme: 'neon' });

    expect(res.status).toBe(400);
  });

  it('PUT /api/user/preferences - sets default location', async () => {
    // First save a location
    const locRes = await request(app)
      .post('/api/locations')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Geneva', lat: 46.2044, lon: 6.1432, country: 'Switzerland' });

    const res = await request(app)
      .put('/api/user/preferences')
      .set('Authorization', `Bearer ${token}`)
      .send({ defaultLocationId: locRes.body.id });

    expect(res.status).toBe(200);
    expect(res.body.defaultLocationId).toBe(locRes.body.id);
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/user/preferences');
    expect(res.status).toBe(401);
  });
});

describe('Delete Account', () => {
  let deleteToken;

  it('DELETE /api/user/account - deletes user and associated data', async () => {
    // Register a fresh user
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({ email: 'todelete@farm.co', password: 'deleteMe123' });

    expect(regRes.status).toBe(201);
    deleteToken = regRes.body.token;

    // Save a location for this user
    const locRes = await request(app)
      .post('/api/locations')
      .set('Authorization', `Bearer ${deleteToken}`)
      .send({ name: 'Bern', lat: 46.9480, lon: 7.4474, country: 'Switzerland' });

    expect(locRes.status).toBe(201);

    // Delete the account
    const res = await request(app)
      .delete('/api/user/account')
      .set('Authorization', `Bearer ${deleteToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Account deleted');
  });

  it('deleted user can no longer fetch preferences', async () => {
    const res = await request(app)
      .get('/api/user/preferences')
      .set('Authorization', `Bearer ${deleteToken}`);

    expect(res.status).toBe(404);
  });

  it('deleted user can no longer fetch locations', async () => {
    const res = await request(app)
      .get('/api/locations')
      .set('Authorization', `Bearer ${deleteToken}`);

    expect(res.body).toHaveLength(0);
  });

  it('requires authentication', async () => {
    const res = await request(app).delete('/api/user/account');
    expect(res.status).toBe(401);
  });
});

// ─── Corner‑case / adversarial tests ───────────────────────────────

describe('Auth – Corner Cases', () => {
  it('register with empty body returns 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({});
    expect(res.status).toBe(400);
  });

  it('register with missing password returns 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'only-email@test.co' });
    expect(res.status).toBe(400);
  });

  it('register with missing email returns 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ password: 'validpassword' });
    expect(res.status).toBe(400);
  });

  it('register with exactly 6 char password succeeds', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'edge6@test.co', password: '123456' });
    expect(res.status).toBe(201);
  });

  it('register with 5 char password fails', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'edge5@test.co', password: '12345' });
    expect(res.status).toBe(400);
  });

  it('login to non-existent email returns 401 (not 404 — no user enumeration)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ghost@nowhere.co', password: 'anything' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid email or password');
  });

  it('login with empty body returns 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});
    expect(res.status).toBe(400);
  });
});

describe('Auth Middleware – Corner Cases', () => {
  it('rejects garbage token', async () => {
    const res = await request(app)
      .get('/api/user/preferences')
      .set('Authorization', 'Bearer not.a.real.jwt');
    expect(res.status).toBe(401);
  });

  it('rejects token signed with wrong secret', async () => {
    const jwt = await import('jsonwebtoken');
    const badToken = jwt.default.sign({ userId: 1 }, 'wrong-secret', { expiresIn: '1h' });
    const res = await request(app)
      .get('/api/user/preferences')
      .set('Authorization', `Bearer ${badToken}`);
    expect(res.status).toBe(401);
  });

  it('rejects completely empty Authorization header', async () => {
    const res = await request(app)
      .get('/api/user/preferences')
      .set('Authorization', '');
    expect(res.status).toBe(401);
  });

  it('rejects "Basic" scheme instead of "Bearer"', async () => {
    const res = await request(app)
      .get('/api/user/preferences')
      .set('Authorization', 'Basic dXNlcjpwYXNz');
    expect(res.status).toBe(401);
  });

  it('valid token for deleted user gets 404 on preferences', async () => {
    // Register, get token, delete, then try
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ email: 'zombie@test.co', password: 'brains123' });
    const zombieToken = reg.body.token;

    await request(app)
      .delete('/api/user/account')
      .set('Authorization', `Bearer ${zombieToken}`);

    const res = await request(app)
      .get('/api/user/preferences')
      .set('Authorization', `Bearer ${zombieToken}`);
    expect(res.status).toBe(404);
  });
});

describe('Locations – Corner Cases', () => {
  let userToken;

  beforeAll(async () => {
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ email: 'loctest@test.co', password: 'loctest123' });
    userToken = reg.body.token;
  });

  it('rejects location with missing name', async () => {
    const res = await request(app)
      .post('/api/locations')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ lat: 0, lon: 0 });
    expect(res.status).toBe(400);
  });

  it('rejects location with missing lat', async () => {
    const res = await request(app)
      .post('/api/locations')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Nowhere', lon: 0 });
    expect(res.status).toBe(400);
  });

  it('rejects location with missing lon', async () => {
    const res = await request(app)
      .post('/api/locations')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Nowhere', lat: 0 });
    expect(res.status).toBe(400);
  });

  it('accepts lat=0, lon=0 (Null Island is valid coords)', async () => {
    const res = await request(app)
      .post('/api/locations')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Null Island', lat: 0, lon: 0 });
    expect(res.status).toBe(201);
    expect(res.body.lat).toBe(0);
    expect(res.body.lon).toBe(0);
  });

  it('cannot delete another user\'s location (IDOR)', async () => {
    // Create a second user with a location
    const reg2 = await request(app)
      .post('/api/auth/register')
      .send({ email: 'victim@test.co', password: 'victim123' });
    const victimToken = reg2.body.token;

    const loc = await request(app)
      .post('/api/locations')
      .set('Authorization', `Bearer ${victimToken}`)
      .send({ name: 'Secret Base', lat: 10, lon: 20 });

    // Attacker tries to delete victim's location
    const res = await request(app)
      .delete(`/api/locations/${loc.body.id}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(404);

    // Confirm it's still there for the victim
    const check = await request(app)
      .get('/api/locations')
      .set('Authorization', `Bearer ${victimToken}`);
    expect(check.body).toHaveLength(1);
  });

  it('deleting a location that is the default clears the default', async () => {
    const loc = await request(app)
      .post('/api/locations')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'TempDefault', lat: 55, lon: 66 });

    await request(app)
      .put('/api/user/preferences')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ defaultLocationId: loc.body.id });

    await request(app)
      .delete(`/api/locations/${loc.body.id}`)
      .set('Authorization', `Bearer ${userToken}`);

    const prefs = await request(app)
      .get('/api/user/preferences')
      .set('Authorization', `Bearer ${userToken}`);
    expect(prefs.body.defaultLocationId).toBeNull();
  });

  it('delete non-existent location returns 404', async () => {
    const res = await request(app)
      .delete('/api/locations/999999')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(404);
  });
});

describe('Preferences – Corner Cases', () => {
  let userToken;

  beforeAll(async () => {
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ email: 'prefedge@test.co', password: 'prefedge123' });
    userToken = reg.body.token;
  });

  it('PUT with empty body is a no-op, not a crash', async () => {
    const res = await request(app)
      .put('/api/user/preferences')
      .set('Authorization', `Bearer ${userToken}`)
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.tempUnit).toBe('celsius');
  });

  it('setting default to non-existent location ID returns 400', async () => {
    const res = await request(app)
      .put('/api/user/preferences')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ defaultLocationId: 999999 });
    expect(res.status).toBe(400);
  });

  it('setting default to another user\'s location is rejected (IDOR)', async () => {
    // Create another user with a location
    const reg2 = await request(app)
      .post('/api/auth/register')
      .send({ email: 'prefvictim@test.co', password: 'prefvictim123' });
    const otherLoc = await request(app)
      .post('/api/locations')
      .set('Authorization', `Bearer ${reg2.body.token}`)
      .send({ name: 'Stolen', lat: 33, lon: 44 });

    const res = await request(app)
      .put('/api/user/preferences')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ defaultLocationId: otherLoc.body.id });
    expect(res.status).toBe(400);
  });

  it('clearing default with null succeeds', async () => {
    const res = await request(app)
      .put('/api/user/preferences')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ defaultLocationId: null });
    expect(res.status).toBe(200);
    expect(res.body.defaultLocationId).toBeNull();
  });

  it('unknown preference fields are silently ignored', async () => {
    const res = await request(app)
      .put('/api/user/preferences')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ tempUnit: 'fahrenheit', hackerField: 'evil' });
    expect(res.status).toBe(200);
    expect(res.body.tempUnit).toBe('fahrenheit');
    expect(res.body.hackerField).toBeUndefined();
  });
});

describe('Delete Account – Corner Cases', () => {
  it('deleting account with default location set succeeds cleanly', async () => {
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ email: 'defaultdel@test.co', password: 'default123' });
    const t = reg.body.token;

    const loc = await request(app)
      .post('/api/locations')
      .set('Authorization', `Bearer ${t}`)
      .send({ name: 'MyDefault', lat: 11, lon: 22 });

    await request(app)
      .put('/api/user/preferences')
      .set('Authorization', `Bearer ${t}`)
      .send({ defaultLocationId: loc.body.id });

    const del = await request(app)
      .delete('/api/user/account')
      .set('Authorization', `Bearer ${t}`);
    expect(del.status).toBe(200);
  });

  it('deleting account twice with same token returns 404 on second call', async () => {
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ email: 'doubledel@test.co', password: 'double123' });
    const t = reg.body.token;

    const first = await request(app)
      .delete('/api/user/account')
      .set('Authorization', `Bearer ${t}`);
    expect(first.status).toBe(200);

    const second = await request(app)
      .delete('/api/user/account')
      .set('Authorization', `Bearer ${t}`);
    expect(second.status).toBe(404);
  });

  it('re-registering with same email after deletion works', async () => {
    const email = 'phoenix@test.co';
    const reg1 = await request(app)
      .post('/api/auth/register')
      .send({ email, password: 'phoenix123' });

    await request(app)
      .delete('/api/user/account')
      .set('Authorization', `Bearer ${reg1.body.token}`);

    const reg2 = await request(app)
      .post('/api/auth/register')
      .send({ email, password: 'phoenix456' });
    expect(reg2.status).toBe(201);
    expect(reg2.body.user.email).toBe(email);
    // New user should have a different ID
    expect(reg2.body.user.id).not.toBe(reg1.body.user.id);
  });
});
