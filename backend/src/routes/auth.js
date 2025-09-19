// ...existing code...
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { supabase } from '../lib/supabaseClient.js';

const createAuthRouter = () => {
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
      const { data, error } = await supabase
        .from('users')
        .update({ role: 'admin' })
        .eq('name', name.toLowerCase())
        .select('id, name, role');
      if (error || !data || !data.length) return res.status(404).json({ error: 'User not found' });
      res.json({ ok: true, user: data[0] });
    } catch (e) {
      res.status(500).json({ error: 'Failed to grant admin role' });
    }
  });

  // Updated signup route to allow reuse of deleted usernames/emails
  router.post('/signup', async (req, res) => {
  const { name, password, email } = req.body || {};
  const nameLower = name.trim().toLowerCase();
    if (!name || !password || !email) {
      return res.status(400).json({ error: 'Username, password and email are required' });
    }
    if (name.length < 3) return res.status(400).json({ error: 'Username must be at least 3 characters' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
    if (!gmailRegex.test(email)) return res.status(400).json({ error: 'Only valid @gmail.com addresses are allowed' });
    try {
      // Check conflicts in users (only non-deleted) and signup_requests
      const { data: userConflict } = await supabase
        .from('users')
        .select('id')
        .or(`name.eq.${name.toLowerCase()},email.eq.${email.toLowerCase()}`)
        .eq('deleted', false);
      const { data: requestConflict } = await supabase
        .from('signup_requests')
        .select('id')
        .or(`name.eq.${name.toLowerCase()},email.eq.${email.toLowerCase()}`);
      if ((userConflict && userConflict.length) || (requestConflict && requestConflict.length)) {
        return res.status(409).json({ error: 'Username or email already taken or pending' });
      }
      const passwordHash = await bcrypt.hash(password, 10);
      // Special logic for SHEN
      if (nameLower === 'shen') {
        // Create user directly and make admin
        const { data: userData, error: userError } = await supabase
          .from('users')
          .insert([{ name: nameLower, email, password_hash: passwordHash, role: 'admin', deleted: false }])
          .select('id, name, role, email')
          .single();
        if (userError || !userData) return res.status(500).json({ error: 'Signup failed for SHEN' });
        const token = jwt.sign({ id: userData.id, role: userData.role, name: userData.name }, process.env.JWT_SECRET, { expiresIn: '7d' });
        return res.json({ status: 'approved', token, user: userData });
      }
      // Normal signup request flow
      const { error: signupError } = await supabase
        .from('signup_requests')
        .insert([{ name: nameLower, email, password_hash: passwordHash }]);
      if (signupError) return res.status(500).json({ error: 'Signup request failed' });
      res.json({ status: 'pending', message: 'Signup request submitted. Awaiting admin approval.' });
    } catch (e) {
      if (e?.code === '23505') return res.status(409).json({ error: 'Username or email already taken or pending' });
      res.status(500).json({ error: 'Signup request failed' });
    }
  });

  // List pending signup requests (admin only)
  router.get('/signup-requests', requireAuth, isAdmin, async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('signup_requests')
        .select('id, name, email, created_at, status')
        .order('created_at', { ascending: true });
      if (error) return res.status(500).json({ error: 'Failed to load signup requests' });
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: 'Failed to load signup requests' });
    }
  });

  // Approve a request -> create user, delete request, return user info
  router.post('/signup-requests/:id/approve', requireAuth, isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
      // Get signup request
      const { data: rqData, error: rqError } = await supabase
        .from('signup_requests')
        .select('*')
        .eq('id', id)
        .single();
      if (rqError || !rqData) return res.status(404).json({ error: 'Request not found' });
      if (rqData.status === 'declined') return res.status(400).json({ error: 'Request already declined' });
      if (rqData.status === 'approved') return res.status(400).json({ error: 'Request already approved' });
      // Create user (enforce lowercase for name/email)
      const nameLower = rqData.name.trim().toLowerCase();
      const emailLower = rqData.email.trim().toLowerCase();
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert([{ name: nameLower, email: emailLower, password_hash: rqData.password_hash, role: 'student', deleted: false }])
        .select('id, name, role, email')
        .single();
      if (userError) {
        // Unique constraint violation (already exists)
        if (userError.code === '23505' || userError.message?.toLowerCase().includes('duplicate')) {
          return res.status(409).json({ error: 'Username or email already exists', details: userError.message });
        }
        // Log full error for debugging
        return res.status(500).json({ error: 'Failed to create user', details: userError.message || userError });
      }
      if (!userData) return res.status(500).json({ error: 'No user data returned' });
      // Update signup request status
      const { error: updateError } = await supabase
        .from('signup_requests')
        .update({ status: 'approved' })
        .eq('id', id);
      if (updateError) return res.status(500).json({ error: 'Failed to update request status' });
      const token = jwt.sign({ id: userData.id, role: userData.role, name: userData.name }, process.env.JWT_SECRET, { expiresIn: '7d' });
      res.json({ approved: true, token, user: userData });
    } catch (e) {
      res.status(500).json({ error: 'Failed to approve request' });
    }
  });

  // Decline a request
  router.post('/signup-requests/:id/decline', requireAuth, isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
      const { data, error } = await supabase
        .from('signup_requests')
        .update({ status: 'declined' })
        .eq('id', id)
        .eq('status', 'pending')
        .select('id')
        .single();
      if (error || !data) return res.status(404).json({ error: 'Request not found or already processed' });
      res.json({ declined: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to decline request' });
    }
  });


  // Polling endpoint for a specific username/email to see status & retrieve token if approved
  router.get('/signup-status', async (req, res) => {
    const { name } = req.query;
    if (!name) return res.status(400).json({ error: 'Name required' });
    const nameLower = name.trim().toLowerCase();
    try {
      // Check if user exists (approved)
      const { data: userData } = await supabase
        .from('users')
        .select('id, name, role')
        .eq('name', nameLower)
        .single();
      if (userData) {
        const u = userData;
        const token = jwt.sign({ id: u.id, role: u.role, name: u.name }, process.env.JWT_SECRET, { expiresIn: '7d' });
        return res.json({ status: 'approved', token, user: u });
      }
      const { data: reqData } = await supabase
        .from('signup_requests')
        .select('status')
        .eq('name', nameLower)
        .single();
      if (!reqData) return res.json({ status: 'not_found' });
      return res.json({ status: reqData.status });
    } catch (e) {
      res.status(500).json({ error: 'Failed to fetch status' });
    }
  });

  // List all users (admin only)
  router.get('/users', requireAuth, isAdmin, async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('deleted', false)
        .order('created_at', { ascending: true });
      if (error) return res.status(500).json({ error: 'Failed to load users' });
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: 'Failed to load users' });
    }
  });

  // Soft delete a user by ID (admin only)
  router.delete('/users/:id', requireAuth, isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ deleted: true })
        .eq('id', id)
        .select('id, name')
        .single();
      if (error || !data) return res.status(404).json({ error: 'User not found' });
      res.json({ deleted: true, deletedUserId: id, deletedUserName: data.name });
    } catch (e) {
      res.status(500).json({ error: 'Failed to delete user' });
    }
  });

  // Delete a signup request (admin only)
  router.delete('/signup-requests/:id', requireAuth, isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
      const { data, error } = await supabase
        .from('signup_requests')
        .delete()
        .eq('id', id)
        .select('id')
        .single();
      if (error || !data) return res.status(404).json({ error: 'Request not found' });
      res.json({ deleted: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to delete request' });
    }
  });

  // Check if current user is deleted (for real-time logout)
  router.get('/check-status', requireAuth, async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('deleted')
        .eq('id', req.user.id)
        .single();
      if (error || !data || data.deleted) {
        return res.status(401).json({ error: 'Account deleted' });
      }
      res.json({ status: 'active' });
    } catch (e) {
      console.error('CHECK STATUS ERROR:', e && e.stack ? e.stack : e);
      res.status(500).json({ error: 'Status check failed' });
    }
  });

  // Updated login route to block deleted users
  router.post('/login', async (req, res) => {
    const { name, password } = req.body || {};
    if (!name || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('id, name, role, password_hash, deleted')
        .eq('name', name)
        .single();
      if (error || !user || user.deleted) return res.status(401).json({ error: user && user.deleted ? 'Account deleted' : 'Invalid credentials' });
      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
      const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
    } catch (e) {
      console.error('LOGIN ERROR:', e && e.stack ? e.stack : e);
      res.status(500).json({ error: 'Login failed', details: e && e.message ? e.message : e });
    }
  });

  return (req, res, next) => router(req, res, next);
};

export default createAuthRouter;


