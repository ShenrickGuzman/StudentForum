
import express from 'express';
import multer from 'multer';
import cloudinary from 'cloudinary';
import { supabase } from '../lib/supabaseClient.js';

const router = express.Router();

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

// General file upload (POST /api/upload)
router.post('/', upload.single('file'), async (req, res) => {
  console.log('--- File upload request received ---');
  console.log('Request headers:', req.headers);
  console.log('Request body:', req.body);
  console.log('Request file:', req.file);
  try {
    console.log('Uploading image to Supabase Storage:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
    const ext = req.file.originalname.split('.').pop();
    const filename = `images/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const { data, error } = await supabase.storage
      .from('forum-files')
      .upload(filename, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });
    if (error) {
      console.error('Supabase image upload error:', error);
      return res.status(500).json({ error: 'Image upload failed' });
    }
    const projectRef = 'xuezboawkhqlkdaspkos';
    const publicUrl = `https://${projectRef}.supabase.co/storage/v1/object/public/forum-files/${data.path}`;
    console.log('Image upload successful, preparing to send response:', publicUrl);
    res.json({ url: publicUrl });
    console.log('Response sent to client for image upload.');
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'Upload failed' });
  }
});

// Avatar upload (POST /api/upload/avatar)
router.post('/avatar', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  if (!['image/jpeg', 'image/png'].includes(req.file.mimetype)) {
    return res.status(400).json({ error: 'Only JPEG and PNG images are allowed.' });
  }
  if (req.file.size > 2 * 1024 * 1024) {
    return res.status(400).json({ error: 'Image size must be less than 2MB.' });
  }
  try {
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
    res.json({ url: result.secure_url });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ error: 'Avatar upload failed', details: error?.message || error });
  }
});

// Audio upload (POST /api/upload/audio)
router.post('/audio', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
    const ext = req.file.originalname.split('.').pop();
    const filename = `audio/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
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
    const projectRef = 'xuezboawkhqlkdaspkos';
    const publicUrl = `https://${projectRef}.supabase.co/storage/v1/object/public/forum-files/${data.path}`;
    res.json({ url: publicUrl });
  } catch (error) {
    console.error('Audio upload error:', error);
    res.status(500).json({ error: 'Audio upload failed' });
  }
});

// Update audio_url for a post (POST /api/upload/audio/post/:id)
router.post('/audio/post/:id', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'Missing audio URL' });
  try {
    const { error } = await supabase
      .from('posts')
      .update({ audio_url: url })
      .eq('id', req.params.id);
    if (error) return res.status(500).json({ error: 'Failed to update post audio URL' });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update post audio URL' });
  }
});

// Update audio_url for a comment (POST /api/upload/audio/comment/:id)
router.post('/audio/comment/:id', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
    const ext = req.file.originalname.split('.').pop();
    const filename = `audio/comment-${req.params.id}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
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
    const projectRef = 'xuezboawkhqlkdaspkos';
    const publicURL = `https://${projectRef}.supabase.co/storage/v1/object/public/forum-files/${data.path}`;
    // Update comment audio_url
    const { data: updatedComment, error: updateError } = await supabase
      .from('comments')
      .update({ audio_url: publicURL })
      .eq('id', req.params.id)
      .select();
    if (updateError) {
      console.error('Failed to update comment audio URL:', updateError);
      return res.status(500).json({ error: 'Failed to update comment audio URL' });
    }
    res.json({ url: publicURL, comment: updatedComment });
  } catch (e) {
    console.error('Comment audio upload error:', e);
    res.status(500).json({ error: 'Failed to upload and update comment audio URL' });
  }
});

export default router;
