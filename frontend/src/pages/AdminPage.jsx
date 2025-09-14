


import { useEffect, useState } from 'react';
import api, { getAssetUrl } from '../lib/api';
import { useAuth } from '../state/auth';



export default function AdminPage() {
  // For comments in post detail modal
  const [detailComments, setDetailComments] = useState([]);
  const [detailComment, setDetailComment] = useState('');
  const [detailCommentsLoading, setDetailCommentsLoading] = useState(false);
  const { token } = useAuth();

  // (removed duplicate openPostDetail)

  // Send comment in modal
  const sendDetailComment = async () => {
    if (!detailComment.trim() || !detailPostId) return;
    try {
      await api.post(`/posts/${detailPostId}/comments`, { content: detailComment });
      setDetailComment('');
      // Reload comments
      setDetailCommentsLoading(true);
      const r = await api.get(`/posts/${detailPostId}`);
      setDetailComments(r.data.comments || []);
    } finally {
      setDetailCommentsLoading(false);
    }
  };
  // Post detail modal state
  const [detailPostId, setDetailPostId] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Load post detail and comments for modal (merged)
  const openPostDetail = async (id) => {
    setDetailPostId(id);
    setDetailLoading(true);
    setDetailData(null);
    setDetailComments([]);
    setDetailCommentsLoading(true);
    try {
      const r = await api.get(`/posts/${id}`);
      setDetailData(r.data.post);
      setDetailComments(r.data.comments || []);
    } catch (e) {
      setDetailData({ error: e?.response?.data?.error || 'Failed to load post' });
    } finally {
      setDetailLoading(false);
      setDetailCommentsLoading(false);
    }
  };
  const closePostDetail = () => {
    setDetailPostId(null);
    setDetailData(null);
    setDetailLoading(false);
  };
  const { user } = useAuth();
  // --- Posts state ---
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState('');
  const [postActionMsg, setPostActionMsg] = useState('');

  // --- Requests/Admin state ---
  const [makeAdminName, setMakeAdminName] = useState('');
  const [makeAdminMsg, setMakeAdminMsg] = useState('');
  const [showRequests, setShowRequests] = useState(false);
  const [requests, setRequests] = useState([]);
  const [reqLoading, setReqLoading] = useState(false);
  const [reqError, setReqError] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, name: '', email: '' });

  // --- Posts API handlers ---
  const loadPosts = async () => {
    setPostsLoading(true); setPostsError('');
    try {
      const r = await api.get('/posts');
      setPosts(r.data);
    } catch (e) {
      setPostsError(e?.response?.data?.error || 'Failed to load posts');
    } finally {
      setPostsLoading(false);
    }
  };

  const handleLock = async (id) => {
    setPostActionMsg('');
    try {
      await api.post(`/posts/${id}/lock`);
      setPostActionMsg('🔒 Post locked!');
      loadPosts();
    } catch (e) {
      setPostActionMsg(e?.response?.data?.error || 'Failed to lock post');
    }
  };
  const handleUnlock = async (id) => {
    setPostActionMsg('');
    try {
      await api.post(`/posts/${id}/unlock`);
      setPostActionMsg('🔓 Post unlocked!');
      loadPosts();
    } catch (e) {
      setPostActionMsg(e?.response?.data?.error || 'Failed to unlock post');
    }
  };
  const handlePin = async (id) => {
    setPostActionMsg('');
    try {
      await api.post(`/posts/${id}/pin`);
      setPostActionMsg('📌 Post pinned!');
      loadPosts();
    } catch (e) {
      setPostActionMsg(e?.response?.data?.error || 'Failed to pin post');
    }
  };
  const handleUnpin = async (id) => {
    setPostActionMsg('');
    try {
      await api.post(`/posts/${id}/unpin`);
      setPostActionMsg('📌 Post unpinned!');
      loadPosts();
    } catch (e) {
      setPostActionMsg(e?.response?.data?.error || 'Failed to unpin post');
    }
  };
  const handleDeletePost = async (id) => {
    setPostActionMsg('');
    try {
      await api.delete(`/posts/${id}`);
      setPostActionMsg('🗑️ Post deleted!');
      loadPosts();
    } catch (e) {
      setPostActionMsg(e?.response?.data?.error || 'Failed to delete post');
    }
  };

  // Load signup requests
  const loadRequests = async () => {
    setReqLoading(true); setReqError('');
    try {
      const r = await api.get('/auth/signup-requests');
      setRequests(r.data);
    } catch (e) {
      setReqError(e?.response?.data?.error || 'Failed to load requests');
    } finally {
      setReqLoading(false);
    }
  };

  // Approve/Decline/Delete actions
  const handleApprove = async (id) => {
    setActionMsg('');
    try {
      await api.post(`/auth/signup-requests/${id}/approve`);
      setActionMsg('✅ Approved!');
      loadRequests();
    } catch (e) {
      setActionMsg(e?.response?.data?.error || 'Failed to approve');
    }
  };
  const handleDecline = async (id) => {
    setActionMsg('');
    try {
      await api.post(`/auth/signup-requests/${id}/decline`);
      setActionMsg('❌ Declined!');
      loadRequests();
    } catch (e) {
      setActionMsg(e?.response?.data?.error || 'Failed to decline');
    }
  };
  const handleDelete = async (id) => {
    setActionMsg('');
    try {
      await api.delete(`/auth/signup-requests/${id}`);
      setActionMsg('🗑️ Deleted!');
      setDeleteModal({ open: false, id: null, name: '', email: '' });
      loadRequests();
    } catch (e) {
      setActionMsg(e?.response?.data?.error || 'Failed to delete');
    }
  };

  // Grant admin
  const handleMakeAdmin = async (e) => {
    e.preventDefault();
    setMakeAdminMsg('');
    try {
      await api.post('/auth/make-admin', { name: makeAdminName });
      setMakeAdminMsg('🎉 User promoted to admin!');
      setMakeAdminName('');
    } catch (e) {
      setMakeAdminMsg(e?.response?.data?.error || 'Failed to promote');
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  useEffect(() => {
    if (showRequests) loadRequests();
  }, [showRequests]);

  // --- UI ---
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

      {/* Admin Panel Section (moved to top) */}
      <div className="relative z-10 max-w-3xl mx-auto py-12 flex flex-col gap-8">
        <div className="cartoon-card border-4 border-accent shadow-cartoon flex flex-col items-center gap-4 bg-white/90">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">�️</span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-accent drop-shadow-lg text-center">Admin Panel</h1>
          </div>
          <form onSubmit={handleMakeAdmin} className="flex flex-col md:flex-row gap-3 items-center w-full justify-center">
            <input
              className="rounded-xl px-4 py-3 border-2 border-accent w-full text-lg focus:ring-2 focus:ring-pink-200 outline-none transition-all bg-white"
              placeholder="Username to promote to admin"
              value={makeAdminName}
              onChange={e => setMakeAdminName(e.target.value)}
            />
            <button className="fun-btn px-6 py-3 text-lg" type="submit">Promote ✨</button>
          </form>
          {makeAdminMsg && <div className="text-success font-bold mt-1">{makeAdminMsg}</div>}
          <button
            className="fun-btn px-6 py-3 text-lg mt-4"
            onClick={() => setShowRequests(v => !v)}
          >{showRequests ? 'Hide Sign Up Requests' : 'Show Sign Up Requests'} <span className="ml-1">📨</span></button>
        </div>

        {showRequests && (
          <div className="cartoon-card border-4 border-primary shadow-fun bg-white/90">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">�</span>
              <h2 className="text-2xl font-bold text-primary drop-shadow">Sign Up Requests</h2>
              <button className="ml-auto fun-btn px-4 py-2 text-base" onClick={loadRequests}>Refresh 🔄</button>
            </div>
            {reqLoading && <div className="text-lg text-info font-bold flex items-center gap-2"><span className="animate-spin">⏳</span> Loading requests...</div>}
            {reqError && <div className="text-error font-bold">{reqError}</div>}
            {actionMsg && <div className="text-success font-bold animate-bouncex">{actionMsg}</div>}
            <div className="flex flex-col gap-4 mt-4">
              {requests.length === 0 && !reqLoading && <div className="text-gray-400 text-base">No pending requests.</div>}
              {requests.map(r => (
                <div key={r.id} className="flex flex-col md:flex-row items-center gap-3 p-4 rounded-cartoon border-2 border-primary bg-yellow-50/60 shadow-fun">
                  <div className="flex-1 flex flex-col md:flex-row md:items-center gap-2">
                    <span className="text-2xl">👤</span>
                    <span className="font-bold text-lg text-dark">{r.name}</span>
                    <span className="text-base text-gray-500">{r.email}</span>
                    <span className="text-xs text-gray-400 ml-2">{new Date(r.created_at).toLocaleString()}</span>
                    {/* Status badge */}
                    {r.status === 'approved' && <span className="ml-3 px-3 py-1 rounded-full bg-success/20 text-success font-bold text-xs flex items-center gap-1">Approved <span>✅</span></span>}
                    {r.status === 'declined' && <span className="ml-3 px-3 py-1 rounded-full bg-error/20 text-error font-bold text-xs flex items-center gap-1">Declined <span>❌</span></span>}
                  </div>
                  <div className="flex gap-2 mt-2 md:mt-0">
                    {r.status === 'pending' && <>
                      <button className="fun-btn px-4 py-2 text-base" onClick={() => handleApprove(r.id)}>Approve ✅</button>
                      <button className="fun-btn px-4 py-2 text-base bg-gradient-to-r from-pink-400 to-orange-400 hover:from-pink-500 hover:to-orange-500" onClick={() => handleDecline(r.id)}>Decline ❌</button>
                    </>}
                    <button className="fun-btn px-4 py-2 text-base bg-gradient-to-r from-gray-400 to-gray-600 hover:from-gray-500 hover:to-gray-700" onClick={() => setDeleteModal({ open: true, id: r.id, name: r.name, email: r.email })}>Delete 🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {deleteModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="cartoon-card border-4 border-error bg-white/95 shadow-2xl flex flex-col items-center gap-4 max-w-sm w-full animate-wiggle">
              <div className="text-5xl">�️</div>
              <div className="text-2xl font-extrabold text-error text-center">Delete this log permanently?</div>
              <div className="text-lg text-dark text-center">{deleteModal.name} <span className="text-gray-400">({deleteModal.email})</span></div>
              <div className="flex gap-4 mt-2">
                <button className="fun-btn px-5 py-2 text-base bg-gradient-to-r from-gray-400 to-gray-600 hover:from-gray-500 hover:to-gray-700" onClick={() => setDeleteModal({ open: false, id: null, name: '', email: '' })}>Cancel</button>
                <button className="fun-btn px-5 py-2 text-base bg-gradient-to-r from-pink-400 to-orange-400 hover:from-pink-500 hover:to-orange-500" onClick={() => handleDelete(deleteModal.id)}>Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Post Detail Modal (admin view) */}
      {detailPostId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="cartoon-card border-4 border-purple-400 bg-white/95 shadow-2xl flex flex-col items-center gap-4 max-w-2xl w-full animate-wiggle p-8 relative">
            <button className="absolute top-2 right-2 text-2xl font-bold text-gray-400 hover:text-error" onClick={closePostDetail}>✖</button>
            {detailLoading && <div className="text-xl font-bold text-primary flex items-center gap-2"><span className="animate-spin">💬</span> Loading post...</div>}
            {detailData && detailData.error && <div className="text-error font-bold">{detailData.error}</div>}
            {detailData && !detailData.error && (
              <>
                <div className="flex gap-2 items-center mb-1 justify-center">
                  {detailData.pinned && <span className="text-accent font-bold flex items-center gap-1"><span className="text-xl">📌</span> Pinned</span>}
                  {detailData.locked && <span className="text-error font-bold flex items-center gap-1"><span className="text-xl">🔒</span> Locked</span>}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{detailData.pinned ? '📌' : ''}</span>
                  <span className={`px-3 py-1 rounded-full text-white text-xs shadow font-bold ${
                    detailData.category === 'Academics' ? 'bg-blue-500' :
                    detailData.category === 'Class Life' ? 'bg-green-500' :
                    detailData.category === 'Ideas' ? 'bg-yellow-400 text-yellow-900' :
                    'bg-purple-600'
                  }`}>
                    {detailData.category}
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-purple-700 mb-2 text-center drop-shadow-lg flex items-center justify-center gap-3">
                  {detailData.title}
                  {detailData.locked && <span className="text-error text-2xl font-bold ml-2">🔒</span>}
                </h1>
                {detailData.image_url && <img alt="" className="rounded-2xl my-2 max-h-64 object-contain mx-auto border-2 border-purple-100" src={getAssetUrl(detailData.image_url)} />}
                <p className="whitespace-pre-wrap text-lg md:text-xl font-semibold text-gray-700 text-center max-w-2xl mx-auto mb-2 drop-shadow-lg bg-white/80 rounded-xl px-4 py-2 border border-purple-100" style={{fontWeight: 600}}>{detailData.content}</p>
                {detailData.link_url && <a className="text-pink-500 underline font-bold" href={detailData.link_url} target="_blank" rel="noreferrer">🔗 Visit link</a>}
                {/* Comments Section */}
                <div className="bg-white rounded-3xl shadow-2xl p-6 border-4 border-pink-200 w-full mt-4">
                  <h2 className="text-2xl font-bold mb-3 text-pink-500 drop-shadow flex items-center gap-2">💬 Comments {detailData.locked && <span className="text-error text-lg">(Locked)</span>}</h2>
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {detailCommentsLoading && <div className="text-gray-400 text-base">Loading comments...</div>}
                    {!detailCommentsLoading && detailComments.length === 0 && <div className="text-gray-400 text-base">No comments yet. Be the first!</div>}
                    {detailComments.map(c => (
                      <div key={c.id} className="p-3 rounded-xl border-2 border-purple-100 bg-purple-50 flex items-center gap-2">
                        <span className="text-lg">🗨️</span>
                        <span className="flex-1 text-gray-700">{c.content}</span>
                        <span className="opacity-70 text-sm text-gray-500">- {c.author_name}</span>
                      </div>
                    ))}
                  </div>
                  {token && !detailData.locked && (
                    <div className="mt-6 flex gap-2">
                      <input
                        className="flex-1 rounded-xl px-4 py-3 border-2 border-pink-200 text-lg focus:ring-2 focus:ring-pink-200 outline-none transition-all bg-white"
                        value={detailComment}
                        onChange={e => setDetailComment(e.target.value)}
                        placeholder="Write a comment"
                      />
                      <button className="rounded-xl px-6 py-3 text-lg font-bold bg-gradient-to-r from-pink-400 to-orange-300 hover:from-pink-500 hover:to-orange-400 text-white shadow-lg transition-all" onClick={sendDetailComment}>Send 💬</button>
                    </div>
                  )}
                  {token && detailData.locked && (
                    <div className="mt-6 text-center text-error font-bold">Comments are locked for this post.</div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Forum Posts Section (moved below admin panel) */}
      <div className="cartoon-card border-4 border-secondary shadow-fun bg-white/90 mt-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">📝</span>
          <h2 className="text-2xl font-bold text-secondary drop-shadow">All Forum Posts</h2>
          <button className="ml-auto fun-btn px-4 py-2 text-base" onClick={loadPosts}>Refresh 🔄</button>
        </div>
        {postsLoading && <div className="text-lg text-info font-bold flex items-center gap-2"><span className="animate-spin">⏳</span> Loading posts...</div>}
        {postsError && <div className="text-error font-bold">{postsError}</div>}
        {postActionMsg && <div className="text-success font-bold animate-bouncex">{postActionMsg}</div>}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-4">
          {posts.length === 0 && !postsLoading && <div className="text-gray-400 text-base col-span-full">No posts yet.</div>}
          {posts.map(p => (
            <div key={p.id} className="bg-white/90 rounded-2xl shadow-xl border-2 border-white/60 flex flex-col gap-2 p-4 relative">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{p.pinned ? '📌' : ''}</span>
                <span className={`px-3 py-1 rounded-full text-white text-xs shadow font-bold ${
                  p.category === 'Academics' ? 'bg-blue-500' :
                  p.category === 'Class Life' ? 'bg-green-500' :
                  p.category === 'Ideas' ? 'bg-yellow-400 text-yellow-900' :
                  'bg-purple-600'
                }`}>
                  {p.category}
                </span>
                {p.locked && <span className="ml-2 px-2 py-1 rounded-full bg-error/20 text-error font-bold text-xs flex items-center gap-1">Locked <span>🔒</span></span>}
                {!p.locked && <span className="ml-2 px-2 py-1 rounded-full bg-success/20 text-success font-bold text-xs flex items-center gap-1">Open <span>💬</span></span>}
              </div>
              <div className="text-lg font-extrabold text-gray-800 drop-shadow mb-1">{p.title}</div>
              <div className="opacity-80 line-clamp-2 flex-1 text-gray-700">{p.content}</div>
              <div className="mt-2 text-sm text-gray-400 flex items-center gap-2">
                <span>👤</span> {p.author_name}
              </div>
              {p.image_url && (
                <div className="w-full h-32 rounded-xl shadow-md overflow-hidden mt-2">
                  <img
                    src={getAssetUrl(p.image_url)}
                    alt="Post image"
                    className="w-full h-full object-cover"
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                </div>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
                <button className="fun-btn px-4 py-2 text-base bg-gradient-to-r from-purple-400 to-blue-400 hover:from-purple-500 hover:to-blue-500" onClick={() => openPostDetail(p.id)}>Open</button>
                {p.locked
                  ? <button className="fun-btn px-4 py-2 text-base bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600" onClick={() => handleUnlock(p.id)}>Unlock 🔓</button>
                  : <button className="fun-btn px-4 py-2 text-base bg-gradient-to-r from-pink-400 to-orange-400 hover:from-pink-500 hover:to-orange-500" onClick={() => handleLock(p.id)}>Lock 🔒</button>
                }
                {p.pinned
                  ? <button className="fun-btn px-4 py-2 text-base bg-gradient-to-r from-gray-400 to-gray-600 hover:from-gray-500 hover:to-gray-700" onClick={() => handleUnpin(p.id)}>Unpin 📌</button>
                  : <button className="fun-btn px-4 py-2 text-base bg-gradient-to-r from-yellow-400 to-pink-400 hover:from-yellow-500 hover:to-pink-500" onClick={() => handlePin(p.id)}>Pin 📌</button>
                }
                <button className="fun-btn px-4 py-2 text-base bg-gradient-to-r from-red-400 to-pink-500 hover:from-red-500 hover:to-pink-600" onClick={() => handleDeletePost(p.id)}>Delete 🗑️</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


