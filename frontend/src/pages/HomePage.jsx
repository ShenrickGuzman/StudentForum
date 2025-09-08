
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

const categories = [
  { key: 'Academics', label: '📚 Academics', color: 'bg-primary/30' },
  { key: 'Class Life', label: '🎉 Class Life', color: 'bg-secondary/30' },
  { key: 'Ideas', label: '💡 Ideas & Suggestions', color: 'bg-accent/30' },
  { key: 'Random', label: '🗨️ Random Thoughts', color: 'bg-success/30' },
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
    <div className="bg-fun min-h-screen py-8 px-2 font-cartoon">
      {/* Hero Section */}
      <div className="flex flex-col items-center mb-8">
        <div className="text-7xl animate-bouncex mb-2">🦉</div>
        <h1 className="text-4xl font-extrabold text-primary drop-shadow mb-2 text-center">Welcome to the Class Forum!</h1>
        <p className="text-lg text-dark/70 text-center max-w-xl mb-4">
          A playful place to share ideas, ask questions, and connect with your classmates. Jump in and join the conversation!
        </p>
        <div className="flex gap-2 flex-wrap justify-center">
          {categories.map(c => (
            <span key={c.key} className={`px-4 py-2 rounded-cartoon font-bold text-dark/80 shadow-fun ${c.color} text-base`}>{c.label}</span>
          ))}
        </div>
      </div>

      {/* Search & Filter */}
      <div className="cartoon-card flex flex-col md:flex-row gap-3 items-center mb-6 shadow-fun border-4 border-primary/30 bg-white/80">
        <input
          className="flex-1 rounded-cartoon px-4 py-3 border-4 border-secondary text-lg focus:ring-4 focus:ring-primary outline-none transition-all"
          placeholder="Search posts..."
          value={q}
          onChange={e => setQ(e.target.value)}
        />
        <select
          className="rounded-cartoon px-4 py-3 border-4 border-secondary text-lg focus:ring-4 focus:ring-primary outline-none transition-all"
          value={cat}
          onChange={e => setCat(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map(c => (
            <option key={c.key} value={c.key}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Posts */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.length === 0 && (
          <div className="cartoon-card text-center text-xl text-dark/60 col-span-full">
            No posts yet. Be the first to start a conversation!
          </div>
        )}
        {posts.map(p => (
          <Link
            to={`/post/${p.id}`}
            key={p.id}
            className={`cartoon-card hover:scale-105 transition-transform duration-150 border-4 border-accent/30 bg-white/90 shadow-cartoon flex flex-col gap-2 relative`}
          >
            <div className="absolute top-2 right-4 text-2xl">{p.pinned ? '📌' : ''}</div>
            <div className="text-sm opacity-70 mb-1">{categories.find(c => c.key === p.category)?.label || p.category}</div>
            <div className="text-2xl font-extrabold text-primary drop-shadow mb-1">{p.title}</div>
            <div className="opacity-80 line-clamp-2 flex-1">{p.content}</div>
            <div className="mt-2 text-sm text-dark/60">by {p.author_name}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}


