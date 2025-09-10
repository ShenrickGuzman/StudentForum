import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

export default function NewPostPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Academics');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    } else {
      setImageFile(null);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    let finalImageUrl = imageUrl;
    if (imageFile) {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', imageFile);
      try {
        const res = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        finalImageUrl = res.data.url;
      } catch (err) {
        alert('Image upload failed.');
        setUploading(false);
        return;
      }
      setUploading(false);
    }
    await api.post('/posts', { title, content, category, imageUrl: finalImageUrl, linkUrl });
    navigate('/');
  };

  return (
    <div className="min-h-screen w-full font-cartoon relative overflow-x-hidden" style={{background: 'linear-gradient(120deg, #ffe0c3 0%, #fcb7ee 100%)'}}>
      {/* Floating pastel circles */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none">
        <span className="absolute left-8 top-8 w-20 h-20 rounded-full bg-yellow-200 opacity-30"></span>
        <span className="absolute right-10 top-24 w-12 h-12 rounded-full bg-green-200 opacity-20"></span>
        <span className="absolute left-1/4 bottom-10 w-32 h-32 rounded-full bg-pink-200 opacity-20"></span>
        <span className="absolute right-1/3 top-1/2 w-16 h-16 rounded-full bg-blue-200 opacity-20"></span>
        <span className="absolute left-10 bottom-24 w-12 h-12 rounded-full bg-purple-200 opacity-20"></span>
        <span className="absolute right-8 bottom-8 w-24 h-24 rounded-full bg-yellow-100 opacity-30"></span>
      </div>
      <form
        onSubmit={submit}
        className="relative z-10 max-w-2xl mx-auto mt-16 p-10 flex flex-col gap-6 bg-white/90 rounded-3xl shadow-2xl border-4 border-purple-200"
        style={{ backdropFilter: 'blur(4px)' }}
      >
        <div className="flex items-center gap-3 mb-2 justify-center">
          <span className="text-4xl">✏️</span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-purple-700 drop-shadow-lg text-center">Create a Post</h1>
        </div>
        <input
          className="rounded-xl px-4 py-3 border-2 border-purple-100 w-full text-lg focus:ring-2 focus:ring-pink-200 outline-none transition-all bg-white"
          placeholder="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />
        <select
          className="rounded-xl px-4 py-3 border-2 border-purple-100 w-full text-lg focus:ring-2 focus:ring-pink-200 outline-none transition-all bg-white"
          value={category}
          onChange={e => setCategory(e.target.value)}
        >
          <option>Academics</option>
          <option>Class Life</option>
          <option>Ideas</option>
          <option>Random</option>
        </select>
        <textarea
          className="rounded-xl px-4 py-3 border-2 border-purple-100 w-full min-h-[140px] text-lg focus:ring-2 focus:ring-pink-200 outline-none transition-all bg-white"
          placeholder="Content"
          value={content}
          onChange={e => setContent(e.target.value)}
          required
        />
        <div>
          <label className="block mb-1 font-bold text-purple-700">Upload a Photo/File (optional)</label>
          <input
            type="file"
            accept="image/*"
            className="block w-full text-lg border-2 border-purple-100 rounded-xl px-4 py-2 bg-white focus:ring-2 focus:ring-pink-200 outline-none transition-all"
            onChange={handleFileChange}
          />
          <div className="text-xs text-gray-400 mt-1">Or paste an image URL below</div>
          <input
            className="rounded-xl px-4 py-3 border-2 border-purple-100 w-full text-lg focus:ring-2 focus:ring-pink-200 outline-none transition-all bg-white mt-1"
            placeholder="Image URL (optional)"
            value={imageUrl}
            onChange={e => setImageUrl(e.target.value)}
            disabled={uploading}
          />
        </div>
        <input
          className="rounded-xl px-4 py-3 border-2 border-purple-100 w-full text-lg focus:ring-2 focus:ring-pink-200 outline-none transition-all bg-white"
          placeholder="Link URL (optional)"
          value={linkUrl}
          onChange={e => setLinkUrl(e.target.value)}
        />
        <button className="w-full text-lg py-3 mt-2 rounded-xl font-bold shadow-lg bg-gradient-to-r from-pink-400 to-orange-300 hover:from-pink-500 hover:to-orange-400 text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60" type="submit" disabled={uploading}>
          {uploading ? <span className="animate-spin">🖼️</span> : <span>🎉</span>} {uploading ? 'Uploading...' : 'Post'}
        </button>
      </form>
    </div>
  );
}


