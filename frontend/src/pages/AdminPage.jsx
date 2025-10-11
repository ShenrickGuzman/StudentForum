  // State for post delete confirmation modal
  const [deletePostModal, setDeletePostModal] = useState({ open: false, id: null });

import { useEffect, useState } from 'react';
import api, { getAssetUrl } from '../lib/api';
import { useAuth } from '../state/auth';
import PostDetailPage from './PostDetailPage';

export default function AdminPage() {
  // ...existing code...
  const [warnUserModal, setWarnUserModal] = useState({ open: false, id: null, name: '', email: '' });
  const [warnReason, setWarnReason] = useState('');
  const [warnLoading, setWarnLoading] = useState(false);
  const [warnMsg, setWarnMsg] = useState('');

  const handleWarnUser = async () => {
    if (!warnReason) { setWarnMsg('Please enter a reason.'); return; }
    setWarnLoading(true); setWarnMsg('');
    try {
      const r = await api.post(`/auth/users/${warnUserModal.id}/warn`, { reason: warnReason });
      if (r.data.deleted) {
        setWarnMsg('User deleted after 3 warnings.');
      } else {
        setWarnMsg('Warning sent!');
      }
      setWarnReason('');
      loadUsers();
    } catch (e) {
      setWarnMsg(e?.response?.data?.error || 'Failed to send warning');
    }
    setWarnLoading(false);
  };
  
   // Lock a post
  const handleLock = async (id) => {
    try {
      await api.post(`/posts/${id}/lock`);
      setPendingActionMsg('🔒 Post locked!');
      loadPendingPosts && loadPendingPosts();
      loadPosts && loadPosts();
    } catch (e) {
      setPendingActionMsg(e?.response?.data?.error || 'Failed to lock post');
    }
  };

  // Unlock a post
  const handleUnlock = async (id) => {
    try {
      await api.post(`/posts/${id}/unlock`);
      setPendingActionMsg('🔓 Post unlocked!');
      loadPendingPosts && loadPendingPosts();
      loadPosts && loadPosts();
    } catch (e) {
      setPendingActionMsg(e?.response?.data?.error || 'Failed to unlock post');
    }
  };

  // Pin a post
  const handlePin = async (id) => {
    try {
      await api.post(`/posts/${id}/pin`);
      setPendingActionMsg('📌 Post pinned!');
      loadPendingPosts && loadPendingPosts();
      loadPosts && loadPosts();
    } catch (e) {
      setPendingActionMsg(e?.response?.data?.error || 'Failed to pin post');
    }
  };

  // Unpin a post
  const handleUnpin = async (id) => {
    try {
      await api.post(`/posts/${id}/unpin`);
      setPendingActionMsg('📌 Post unpinned!');
      loadPendingPosts && loadPendingPosts();
      loadPosts && loadPosts();
    } catch (e) {
      setPendingActionMsg(e?.response?.data?.error || 'Failed to unpin post');
    }
  };

  // Delete a rejected post (user only)
  const handleDeleteRejectedPost = async (id) => {
    setPendingActionMsg('');
    try {
      await api.delete(`/posts/${id}/cancel`);
      setPendingActionMsg('🗑️ Post deleted!');
      loadPendingPosts();
    } catch (e) {
      setPendingActionMsg(e?.response?.data?.error || 'Failed to delete post');
    }
  };
  // Pending posts for admin moderation
  const [pendingPosts, setPendingPosts] = useState([]);
  const [pendingPostsLoading, setPendingPostsLoading] = useState(false);
  const [pendingPostsError, setPendingPostsError] = useState('');
  const [pendingActionMsg, setPendingActionMsg] = useState('');

  // Load all pending posts for admin
  const loadPendingPosts = async () => {
    setPendingPostsLoading(true); setPendingPostsError('');
    try {
      const r = await api.get('/posts', { params: { status: 'pending', admin: 1 } });
      setPendingPosts(r.data);
    } catch (e) {
      setPendingPostsError(e?.response?.data?.error || 'Failed to load pending posts');
    } finally {
      setPendingPostsLoading(false);
    }
  };

  // Approve a pending post
  const handleApprovePost = async (id) => {
    setPendingActionMsg('');
    try {
      await api.post(`/posts/${id}/approve`);
      setPendingActionMsg('✅ Post approved!');
      loadPendingPosts();
    } catch (e) {
      setPendingActionMsg(e?.response?.data?.error || 'Failed to approve post');
    }
  };

  // Reject a pending post
  const handleRejectPost = async (id) => {
    setPendingActionMsg('');
    try {
      await api.post(`/posts/${id}/reject`);
      setPendingActionMsg('❌ Post rejected!');
      loadPendingPosts();
    } catch (e) {
      setPendingActionMsg(e?.response?.data?.error || 'Failed to reject post');
    }
  };
  // ...existing code...
  // --- General state hooks for admin panel ---
  const [makeAdminMsg, setMakeAdminMsg] = useState('');
  const [reqLoading, setReqLoading] = useState(false);
  const [reqError, setReqError] = useState('');
  const [requests, setRequests] = useState([]);
  const [actionMsg, setActionMsg] = useState('');
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, name: '', email: '' });
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState('');
  const [postActionMsg, setPostActionMsg] = useState('');

  // --- Posts API handlers (stubs, should be implemented or already present) ---
  // --- Posts API handlers ---
  const loadPosts = async () => {
    setPostsLoading(true); setPostsError('');
    try {
      const r = await api.get('/posts');
      setPosts(r.data);
    } catch (e) {
      setPostActionMsg(e?.response?.data?.error || 'Failed to load posts');
    } finally {
      setPostsLoading(false);
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
  const closePostDetail = () => {
    setDetailPostId(null);
    setDetailData(null);
    setDetailLoading(false);
  };
  const [makeAdminName, setMakeAdminName] = useState('');
  const [showRequests, setShowRequests] = useState(false);
  // --- User Management state ---
  const [showUsers, setShowUsers] = useState(false);
  const [users, setUsers] = useState([]);
  const [adminActionMsg, setAdminActionMsg] = useState('');
  // Remove admin role from a user
  const handleRemoveAdmin = async (userId) => {
    setAdminActionMsg('');
    try {
      await api.post(`/auth/users/${userId}/remove-admin`);
      setAdminActionMsg('Admin role removed!');
      loadUsers();
    } catch (e) {
      setAdminActionMsg(e?.response?.data?.error || 'Failed to remove admin role');
    }
  };
  const [badgeEdit, setBadgeEdit] = useState({}); // { [userId]: badgeText }
  const [badgeLoading, setBadgeLoading] = useState({}); // { [userId]: boolean }
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [userActionMsg, setUserActionMsg] = useState('');
  const [deleteUserModal, setDeleteUserModal] = useState({ open: false, id: null, name: '', email: '' });

  // Load all users with warning counts
  // Load all users with warning details
  const loadUsers = async () => {
    setUsersLoading(true); setUsersError('');
    try {
      const r = await api.get('/auth/users/warnings?details=true');
      setUsers(r.data.users);
    } catch (e) {
      setUsersError(e?.response?.data?.error || 'Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  };

  // Set or remove badge for a user
  const handleSetBadge = async (userId) => {
    setBadgeLoading(b => ({ ...b, [userId]: true }));
    setUserActionMsg('');
    try {
      const badge = badgeEdit[userId] || '';
      await api.post(`/auth/users/${userId}/badge`, { badge });
      setUserActionMsg(badge ? `🏅 Badge set!` : 'Badge removed.');
      setBadgeEdit(b => ({ ...b, [userId]: '' }));
      loadUsers();
    } catch (e) {
      setUserActionMsg(e?.response?.data?.error || 'Failed to update badge');
    } finally {
      setBadgeLoading(b => ({ ...b, [userId]: false }));
    }
  };

  // Delete user
  const handleDeleteUser = async (id) => {
    setUserActionMsg('');
    try {
      const response = await api.delete(`/auth/users/${id}`);
      const { deletedUserName } = response.data;
      
      // Check if the deleted user is the current user
      if (user && user.name === deletedUserName) {
        // Log out current user and redirect to account deleted page
        logout();
        window.location.replace('/account-deleted');
        return;
      }
      
      setUserActionMsg('🗑️ User deleted!');
      setDeleteUserModal({ open: false, id: null, name: '', email: '' });
      loadUsers();
    } catch (e) {
      setUserActionMsg(e?.response?.data?.error || 'Failed to delete user');
    }
  };
  // For comments in post detail modal
  const [detailComments, setDetailComments] = useState([]);
  const [detailComment, setDetailComment] = useState('');
  const [detailCommentsLoading, setDetailCommentsLoading] = useState(false);
  const { token, user, logout } = useAuth();

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
      setMakeAdminMsg('✅ User promoted to admin!');
      setMakeAdminName('');
    } catch (err) {
      setMakeAdminMsg(err?.response?.data?.error || 'Failed to promote user');
    }
  };

  // Automatically load posts, users, and pending posts on mount
  useEffect(() => {
  loadPosts();
  loadUsers();
  loadPendingPosts();
  loadRequests();
  }, []);

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
      <div className="relative z-10 max-w-3xl mx-auto py-12 flex flex-col gap-8">
        {/* Pending Posts Approval Section */}
        <div className="cartoon-card border-4 border-yellow-400 shadow-fun bg-white/90 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">📝</span>
            <h2 className="text-2xl font-bold text-yellow-500 drop-shadow">Pending Posts for Approval</h2>
            <button className="ml-auto fun-btn px-4 py-2 text-base" onClick={loadPendingPosts}>Refresh 🔄</button>
          </div>
          {pendingPostsLoading && <div className="text-lg text-info font-bold flex items-center gap-2"><span className="animate-spin">⏳</span> Loading pending posts...</div>}
          {pendingPostsError && <div className="text-error font-bold">{pendingPostsError}</div>}
          {pendingActionMsg && <div className="text-success font-bold animate-bouncex">{pendingActionMsg}</div>}
          <div className="flex flex-col gap-4 mt-4">
            {pendingPosts.length === 0 && !pendingPostsLoading && <div className="text-gray-400 text-base">No pending posts.</div>}
            {pendingPosts.map(p => (
              <div key={p.id} className="flex flex-col md:flex-row items-center gap-3 p-4 rounded-cartoon border-2 border-yellow-300 bg-yellow-50/60 shadow-fun">
                <div className="flex-1 flex flex-col md:flex-row md:items-center gap-2">
                  <span className="text-2xl">👤</span>
                  <span className="font-bold text-lg text-dark">{p.author_name}</span>
                  <span className="text-base text-gray-500">{p.category}</span>
                  <span className="text-xs text-gray-400 ml-2">{new Date(p.created_at).toLocaleString()}</span>
                  <span className="font-bold text-purple-700 ml-2">{p.title}</span>
                </div>
                <div className="flex gap-2 mt-2 md:mt-0">
                  {p.status === 'pending' && <>
                    <button className="fun-btn px-4 py-2 text-base" onClick={() => handleApprovePost(p.id)}>Approve ✅</button>
                    <button className="fun-btn px-4 py-2 text-base bg-gradient-to-r from-pink-400 to-orange-400 hover:from-pink-500 hover:to-orange-500" onClick={() => handleRejectPost(p.id)}>Reject ❌</button>
                  </>}
                  {p.status === 'rejected' && p.user_id === user?.id && (
                    <button className="fun-btn px-4 py-2 text-base bg-gradient-to-r from-gray-400 to-gray-600 hover:from-gray-500 hover:to-gray-700" onClick={() => handleDeleteRejectedPost(p.id)}>Delete 🗑️</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="cartoon-card border-4 border-accent shadow-cartoon flex flex-col items-center gap-4 bg-white/90">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">🛠️</span>
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
            className="fun-btn px-6 py-3 text-lg mt-2"
            onClick={() => setShowUsers(v => !v)}
          >{showUsers ? 'Hide All Accounts' : 'Show All Accounts'} <span className="ml-1">👥</span></button>
      {/* User Management Section */}
      {showUsers && (
        <>
          {/* Admin List */}
          <div className="cartoon-card border-4 border-purple-400 shadow-fun bg-white/90 mt-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🛡️</span>
              <h2 className="text-2xl font-bold text-purple-500 drop-shadow">Admin Accounts</h2>
              <button className="ml-auto fun-btn px-4 py-2 text-base" onClick={loadUsers}>Refresh 🔄</button>
            </div>
            <div className="flex flex-col gap-4 mt-4">
              {users.filter(u => u.role === 'admin').length === 0 && !usersLoading && <div className="text-gray-400 text-base">No admin users.</div>}
              {users.filter(u => u.role === 'admin').map(u => (
                <div key={u.id} className="flex flex-col md:flex-row items-center gap-3 p-4 rounded-cartoon border-2 border-purple-300 bg-purple-50/60 shadow-fun">
                  <div className="flex-1 flex flex-col md:flex-row md:items-center gap-2">
                    <span className="text-2xl">👤</span>
                    <span className="font-bold text-lg text-dark">{u.name}</span>
                    <span className="text-base text-gray-500">{u.email}</span>
                    {/* Badges display */}
                    {Array.isArray(u.badges) && u.badges.length > 0 && (
                      <div className="flex flex-wrap gap-1 ml-2">
                        {u.badges.map((badge, idx) => (
                          <span key={idx} className="px-3 py-1 rounded-full bg-yellow-200 border border-yellow-400 text-yellow-900 font-bold text-xs uppercase tracking-wider flex items-center gap-1">
                            {badge}
                            <button
                              className="ml-2 text-red-500 hover:text-red-700 font-bold text-lg px-2 py-0.5 rounded-full border-2 border-red-300 bg-red-100/70 transition-all duration-150 shadow-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                              style={{ minWidth: 32, minHeight: 32 }}
                              title={`Remove ${badge}`}
                              onClick={async () => {
                                setBadgeLoading(b => ({ ...b, [u.id]: true }));
                                setUserActionMsg('');
                                try {
                                  // Remove badge from user
                                  await api.post(`/auth/users/${u.id}/badge`, { badge, remove: true });
                                  setUserActionMsg('Badge removed.');
                                  loadUsers();
                                } catch (e) {
                                  setUserActionMsg(e?.response?.data?.error || 'Failed to remove badge');
                                } finally {
                                  setBadgeLoading(b => ({ ...b, [u.id]: false }));
                                }
                              }}
                              disabled={badgeLoading[u.id]}
                            >×</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 mt-2 md:mt-0 items-end">
                    {/* Only show Remove Admin if current user is admin AND the listed user is admin */}
                    {user?.role === 'admin' && u.role === 'admin' && (
                      <button
                        className="fun-btn px-3 py-1 text-sm bg-gradient-to-r from-red-400 to-orange-400 hover:from-red-500 hover:to-orange-500 mb-1"
                        onClick={() => handleRemoveAdmin(u.id)}
                      >Remove Admin</button>
                    )}
                    <div className="flex gap-2 items-center">
                      <input
                        className="rounded-xl px-3 py-1 border-2 border-yellow-400 w-32 text-sm focus:ring-2 focus:ring-yellow-200 outline-none transition-all bg-white"
                        placeholder="Add badge..."
                        value={badgeEdit[u.id] ?? ''}
                        onChange={e => setBadgeEdit(b => ({ ...b, [u.id]: e.target.value }))}
                        disabled={badgeLoading[u.id]}
                      />
                      <button
                        className="fun-btn px-3 py-1 text-sm"
                        onClick={() => handleSetBadge(u.id)}
                        disabled={badgeLoading[u.id]}
                      >{badgeLoading[u.id] ? 'Saving...' : 'Add'}</button>
                    </div>
                    <button className="fun-btn px-4 py-2 text-base bg-gradient-to-r from-gray-400 to-gray-600 hover:from-gray-500 hover:to-gray-700" onClick={() => setDeleteUserModal({ open: true, id: u.id, name: u.name, email: u.email })}>Delete 🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* All Users List */}
          <div className="cartoon-card border-4 border-blue-400 shadow-fun bg-white/90 mt-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">👥</span>
              <h2 className="text-2xl font-bold text-blue-500 drop-shadow">All Registered Accounts</h2>
              <button className="ml-auto fun-btn px-4 py-2 text-base" onClick={loadUsers}>Refresh 🔄</button>
            </div>
            {usersLoading && <div className="text-lg text-info font-bold flex items-center gap-2"><span className="animate-spin">⏳</span> Loading users...</div>}
            {usersError && <div className="text-error font-bold">{usersError}</div>}
            {userActionMsg && <div className="text-success font-bold animate-bouncex">{userActionMsg}</div>}
            {adminActionMsg && <div className="text-success font-bold animate-bouncex">{adminActionMsg}</div>}
            <div className="flex flex-col gap-4 mt-4">
              {users.length === 0 && !usersLoading && <div className="text-gray-400 text-base">No registered users.</div>}
              {users.map(u => (
                <div key={u.id} className="flex flex-col md:flex-row items-center gap-3 p-4 rounded-cartoon border-2 border-blue-300 bg-blue-50/60 shadow-fun">
                  <div className="flex-1 flex flex-col md:flex-row md:items-center gap-2">
                    <span className="text-2xl">👤</span>
                    <span className="font-bold text-lg text-dark">{u.name}</span>
                    <span className="text-base text-gray-500">{u.email}</span>
                    <span className="text-base text-red-500 font-bold ml-2">Warnings: {u.warningCount}</span>
                    {Array.isArray(u.warnings) && u.warnings.length > 0 && (
                      <div className="flex flex-col gap-1 ml-2">
                        {u.warnings.map(w => (
                          <div key={w.id} className="flex items-center gap-2 text-xs text-gray-600 bg-red-50 rounded px-2 py-1 border border-red-200">
                            <span>{w.reason}</span>
                            <span className="text-gray-400">{new Date(w.created_at).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}</span>
                            <button
                              className="text-red-500 hover:text-red-700 font-bold px-2 py-0.5 rounded border border-red-300 bg-red-100/70"
                              title="Remove warning"
                              onClick={async () => {
                                try {
                                  await api.delete(`/auth/users/${u.id}/warnings/${w.id}`);
                                  loadUsers();
                                } catch (e) {
                                  setUserActionMsg(e?.response?.data?.error || 'Failed to remove warning');
                                }
                              }}
                            >Remove</button>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Badges display */}
                    {Array.isArray(u.badges) && u.badges.length > 0 && (
                      <div className="flex flex-wrap gap-1 ml-2">
                        {u.badges.map((badge, idx) => (
                          <span key={idx} className="px-3 py-1 rounded-full bg-yellow-200 border border-yellow-400 text-yellow-900 font-bold text-xs uppercase tracking-wider flex items-center gap-1">
                            {badge}
                            <button
                              className="ml-2 text-red-500 hover:text-red-700 font-bold text-lg px-2 py-0.5 rounded-full border-2 border-red-300 bg-red-100/70 transition-all duration-150 shadow-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                              style={{ minWidth: 32, minHeight: 32 }}
                              title={`Remove ${badge}`}
                              onClick={async () => {
                                setBadgeLoading(b => ({ ...b, [u.id]: true }));
                                setUserActionMsg('');
                                try {
                                  // Remove badge from user
                                  await api.post(`/auth/users/${u.id}/badge`, { badge, remove: true });
                                  setUserActionMsg('Badge removed.');
                                  loadUsers();
                                } catch (e) {
                                  setUserActionMsg(e?.response?.data?.error || 'Failed to remove badge');
                                } finally {
                                  setBadgeLoading(b => ({ ...b, [u.id]: false }));
                                }
                              }}
                              disabled={badgeLoading[u.id]}
                            >×</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 mt-2 md:mt-0 items-end">
                    {/* Only show Remove Admin if current user is admin AND the listed user is admin */}
                    {user?.role === 'admin' && u.role === 'admin' && (
                      <button
                        className="fun-btn px-3 py-1 text-sm bg-gradient-to-r from-red-400 to-orange-400 hover:from-red-500 hover:to-orange-500 mb-1"
                        onClick={() => handleRemoveAdmin(u.id)}
                      >Remove Admin</button>
                    )}
                    <div className="flex gap-2 items-center">
                      <input
                        className="rounded-xl px-3 py-1 border-2 border-yellow-400 w-32 text-sm focus:ring-2 focus:ring-yellow-200 outline-none transition-all bg-white"
                        placeholder="Add badge..."
                        value={badgeEdit[u.id] ?? ''}
                        onChange={e => setBadgeEdit(b => ({ ...b, [u.id]: e.target.value }))}
                        disabled={badgeLoading[u.id]}
                      />
                      <button
                        className="fun-btn px-3 py-1 text-sm"
                        onClick={() => handleSetBadge(u.id)}
                        disabled={badgeLoading[u.id]}
                      >{badgeLoading[u.id] ? 'Saving...' : 'Add'}</button>
                    </div>
                    <button className="fun-btn px-4 py-2 text-base bg-gradient-to-r from-gray-400 to-gray-600 hover:from-gray-500 hover:to-gray-700" onClick={() => setDeleteUserModal({ open: true, id: u.id, name: u.name, email: u.email })}>Delete 🗑️</button>
                    <button className="fun-btn px-4 py-2 text-base bg-gradient-to-r from-yellow-400 to-red-400 hover:from-yellow-500 hover:to-red-500" onClick={() => setWarnUserModal({ open: true, id: u.id, name: u.name, email: u.email })}>Warn User ⚠️</button>
                  </div>
                </div>
              ))}
      {/* Warn User Modal */}
      {warnUserModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="cartoon-card max-w-md w-full border-4 border-red-400 bg-gradient-to-br from-yellow-100 via-pink-100 to-red-100 animate-pop rounded-3xl shadow-2xl p-8 text-center font-cartoon">
            <h2 className="text-2xl font-extrabold mb-2 text-red-500 drop-shadow">Send Warning to {warnUserModal.name}</h2>
            <input
              className="w-full rounded-xl px-4 py-3 border-2 border-red-300 bg-yellow-50 text-lg focus:ring-2 focus:ring-red-300 outline-none mb-4"
              placeholder="Reason for warning"
              value={warnReason}
              onChange={e => setWarnReason(e.target.value)}
              disabled={warnLoading}
            />
            {warnMsg && <div className="text-error bg-red-100 rounded-xl px-4 py-2 border-2 border-red-300 w-full text-center animate-wiggle mb-2">{warnMsg}</div>}
            <div className="flex gap-4 justify-center mt-2">
              <button className="fun-btn px-6 py-3 text-lg bg-gradient-to-r from-yellow-400 to-red-400" onClick={handleWarnUser} disabled={warnLoading}>{warnLoading ? 'Sending...' : 'Send Warning'}</button>
              <button className="fun-btn px-6 py-3 text-lg bg-gradient-to-r from-gray-400 to-gray-600" onClick={() => { setWarnUserModal({ open: false, id: null, name: '', email: '' }); setWarnReason(''); setWarnMsg(''); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
            </div>
          </div>
        </>
      )}

      {/* Delete User Modal */}
      {deleteUserModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="cartoon-card border-4 border-error bg-white/95 shadow-2xl flex flex-col items-center gap-4 max-w-sm w-full animate-wiggle">
            <div className="text-5xl">🗑️</div>
            <div className="text-2xl font-extrabold text-error text-center">Delete this account permanently?</div>
            <div className="text-lg text-dark text-center">{deleteUserModal.name} <span className="text-gray-400">({deleteUserModal.email})</span></div>
            <div className="flex gap-4 mt-2">
              <button className="fun-btn px-5 py-2 text-base bg-gradient-to-r from-gray-400 to-gray-600 hover:from-gray-500 hover:to-gray-700" onClick={() => setDeleteUserModal({ open: false, id: null, name: '', email: '' })}>Cancel</button>
              <button className="fun-btn px-5 py-2 text-base bg-gradient-to-r from-pink-400 to-orange-400 hover:from-pink-500 hover:to-orange-500" onClick={() => handleDeleteUser(deleteUserModal.id)}>Delete</button>
            </div>
          </div>
        </div>
      )}
          <button
            className="fun-btn px-6 py-3 text-lg mt-4"
            onClick={() => setShowRequests(v => !v)}
          >{showRequests ? 'Hide Sign Up Requests' : 'Show Sign Up Requests'} <span className="ml-1">📨</span></button>
        </div>

        {showRequests && (
          <div className="cartoon-card border-4 border-primary shadow-fun bg-white/90">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">📃</span>
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
              <div className="text-5xl">🗑️</div>
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
                {/* Author and date/time (Philippines time) */}
                <div className="text-center text-gray-500 text-base mb-4">
                  By: <span className="font-bold">{detailData.author_name}</span>
                  {detailData.created_at && (
                    <span> • {new Date(detailData.created_at).toLocaleString('en-PH', { timeZone: 'Asia/Manila', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  )}
                </div>
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
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mt-4">
          {posts.length === 0 && !postsLoading && <div className="text-gray-400 text-base col-span-full">No posts yet.</div>}
          {posts.map(p => {
            // Card style matches homepage
            const categories = [
              { key: 'Academics', label: '📚 Academics', color: 'bg-gradient-to-r from-pink-400 to-pink-500 text-white' },
              { key: 'Arts', label: '🎨 Arts', color: 'bg-gradient-to-r from-orange-300 to-orange-400 text-white' },
              { key: 'Sports', label: '🏅 Sports', color: 'bg-gradient-to-r from-green-400 to-teal-400 text-white' },
              { key: 'Music', label: '🎵 Music', color: 'bg-gradient-to-r from-purple-400 to-purple-500 text-white' },
              { key: 'Technology', label: '💻 Technology', color: 'bg-gradient-to-r from-cyan-400 to-blue-400 text-white' },
              { key: 'Ideas', label: '💡 Ideas', color: 'bg-gradient-to-r from-yellow-300 to-yellow-400 text-yellow-900' },
              { key: 'Random', label: '✨ Random', color: 'bg-gradient-to-r from-purple-400 to-indigo-400 text-white' },
            ];
            let badges = Array.isArray(p.badges) ? [...p.badges] : [];
            if (p.author_role === 'admin' && !badges.includes('ADMIN')) badges.push('ADMIN');
            return (
              <div key={p.id} className="bg-white/90 rounded-2xl shadow-xl hover:scale-105 transition-transform duration-150 border-2 border-white/60 flex flex-row gap-4 relative p-6">
                <div className="absolute top-2 right-4 text-2xl">{p.pinned ? '📌' : ''}</div>
                <div className="flex flex-col flex-1">
                  <div className="text-sm font-bold mb-1">
                    <span className={`px-3 py-1 rounded-full text-xs shadow font-extrabold ${categories.find(c => c.key === p.category)?.color || 'bg-gray-400 text-white'}`}>{categories.find(c => c.key === p.category)?.label || p.category}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl font-extrabold text-gray-800 drop-shadow">{p.title}</span>
                    {p.pinned && <span className="ml-2 px-2 py-1 rounded-full bg-pink-100 border border-pink-300 text-pink-700 text-xs font-bold flex items-center gap-1">📌 Pinned</span>}
                    {p.locked && <span className="ml-2 px-2 py-1 rounded-full bg-red-100 border border-red-300 text-red-700 text-xs font-bold flex items-center gap-1">🔒 Locked</span>}
                  </div>
                  <div className="opacity-80 line-clamp-2 flex-1 text-gray-700">{p.content}</div>
                  <div className="mt-2 text-sm text-gray-400 flex items-center gap-2">
                    {p.anonymous ? (
                      <span className="font-bold text-gray-500">Anonymous</span>
                    ) : (
                      <>
                        <div className="flex items-center">
                          <span className="mr-2">
                            <img
                              src={p.avatar && p.avatar.trim() ? getAssetUrl(p.avatar) : '/Cute-Cat.png'}
                              alt={p.author_name}
                              className="w-8 h-8 rounded-full object-cover border border-gray-300 hover:ring-2 hover:ring-purple-400 transition-all"
                              onError={e => { e.target.src = '/Cute-Cat.png'; }}
                            />
                          </span>
                          <span className="font-bold text-gray-700 hover:text-purple-600 transition-all">{p.author_name}</span>
                        </div>
                        {badges.length > 0 && (
                          <span className="flex gap-1 ml-2">
                            {badges.map((badge, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded-full bg-yellow-100 border border-yellow-300 text-yellow-800 text-xs font-bold uppercase tracking-wider">{badge}</span>
                            ))}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  {/* Action buttons below author profile */}
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
                    <button className="fun-btn px-4 py-2 text-base bg-gradient-to-r from-red-400 to-pink-500 hover:from-red-500 hover:to-pink-600" onClick={() => setDeletePostModal({ open: true, id: p.id })}>Delete 🗑️</button>
      {/* Delete Post Confirmation Modal */}
      {deletePostModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="cartoon-card max-w-md w-full border-4 border-red-400 bg-gradient-to-br from-yellow-100 via-pink-100 to-red-100 animate-pop rounded-3xl shadow-2xl p-8 text-center font-cartoon">
            <h2 className="text-2xl font-extrabold mb-2 text-red-500 drop-shadow">Delete Post?</h2>
            <div className="mb-4 text-lg font-bold text-red-700">Are you sure you want to delete this post?</div>
            <div className="mb-2 text-base text-red-600 font-semibold">Once deleted, it cannot be recovered.</div>
            <div className="flex gap-4 justify-center mt-2">
              <button className="fun-btn px-6 py-3 text-lg bg-gradient-to-r from-yellow-400 to-red-400" onClick={() => handleDeletePost(deletePostModal.id)}>Delete Permanently</button>
              <button className="fun-btn px-6 py-3 text-lg bg-gradient-to-r from-gray-400 to-gray-600" onClick={() => setDeletePostModal({ open: false, id: null })}>Cancel</button>
            </div>
          </div>
        </div>
      )}
                  </div>
                  {/* Status label for pending/rejected posts (if needed) */}
                  {(p.status === 'pending' || p.status === 'rejected') && user && user.id === p.user_id && (
                    <div className={`mt-2 text-xs font-bold px-3 py-1 rounded-full ${
                      p.status === 'pending' ? 'bg-yellow-200 text-yellow-800' : 'bg-red-200 text-red-800'
                    }`}>
                      {p.status === 'pending'
                        ? 'Pending: waiting for admin approval'
                        : 'Rejected: not approved by admin'}
                    </div>
                  )}
                </div>
                {p.image_url && (
                  <div className="flex-shrink-0 w-[150px] h-[150px] rounded-xl shadow-md overflow-hidden">
                    <img
                      src={getAssetUrl(p.image_url)}
                      alt="Post image"
                      className="w-full h-full object-cover"
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}



