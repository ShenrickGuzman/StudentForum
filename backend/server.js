import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import pkg from 'pg';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const { Pool } = pkg;

const app = express();
const port = process.env.PORT || 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));

// Database
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_URL?.includes('render.com') ? { rejectUnauthorized: false } : undefined });

async function ensureSchema() {
  try {
    const schemaPath = path.join(__dirname, 'src', 'db', 'schema.sql');
    const sql = await fs.readFile(schemaPath, 'utf8');
    await pool.query(sql);
    console.log('Database schema ensured');
  } catch (e) {
    console.error('Schema initialization failed', e);
  }
}

// Simple health route
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as now');
    res.json({ ok: true, now: result.rows[0].now });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'Database connection failed' });
  }
});

// Auth and feature routes (to be implemented)
app.use('/api/auth', (await import('./src/routes/auth.js')).default(pool));
app.use('/api/posts', (await import('./src/routes/posts.js')).default(pool));

// Start
ensureSchema().then(() => {
  app.listen(port, () => {
    console.log(`Backend running on port ${port}`);
  });
});


