import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

const categories = [
  { key: 'Academics', label: '📚 Academics', color: 'bg-lemon' },
  { key: 'Class Life', label: '🎉 Class Life', color: 'bg-mint' },
  { key: 'Ideas', label: '💡 Ideas & Suggestions', color: 'bg-pinky' },
  { key: 'Random', label: '🗨️ Random Thoughts', color: 'bg-sky' },
];

export default function HomePage() {
  const [posts, setPosts] = useState([]);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');

  useEffect(() => {
    const params = {};
    if (q) params.q = q;
    if (cat) params.category = cat;
    api.get('/posts', { params }).then(r => setPosts(r.data));
  }, [q, cat]);

  return (
    <div className="space-y-4">
      <div className="card-bubble p-4 flex gap-3 items-center">
        <input className="flex-1 rounded-full px-4 py-2 border-2" placeholder="Search posts..." value={q} onChange={e => setQ(e.target.value)} />
        <select className="rounded-full px-4 py-2 border-2" value={cat} onChange={e => setCat(e.target.value)}>
          <option value="">All</option>
          {categories.map(c => (
            <option key={c.key} value={c.key}>{c.label}</option>
          ))}
        </select>
      </div>
      <div className="grid gap-4">
        {posts.map(p => (
          <Link to={`/post/${p.id}`} key={p.id} className="card-bubble p-4 hover:scale-[1.01]">
            <div className="text-sm opacity-70">{p.pinned ? '📌 Pinned' : ''} {p.category}</div>
            <div className="text-2xl font-extrabold">{p.title}</div>
            <div className="opacity-80 line-clamp-2">{p.content}</div>
            <div className="mt-2 text-sm">by {p.author_name}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}


