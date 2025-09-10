
import { useEffect, useState } from 'react';
import api from '../lib/api';
import { useAuth } from '../state/auth';

export default function AdminPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [makeAdminName, setMakeAdminName] = useState('');
  const [makeAdminMsg, setMakeAdminMsg] = useState('');
  const load = () => api.get('/posts').then(r => setPosts(r.data));
  useEffect(() => { load(); }, []);

  // Only allow SHEN (case-insensitive) or admin role
  if (!user || !(user.role === 'admin' || user.name?.toLowerCase() === 'shen')) {
    return <div className="cartoon-card mt-10 mx-auto max-w-lg text-center text-xl text-error font-bold">Access denied. Admins only.</div>;
  }

  return (
    <div className="space-y-7 font-cartoon max-w-3xl mx-auto py-8">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-4xl">🛠️</span>
        <h1 className="text-3xl font-extrabold text-accent drop-shadow">Admin Panel</h1>
      </div>

      {/* Make Admin Section */}
      <div className="cartoon-card flex flex-col md:flex-row items-center gap-3 border-4 border-accent/30 shadow-fun bg-white/90 p-4">
        <div className="flex-1">
          <label className="font-bold text-accent">Promote user to admin:</label>
          <input
            className="rounded-xl px-4 py-2 border-2 border-accent/30 ml-2"
            placeholder="Enter username"
            value={makeAdminName}
            onChange={e => setMakeAdminName(e.target.value)}
          />
          <button
            className="fun-btn ml-2 px-4 py-2 text-base"
            onClick={async () => {
              setMakeAdminMsg('');
              try {
                await api.post('/auth/make-admin', { name: makeAdminName });
                setMakeAdminMsg(`User '${makeAdminName}' is now an admin!`);
                setMakeAdminName('');
              } catch (e) {
                setMakeAdminMsg(e?.response?.data?.error || 'Failed to promote user');
              }
            }}
          >Promote</button>
        </div>
        {makeAdminMsg && <div className="text-accent font-bold">{makeAdminMsg}</div>}
      </div>

      {/* Posts Management */}
      {posts.length === 0 && (
        <div className="cartoon-card text-center text-lg text-dark/60">No posts to manage.</div>
      )}
      {posts.map(p => (
        <div key={p.id} className="cartoon-card flex flex-col md:flex-row md:items-center gap-4 border-4 border-primary/30 shadow-fun bg-white/90">
          <div className="flex-1 text-lg font-bold text-primary">
            {p.title}
            {p.locked && <span className="ml-2 text-error text-base font-bold">🔒 Locked</span>}
            {p.pinned && <span className="ml-2 text-accent text-base font-bold">📌 Pinned</span>}
          </div>
          <div className="flex flex-wrap gap-2">
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
            {!p.locked ? (
              <button
                className="fun-btn px-4 py-2 text-base bg-yellow-200 hover:bg-yellow-300"
                title="Lock post (disable comments)"
                onClick={async () => { await api.post(`/posts/${p.id}/lock`); load(); }}
              >🔒 Lock</button>
            ) : (
              <button
                className="fun-btn px-4 py-2 text-base bg-green-200 hover:bg-green-300"
                title="Unlock post"
                onClick={async () => { await api.post(`/posts/${p.id}/unlock`); load(); }}
              >🔓 Unlock</button>
            )}
            <button
              className="fun-btn px-4 py-2 text-base bg-error/80 hover:bg-error"
              title="Delete post"
              onClick={async () => { await api.delete(`/posts/${p.id}`); load(); }}
            >🗑️ Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}


