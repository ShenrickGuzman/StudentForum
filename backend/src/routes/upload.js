
import express from 'express';
import multer from 'multer';
import { supabase } from '../lib/supabaseClient.js';

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Set up multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });
// POST /api/upload/audio (audio file upload to Supabase Storage)
router.post('/audio', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  try {
    // Generate a unique filename
    const ext = req.file.originalname.split('.').pop();
    const filename = `audio/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    // Upload to Supabase Storage (bucket: 'forum-files')
    const { data, error } = await supabase.storage
      .from('forum-files')
      .upload(filename, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });
    if (error) {
      console.error('Supabase audio upload error:', error);
      return res.status(500).json({ error: 'Audio upload failed' });
    }

    // Get public URL
    const { publicURL } = supabase.storage
      .from('forum-files')
      .getPublicUrl(filename).data;

    res.json({ url: publicURL });
  } catch (error) {
    console.error('Audio upload error:', error);
    res.status(500).json({ error: 'Audio upload failed' });
  }
});


// POST /api/upload (general file upload)
router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  try {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'margaretforum' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });
    res.json({ url: result.secure_url });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// POST /api/upload/avatar (avatar upload)
router.post('/avatar', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    // Validate type
    if (!['image/jpeg', 'image/png'].includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'Only JPEG and PNG images are allowed.' });
    }
    // Validate size (max 2MB)
    if (req.file.size > 2 * 1024 * 1024) {
      return res.status(400).json({ error: 'Image size must be less than 2MB.' });
    }
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'avatars' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });
    return res.json({ url: result.secure_url });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return res.status(500).json({ error: 'Avatar upload failed', details: error?.message || error });
  }
});

// Update audio_url for a post
router.post('/audio/post/:id', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'Missing audio URL' });
  try {
    const { error } = await req.app.get('supabase')
      .from('posts')
      .update({ audio_url: url })
      .eq('id', req.params.id);
    if (error) return res.status(500).json({ error: 'Failed to update post audio URL' });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update post audio URL' });
  }
});

// Update audio_url for a comment: accept file upload, store audio, update comment
router.post('/audio/comment/:id', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  try {
    // Generate a unique filename
    const ext = req.file.originalname.split('.').pop();
    const filename = `audio/comment-${req.params.id}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    // Upload to Supabase Storage (bucket: 'forum-files')
    const { data, error } = await supabase.storage
      .from('forum-files')
      .upload(filename, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });
    if (error) {
      console.error('Supabase audio upload error:', error);
      return res.status(500).json({ error: 'Audio upload failed' });
    }

    // Get public URL
    const { publicURL } = supabase.storage
      .from('forum-files')
      .getPublicUrl(filename).data;

    // Update comment audio_url
    const { error: updateError } = await req.app.get('supabase')
      .from('comments')
      .update({ audio_url: publicURL })
      .eq('id', req.params.id);
    if (updateError) {
      return res.status(500).json({ error: 'Failed to update comment audio URL' });
    }
    res.json({ url: publicURL });
  } catch (e) {
    console.error('Comment audio upload error:', e);
    res.status(500).json({ error: 'Failed to upload and update comment audio URL' });
  }
});

export default router;
