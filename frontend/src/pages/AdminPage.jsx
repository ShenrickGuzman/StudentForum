
import { useEffect, useState } from 'react';
import api from '../lib/api';
import { useAuth } from '../state/auth';


export default function AdminPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [makeAdminName, setMakeAdminName] = useState('');
  const [makeAdminMsg, setMakeAdminMsg] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [actionMsg, setActionMsg] = useState('');
  // Signup requests state
  const [showRequests, setShowRequests] = useState(false);
  const [requests, setRequests] = useState([]);
  const [reqLoading, setReqLoading] = useState(false);
  const [reqError, setReqError] = useState('');

  const loadRequests = async () => {
    setReqLoading(true); setReqError('');
    try {
      const r = await api.get('/auth/signup-requests');
      setRequests(r.data);
    } catch (e) {
      setReqError(e?.response?.data?.error || 'Failed to load requests');
    } finally { setReqLoading(false); }
  };
  const load = () => {
    setLoading(true);
    api.get('/posts').then(r => {
      setPosts(r.data);
      setLoading(false);
    });
  };
  useEffect(() => { load(); }, []);

  // Only allow SHEN (case-insensitive, trimmed) or admin role
  const isShen = user?.name && user.name.trim().toLowerCase() === 'shen';
  if (!user || !(user.role === 'admin' || isShen)) {
    return <div className="cartoon-card mt-10 mx-auto max-w-lg text-center text-xl text-error font-bold">Access denied. Admins only.</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 to-yellow-100">
        <div className="cartoon-card text-2xl font-bold text-primary bg-white/90 p-8 shadow-fun flex flex-col items-center gap-2">
          <span className="text-4xl animate-spin">🛠️</span>
          Loading Forums for Admin...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7 font-cartoon max-w-3xl mx-auto py-8">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-4xl">🛠️</span>
        <h1 className="text-3xl font-extrabold text-accent drop-shadow">Admin Panel</h1>
      </div>

      {/* Signup Requests Toggle */}
      <div className="cartoon-card flex flex-col gap-3 border-4 border-purple-300 bg-white/90 shadow-fun">
        <div className="flex flex-wrap items-center gap-3">
          <button
            className="fun-btn px-4 py-2 text-base"
            onClick={() => { if (!showRequests) { setShowRequests(true); loadRequests(); } else setShowRequests(false); }}
          >{showRequests ? '⬅️ Back' : '📥 Show Sign Up Requests'}</button>
          {showRequests && (
            <button
              className="fun-btn px-4 py-2 text-base bg-green-200 hover:bg-green-300"
              onClick={loadRequests}
              disabled={reqLoading}
            >🔄 Refresh</button>
          )}
          {reqLoading && <span className="text-purple-600 font-bold flex items-center gap-1"><span className="animate-spin">⏳</span> Loading...</span>}
          {reqError && <span className="text-error font-bold">{reqError}</span>}
        </div>
        {showRequests && (
          <div className="space-y-3">
            {requests.length === 0 && !reqLoading && <div className="text-center text-dark/60 font-semibold">No signup requests.</div>}
            {requests.map(rq => (
              <div key={rq.id} className="flex flex-col md:flex-row md:items-center gap-3 p-3 rounded-xl border-2 border-purple-200 bg-purple-50">
                <div className="flex-1">
                  <div className="font-bold text-purple-700 text-lg flex items-center gap-2">👤 {rq.name} <span className="text-sm px-2 py-0.5 rounded-full bg-white border border-purple-200">{rq.email}</span></div>
                  <div className="text-xs text-purple-500">Requested at {new Date(rq.created_at).toLocaleString()} · Status: <b>{rq.status}</b></div>
                </div>
                {rq.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      className="fun-btn px-4 py-2 text-base bg-green-300 hover:bg-green-400"
                      onClick={async () => {
                        try { await api.post(`/auth/signup-requests/${rq.id}/approve`); loadRequests(); }
                        catch(e){ alert(e?.response?.data?.error || 'Approve failed'); }
                      }}
                    >✅ Approve</button>
                    <button
                      className="fun-btn px-4 py-2 text-base bg-error/80 hover:bg-error"
                      onClick={async () => {
                        try { await api.post(`/auth/signup-requests/${rq.id}/decline`); loadRequests(); }
                        catch(e){ alert(e?.response?.data?.error || 'Decline failed'); }
                      }}
                    >❌ Decline</button>
                  </div>
                )}
                {rq.status !== 'pending' && (
                  <div className="flex gap-2 items-center">
                    <span className="text-sm font-bold text-purple-600">{rq.status === 'approved' ? '✅ Approved' : '❌ Declined'}</span>
                    <button
                      className="fun-btn px-3 py-1 text-xs bg-error/80 hover:bg-error"
                      onClick={async () => {
                        if (!window.confirm('Delete this request log permanently?')) return;
                        try { await api.delete(`/auth/signup-requests/${rq.id}`); loadRequests(); }
                        catch(e){ alert(e?.response?.data?.error || 'Delete failed'); }
                      }}
                    >🗑️ Delete</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
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

      {/* Posts Management (hidden when viewing requests) */}
      {!showRequests && posts.length === 0 && (
        <div className="cartoon-card text-center text-lg text-dark/60">No posts to manage.</div>
      )}
      {!showRequests && posts.map(p => (
        <div key={p.id} className="cartoon-card flex flex-col gap-2 border-4 border-primary/30 shadow-fun bg-white/90">
          {/* Forum status indicators */}
          <div className="flex gap-2 items-center mb-1">
            {p.pinned && <span className="text-accent font-bold flex items-center gap-1"><span className="text-xl">📌</span> This Forum is pinned by an admin</span>}
            {p.locked && <span className="text-error font-bold flex items-center gap-1"><span className="text-xl">🔒</span> This Forum has been locked by an admin</span>}
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
            <div className="flex-1 text-lg font-bold text-primary">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-white text-xs shadow font-bold ${
                  p.category === 'Academics' ? 'bg-blue-500' :
                  p.category === 'Class Life' ? 'bg-green-500' :
                  p.category === 'Ideas' ? 'bg-yellow-400 text-yellow-900' :
                  'bg-purple-600'
                }`}>
                  {p.category}
                </span>
                <span className="text-gray-500 text-sm">by {p.author_name}</span>
                {p.locked && <span className="ml-2 text-error text-base font-bold">🔒 Locked</span>}
                {p.pinned && <span className="ml-2 text-accent text-base font-bold">📌 Pinned</span>}
              </div>
              <div className="text-xl font-extrabold text-primary mt-1">{p.title}</div>
              <div className="text-base text-gray-700 mt-1 whitespace-pre-line bg-purple-50 rounded-xl px-3 py-2 border border-purple-100">{p.content}</div>
            </div>
            <div className="flex flex-wrap gap-2 md:ml-4 mt-2 md:mt-0">
              {!p.pinned ? (
                <button
                  className="fun-btn px-4 py-2 text-base"
                  title="Pin post"
                  onClick={async () => {
                    setActionMsg('');
                    try {
                      await api.post(`/posts/${p.id}/pin`);
                      load();
                    } catch (e) {
                      setActionMsg(e?.response?.data?.error || 'Failed to pin post');
                    }
                  }}
                >📌 Pin</button>
              ) : (
                <button
                  className="fun-btn px-4 py-2 text-base bg-accent/80 hover:bg-accent"
                  title="Unpin post"
                  onClick={async () => {
                    setActionMsg('');
                    try {
                      await api.post(`/posts/${p.id}/unpin`);
                      load();
                    } catch (e) {
                      setActionMsg(e?.response?.data?.error || 'Failed to unpin post');
                    }
                  }}
                >❌ Unpin</button>
              )}
              {!p.locked ? (
                <button
                  className="fun-btn px-4 py-2 text-base bg-yellow-200 hover:bg-yellow-300"
                  title="Lock post (disable comments)"
                  onClick={async () => {
                    setActionMsg('');
                    try {
                      await api.post(`/posts/${p.id}/lock`);
                      load();
                    } catch (e) {
                      setActionMsg(e?.response?.data?.error || 'Failed to lock post');
                    }
                  }}
                >🔒 Lock</button>
              ) : (
                <button
                  className="fun-btn px-4 py-2 text-base bg-green-200 hover:bg-green-300"
                  title="Unlock post"
                  onClick={async () => {
                    setActionMsg('');
                    try {
                      await api.post(`/posts/${p.id}/unlock`);
                      load();
                    } catch (e) {
                      setActionMsg(e?.response?.data?.error || 'Failed to unlock post');
                    }
                  }}
                >🔓 Unlock</button>
              )}
              <button
                className={`fun-btn px-4 py-2 text-base bg-error/80 hover:bg-error ${deletingId === p.id ? 'opacity-60 cursor-not-allowed' : ''}`}
                title="Delete post"
                disabled={deletingId === p.id}
                onClick={async () => {
                  if (!window.confirm('Are you sure you want to delete this forum?')) return;
                  setDeletingId(p.id);
                  setActionMsg('Deleting Forum...');
                  try {
                    await api.delete(`/posts/${p.id}`);
                    setActionMsg('');
                    setDeletingId(null);
                    load();
                  } catch (e) {
                    setActionMsg(e?.response?.data?.error || 'Failed to delete post');
                    setDeletingId(null);
                  }
                }}
              >{deletingId === p.id ? 'Deleting Forum...' : '🗑️ Delete'}</button>
            </div>
          </div>
        </div>
  ))}
  {actionMsg && <div className="text-center text-error font-bold mt-4">{actionMsg}</div>}
    </div>
  );
}


