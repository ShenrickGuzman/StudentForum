import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

const DRAFT_KEY = 'mf_newpost_draft';
export default function NewPostPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Academics');
  const [linkUrl, setLinkUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      try {
        const data = JSON.parse(draft);
        if (data.title) setTitle(data.title);
        if (data.content) setContent(data.content);
        if (data.category) setCategory(data.category);
        if (data.linkUrl) setLinkUrl(data.linkUrl);
      } catch {}
    }
    // eslint-disable-next-line
  }, []);

  // Auto-save draft as user types
  useEffect(() => {
    const draft = { title, content, category, linkUrl };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [title, content, category, linkUrl]);

  function handleFileChange(e) {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  }

  async function submit(e) {
    e.preventDefault();
    setUploading(true);
    try {
      let imageUrl = '';
      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        const uploadRes = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        imageUrl = uploadRes.data.url;
      }
      await api.post('/posts', {
        title,
        content,
        category,
        linkUrl,
        imageUrl,
      });
      // Clear draft on successful submit
      localStorage.removeItem(DRAFT_KEY);
      navigate('/');
    } catch (err) {
      alert('Failed to post. Please try again!');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="min-h-screen w-full font-cartoon relative overflow-x-hidden" style={{background: 'linear-gradient(120deg, #ffe0c3 0%, #fcb7ee 100%)', fontFamily: 'Fredoka, Comic Neue, Baloo, cursive'}}>
      {/* Floating pastel circles and extra playful shapes */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none">
        <span className="absolute left-8 top-8 w-20 h-20 rounded-full bg-yellow-200 opacity-30 animate-bounce-slow"></span>
        <span className="absolute right-10 top-24 w-12 h-12 rounded-full bg-green-200 opacity-20 animate-spin-slow"></span>
        <span className="absolute left-1/4 bottom-10 w-32 h-32 rounded-full bg-pink-200 opacity-20 animate-bounce-short"></span>
        <span className="absolute right-1/3 top-1/2 w-16 h-16 rounded-full bg-blue-200 opacity-20 animate-bounce-slow"></span>
        <span className="absolute left-10 bottom-24 w-12 h-12 rounded-full bg-purple-200 opacity-20 animate-spin-slow"></span>
        <span className="absolute right-8 bottom-8 w-24 h-24 rounded-full bg-yellow-100 opacity-30 animate-bounce-short"></span>
        {/* Extra playful stars */}
        <span className="absolute left-1/2 top-1/4 text-yellow-400 text-4xl opacity-40 select-none">★</span>
        <span className="absolute right-1/4 bottom-1/3 text-pink-400 text-3xl opacity-30 select-none">★</span>
      </div>
      <form
        onSubmit={submit}
        className="relative z-10 max-w-2xl mx-auto mt-16 p-10 flex flex-col gap-7 bg-white/95 rounded-[2.5rem] shadow-fun border-4 border-pink-200 animate-pop"
        style={{ backdropFilter: 'blur(6px)', boxShadow: '0 8px 32px 0 rgba(255, 182, 193, 0.25), 0 1.5px 0 0 #fcb7ee' }}
      >
        <button
          type="button"
          className="absolute left-4 top-4 px-5 py-2 rounded-full bg-gradient-to-r from-yellow-200 via-pink-200 to-pink-300 text-purple-800 font-extrabold shadow-fun border-4 border-pink-200 hover:scale-110 hover:bg-yellow-100 transition-all flex items-center gap-2 drop-shadow-lg hover:drop-shadow-2xl"
          onClick={() => navigate('/')}
          style={{zIndex: 20, fontFamily: 'Baloo, Fredoka, Comic Neue, cursive'}}
          aria-label="Back to Home"
        >
          <span className="text-2xl">⬅️</span> <span className="hidden sm:inline">Back</span>
        </button>
        <div className="flex items-center gap-3 mb-2 justify-center">
          <span className="text-5xl animate-wiggle">✏️</span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-pink-500 drop-shadow-lg text-center font-cartoon" style={{fontFamily: 'Fredoka, Comic Neue, Baloo, cursive', letterSpacing: 2}}>Create a Post</h1>
        </div>
        <input
          className="rounded-3xl px-7 py-5 border-4 border-yellow-200 w-full text-2xl font-extrabold focus:ring-4 focus:ring-pink-200 outline-none transition-all bg-pink-50 placeholder:text-purple-300 shadow-fun hover:scale-105 focus:scale-105 duration-200"
          placeholder="Title (make it fun!)"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          style={{fontFamily: 'Comic Neue, Baloo, Fredoka, cursive'}} 
        />
        <select
          className="rounded-3xl px-7 py-5 border-4 border-yellow-200 w-full text-2xl font-extrabold focus:ring-4 focus:ring-pink-200 outline-none transition-all bg-pink-50 shadow-fun hover:scale-105 focus:scale-105 duration-200"
          value={category}
          onChange={e => setCategory(e.target.value)}
          style={{fontFamily: 'Comic Neue, Baloo, Fredoka, cursive'}}
        >
          <option>Academics</option>
          <option>Class Life</option>
          <option>Ideas</option>
          <option>Random</option>
        </select>
        <textarea
          className="rounded-3xl px-7 py-5 border-4 border-yellow-200 w-full min-h-[140px] text-2xl font-extrabold focus:ring-4 focus:ring-pink-200 outline-none transition-all bg-pink-50 placeholder:text-purple-300 shadow-fun hover:scale-105 focus:scale-105 duration-200"
          placeholder="What's on your mind? (Share your story!)"
          value={content}
          onChange={e => setContent(e.target.value)}
          required
          style={{fontFamily: 'Comic Neue, Baloo, Fredoka, cursive'}}
        />
        <div>
          <label className="block mb-2 font-extrabold text-pink-500 text-lg font-cartoon">Upload a Photo/File <span className="font-normal text-purple-400">(optional)</span></label>
          <label
            htmlFor="file-upload"
            className="inline-block cursor-pointer rounded-2xl border-4 border-yellow-200 bg-pink-100 px-6 py-3 text-lg font-bold text-purple-700 shadow-fun transition-all hover:bg-yellow-100 focus:outline-none focus:ring-4 focus:ring-pink-200 hover:scale-105 duration-200"
            style={{fontFamily: 'Comic Neue, Baloo, Fredoka, cursive'}}
          >
            Choose file
          </label>
          <input
            id="file-upload"
            type="file"
            accept="image/*,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
          {imageFile && (
            <div className="mt-3 border-4 border-pink-300 rounded-2xl p-2 max-w-xs bg-white shadow-fun animate-pop">
              <img
                src={URL.createObjectURL(imageFile)}
                alt="Preview"
                className="max-w-full max-h-48 object-contain rounded-xl"
              />
            </div>
          )}
        </div>
        <input
          className="rounded-3xl px-7 py-5 border-4 border-yellow-200 w-full text-2xl font-extrabold focus:ring-4 focus:ring-pink-200 outline-none transition-all bg-pink-50 placeholder:text-purple-300 shadow-fun hover:scale-105 focus:scale-105 duration-200"
          placeholder="Link URL (optional)"
          value={linkUrl}
          onChange={e => setLinkUrl(e.target.value)}
          style={{fontFamily: 'Comic Neue, Baloo, Fredoka, cursive'}}
        />
        <button className="w-full text-2xl py-5 mt-2 rounded-3xl font-extrabold shadow-fun bg-gradient-to-r from-pink-400 via-yellow-300 to-orange-300 hover:from-pink-500 hover:via-yellow-400 hover:to-orange-400 text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60 border-4 border-yellow-200 animate-bounce-short hover:scale-105 duration-200" type="submit" disabled={uploading}>
          {uploading ? <span className="animate-spin">🖼️</span> : <span className="animate-wiggle">🎉</span>} {uploading ? 'Uploading...' : 'Post!'}
        </button>
        <div className="text-center mt-4 text-purple-400 font-bold text-lg font-cartoon animate-pop">Your draft is saved automatically! 📝</div>
      </form>
    </div>
  );
}
