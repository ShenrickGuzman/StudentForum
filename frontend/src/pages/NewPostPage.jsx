import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

export default function NewPostPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Academics');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    await api.post('/posts', { title, content, category, imageUrl, linkUrl });
    navigate('/');
  };

  return (
    <form onSubmit={submit} className="cartoon-card max-w-2xl mx-auto mt-6 p-6 flex flex-col gap-4 border-4 border-primary/30 shadow-cartoon bg-white/90 font-cartoon">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-3xl">✏️</span>
        <h1 className="text-3xl font-extrabold text-primary drop-shadow">Create a Post</h1>
      </div>
      <input
        className="rounded-cartoon px-4 py-3 border-4 border-secondary w-full text-lg focus:ring-4 focus:ring-primary outline-none transition-all"
        placeholder="Title"
        value={title}
        onChange={e => setTitle(e.target.value)}
        required
      />
      <select
        className="rounded-cartoon px-4 py-3 border-4 border-secondary w-full text-lg focus:ring-4 focus:ring-primary outline-none transition-all"
        value={category}
        onChange={e => setCategory(e.target.value)}
      >
        <option>Academics</option>
        <option>Class Life</option>
        <option>Ideas</option>
        <option>Random</option>
      </select>
      <textarea
        className="rounded-cartoon px-4 py-3 border-4 border-secondary w-full min-h-[140px] text-lg focus:ring-4 focus:ring-primary outline-none transition-all"
        placeholder="Content"
        value={content}
        onChange={e => setContent(e.target.value)}
        required
      />
      <input
        className="rounded-cartoon px-4 py-3 border-4 border-secondary w-full text-lg focus:ring-4 focus:ring-primary outline-none transition-all"
        placeholder="Image URL (optional)"
        value={imageUrl}
        onChange={e => setImageUrl(e.target.value)}
      />
      <input
        className="rounded-cartoon px-4 py-3 border-4 border-secondary w-full text-lg focus:ring-4 focus:ring-primary outline-none transition-all"
        placeholder="Link URL (optional)"
        value={linkUrl}
        onChange={e => setLinkUrl(e.target.value)}
      />
      <button className="fun-btn w-full text-lg py-3 mt-2 shadow-fun" type="submit">Post 🎉</button>
    </form>
  );
}


