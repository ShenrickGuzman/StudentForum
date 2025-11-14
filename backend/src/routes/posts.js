 

import express from 'express';
import jwt from 'jsonwebtoken';
import { supabase } from '../lib/supabaseClient.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
  const isShen = req.user?.name && req.user.name.trim().toLowerCase() === 'shen';
  if (req.user?.role === 'admin' || req.user?.role === 'teacher' || isShen) return next();
  return res.status(403).json({ error: 'Forbidden' });
};

const createPostsRouter = () => {
  const router = express.Router();
  // Admin: Delete a report log entry
  router.delete('/report-log/:id', requireAuth, isAdmin, async (req, res) => {
    try {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', req.params.id);
      if (error) return res.status(500).json({ error: 'Failed to delete report log' });
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to delete report log' });
    }
  });
  // Admin: Get all reports (posts and comments)
  router.get('/reports', requireAuth, isAdmin, async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) return res.status(500).json({ error: 'Failed to fetch reports' });
      res.json({ reports: data });
    } catch (e) {
      res.status(500).json({ error: 'Failed to fetch reports' });
    }
  });

  // Admin: Remove reported post (cascade delete related data)
  router.delete('/reported-post/:id', requireAuth, isAdmin, async (req, res) => {
    try {
      // 1. Get all comment IDs for this post
      const { data: comments, error: commentsError } = await supabase
        .from('comments')
        .select('id')
        .eq('post_id', req.params.id);
      if (commentsError) {
        console.error('Error fetching comments for post delete:', commentsError);
        return res.status(500).json({ error: 'Failed to fetch comments', details: commentsError.message || commentsError });
      }
      const commentIds = (comments || []).map(c => c.id);

      // 2. Delete all comment reactions for these comments
      if (commentIds.length > 0) {
        const { error: delCommentReactionsError } = await supabase
          .from('comment_reactions')
          .delete()
          .in('comment_id', commentIds);
        if (delCommentReactionsError) {
          console.error('Error deleting comment reactions:', delCommentReactionsError);
          return res.status(500).json({ error: 'Failed to delete comment reactions', details: delCommentReactionsError.message || delCommentReactionsError });
        }
      }

      // 3. Delete all comments for this post
      if (commentIds.length > 0) {
        const { error: delCommentsError } = await supabase
          .from('comments')
          .delete()
          .in('id', commentIds);
        if (delCommentsError) {
          console.error('Error deleting comments:', delCommentsError);
          return res.status(500).json({ error: 'Failed to delete comments', details: delCommentsError.message || delCommentsError });
        }
      }

      // 4. Delete all post reactions for this post
      const { error: delPostReactionsError } = await supabase
        .from('post_reactions')
        .delete()
        .eq('post_id', req.params.id);
      if (delPostReactionsError) {
        console.error('Error deleting post reactions:', delPostReactionsError);
        return res.status(500).json({ error: 'Failed to delete post reactions', details: delPostReactionsError.message || delPostReactionsError });
      }

      // 5. Delete the post itself
      const { error: deleteError } = await supabase
        .from('posts')
        .delete()
        .eq('id', req.params.id);
      if (deleteError) {
        console.error('Error deleting post:', deleteError);
        return res.status(500).json({ error: 'Failed to delete post', details: deleteError.message || deleteError });
      }
      res.json({ ok: true });
    } catch (e) {
      console.error('Exception in admin reported post delete:', e);
      res.status(500).json({ error: 'Exception occurred while deleting post', details: e && e.message ? e.message : e });
    }
  });

  // Admin: Remove reported comment
  router.delete('/reported-comment/:id', requireAuth, isAdmin, async (req, res) => {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', req.params.id);
      if (error) return res.status(500).json({ error: 'Failed to delete comment' });
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to delete comment' });
    }
  });
  

  // Report a post
  router.post('/:id/report', requireAuth, async (req, res) => {
    const { reason } = req.body || {};
    if (!reason) return res.status(400).json({ error: 'Missing reason' });
    try {
      const { error } = await supabase
        .from('reports')
        .insert([{ reported_by: req.user.id, target_type: 'post', target_id: req.params.id, reason }]);
      if (error) return res.status(500).json({ error: 'Failed to report post' });
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to report post' });
    }
  });

  // Report a comment
  router.post('/comment/:id/report', requireAuth, async (req, res) => {
    const { reason } = req.body || {};
    if (!reason) return res.status(400).json({ error: 'Missing reason' });
    try {
      const { error } = await supabase
        .from('reports')
        .insert([{ reported_by: req.user.id, target_type: 'comment', target_id: req.params.id, reason }]);
      if (error) return res.status(500).json({ error: 'Failed to report comment' });
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to report comment' });
    }
  });

  // Report a comment
  router.post('/comments/:id/report', requireAuth, async (req, res) => {
    const { reason } = req.body || {};
    if (!reason) return res.status(400).json({ error: 'Missing reason' });
    try {
      const { error } = await supabase
        .from('reports')
        .insert([{ comment_id: req.params.id, reporter_id: req.user.id, reason }]);
      if (error) return res.status(500).json({ error: 'Failed to report comment' });
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to report comment' });
    }
  });

 // Test endpoint to debug insert object
  router.post('/test-insert', requireAuth, async (req, res) => {
    const { title, content, category, imageUrl, linkUrl, anonymous } = req.body || {};
    const anonBool = anonymous === true || anonymous === 'true' || anonymous === 1 || anonymous === '1';
    const insertObj = {
      user_id: req.user.id,
      title,
      content,
      category,
      image_url: imageUrl || null,
      link_url: linkUrl || null,
      status: 'pending',
      anonymous: !!anonBool
    };
    res.json({ insertObj });
  });

