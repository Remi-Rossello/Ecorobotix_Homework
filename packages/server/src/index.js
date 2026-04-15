import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import locationRoutes from './routes/locations.js';
import weatherRoutes from './routes/weather.js';
import { getDb, closeDb } from './db/database.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

// Initialize DB on startup
getDb();

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/weather', weatherRoutes);

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

const server = app.listen(PORT, () => {
  console.log(`AgriWatch API running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  closeDb();
  server.close();
});

export { app };
