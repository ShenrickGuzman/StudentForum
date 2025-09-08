import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const createAuthRouter = (pool) => {
  const router = express.Router();

  router.post('/signup', async (req, res) => {
    const { name, password } = req.body || {};
    if (!name || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    if (name.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    try {
      const existing = await pool.query('SELECT id FROM users WHERE name = $1', [name]);
      if (existing.rows.length) {
        return res.status(409).json({ error: 'Username already taken' });
      }
      const passwordHash = await bcrypt.hash(password, 10);
      const result = await pool.query(
        'INSERT INTO users (name, password_hash, role) VALUES ($1, $2, $3) RETURNING id, name, role',
        [name, passwordHash, 'student']
      );
      const user = result.rows[0];
      const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user });
    } catch (e) {
      if (e?.code === '23505') {
        return res.status(409).json({ error: 'Username already taken' });
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


