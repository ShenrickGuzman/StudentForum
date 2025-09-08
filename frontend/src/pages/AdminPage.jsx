import { useEffect, useState } from 'react';
import api from '../lib/api';

export default function AdminPage() {
  const [posts, setPosts] = useState([]);
  const load = () => api.get('/posts').then(r => setPosts(r.data));
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-5 font-cartoon">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-4xl">🛠️</span>
        <h1 className="text-3xl font-extrabold text-accent drop-shadow">Admin Panel</h1>
      </div>
      {posts.length === 0 && (
        <div className="cartoon-card text-center text-lg text-dark/60">No posts to manage.</div>
      )}
      {posts.map(p => (
        <div key={p.id} className="cartoon-card flex items-center gap-4 border-4 border-primary/30 shadow-fun bg-white/90">
          <div className="flex-1 text-lg font-bold text-primary">{p.title}</div>
          {!p.pinned ? (
            <button
              className="fun-btn px-4 py-2 text-base"
              title="Pin post"
              onClick={async () => { await api.post(`/posts/${p.id}/pin`); load(); }}
            >📌 Pin</button>
          ) : (
            <button
              className="fun-btn px-4 py-2 text-base bg-accent/80 hover:bg-accent"
              title="Unpin post"
              onClick={async () => { await api.post(`/posts/${p.id}/unpin`); load(); }}
            >❌ Unpin</button>
          )}
          <button
            className="fun-btn px-4 py-2 text-base bg-error/80 hover:bg-error"
            title="Delete post"
            onClick={async () => { await api.delete(`/posts/${p.id}`); load(); }}
          >🗑️ Delete</button>
        </div>
      ))}
    </div>
  );
}


