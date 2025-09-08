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
    <form onSubmit={submit} className="card-bubble p-4 space-y-3">
      <h1 className="text-3xl font-extrabold">Create a Post</h1>
      <input className="rounded-full px-4 py-2 border-2 w-full" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
      <select className="rounded-full px-4 py-2 border-2 w-full" value={category} onChange={e => setCategory(e.target.value)}>
        <option>Academics</option>
        <option>Class Life</option>
        <option>Ideas</option>
        <option>Random</option>
      </select>
      <textarea className="rounded-bubble px-4 py-2 border-2 w-full min-h-[140px]" placeholder="Content" value={content} onChange={e => setContent(e.target.value)} />
      <input className="rounded-full px-4 py-2 border-2 w-full" placeholder="Image URL (optional)" value={imageUrl} onChange={e => setImageUrl(e.target.value)} />
      <input className="rounded-full px-4 py-2 border-2 w-full" placeholder="Link URL (optional)" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} />
      <button className="btn-fun" type="submit">Post</button>
    </form>
  );
}


