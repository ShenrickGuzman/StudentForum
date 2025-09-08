import { useEffect, useState } from 'react';
import api from '../lib/api';

export default function AdminPage() {
  const [posts, setPosts] = useState([]);
  const load = () => api.get('/posts').then(r => setPosts(r.data));
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-3">
      <h1 className="text-3xl font-extrabold">Admin</h1>
      {posts.map(p => (
        <div key={p.id} className="card-bubble p-3 flex items-center gap-3">
          <div className="flex-1">{p.title}</div>
          {!p.pinned ? (
            <button className="btn-fun" onClick={async () => { await api.post(`/posts/${p.id}/pin`); load(); }}>Pin</button>
          ) : (
            <button className="btn-fun" onClick={async () => { await api.post(`/posts/${p.id}/unpin`); load(); }}>Unpin</button>
          )}
          <button className="btn-fun" onClick={async () => { await api.delete(`/posts/${p.id}`); load(); }}>Delete</button>
        </div>
      ))}
    </div>
  );
}


