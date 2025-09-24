  // ...existing code...
// ...existing code...
import express from 'express';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { supabase } from '../lib/supabaseClient.js';

const createAuthRouter = () => {

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

  const router = express.Router();

  // Get current user's profile
  router.get('/profile', requireAuth, async (req, res) => {
    try {
      if (!req.user || !req.user.id) return res.status(401).json({ error: 'Unauthorized' });
      const { data, error } = await supabase
        .from('users')
        .select('id, name, avatar, about, interests')
        .eq('id', req.user.id)
        .single();
      if (error || !data) return res.status(404).json({ error: 'Profile not found' });
      return res.json({ profile: data });
    } catch (e) {
      console.error('Get profile error:', e);
      return res.status(500).json({ error: 'Failed to fetch profile', details: e && e.message ? e.message : e });
    }
  });

  // Profile Picture Upload (Supabase Storage) and Profile Update
  const upload = multer();
  router.post('/profile/picture', requireAuth, upload.single('picture'), async (req, res) => {
    try {
      if (!req.user || !req.user.id) {
        console.error('No user or user id in request');
        return res.status(401).json({ error: 'Unauthorized' });
      }
      if (!req.file) {
        console.error('No file uploaded');
        return res.status(400).json({ error: 'No file uploaded' });
      }
      const file = req.file;
      const fileExt = file.originalname.split('.').pop();
  const filePath = `${req.user.id}.${fileExt}`;
      console.log('Uploading file to:', filePath);
      // Upload to Supabase Storage
      const allowedTypes = ['image/png', 'image/jpeg'];
      const contentType = allowedTypes.includes(file.mimetype) ? file.mimetype : 'image/png';
      const { data, error } = await supabase.storage.from('profile-pictures').upload(filePath, file.buffer, {
        cacheControl: '3600',
        upsert: true,
        contentType
      });
      if (error) {
        console.error('Supabase Storage upload error:', error);
        return res.status(500).json({ error: 'Failed to upload profile picture', details: error.message || error });
      }
      console.log('Upload data:', data);
      // Get public URL
  console.log('DEBUG: filePath for getPublicUrl:', filePath);
  const publicUrlResult = supabase.storage.from('profile-pictures').getPublicUrl(filePath);
  console.log('DEBUG: getPublicUrl result:', publicUrlResult);
  const publicUrl = publicUrlResult.data.publicUrl;
  // Hardcoded test for 1.jpg
  const testUrlResult = supabase.storage.from('profile-pictures').getPublicUrl('1.jpg');
  console.log('DEBUG: getPublicUrl for 1.jpg:', testUrlResult);
  console.log('publicUrl:', publicUrl);
      // Update profile_picture column
      const { data: updateData, error: updateError } = await supabase
        .from('users')
        .update({ avatar: publicUrl || '/Cute-Cat.png' })
        .eq('id', req.user.id)
        .select('id, avatar');
      if (updateError) {
        console.error('Supabase profile update error:', updateError);
        return res.status(500).json({ error: 'Failed to update profile picture', details: updateError.message || updateError });
      }
  console.log('Profile update data:', updateData);
  return res.json({ ok: true, profile_picture: publicUrl });
    } catch (e) {
      console.error('Profile picture upload error (catch):', e);
      return res.status(500).json({ error: 'Failed to upload profile picture', details: e && e.message ? e.message : e });
    }
  });

  // Update About Me and Hobbies & Interests
  router.put('/profile', requireAuth, async (req, res) => {
    try {
      if (!req.user || !req.user.id) return res.status(401).json({ error: 'Unauthorized' });
      const { about_me, hobbies_interests } = req.body || {};
      const updateFields = {};
      if (about_me !== undefined) updateFields.about = about_me;
      if (hobbies_interests !== undefined) {
        if (Array.isArray(hobbies_interests)) {
          updateFields.interests = hobbies_interests;
        } else if (typeof hobbies_interests === 'string') {
          updateFields.interests = hobbies_interests.split(',').map(s => s.trim()).filter(Boolean);
        } else {
          updateFields.interests = [];
        }
      }
      const { data, error } = await supabase
        .from('users')
        .update(updateFields)
        .eq('id', req.user.id)
        .select('id, avatar, about, interests');
      if (error) return res.status(500).json({ error: 'Failed to update profile', details: error.message || error });
      if (!data || !data.length) return res.status(500).json({ error: 'No profile data returned after update' });
      return res.json({ ok: true, profile: data[0] });
    } catch (e) {
      console.error('Profile update error:', e);
      return res.status(500).json({ error: 'Failed to update profile', details: e && e.message ? e.message : e });
    }
  });

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
  const nameDisplay = name.trim();
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
        .or(`name.ilike.${nameLower},email.ilike.${email.toLowerCase()}`)
        .eq('deleted', false);
      const { data: requestConflict } = await supabase
        .from('signup_requests')
        .select('id')
        .or(`name.ilike.${nameLower},email.ilike.${email.toLowerCase()}`);
      if ((userConflict && userConflict.length) || (requestConflict && requestConflict.length)) {
        return res.status(409).json({ error: 'Username or email already taken or pending' });
      }
      const passwordHash = await bcrypt.hash(password, 10);
      // Special logic for SHEN
      if (nameLower === 'shen') {
        // Create user directly and make admin
        const { data: userData, error: userError } = await supabase
          .from('users')
          .insert([{ name: nameDisplay, email, password_hash: passwordHash, role: 'admin', deleted: false }])
          .select('id, name, role, email')
          .single();
        if (userError || !userData) return res.status(500).json({ error: 'Signup failed for SHEN' });
        const token = jwt.sign({ id: userData.id, role: userData.role, name: userData.name }, process.env.JWT_SECRET, { expiresIn: '7d' });
        return res.json({ status: 'approved', token, user: userData });
      }
      // Normal signup request flow
      const { error: signupError } = await supabase
        .from('signup_requests')
        .insert([{ name: nameDisplay, email, password_hash: passwordHash }]);
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
      // Create user (preserve display case, but enforce lowercase for uniqueness)
      const nameDisplay = rqData.name.trim();
      const emailLower = rqData.email.trim().toLowerCase();
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert([{ name: nameDisplay, email: emailLower, password_hash: rqData.password_hash, role: 'student', deleted: false }])
        .select('id, name, role, email')
        .single();
      if (userError) {
        // Unique constraint violation (already exists)
        if (userError.code === '23505' || userError.message?.toLowerCase().includes('duplicate')) {
          // Find conflicting user(s)
          const { data: conflictUsers } = await supabase
            .from('users')
            .select('id, name, email')
            .or(`name.ilike.${nameDisplay.toLowerCase()},email.ilike.${emailLower}`)
            .eq('deleted', false);
          return res.status(409).json({ error: 'Username or email already exists', details: userError.message, conflicts: conflictUsers });
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
  const nameTrimmed = name.trim();
    try {
      // Check if user exists (approved, case-insensitive)
      const { data: userData } = await supabase
        .from('users')
        .select('id, name, role')
        .ilike('name', nameTrimmed)
        .single();
      if (userData) {
        const u = userData;
        const token = jwt.sign({ id: u.id, role: u.role, name: u.name }, process.env.JWT_SECRET, { expiresIn: '7d' });
        return res.json({ status: 'approved', token, user: u });
      }
      // Check signup request (case-insensitive)
      const { data: reqData } = await supabase
        .from('signup_requests')
        .select('status')
        .ilike('name', nameTrimmed)
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
        .eq('name', name.trim())
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


