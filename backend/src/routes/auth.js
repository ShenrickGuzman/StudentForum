// ...existing code...
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';


const createAuthRouter = (pool) => {
  const router = express.Router();

  // Middleware to require authentication and admin role (scoped here to avoid redeclaration)
  const requireAuth = (req, res, next) => {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  };

  const isAdmin = (req, res, next) => {
    if (req.user?.role === 'admin' || req.user?.role === 'teacher') return next();
    return res.status(403).json({ error: 'Forbidden' });
  };

  // Grant admin role (admin only)
  router.post('/make-admin', requireAuth, isAdmin, async (req, res) => {
    const { name } = req.body || {};
    if (!name) return res.status(400).json({ error: 'Username required' });
    try {
      const result = await pool.query('UPDATE users SET role = $1 WHERE lower(name) = lower($2) RETURNING id, name, role', ['admin', name]);
      if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });
      res.json({ ok: true, user: result.rows[0] });
    } catch (e) {
      res.status(500).json({ error: 'Failed to grant admin role' });
    }
  });

  router.post('/signup', async (req, res) => {
    const { name, password, email } = req.body || {};
    if (!name || !password || !email) {
      return res.status(400).json({ error: 'Username, password and email are required' });
    }
    if (name.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    // Gmail-only validation
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
    if (!gmailRegex.test(email)) {
      return res.status(400).json({ error: 'Only valid @gmail.com addresses are allowed' });
    }
    try {
      const existing = await pool.query('SELECT id FROM users WHERE name = $1 OR lower(email) = lower($2)', [name, email]);
      if (existing.rows.length) {
        return res.status(409).json({ error: 'Username or email already taken' });
      }
      const passwordHash = await bcrypt.hash(password, 10);
      const result = await pool.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, role, email',
        [name, email, passwordHash, 'student']
      );
      const user = result.rows[0];
      const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user });
    } catch (e) {
      if (e?.code === '23505') {
        return res.status(409).json({ error: 'Username or email already taken' });
      }
      res.status(500).json({ error: 'Signup failed' });
    }
  });

  router.post('/login', async (req, res) => {
    const { name, password } = req.body || {};
    if (!name || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    try {
      const result = await pool.query('SELECT id, name, role, password_hash FROM users WHERE name = $1', [name]);
      const user = result.rows[0];
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });
      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
      const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
    } catch (e) {
      res.status(500).json({ error: 'Login failed' });
    }
  });

  return (req, res, next) => router(req, res, next);
};

export default createAuthRouter;


