import express from 'express';
import jwt from 'jsonwebtoken';

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

const createPostsRouter = (pool) => {
  const router = express.Router();

  // Create post
  router.post('/', requireAuth, async (req, res) => {
    const { title, content, category, imageUrl, linkUrl } = req.body || {};
    if (!title || !content || !category) return res.status(400).json({ error: 'Missing fields' });
    try {
      const result = await pool.query(
        `INSERT INTO posts (user_id, title, content, category, image_url, link_url)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [req.user.id, title, content, category, imageUrl || null, linkUrl || null]
      );
      res.json(result.rows[0]);
    } catch (e) {
      res.status(500).json({ error: 'Failed to create post' });
    }
  });

  // List posts with search/filter, pinned first (auth required)
  router.get('/', requireAuth, async (req, res) => {
    const { q, category } = req.query;
    const clauses = [];
    const params = [];
    if (q) { params.push(`%${q}%`); clauses.push(`(title ILIKE $${params.length} OR content ILIKE $${params.length})`); }
    if (category) { params.push(category); clauses.push(`category = $${params.length}`); }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    try {
      const result = await pool.query(
        `SELECT p.*, u.name as author_name
         FROM posts p
         JOIN users u ON u.id = p.user_id
         ${where}
         ORDER BY pinned DESC, created_at DESC`
        , params);
      res.json(result.rows);
    } catch (e) {
      res.status(500).json({ error: 'Failed to fetch posts' });
    }
  });

  // Get post detail with comments (auth required)
  router.get('/:id', requireAuth, async (req, res) => {
    try {
      const post = await pool.query('SELECT * FROM posts WHERE id = $1', [req.params.id]);
      const comments = await pool.query(
        `SELECT c.*, u.name as author_name FROM comments c JOIN users u ON u.id = c.user_id WHERE post_id = $1 ORDER BY created_at ASC`,
        [req.params.id]
      );
      res.json({ post: post.rows[0], comments: comments.rows });
    } catch (e) {
      res.status(500).json({ error: 'Failed to fetch post' });
    }
  });

  // Comment (prevent if locked)
  router.post('/:id/comments', requireAuth, async (req, res) => {
    const { content } = req.body || {};
    if (!content) return res.status(400).json({ error: 'Missing content' });
    try {
      const postRes = await pool.query('SELECT locked FROM posts WHERE id = $1', [req.params.id]);
      if (postRes.rows[0]?.locked) return res.status(403).json({ error: 'Post is locked. Comments are disabled.' });
      const result = await pool.query(
        `INSERT INTO comments (post_id, user_id, content) VALUES ($1, $2, $3) RETURNING *`,
        [req.params.id, req.user.id, content]
      );
      res.json(result.rows[0]);
    } catch (e) {
      res.status(500).json({ error: 'Failed to add comment' });
    }
  });
  // Lock/unlock post (admin only)
  router.post('/:id/lock', requireAuth, isAdmin, async (req, res) => {
    try {
      await pool.query('UPDATE posts SET locked = TRUE WHERE id = $1', [req.params.id]);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to lock post' });
    }
  });
  router.post('/:id/unlock', requireAuth, isAdmin, async (req, res) => {
    try {
      await pool.query('UPDATE posts SET locked = FALSE WHERE id = $1', [req.params.id]);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to unlock post' });
    }
  });

  // React to post or comment
  router.post('/:type/:id/react', requireAuth, async (req, res) => {
    const { emoji } = req.body || {};
    const { type, id } = req.params;
    if (!['post', 'comment'].includes(type)) return res.status(400).json({ error: 'Invalid type' });
    if (!['like', 'heart'].includes(emoji)) return res.status(400).json({ error: 'Invalid reaction' });
    try {
      const table = type === 'post' ? 'post_reactions' : 'comment_reactions';
      const targetCol = type === 'post' ? 'post_id' : 'comment_id';
      await pool.query(
        `INSERT INTO ${table} (${targetCol}, user_id, emoji)
         VALUES ($1, $2, $3)
         ON CONFLICT (${targetCol}, user_id) DO UPDATE SET emoji = EXCLUDED.emoji`,
        [id, req.user.id, emoji]
      );
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to react' });
    }
  });

  // Pin/unpin (admin only)
  router.post('/:id/pin', requireAuth, isAdmin, async (req, res) => {
    try {
      await pool.query('UPDATE posts SET pinned = TRUE WHERE id = $1', [req.params.id]);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to pin' });
    }
  });
  router.post('/:id/unpin', requireAuth, isAdmin, async (req, res) => {
    try {
      await pool.query('UPDATE posts SET pinned = FALSE WHERE id = $1', [req.params.id]);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to unpin' });
    }
  });

  // Delete (admin or author)
  router.delete('/:id', requireAuth, async (req, res) => {
    try {
      const post = await pool.query('SELECT user_id FROM posts WHERE id = $1', [req.params.id]);
      if (!post.rows[0]) return res.status(404).json({ error: 'Not found' });
      if (post.rows[0].user_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'teacher') {
        return res.status(403).json({ error: 'Forbidden' });
      }
      await pool.query('DELETE FROM posts WHERE id = $1', [req.params.id]);
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: 'Failed to delete' });
    }
  });

  return (req, res, next) => router(req, res, next);
};

export default createPostsRouter;


