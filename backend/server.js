
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();


const app = express();

// Detailed request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});
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
  origin: 'https://studentforum-uk42.onrender.com', // Allow all origins for development; restrict for production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Global OPTIONS handler for CORS preflight
app.options('*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});
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

// Health check route
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'StudentForum backend is running!' });
});

// Auth and feature routes
const createAuthRouter = (await import('./src/routes/auth.js')).default;
app.use('/api/auth', createAuthRouter());
const createPostsRouter = (await import('./src/routes/posts.js')).default;
app.use('/api/posts', createPostsRouter());
const uploadRouter = (await import('./src/routes/upload.js')).default;
app.use('/api/upload', uploadRouter);
// Settings route for global auto-approve toggle
const settingsRouter = (await import('./src/routes/settings.js')).default;
app.use('/api/settings', settingsRouter);

// Start
// Global error handler to catch all uncaught errors and always return JSON
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ error: 'Internal server error', details: err && err.message ? err.message : err });
});

app.listen(port, () => {
  console.log(`Backend running on port ${port}`);
});

// ARIANAH :>
