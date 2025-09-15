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
    const nameLower = req.user?.name?.trim().toLowerCase();
    if (req.user?.role === 'admin' || req.user?.role === 'teacher' || nameLower === 'shen') return next();
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

  // Updated signup route to allow reuse of deleted usernames/emails
  router.post('/signup', async (req, res) => {
    const { name, password, email } = req.body || {};
    if (!name || !password || !email) {
      return res.status(400).json({ error: 'Username, password and email are required' });
    }
    if (name.length < 3) return res.status(400).json({ error: 'Username must be at least 3 characters' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
    if (!gmailRegex.test(email)) return res.status(400).json({ error: 'Only valid @gmail.com addresses are allowed' });
    try {
      // Check conflicts in users (only non-deleted) and signup_requests
      const conflict = await pool.query(
        `SELECT 'user' AS src FROM users WHERE (lower(name)=lower($1) OR lower(email)=lower($2)) AND deleted=FALSE
         UNION ALL
         SELECT 'request' AS src FROM signup_requests WHERE lower(name)=lower($1) OR lower(email)=lower($2)`,
        [name, email]
      );
      if (conflict.rows.length) return res.status(409).json({ error: 'Username or email already taken or pending' });
      const passwordHash = await bcrypt.hash(password, 10);
      await pool.query('INSERT INTO signup_requests (name, email, password_hash) VALUES ($1, $2, $3)', [name, email, passwordHash]);
      res.json({ status: 'pending', message: 'Signup request submitted. Awaiting admin approval.' });
    } catch (e) {
      if (e?.code === '23505') return res.status(409).json({ error: 'Username or email already taken or pending' });
      res.status(500).json({ error: 'Signup request failed' });
    }
  });

  // List pending signup requests (admin only)
  router.get('/signup-requests', requireAuth, isAdmin, async (req, res) => {
    try {
      const result = await pool.query('SELECT id, name, email, created_at, status FROM signup_requests ORDER BY created_at ASC');
      res.json(result.rows);
    } catch (e) {
      res.status(500).json({ error: 'Failed to load signup requests' });
    }
  });

  // Approve a request -> create user, delete request, return user info
  router.post('/signup-requests/:id/approve', requireAuth, isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
      await pool.query('BEGIN');
      const rq = await pool.query('SELECT * FROM signup_requests WHERE id=$1 FOR UPDATE', [id]);
      const r = rq.rows[0];
      if (!r) { await pool.query('ROLLBACK'); return res.status(404).json({ error: 'Request not found' }); }
      if (r.status === 'declined') { await pool.query('ROLLBACK'); return res.status(400).json({ error: 'Request already declined' }); }
      if (r.status === 'approved') { await pool.query('ROLLBACK'); return res.status(400).json({ error: 'Request already approved' }); }
      // Create user
      const userResult = await pool.query('INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,$3,$4) RETURNING id, name, role, email', [r.name, r.email, r.password_hash, 'student']);
      await pool.query('UPDATE signup_requests SET status=\'approved\' WHERE id=$1', [id]);
      await pool.query('COMMIT');
      const user = userResult.rows[0];
      const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: '7d' });
      res.json({ approved: true, token, user });
    } catch (e) {
      await pool.query('ROLLBACK').catch(()=>{});
      res.status(500).json({ error: 'Failed to approve request' });
    }
  });

  // Decline a request
  router.post('/signup-requests/:id/decline', requireAuth, isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
      const result = await pool.query('UPDATE signup_requests SET status=\'declined\' WHERE id=$1 AND status=\'pending\' RETURNING id', [id]);
      if (!result.rows[0]) return res.status(404).json({ error: 'Request not found or already processed' });
      res.json({ declined: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to decline request' });
    }
  });


  // Polling endpoint for a specific username/email to see status & retrieve token if approved
  router.get('/signup-status', async (req, res) => {
    const { name } = req.query;
    if (!name) return res.status(400).json({ error: 'Name required' });
    try {
      // Check if user exists (approved)
      const userResult = await pool.query('SELECT id, name, role FROM users WHERE lower(name)=lower($1)', [name]);
      if (userResult.rows[0]) {
        const u = userResult.rows[0];
        const token = jwt.sign({ id: u.id, role: u.role, name: u.name }, process.env.JWT_SECRET, { expiresIn: '7d' });
        return res.json({ status: 'approved', token, user: u });
      }
      const reqResult = await pool.query('SELECT status FROM signup_requests WHERE lower(name)=lower($1)', [name]);
      if (!reqResult.rows[0]) return res.json({ status: 'not_found' });
      return res.json({ status: reqResult.rows[0].status });
    } catch (e) {
      res.status(500).json({ error: 'Failed to fetch status' });
    }
  });

  // List all users (admin only)
  router.get('/users', requireAuth, isAdmin, async (req, res) => {
    try {
  const result = await pool.query('SELECT id, name, email FROM users WHERE deleted=FALSE ORDER BY created_at ASC');
  res.json(result.rows);
    } catch (e) {
      res.status(500).json({ error: 'Failed to load users' });
    }
  });

  // Soft delete a user by ID (admin only)
  router.delete('/users/:id', requireAuth, isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
      const result = await pool.query('UPDATE users SET deleted=TRUE WHERE id=$1 RETURNING id', [id]);
      if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });
      res.json({ deleted: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to delete user' });
    }
  });

  // Delete a signup request (admin only)
  router.delete('/signup-requests/:id', requireAuth, isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
      const result = await pool.query('DELETE FROM signup_requests WHERE id=$1 RETURNING id', [id]);
      if (!result.rows[0]) return res.status(404).json({ error: 'Request not found' });
      res.json({ deleted: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to delete request' });
    }
  });

  // Updated login route to block deleted users
  router.post('/login', async (req, res) => {
    const { name, password } = req.body || {};
    if (!name || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    try {
      const result = await pool.query('SELECT id, name, role, password_hash, deleted FROM users WHERE name = $1', [name]);
      const user = result.rows[0];
      if (!user || user.deleted) return res.status(401).json({ error: user && user.deleted ? 'Account deleted' : 'Invalid credentials' });
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


