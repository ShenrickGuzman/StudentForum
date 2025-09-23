import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();


const app = express();
const port = process.env.PORT || 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
    },
  },
}));
const allowedOrigins = [
  'https://studentforum.onrender.com',
  'https://studentforum-uk42.onrender.com',
  'https://studentforum-backend.onrender.com',
];
app.use(cors({
  origin: function(origin, callback) {
    // allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));



// Remove PostgreSQL pool and schema logic
// Remove health route that checks PostgreSQL


// Ensure uploads directory exists
const uploadsPath = path.join(process.cwd(), 'uploads');
try {
  await fs.access(uploadsPath);
} catch {
  await fs.mkdir(uploadsPath, { recursive: true });
  console.log('Created uploads directory');
}

// Handle OPTIONS requests for CORS preflight
app.options('/uploads/*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.sendStatus(200);
});

// Serve static files with CORS headers
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(uploadsPath));

// Auth and feature routes
const authModule = await import('./src/routes/auth.js');
app.use('/api/auth', authModule.default());
import createPostsRouter from './src/routes/posts.js';
app.use('/api/posts', createPostsRouter());
const uploadModule = await import('./src/routes/upload.js');
app.use('/api/upload', uploadModule.default());

// Start
// Global error handler to catch all uncaught errors and always return JSON
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ error: 'Internal server error', details: err && err.message ? err.message : err });
});

app.listen(port, () => {
  console.log(`Backend running on port ${port}`);
});

// ARIANAH