// Get post count for a user
  router.get('/count', requireAuth, async (req, res) => {
    const userId = req.query.user_id || req.user.id;
    try {
      const { count, error } = await supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);
      if (error) return res.status(500).json({ error: 'Failed to fetch post count' });
      res.json({ count: typeof count === 'number' ? count : 0 });
    } catch (e) {
      res.status(500).json({ error: 'Failed to fetch post count' });
    }
  });

  // Get comment count for a user
  router.get('/comments/count', requireAuth, async (req, res) => {
    const userId = req.query.user_id || req.user.id;
    try {
      const { count, error } = await supabase
        .from('comments')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);
      if (error) return res.status(500).json({ error: 'Failed to fetch comment count' });
      res.json({ count: typeof count === 'number' ? count : 0 });
    } catch (e) {
      res.status(500).json({ error: 'Failed to fetch comment count' });
    }
  });

 // Lock a post (admin only)
  router.post('/:id/lock', requireAuth, isAdmin, async (req, res) => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({ locked: true })
        .eq('id', req.params.id);
      if (error) return res.status(500).json({ error: 'Failed to lock post' });
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to lock post' });
    }
  });

  // Unlock a post (admin only)
  router.post('/:id/unlock', requireAuth, isAdmin, async (req, res) => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({ locked: false })
        .eq('id', req.params.id);
      if (error) return res.status(500).json({ error: 'Failed to unlock post' });
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to unlock post' });
    }
  });

  // Pin a post (admin only)
  router.post('/:id/pin', requireAuth, isAdmin, async (req, res) => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({ pinned: true })
        .eq('id', req.params.id);
      if (error) return res.status(500).json({ error: 'Failed to pin post' });
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to pin post' });
    }
  });

  // Unpin a post (admin only)
  router.post('/:id/unpin', requireAuth, isAdmin, async (req, res) => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({ pinned: false })
        .eq('id', req.params.id);
      if (error) return res.status(500).json({ error: 'Failed to unpin post' });
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to unpin post' });
    }
  });
    // Approve post via /api/posts/:id/approve (admin only)
    router.post('/:id/approve', requireAuth, isAdmin, async (req, res) => {
      try {
        const { error } = await supabase
          .from('posts')
          .update({ status: 'approved' })
          .eq('id', req.params.id)
          .eq('status', 'pending');
        if (error) return res.status(500).json({ error: 'Failed to approve post' });
        res.json({ ok: true });
      } catch (e) {
        res.status(500).json({ error: 'Failed to approve post' });
      }
    });

    // Reject post via /api/posts/:id/reject (admin only)
    router.post('/:id/reject', requireAuth, isAdmin, async (req, res) => {
      try {
        const { error } = await supabase
          .from('posts')
          .update({ status: 'rejected' })
          .eq('id', req.params.id)
          .eq('status', 'pending');
        if (error) return res.status(500).json({ error: 'Failed to reject post' });
        res.json({ ok: true });
      } catch (e) {
        res.status(500).json({ error: 'Failed to reject post' });
      }
    });

    // Approve post via /api/posts/approve (admin only)
    router.post('/approve', requireAuth, isAdmin, async (req, res) => {
      const { postId } = req.body;
      if (!postId) return res.status(400).json({ error: 'Missing postId' });
      try {
        const { error } = await supabase
          .from('posts')
          .update({ status: 'approved' })
          .eq('id', postId)
          .eq('status', 'pending');
        if (error) return res.status(500).json({ error: 'Failed to approve post' });
        res.json({ ok: true });
      } catch (e) {
        res.status(500).json({ error: 'Failed to approve post' });
      }
    });

    // Reject post via /api/posts/reject (admin only)
    router.post('/reject', requireAuth, isAdmin, async (req, res) => {
      const { postId } = req.body;
      if (!postId) return res.status(400).json({ error: 'Missing postId' });
      try {
        const { error } = await supabase
          .from('posts')
          .update({ status: 'rejected' })
          .eq('id', postId)
          .eq('status', 'pending');
        if (error) return res.status(500).json({ error: 'Failed to reject post' });
        res.json({ ok: true });
      } catch (e) {
        res.status(500).json({ error: 'Failed to reject post' });
      }
    });

  // Delete a comment (author or admin)
  router.delete('/comments/:id', requireAuth, async (req, res) => {
    try {
      // Get comment info
      const { data: commentData, error: commentError } = await supabase
        .from('comments')
        .select('user_id')
        .eq('id', req.params.id)
        .single();
      if (commentError || !commentData) return res.status(404).json({ error: 'Comment not found' });
      const isShen = req.user?.name && req.user.name.trim().toLowerCase() === 'shen';
      if (commentData.user_id !== req.user.id && req.user.role !== 'admin' && !isShen) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      const { error: deleteError } = await supabase
        .from('comments')
        .delete()
        .eq('id', req.params.id);
      if (deleteError) return res.status(500).json({ error: 'Failed to delete comment' });
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to delete comment' });
    }
  });
  // Get all comments for a post (with author and reactions)
  router.get('/:id/comments', requireAuth, async (req, res) => {
    try {
      const { data: commentsRaw, error: commentsError } = await supabase
        .from('comments')
        .select('*, users!comments_user_id_fkey(name, role, avatar, badges)')
        .eq('post_id', req.params.id)
        .order('created_at', { ascending: true });
      if (commentsError) return res.status(500).json({ error: 'Failed to fetch comments' });
      const commentsArr = Array.isArray(commentsRaw) ? commentsRaw : [];
      const commentIds = commentsArr.map(c => c.id);
      let commentReactions = [];
      if (Array.isArray(commentIds) && commentIds.length > 0) {
        const { data: reactionsData } = await supabase
          .from('comment_reactions')
          .select('comment_id, emoji')
          .in('comment_id', commentIds);
        commentReactions = Array.isArray(reactionsData) ? reactionsData : [];
      }
      let userCommentReactions = [];
      if (Array.isArray(commentIds) && commentIds.length > 0) {
        const { data: userReactionsData } = await supabase
          .from('comment_reactions')
          .select('comment_id, emoji')
          .in('comment_id', commentIds)
          .eq('user_id', req.user.id);
        userCommentReactions = Array.isArray(userReactionsData) ? userReactionsData : [];
      }
      // Map reactions to each comment
      const commentReactionsMap = {};
      if (Array.isArray(commentReactions)) {
        for (const row of commentReactions) {
          if (!commentReactionsMap[row.comment_id]) commentReactionsMap[row.comment_id] = {};
          commentReactionsMap[row.comment_id][row.emoji] = (commentReactionsMap[row.comment_id][row.emoji] || 0) + 1;
        }
      }
      const userCommentReactionsMap = {};
      if (Array.isArray(userCommentReactions)) {
        for (const row of userCommentReactions) {
          userCommentReactionsMap[row.comment_id] = row.emoji;
        }
      }
      const comments = Array.isArray(commentsArr)
        ? commentsArr.map(c => ({
            ...c,
            author_name: c.users?.name || null,
            author_role: c.users?.role || null,
            avatar: c.users?.avatar || null,
            reactions: {
              counts: commentReactionsMap[c.id] || {},
              user: userCommentReactionsMap[c.id] || null
            }
          }))
        : [];
      // Extra logging for debugging
      console.log('COMMENTS DEBUG:', {
        commentsRaw,
        commentsArr,
        commentIds,
        commentReactions,
        userCommentReactions,
        commentReactionsMap,
        userCommentReactionsMap,
        comments
      });
      res.json(comments);
    } catch (e) {
      console.error('COMMENTS ERROR:', e && e.stack ? e.stack : e);
      res.status(500).json({ error: 'Failed to fetch comments', details: e && e.message ? e.message : e });
    }
  });

  // Create post
  router.post('/', requireAuth, async (req, res) => {
    console.log('POST /api/posts route hit');
    console.log('Request body:', req.body);
    const { title, content, category, imageUrl, linkUrl, anonymous } = req.body || {};
    // Debug: print the value of anonymous received
    console.log('DEBUG anonymous value received:', anonymous, 'typeof:', typeof anonymous);
    // Accept true, 'true', 1, '1' as true, else false
    let anonBool = false;
    if (typeof anonymous === 'boolean') {
      anonBool = anonymous;
    } else if (typeof anonymous === 'string') {
      anonBool = anonymous.trim().toLowerCase() === 'true';
    } else if (typeof anonymous === 'number') {
      anonBool = anonymous === 1;
    }
    // Debug: print the computed anonBool
    console.log('DEBUG computed anonBool:', anonBool);

    // --- Read auto-approve setting from settings.json (ESM, robust path) ---
    let autoApprove = true;
    try {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const settingsPath = path.join(__dirname, '../../settings.json');
      if (fs.existsSync(settingsPath)) {
        const raw = fs.readFileSync(settingsPath, 'utf8');
        const settings = JSON.parse(raw);
        autoApprove = settings.autoApprove !== undefined ? !!settings.autoApprove : true;
      }
    } catch (e) {
      autoApprove = true;
      console.error('Failed to read auto-approve setting:', e);
    }

    const insertObj = {
      user_id: req.user.id,
      title,
      content,
      category,
      image_url: imageUrl || null,
      link_url: linkUrl || null,
      status: autoApprove ? 'approved' : 'pending',
      anonymous: anonBool
    };
    try {
      if (!title || !content || !category) return res.status(400).json({ error: 'Missing fields' });
      const { data, error } = await supabase
        .from('posts')
        .insert([insertObj])
        .select('*')
        .single();
      if (error || !data) return res.status(500).json({ error: 'Failed to create post' });
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: 'Failed to create post' });
    }
  });

  // List posts with search/filter, pinned first (auth required)
  router.get('/', requireAuth, async (req, res) => {
    const { q, category, status, admin } = req.query;
    let query = supabase
      .from('posts')
      .select('*, users!posts_user_id_fkey(name, avatar, role, badges)')
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false });

    // If admin panel requests all pending posts
    if (admin && status === 'pending' && (req.user?.role === 'admin' || (req.user?.name && req.user.name.trim().toLowerCase() === 'shen'))) {
      query = query.eq('status', 'pending');
    } else {
      // Show all approved posts to everyone
      // Also show current user's own pending/rejected posts
      const statusFilter = [
        'status.eq.approved'
      ];
      if (req.user) {
        statusFilter.push(`and(status.in.(pending,rejected),user_id.eq.${req.user.id})`);
      }
      query = query.or(statusFilter.join(','));
    }

    if (q) {
      query = query.ilike('title', `%${q}%`).or(`content.ilike.%${q}%`);
    }
    if (category) {
      query = query.eq('category', category);
    }
    try {
      const { data, error } = await query;
      if (error) {
        console.error('Failed to fetch posts:', error);
        return res.status(500).json({ error: 'Failed to fetch posts', details: error.message, supabaseError: error });
      }
      // Add author_name, avatar, role, badges for compatibility
      let posts = [];
      try {
        posts = data.map(p => {
          if (p.anonymous) {
            return {
              ...p,
              author_name: 'Anonymous',
              avatar: null,
              author_role: null,
              badges: [],
              users: { name: 'Anonymous', avatar: null, role: null, badges: [] }
            };
          } else {
            return {
              ...p,
              author_name: p.users?.name || null,
              avatar: p.users?.avatar || null,
              author_role: p.users?.role || null,
              badges: p.users?.badges || []
            };
          }
        });
      } catch (mapErr) {
        console.error('Error mapping posts data:', mapErr, 'Raw data:', data);
        return res.status(500).json({ error: 'Failed to map posts data', details: mapErr.message, rawData: data });
      }
      res.json(posts);
    } catch (e) {
      console.error('Exception in posts list endpoint:', e);
      res.status(500).json({ error: 'Failed to fetch posts', details: e.message, exception: e });
    }
  });

  // Get post detail with comments and reactions (auth required)
  router.get('/:id', requireAuth, async (req, res) => {
    try {
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('*, users!posts_user_id_fkey(name, avatar, role, badges)')
        .eq('id', req.params.id)
        .single();
      if (postError || !postData) return res.status(404).json({ error: 'Post not found' });
      // Only show post if approved or author is viewing
      if (postData.status !== 'approved' && postData.user_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'teacher') {
        return res.status(403).json({ error: 'Post not available' });
      }

      // Mask author info if anonymous, unless admin
      let maskedPost = { ...postData };
      const isAdmin = req.user?.role === 'admin' || req.user?.role === 'teacher' || (req.user?.name && req.user.name.trim().toLowerCase() === 'shen');
      if (postData.anonymous && !isAdmin) {
        maskedPost.users = {
          name: 'Anonymous',
          avatar: null,
          role: null,
          badges: []
        };
        maskedPost.author_name = 'Anonymous';
        maskedPost.avatar = null;
        maskedPost.author_role = null;
        maskedPost.badges = [];
      } else {
        maskedPost.author_name = postData.users?.name || null;
        maskedPost.avatar = postData.users?.avatar || null;
        maskedPost.author_role = postData.users?.role || null;
        maskedPost.badges = postData.users?.badges || [];
      }

      // Get comments
      const { data: commentsRaw, error: commentsError } = await supabase
        .from('comments')
        .select('*, users(name, role, avatar, badges), anonymous')
        .eq('post_id', req.params.id)
        .order('created_at', { ascending: true });
      const commentsArr = Array.isArray(commentsRaw) ? commentsRaw : [];
      // Mask author info for anonymous comments, unless admin
      const comments = commentsArr.map(c => {
        if (c.anonymous && !isAdmin) {
          return {
            ...c,
            users: {
              name: 'Anonymous',
              avatar: null,
              role: null,
              badges: []
            },
            author_name: 'Anonymous',
            avatar: null,
            author_role: null,
            badges: []
          };
        } else {
          return {
            ...c,
            author_name: c.users?.name || null,
            avatar: c.users?.avatar || null,
            author_role: c.users?.role || null,
            badges: c.users?.badges || []
          };
        }
      });

      // Get reaction counts for this post
      const { data: reactionCountsRaw } = await supabase
        .from('post_reactions')
        .select('emoji')
        .eq('post_id', req.params.id);
      const counts = {};
      for (const row of reactionCountsRaw || []) {
        counts[row.emoji] = (counts[row.emoji] || 0) + 1;
      }
      // Get current user's reaction for this post
      const { data: userReactionRaw } = await supabase
        .from('post_reactions')
        .select('emoji')
        .eq('post_id', req.params.id)
        .eq('user_id', req.user.id)
        .single();
      res.json({
        post: maskedPost,
        comments,
        reactions: {
          counts,
          user: userReactionRaw?.emoji || null
        }
      });
    } catch (e) {
      console.error('Error fetching post detail:', e);
      res.status(500).json({ error: 'Failed to fetch post', details: e.message });
    }
  });

  // Comment (prevent if locked)
  router.post('/:id/comments', requireAuth, async (req, res) => {
    const { content, anonymous } = req.body || {};
    if (!content) return res.status(400).json({ error: 'Missing content' });
    try {
      const { data: postRes } = await supabase
        .from('posts')
        .select('locked')
        .eq('id', req.params.id)
        .single();
      if (postRes?.locked) return res.status(403).json({ error: 'Post is locked. Comments are disabled.' });
      // Accept true, 'true', 1, '1' as true, else false
      let anonBool = false;
      if (typeof anonymous === 'boolean') {
        anonBool = anonymous;
      } else if (typeof anonymous === 'string') {
        anonBool = anonymous.trim().toLowerCase() === 'true';
      } else if (typeof anonymous === 'number') {
        anonBool = anonymous === 1;
      }
      const { data, error } = await supabase
        .from('comments')
        .insert([{ post_id: req.params.id, user_id: req.user.id, content, anonymous: anonBool }])
        .select('*')
        .single();
      if (error || !data) return res.status(500).json({ error: 'Failed to add comment' });
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: 'Failed to add comment' });
    }
  });
  // Lock/unlock post (admin only)
  router.post('/:id/lock', requireAuth, isAdmin, async (req, res) => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({ locked: true })
        .eq('id', req.params.id);
      if (error) return res.status(500).json({ error: 'Failed to lock post' });
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to lock post' });
    }
  });
  router.post('/:id/unlock', requireAuth, isAdmin, async (req, res) => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({ locked: false })
        .eq('id', req.params.id);
      if (error) return res.status(500).json({ error: 'Failed to unlock post' });
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to unlock post' });
    }
  });

  // React to post or comment
  router.post('/:type/:id/react', requireAuth, async (req, res) => {
    const { emoji } = req.body || {};
    const { type, id } = req.params;
    if (!['post', 'comment'].includes(type)) {
      return res.status(400).json({ error: 'Invalid type' });
    }
    const table = type === 'post' ? 'post_reactions' : 'comment_reactions';
    const targetCol = type === 'post' ? 'post_id' : 'comment_id';
    // If emoji is null, empty, or undefined, remove the reaction
    if (!emoji) {
      try {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq(targetCol, id)
          .eq('user_id', req.user.id);
        if (error) {
          console.error('Failed to remove reaction:', error);
          return res.status(500).json({ error: 'Failed to remove reaction', details: error.message, supabaseError: error });
        }
        return res.json({ ok: true, removed: true });
      } catch (e) {
        console.error('Exception in remove reaction:', e);
        return res.status(500).json({ error: 'Failed to remove reaction', details: e.message, exception: e });
      }
    }
    if (!['like', 'heart', 'wow', 'sad', 'haha'].includes(emoji)) {
      return res.status(400).json({ error: 'Invalid reaction' });
    }
    try {
      // True upsert: insert or update emoji for (post_id/user_id) or (comment_id/user_id)
      const { data, error } = await supabase
        .from(table)
        .upsert([{ [targetCol]: id, user_id: req.user.id, emoji }], { onConflict: [targetCol, 'user_id'] });
      if (error) {
        console.error('Failed to react (upsert):', error, 'Request:', { [targetCol]: id, user_id: req.user.id, emoji });
        return res.status(500).json({ error: 'Failed to react', details: error.message, supabaseError: error });
      }
      res.json({ ok: true, data });
    } catch (e) {
      console.error('Exception in react (upsert):', e);
      res.status(500).json({ error: 'Failed to react', details: e.message, exception: e });
    }
  });

  // Pin/unpin (admin only)
  router.post('/:id/pin', requireAuth, isAdmin, async (req, res) => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({ pinned: true })
        .eq('id', req.params.id);
      if (error) return res.status(500).json({ error: 'Failed to pin' });
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to pin' });
    }
  });
  router.post('/:id/unpin', requireAuth, isAdmin, async (req, res) => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({ pinned: false })
        .eq('id', req.params.id);
      if (error) return res.status(500).json({ error: 'Failed to unpin' });
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to unpin' });
    }
  });

  // Delete (admin, SHEN, or author) - cascade delete related data
  router.delete('/:id', requireAuth, async (req, res) => {
    try {
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', req.params.id)
        .single();
      if (postError) {
        console.error('Error fetching post for admin delete:', postError);
        return res.status(500).json({ error: 'Database error fetching post', details: postError.message || postError });
      }
      if (!postData) {
        return res.status(404).json({ error: 'Post not found' });
      }
      const isShen = req.user?.name && req.user.name.trim().toLowerCase() === 'shen';
      if (postData.user_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'teacher' && !isShen) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      // 1. Get all comment IDs for this post
      const { data: comments, error: commentsError } = await supabase
        .from('comments')
        .select('id')
        .eq('post_id', req.params.id);
      if (commentsError) {
        console.error('Error fetching comments for post delete:', commentsError);
        return res.status(500).json({ error: 'Failed to fetch comments', details: commentsError.message || commentsError });
      }
      const commentIds = (comments || []).map(c => c.id);

      // 2. Delete all comment reactions for these comments
      if (commentIds.length > 0) {
        const { error: delCommentReactionsError } = await supabase
          .from('comment_reactions')
          .delete()
          .in('comment_id', commentIds);
        if (delCommentReactionsError) {
          console.error('Error deleting comment reactions:', delCommentReactionsError);
          return res.status(500).json({ error: 'Failed to delete comment reactions', details: delCommentReactionsError.message || delCommentReactionsError });
        }
      }

      // 3. Delete all comments for this post
      if (commentIds.length > 0) {
        const { error: delCommentsError } = await supabase
          .from('comments')
          .delete()
          .in('id', commentIds);
        if (delCommentsError) {
          console.error('Error deleting comments:', delCommentsError);
          return res.status(500).json({ error: 'Failed to delete comments', details: delCommentsError.message || delCommentsError });
        }
      }

      // 4. Delete all post reactions for this post
      const { error: delPostReactionsError } = await supabase
        .from('post_reactions')
        .delete()
        .eq('post_id', req.params.id);
      if (delPostReactionsError) {
        console.error('Error deleting post reactions:', delPostReactionsError);
        return res.status(500).json({ error: 'Failed to delete post reactions', details: delPostReactionsError.message || delPostReactionsError });
      }

      // 5. Delete the post itself
      const { error: deleteError } = await supabase
        .from('posts')
        .delete()
        .eq('id', req.params.id);
      if (deleteError) {
        console.error('Error deleting post:', deleteError);
        return res.status(500).json({ error: 'Failed to delete post', details: deleteError.message || deleteError });
      }
      res.json({ ok: true });
    } catch (e) {
      console.error('Exception in admin post delete:', e);
      res.status(500).json({ error: 'Exception occurred while deleting post', details: e && e.message ? e.message : e });
    }
  });

  return router;
};

export default createPostsRouter;
