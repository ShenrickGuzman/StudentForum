import express from 'express';
import jwt from 'jsonwebtoken';
import { supabase } from '../lib/supabaseClient.js';

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
        .select('*, users(name)')
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
    const { title, content, category, imageUrl, linkUrl } = req.body || {};
    if (!title || !content || !category) return res.status(400).json({ error: 'Missing fields' });
    try {
      const { data, error } = await supabase
        .from('posts')
        .insert([{ user_id: req.user.id, title, content, category, image_url: imageUrl || null, link_url: linkUrl || null, status: 'pending' }])
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
      .select('*, users(name)')
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
      if (error) return res.status(500).json({ error: 'Failed to fetch posts' });
      // Add author_name for compatibility
      const posts = data.map(p => ({ ...p, author_name: p.users?.name || null }));
      res.json(posts);
    } catch (e) {
      res.status(500).json({ error: 'Failed to fetch posts' });
    }
  });

  // Get post detail with comments and reactions (auth required)
  router.get('/:id', requireAuth, async (req, res) => {
    try {
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('*, users(name)')
        .eq('id', req.params.id)
        .single();
      if (postError || !postData) return res.status(404).json({ error: 'Post not found' });
      // Only show post if approved or author is viewing
      if (postData.status !== 'approved' && postData.user_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'teacher') {
        return res.status(403).json({ error: 'Post not available' });
      }

  // Admin approve post
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

  // Admin reject post
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

  // Author cancels (deletes) their own pending post
  router.delete('/:id/cancel', requireAuth, async (req, res) => {
    try {
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('user_id, status')
        .eq('id', req.params.id)
        .single();
      if (postError || !postData) return res.status(404).json({ error: 'Not found' });
      if (postData.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
      // Allow user to delete their own post regardless of status
      const { error: deleteError } = await supabase
        .from('posts')
        .delete()
        .eq('id', req.params.id);
      if (deleteError) return res.status(500).json({ error: 'Failed to cancel post' });
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to cancel post' });
    }
  });
      const { data: commentsRaw, error: commentsError } = await supabase
        .from('comments')
        .select('*, users(name)')
        .eq('post_id', req.params.id)
        .order('created_at', { ascending: true });
      const commentsArr = commentsRaw || [];
      const commentIds = commentsArr.map(c => c.id);
      let commentReactions = [];
      if (commentIds.length > 0) {
        const { data: reactionsData } = await supabase
          .from('comment_reactions')
          .select('comment_id, emoji')
          .in('comment_id', commentIds);
        commentReactions = reactionsData || [];
      }
      let userCommentReactions = [];
      if (commentIds.length > 0) {
        const { data: userReactionsData } = await supabase
          .from('comment_reactions')
          .select('comment_id, emoji')
          .in('comment_id', commentIds)
          .eq('user_id', req.user.id);
        userCommentReactions = userReactionsData || [];
      }
      const commentReactionsMap = {};
      for (const row of commentReactions) {
        if (!commentReactionsMap[row.comment_id]) commentReactionsMap[row.comment_id] = {};
        commentReactionsMap[row.comment_id][row.emoji] = (commentReactionsMap[row.comment_id][row.emoji] || 0) + 1;
      }
      const userCommentReactionsMap = {};
      for (const row of userCommentReactions) {
        userCommentReactionsMap[row.comment_id] = row.emoji;
      }
      const comments = commentsArr.map(c => ({
        ...c,
        author_name: c.users?.name || null,
        reactions: {
          counts: commentReactionsMap[c.id] || {},
          user: userCommentReactionsMap[c.id] || null
        }
      }));
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
        post: { ...postData, author_name: postData.users?.name || null },
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
    const { content } = req.body || {};
    if (!content) return res.status(400).json({ error: 'Missing content' });
    try {
      const { data: postRes } = await supabase
        .from('posts')
        .select('locked')
        .eq('id', req.params.id)
        .single();
      if (postRes?.locked) return res.status(403).json({ error: 'Post is locked. Comments are disabled.' });
      const { data, error } = await supabase
        .from('comments')
        .insert([{ post_id: req.params.id, user_id: req.user.id, content }])
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
        if (error) return res.status(500).json({ error: 'Failed to remove reaction' });
        return res.json({ ok: true, removed: true });
      } catch (e) {
        return res.status(500).json({ error: 'Failed to remove reaction', details: e.message });
      }
    }
    if (!['like', 'heart', 'wow', 'sad', 'haha'].includes(emoji)) {
      return res.status(400).json({ error: 'Invalid reaction' });
    }
    try {
      // True upsert: insert or update emoji for (post_id/user_id) or (comment_id/user_id)
      const { error } = await supabase
        .from(table)
        .upsert([{ [targetCol]: id, user_id: req.user.id, emoji }], { onConflict: [targetCol, 'user_id'] });
      if (error) return res.status(500).json({ error: 'Failed to react', details: error.message });
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to react', details: e.message });
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

  // Delete (admin, SHEN, or author)
  router.delete('/:id', requireAuth, async (req, res) => {
    try {
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', req.params.id)
        .single();
      if (postError || !postData) return res.status(404).json({ error: 'Not found' });
      const isShen = req.user?.name && req.user.name.trim().toLowerCase() === 'shen';
      if (postData.user_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'teacher' && !isShen) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      const { error: deleteError } = await supabase
        .from('posts')
        .delete()
        .eq('id', req.params.id);
      if (deleteError) return res.status(500).json({ error: 'Failed to delete' });
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to delete' });
    }
  });

  return router;
};

export default createPostsRouter;
