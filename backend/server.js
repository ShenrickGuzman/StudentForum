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
app.use(cors({
  origin: '*', // Allow all origins for development; restrict for production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
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
const authRouter = (await import('./src/routes/auth.js')).default;
app.use('/api/auth', authRouter);
const postsRouter = (await import('./src/routes/posts.js')).default;
app.use('/api/posts', postsRouter);
const uploadRouter = (await import('./src/routes/upload.js')).default;
app.use('/api/upload', uploadRouter);

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
