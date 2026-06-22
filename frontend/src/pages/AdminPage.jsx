import React, { useEffect, useState } from 'react';
import api, { getAssetUrl, reportPost, getReports, removeReportedPost, removeReportedComment, deleteReportLog } from '../lib/api';
import { useAuth } from '../state/auth';
import { motion, AnimatePresence } from 'framer-motion';

const TABS = [
  { key: 'pending', label: 'Pending Posts', icon: '📝' },
  { key: 'reports', label: 'Reports', icon: '🚩' },
  { key: 'users', label: 'Users', icon: '👥' },
  { key: 'signups', label: 'Sign Ups', icon: '📃' },
  { key: 'posts', label: 'All Posts', icon: '📄' },
];

export default function AdminPage() {
  const { token, user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('pending');

  // --- Auto Approve ---
  const [autoApprove, setAutoApprove] = useState(false);
  const [autoApproveLoading, setAutoApproveLoading] = useState(false);
  const [autoApproveError, setAutoApproveError] = useState('');

  useEffect(() => {
    const fetchAA = async () => {
      setAutoApproveLoading(true); setAutoApproveError('');
      try { const { getAutoApproveSetting } = await import('../lib/api'); const res = await getAutoApproveSetting(); setAutoApprove(!!res.data.enabled); }
      catch (e) { setAutoApproveError('Failed to load setting'); }
      finally { setAutoApproveLoading(false); }
    };
    fetchAA();
  }, []);

  const handleToggleAutoApprove = async () => {
    setAutoApproveLoading(true); setAutoApproveError('');
    try { const { setAutoApproveSetting } = await import('../lib/api'); await setAutoApproveSetting(!autoApprove); setAutoApprove(!autoApprove); }
    catch (e) { setAutoApproveError('Failed to update'); }
    finally { setAutoApproveLoading(false); }
  };

  // --- Pending Posts ---
  const [pendingPosts, setPendingPosts] = useState([]);
  const [pendingPostsLoading, setPendingPostsLoading] = useState(false);
  const [pendingPostsError, setPendingPostsError] = useState('');
  const [pendingActionMsg, setPendingActionMsg] = useState('');

  const loadPendingPosts = async () => {
    setPendingPostsLoading(true); setPendingPostsError('');
    try { const r = await api.get('/posts', { params: { status: 'pending', admin: 1 } }); setPendingPosts(r.data); }
    catch (e) { setPendingPostsError(e?.response?.data?.error || 'Failed to load'); }
    finally { setPendingPostsLoading(false); }
  };

  const handleApprovePost = async (id) => {
    setPendingActionMsg('');
    try { await api.post(`/posts/${id}/approve`); setPendingActionMsg('Approved!'); loadPendingPosts(); }
    catch (e) { setPendingActionMsg(e?.response?.data?.error || 'Failed'); }
  };
  const handleRejectPost = async (id) => {
    setPendingActionMsg('');
    try { await api.post(`/posts/${id}/reject`); setPendingActionMsg('Rejected!'); loadPendingPosts(); }
    catch (e) { setPendingActionMsg(e?.response?.data?.error || 'Failed'); }
  };
  const handleDeleteRejectedPost = async (id) => {
    setPendingActionMsg('');
    try { await api.delete(`/posts/${id}/cancel`); setPendingActionMsg('Deleted!'); loadPendingPosts(); }
    catch (e) { setPendingActionMsg(e?.response?.data?.error || 'Failed'); }
  };

  // --- Reports ---
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState('');
  const [reportActionMsg, setReportActionMsg] = useState('');
  const [reportLogDeleteModal, setReportLogDeleteModal] = useState({ open: false, id: null });

  const loadReports = async () => {
    setReportsLoading(true); setReportsError('');
    try { const r = await getReports(); setReports(r.data.reports || []); }
    catch (e) { setReportsError(e?.response?.data?.error || 'Failed'); }
    finally { setReportsLoading(false); }
  };

  const handleRemoveReportedPost = async (postId) => {
    setReportActionMsg('');
    try { await removeReportedPost(postId); setReportActionMsg('Post removed!'); loadReports(); }
    catch (e) { setReportActionMsg(e?.response?.data?.error || 'Failed'); }
  };
  const handleRemoveReportedComment = async (commentId) => {
    setReportActionMsg('');
    try { await removeReportedComment(commentId); setReportActionMsg('Comment removed!'); loadReports(); }
    catch (e) { setReportActionMsg(e?.response?.data?.error || 'Failed'); }
  };
  const handleDeleteReportLog = async (reportId) => {
    setReportActionMsg('');
    try { await deleteReportLog(reportId); setReportActionMsg('Log deleted!'); loadReports(); }
    catch (e) { setReportActionMsg(e?.response?.data?.error || 'Failed'); }
  };
  const handleConfirmRemoveReportedPost = async () => {
    if (!reportLogDeleteModal.id) return;
    await handleRemoveReportedPost(reportLogDeleteModal.id);
    setReportLogDeleteModal({ open: false, id: null });
  };

  // --- Users ---
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [userActionMsg, setUserActionMsg] = useState('');
  const [adminActionMsg, setAdminActionMsg] = useState('');
  const [badgeEdit, setBadgeEdit] = useState({});
  const [badgeLoading, setBadgeLoading] = useState({});
  const [deleteUserModal, setDeleteUserModal] = useState({ open: false, id: null, name: '', email: '' });
  const [warnUserModal, setWarnUserModal] = useState({ open: false, id: null, name: '', email: '' });
  const [warnReason, setWarnReason] = useState('');
  const [warnLoading, setWarnLoading] = useState(false);
  const [warnMsg, setWarnMsg] = useState('');
  const [makeAdminName, setMakeAdminName] = useState('');
  const [makeAdminMsg, setMakeAdminMsg] = useState('');

  const loadUsers = async () => {
    setUsersLoading(true); setUsersError('');
    try { const r = await api.get('/auth/users/warnings?details=true'); setUsers(r.data.users); }
    catch (e) { setUsersError(e?.response?.data?.error || 'Failed'); }
    finally { setUsersLoading(false); }
  };

  const handleDeleteUser = async (id) => {
    setUserActionMsg('');
    try {
      const response = await api.delete(`/auth/users/${id}`);
      const { deletedUserName } = response.data;
      if (user && user.name === deletedUserName) { logout(); window.location.replace('/account-deleted'); return; }
      setUserActionMsg('User deleted!');
      setDeleteUserModal({ open: false, id: null, name: '', email: '' });
      loadUsers();
    } catch (e) { setUserActionMsg(e?.response?.data?.error || 'Failed'); }
  };

  const handleWarnUser = async () => {
    if (!warnReason) { setWarnMsg('Enter a reason.'); return; }
    setWarnLoading(true); setWarnMsg('');
    try {
      const r = await api.post(`/auth/users/${warnUserModal.id}/warn`, { reason: warnReason });
      setWarnMsg(r.data.deleted ? 'User deleted (3 warnings).' : 'Warning sent!');
      setWarnReason(''); loadUsers();
    } catch (e) { setWarnMsg(e?.response?.data?.error || 'Failed'); }
    setWarnLoading(false);
  };

  const handleRemoveAdmin = async (userId) => {
    setAdminActionMsg('');
    try { await api.post(`/auth/users/${userId}/remove-admin`); setAdminActionMsg('Admin removed!'); loadUsers(); }
    catch (e) { setAdminActionMsg(e?.response?.data?.error || 'Failed'); }
  };

  const handleSetBadge = async (userId) => {
    setBadgeLoading(b => ({ ...b, [userId]: true })); setUserActionMsg('');
    try { const badge = badgeEdit[userId] || ''; await api.post(`/auth/users/${userId}/badge`, { badge }); setUserActionMsg(badge ? 'Badge set!' : 'Badge removed.'); setBadgeEdit(b => ({ ...b, [userId]: '' })); loadUsers(); }
    catch (e) { setUserActionMsg(e?.response?.data?.error || 'Failed'); }
    finally { setBadgeLoading(b => ({ ...b, [userId]: false })); }
  };

  const handleMakeAdmin = async (e) => {
    e.preventDefault(); setMakeAdminMsg('');
    try { await api.post('/auth/make-admin', { name: makeAdminName }); setMakeAdminMsg('Promoted!'); setMakeAdminName(''); }
    catch (err) { setMakeAdminMsg(err?.response?.data?.error || 'Failed'); }
  };

  // --- Signup Requests ---
  const [requests, setRequests] = useState([]);
  const [reqLoading, setReqLoading] = useState(false);
  const [reqError, setReqError] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, name: '', email: '' });

  const loadRequests = async () => {
    setReqLoading(true); setReqError('');
    try { const r = await api.get('/auth/signup-requests'); setRequests(r.data); }
    catch (e) { setReqError(e?.response?.data?.error || 'Failed'); }
    finally { setReqLoading(false); }
  };

  const handleApprove = async (id) => {
    setActionMsg(''); try { await api.post(`/auth/signup-requests/${id}/approve`); setActionMsg('Approved!'); loadRequests(); } catch (e) { setActionMsg(e?.response?.data?.error || 'Failed'); }
  };
  const handleDecline = async (id) => {
    setActionMsg(''); try { await api.post(`/auth/signup-requests/${id}/decline`); setActionMsg('Declined!'); loadRequests(); } catch (e) { setActionMsg(e?.response?.data?.error || 'Failed'); }
  };
  const handleDelete = async (id) => {
    setActionMsg(''); try { await api.delete(`/auth/signup-requests/${id}`); setActionMsg('Deleted!'); setDeleteModal({ open: false, id: null, name: '', email: '' }); loadRequests(); } catch (e) { setActionMsg(e?.response?.data?.error || 'Failed'); }
  };

  // --- All Posts ---
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState('');
  const [postActionMsg, setPostActionMsg] = useState('');
  const [deletePostModal, setDeletePostModal] = useState({ open: false, id: null });
  const [reportPostModal, setReportPostModal] = useState({ open: false, id: null });
  const [reportReason, setReportReason] = useState('');
  const [reportMsg, setReportMsg] = useState('');
  const [reportLoading, setReportLoading] = useState(false);

  const loadPosts = async () => {
    setPostsLoading(true); setPostsError('');
    try { const r = await api.get('/posts'); setPosts(r.data); }
    catch (e) { setPostActionMsg(e?.response?.data?.error || 'Failed'); }
    finally { setPostsLoading(false); }
  };
  const handleDeletePost = async (id) => {
    setPostActionMsg(''); try { await api.delete(`/posts/${id}`); setPostActionMsg('Deleted!'); setDeletePostModal({ open: false, id: null }); loadPosts(); } catch (e) { setPostActionMsg(e?.response?.data?.error || 'Failed'); }
  };
  const handleReportPost = async (id) => {
    if (!reportReason.trim()) { setReportMsg('Enter a reason.'); return; }
    setReportLoading(true); setReportMsg('');
    try { await reportPost(id, reportReason); setReportMsg('Reported!'); setTimeout(() => setReportPostModal({ open: false, id: null }), 1200); } catch (e) { setReportMsg(e?.response?.data?.error || 'Failed'); }
    setReportLoading(false);
  };
  const handleLock = async (id) => {
    try { await api.post(`/posts/${id}/lock`); setPostActionMsg('Locked!'); loadPosts(); } catch (e) { setPostActionMsg(e?.response?.data?.error || 'Failed'); }
  };
  const handleUnlock = async (id) => {
    try { await api.post(`/posts/${id}/unlock`); setPostActionMsg('Unlocked!'); loadPosts(); } catch (e) { setPostActionMsg(e?.response?.data?.error || 'Failed'); }
  };
  const handlePin = async (id) => {
    try { await api.post(`/posts/${id}/pin`); setPostActionMsg('Pinned!'); loadPosts(); } catch (e) { setPostActionMsg(e?.response?.data?.error || 'Failed'); }
  };
  const handleUnpin = async (id) => {
    try { await api.post(`/posts/${id}/unpin`); setPostActionMsg('Unpinned!'); loadPosts(); } catch (e) { setPostActionMsg(e?.response?.data?.error || 'Failed'); }
  };

  // --- Post Detail Modal ---
  const [detailPostId, setDetailPostId] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailComments, setDetailComments] = useState([]);
  const [detailComment, setDetailComment] = useState('');
  const [detailCommentsLoading, setDetailCommentsLoading] = useState(false);

  const openPostDetail = async (id) => {
    setDetailPostId(id); setDetailLoading(true); setDetailData(null); setDetailComments([]); setDetailCommentsLoading(true);
    try { const r = await api.get(`/posts/${id}`); setDetailData(r.data.post); setDetailComments(r.data.comments || []); }
    catch (e) { setDetailData({ error: e?.response?.data?.error || 'Failed' }); }
    finally { setDetailLoading(false); setDetailCommentsLoading(false); }
  };
  const closePostDetail = () => { setDetailPostId(null); setDetailData(null); setDetailLoading(false); };
  const sendDetailComment = async () => {
    if (!detailComment.trim() || !detailPostId) return;
    try { await api.post(`/posts/${detailPostId}/comments`, { content: detailComment }); setDetailComment(''); setDetailCommentsLoading(true); const r = await api.get(`/posts/${detailPostId}`); setDetailComments(r.data.comments || []); }
    finally { setDetailCommentsLoading(false); }
  };

  const handleViewReportedComment = async (commentId) => {
    const report = reports.find(r => r.target_type === 'comment' && r.target_id === commentId);
    if (!report) return;
    let postId = report.post_id;
    if (!postId) { try { const res = await api.get(`/comments/${commentId}`); postId = res.data.comment?.post_id; } catch {} }
    if (postId) await openPostDetail(postId);
  };

  useEffect(() => {
    loadPosts(); loadUsers(); loadPendingPosts(); loadRequests(); loadReports();
  }, []);

  // Modal component
  const ConfirmModal = ({ open, onClose, onConfirm, title, children }) => (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="card p-6 max-w-sm w-full text-center" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
            <div className="text-4xl mb-3">🗑️</div>
            <h3 className="text-lg font-bold text-dark dark:text-dark-text mb-4">{title}</h3>
            {children}
            <div className="flex gap-3 justify-center mt-4">
              <button className="btn-secondary text-sm" onClick={onClose}>Cancel</button>
              <button className="btn-primary text-sm bg-gradient-to-r from-error to-orange-500 hover:from-error/90 hover:to-orange-500/90" onClick={onConfirm}>Delete</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="min-h-screen bg-background dark:bg-dark-bg">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-dark dark:text-dark-text mb-6 flex items-center gap-2">🛠️ Admin Panel</h1>

        {/* Auto Approve Toggle */}
        <div className="card p-4 flex items-center gap-3 mb-6">
          <span className="text-xl">⚡</span>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-dark dark:text-dark-text">Auto Approve Posts</h2>
            <p className="text-xs text-muted dark:text-dark-muted">When enabled, all pending posts are automatically approved.</p>
            {autoApproveError && <p className="text-xs text-error mt-1">{autoApproveError}</p>}
          </div>
          <button className={`text-sm font-semibold rounded-lg px-4 py-2 transition ${autoApprove ? 'bg-success/10 text-success' : 'bg-gray-100 text-muted'}`} onClick={handleToggleAutoApprove} disabled={autoApproveLoading}>
            {autoApproveLoading ? '...' : autoApprove ? 'Enabled' : 'Disabled'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 mb-6 bg-white dark:bg-dark-surface rounded-xl p-1 shadow-sm border border-gray-100">
          {TABS.map(tab => (
            <button key={tab.key} className={`px-4 py-2 text-sm font-medium rounded-lg transition ${activeTab === tab.key ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-dark hover:bg-gray-50'}`} onClick={() => setActiveTab(tab.key)}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="card p-6">
          {/* Pending Posts */}
          {activeTab === 'pending' && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-base font-bold text-dark dark:text-dark-text">Pending Posts</h2>
                <button className="ml-auto text-xs btn-secondary px-3 py-1" onClick={loadPendingPosts}>Refresh</button>
              </div>
              {pendingPostsLoading && <p className="text-sm text-muted dark:text-dark-muted">Loading...</p>}
              {pendingPostsError && <p className="text-sm text-error">{pendingPostsError}</p>}
              {pendingActionMsg && <p className="text-sm text-success mb-2">{pendingActionMsg}</p>}
              {!pendingPostsLoading && pendingPosts.length === 0 && <p className="text-sm text-muted dark:text-dark-muted">No pending posts.</p>}
              <div className="flex flex-col gap-3">
                {pendingPosts.map(p => (
                  <div key={p.id} className="flex flex-col md:flex-row items-start md:items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-dark-bg border border-gray-100">
                    <div className="flex-1 flex flex-col md:flex-row md:items-center gap-1.5 text-sm">
                      <span className="font-semibold text-dark dark:text-dark-text">{p.author_name}</span>
                      <span className="text-muted">{p.category}</span>
                      <span className="text-xs text-muted dark:text-dark-muted">{new Date(p.created_at).toLocaleString()}</span>
                      <span className="font-semibold text-primary ml-1">{p.title}</span>
                    </div>
                    <div className="flex gap-2">
                      {p.status === 'pending' && <><button className="btn-primary text-xs px-3 py-1" onClick={() => handleApprovePost(p.id)}>Approve</button><button className="text-xs px-3 py-1 rounded-lg bg-error/10 text-error font-semibold hover:bg-error/20 transition" onClick={() => handleRejectPost(p.id)}>Reject</button></>}
                      {p.status === 'rejected' && p.user_id === user?.id && <button className="text-xs px-3 py-1 rounded-lg bg-gray-100 text-muted dark:text-dark-muted font-semibold hover:bg-gray-200 transition" onClick={() => handleDeleteRejectedPost(p.id)}>Delete</button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reports */}
          {activeTab === 'reports' && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-base font-bold text-dark dark:text-dark-text">Reported Posts & Comments</h2>
                <button className="ml-auto text-xs btn-secondary px-3 py-1" onClick={loadReports}>Refresh</button>
              </div>
              {reportsLoading && <p className="text-sm text-muted dark:text-dark-muted">Loading...</p>}
              {reportsError && <p className="text-sm text-error">{reportsError}</p>}
              {reportActionMsg && <p className="text-sm text-success mb-2">{reportActionMsg}</p>}
              {!reportsLoading && reports.length === 0 && <p className="text-sm text-muted dark:text-dark-muted">No reports.</p>}
              <div className="flex flex-col gap-3">
                {reports.map(r => (
                  <div key={r.id} className="flex flex-col md:flex-row items-start md:items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-dark-bg border border-gray-100">
                    <div className="flex-1 flex flex-col md:flex-row md:items-center gap-1.5 text-sm">
                      <span className="text-muted">Reporter: {r.reported_by_username || r.reported_by}</span>
                      <span className="text-xs text-muted dark:text-dark-muted">{new Date(r.created_at).toLocaleString()}</span>
                      <span className="text-error font-medium">Reason: {r.reason}</span>
                      <span className="text-xs text-muted dark:text-dark-muted">Type: {r.target_type}</span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {r.target_type === 'post' && <><button className="text-xs px-3 py-1 rounded-lg bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition" onClick={() => openPostDetail(r.target_id)}>View</button><button className="text-xs px-3 py-1 rounded-lg bg-error/10 text-error font-semibold hover:bg-error/20 transition" onClick={() => setReportLogDeleteModal({ open: true, id: r.target_id })}>Remove Post</button></>}
                      {r.target_type === 'comment' && <><button className="text-xs px-3 py-1 rounded-lg bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition" onClick={() => handleViewReportedComment(r.target_id)}>View Comment</button><button className="text-xs px-3 py-1 rounded-lg bg-error/10 text-error font-semibold hover:bg-error/20 transition" onClick={() => handleRemoveReportedComment(r.target_id)}>Remove Comment</button></>}
                      <button className="text-xs px-3 py-1 rounded-lg bg-gray-100 text-muted dark:text-dark-muted font-semibold hover:bg-gray-200 transition" onClick={() => handleDeleteReportLog(r.id)}>Delete Log</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Users */}
          {activeTab === 'users' && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-base font-bold text-dark dark:text-dark-text">User Management</h2>
                <button className="ml-auto text-xs btn-secondary px-3 py-1" onClick={loadUsers}>Refresh</button>
              </div>
              {usersLoading && <p className="text-sm text-muted dark:text-dark-muted">Loading...</p>}
              {usersError && <p className="text-sm text-error">{usersError}</p>}
              {userActionMsg && <p className="text-sm text-success mb-2">{userActionMsg}</p>}
              {adminActionMsg && <p className="text-sm text-success mb-2">{adminActionMsg}</p>}

              {/* Make Admin */}
              <form onSubmit={handleMakeAdmin} className="flex gap-3 items-center mb-6 p-3 rounded-xl bg-gray-50 dark:bg-dark-bg">
                <input className="flex-1 rounded-lg px-3 py-2 border border-gray-200 dark:border-dark-border text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none" placeholder="Username to promote to admin" value={makeAdminName} onChange={e => setMakeAdminName(e.target.value)} />
                <button className="btn-primary text-sm" type="submit">Promote</button>
                {makeAdminMsg && <span className="text-xs text-success">{makeAdminMsg}</span>}
              </form>

              {/* Admin Users */}
              <h3 className="text-sm font-bold text-dark dark:text-dark-text mb-2">Admins</h3>
              <div className="flex flex-col gap-3 mb-6">
                {users.filter(u => u.role === 'admin').length === 0 && !usersLoading && <p className="text-sm text-muted dark:text-dark-muted">No admin users.</p>}
                {users.filter(u => u.role === 'admin').map(u => (
                  <div key={u.id} className="flex flex-col md:flex-row items-start md:items-center gap-3 p-3 rounded-xl bg-purple-50 border border-purple-100">
                    <div className="flex-1 flex flex-col md:flex-row md:items-center gap-1.5 text-sm">
                      <span className="font-semibold text-dark dark:text-dark-text">{u.name}</span>
                      <span className="text-muted">{u.email}</span>
                      {Array.isArray(u.badges) && u.badges.length > 0 && u.badges.map((badge, idx) => (
                        <span key={idx} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold uppercase">
                          {badge}
                          <button className="text-error hover:text-error/70 font-bold text-sm ml-1" onClick={async () => { setBadgeLoading(b => ({ ...b, [u.id]: true })); try { await api.post(`/auth/users/${u.id}/badge`, { badge, remove: true }); loadUsers(); } catch {} finally { setBadgeLoading(b => ({ ...b, [u.id]: false })); } }} disabled={badgeLoading[u.id]}>×</button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2 items-center flex-wrap">
                      {user?.role === 'admin' && u.role === 'admin' && <button className="text-xs px-2 py-1 rounded-lg bg-error/10 text-error font-semibold hover:bg-error/20 transition" onClick={() => handleRemoveAdmin(u.id)}>Remove Admin</button>}
                      <input className="rounded-lg px-2 py-1 border border-gray-200 dark:border-dark-border w-24 text-xs focus:border-primary outline-none" placeholder="Badge..." value={badgeEdit[u.id] ?? ''} onChange={e => setBadgeEdit(b => ({ ...b, [u.id]: e.target.value }))} disabled={badgeLoading[u.id]} />
                      <button className="text-xs px-2 py-1 rounded-lg bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition" onClick={() => handleSetBadge(u.id)} disabled={badgeLoading[u.id]}>{badgeLoading[u.id] ? '...' : 'Add'}</button>
                      <button className="text-xs px-2 py-1 rounded-lg bg-error/10 text-error font-semibold hover:bg-error/20 transition" onClick={() => setDeleteUserModal({ open: true, id: u.id, name: u.name, email: u.email })}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* All Users */}
              <h3 className="text-sm font-bold text-dark dark:text-dark-text mb-2">All Registered Users</h3>
              <div className="flex flex-col gap-3">
                {users.length === 0 && !usersLoading && <p className="text-sm text-muted dark:text-dark-muted">No users.</p>}
                {users.map(u => (
                  <div key={u.id} className="flex flex-col md:flex-row items-start md:items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-dark-bg border border-gray-100">
                    <div className="flex-1 flex flex-col md:flex-row md:items-center gap-1.5 text-sm">
                      <span className="font-semibold text-dark dark:text-dark-text">{u.name}</span>
                      <span className="text-muted">{u.email}</span>
                      <span className="text-error font-medium text-xs">Warnings: {u.warningCount}</span>
                      {Array.isArray(u.warnings) && u.warnings.length > 0 && u.warnings.map(w => (
                        <div key={w.id} className="flex items-center gap-1.5 text-xs text-muted dark:text-dark-muted bg-red-50 rounded px-2 py-0.5">
                          <span>{w.reason}</span>
                          <span className="text-gray-400">{new Date(w.created_at).toLocaleString()}</span>
                          <button className="text-error hover:text-error/70 font-bold" onClick={async () => { try { await api.delete(`/auth/users/${u.id}/warnings/${w.id}`); loadUsers(); } catch {} }}>Remove</button>
                        </div>
                      ))}
                      {Array.isArray(u.badges) && u.badges.length > 0 && u.badges.map((badge, idx) => (
                        <span key={idx} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold uppercase">
                          {badge}
                          <button className="text-error hover:text-error/70 font-bold text-sm ml-1" onClick={async () => { setBadgeLoading(b => ({ ...b, [u.id]: true })); try { await api.post(`/auth/users/${u.id}/badge`, { badge, remove: true }); loadUsers(); } catch {} finally { setBadgeLoading(b => ({ ...b, [u.id]: false })); } }} disabled={badgeLoading[u.id]}>×</button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2 items-center flex-wrap">
                      {user?.role === 'admin' && u.role === 'admin' && <button className="text-xs px-2 py-1 rounded-lg bg-error/10 text-error font-semibold hover:bg-error/20 transition" onClick={() => handleRemoveAdmin(u.id)}>Remove Admin</button>}
                      <input className="rounded-lg px-2 py-1 border border-gray-200 dark:border-dark-border w-24 text-xs focus:border-primary outline-none" placeholder="Badge..." value={badgeEdit[u.id] ?? ''} onChange={e => setBadgeEdit(b => ({ ...b, [u.id]: e.target.value }))} disabled={badgeLoading[u.id]} />
                      <button className="text-xs px-2 py-1 rounded-lg bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition" onClick={() => handleSetBadge(u.id)} disabled={badgeLoading[u.id]}>{badgeLoading[u.id] ? '...' : 'Add'}</button>
                      <button className="text-xs px-2 py-1 rounded-lg bg-error/10 text-error font-semibold hover:bg-error/20 transition" onClick={() => setDeleteUserModal({ open: true, id: u.id, name: u.name, email: u.email })}>Delete</button>
                      <button className="text-xs px-2 py-1 rounded-lg bg-amber-50 text-amber-700 font-semibold hover:bg-amber-100 transition border border-amber-200" onClick={() => setWarnUserModal({ open: true, id: u.id, name: u.name, email: u.email })}>Warn</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sign Ups */}
          {activeTab === 'signups' && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-base font-bold text-dark dark:text-dark-text">Sign Up Requests</h2>
                <button className="ml-auto text-xs btn-secondary px-3 py-1" onClick={loadRequests}>Refresh</button>
              </div>
              {reqLoading && <p className="text-sm text-muted dark:text-dark-muted">Loading...</p>}
              {reqError && <p className="text-sm text-error">{reqError}</p>}
              {actionMsg && <p className="text-sm text-success mb-2">{actionMsg}</p>}
              {!reqLoading && requests.length === 0 && <p className="text-sm text-muted dark:text-dark-muted">No pending requests.</p>}
              <div className="flex flex-col gap-3">
                {requests.map(r => (
                  <div key={r.id} className="flex flex-col md:flex-row items-start md:items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-dark-bg border border-gray-100">
                    <div className="flex-1 flex flex-col md:flex-row md:items-center gap-1.5 text-sm">
                      <span className="font-semibold text-dark dark:text-dark-text">{r.name}</span>
                      <span className="text-muted">{r.email}</span>
                      <span className="text-xs text-muted dark:text-dark-muted">{new Date(r.created_at).toLocaleString()}</span>
                      {r.status === 'approved' && <span className="text-xs px-2 py-0.5 rounded-full bg-success/10 text-success font-semibold">Approved</span>}
                      {r.status === 'declined' && <span className="text-xs px-2 py-0.5 rounded-full bg-error/10 text-error font-semibold">Declined</span>}
                    </div>
                    <div className="flex gap-2">
                      {r.status === 'pending' && <><button className="btn-primary text-xs px-3 py-1" onClick={() => handleApprove(r.id)}>Approve</button><button className="text-xs px-3 py-1 rounded-lg bg-error/10 text-error font-semibold hover:bg-error/20 transition" onClick={() => handleDecline(r.id)}>Decline</button></>}
                      <button className="text-xs px-3 py-1 rounded-lg bg-gray-100 text-muted dark:text-dark-muted font-semibold hover:bg-gray-200 transition" onClick={() => setDeleteModal({ open: true, id: r.id, name: r.name, email: r.email })}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Posts */}
          {activeTab === 'posts' && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-base font-bold text-dark dark:text-dark-text">All Posts</h2>
                <button className="ml-auto text-xs btn-secondary px-3 py-1" onClick={loadPosts}>Refresh</button>
              </div>
              {postsLoading && <p className="text-sm text-muted dark:text-dark-muted">Loading...</p>}
              {postsError && <p className="text-sm text-error">{postsError}</p>}
              {postActionMsg && <p className="text-sm text-success mb-2">{postActionMsg}</p>}
              {!postsLoading && posts.length === 0 && <p className="text-sm text-muted dark:text-dark-muted">No posts.</p>}
              <div className="flex flex-col gap-3">
                {posts.map(p => (
                  <div key={p.id} className="flex flex-col md:flex-row items-start md:items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-dark-bg border border-gray-100">
                    <div className="flex-1 flex flex-col md:flex-row md:items-center gap-1.5 text-sm">
                      {p.pinned && <span className="text-accent font-bold">📌</span>}
                      {p.locked && <span className="text-error font-bold">🔒</span>}
                      <span className="font-semibold text-dark dark:text-dark-text">{p.author_name}</span>
                      <span className="text-muted">{p.category}</span>
                      <span className="text-xs text-muted dark:text-dark-muted">{new Date(p.created_at).toLocaleString()}</span>
                      <span className="font-semibold text-primary">{p.title}</span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button className="text-xs px-2 py-1 rounded-lg bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition" onClick={() => openPostDetail(p.id)}>Open</button>
                      {p.locked ? <button className="text-xs px-2 py-1 rounded-lg bg-success/10 text-success font-semibold hover:bg-success/20 transition" onClick={() => handleUnlock(p.id)}>Unlock</button> : <button className="text-xs px-2 py-1 rounded-lg bg-amber-50 text-amber-700 font-semibold hover:bg-amber-100 transition border border-amber-200" onClick={() => handleLock(p.id)}>Lock</button>}
                      {p.pinned ? <button className="text-xs px-2 py-1 rounded-lg bg-gray-100 text-muted dark:text-dark-muted font-semibold hover:bg-gray-200 transition" onClick={() => handleUnpin(p.id)}>Unpin</button> : <button className="text-xs px-2 py-1 rounded-lg bg-accent/10 text-accent font-semibold hover:bg-accent/20 transition" onClick={() => handlePin(p.id)}>Pin</button>}
                      <button className="text-xs px-2 py-1 rounded-lg bg-error/10 text-error font-semibold hover:bg-error/20 transition" onClick={() => setDeletePostModal({ open: true, id: p.id })}>Delete</button>
                      <button className="text-xs px-2 py-1 rounded-lg bg-amber-50 text-amber-700 font-semibold hover:bg-amber-100 transition border border-amber-200" onClick={() => { setReportPostModal({ open: true, id: p.id }); setReportReason(''); setReportMsg(''); }}>Report</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete User Modal */}
      <ConfirmModal open={deleteUserModal.open} title="Delete this account permanently?" onClose={() => setDeleteUserModal({ open: false, id: null, name: '', email: '' })} onConfirm={() => handleDeleteUser(deleteUserModal.id)}>
        <p className="text-sm text-muted dark:text-dark-muted">{deleteUserModal.name} ({deleteUserModal.email})</p>
      </ConfirmModal>

      {/* Delete Request Modal */}
      <ConfirmModal open={deleteModal.open} title="Delete this request permanently?" onClose={() => setDeleteModal({ open: false, id: null, name: '', email: '' })} onConfirm={() => handleDelete(deleteModal.id)}>
        <p className="text-sm text-muted dark:text-dark-muted">{deleteModal.name} ({deleteModal.email})</p>
      </ConfirmModal>

      {/* Delete Post Modal */}
      <ConfirmModal open={deletePostModal.open} title="Delete this post permanently?" onClose={() => setDeletePostModal({ open: false, id: null })} onConfirm={() => handleDeletePost(deletePostModal.id)} />

      {/* Remove Reported Post Modal */}
      <ConfirmModal open={reportLogDeleteModal.open} title="Remove this reported post?" onClose={() => setReportLogDeleteModal({ open: false, id: null })} onConfirm={handleConfirmRemoveReportedPost} />

      {/* Warn User Modal */}
      <AnimatePresence>
        {warnUserModal.open && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="card p-6 max-w-sm w-full text-center" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <h3 className="text-lg font-bold text-dark dark:text-dark-text mb-3">Send Warning to {warnUserModal.name}</h3>
              <input className="w-full rounded-lg px-3 py-2 border border-gray-200 dark:border-dark-border text-sm mb-2 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none" placeholder="Reason for warning" value={warnReason} onChange={e => setWarnReason(e.target.value)} disabled={warnLoading} />
              {warnMsg && <p className="text-xs text-error mb-2">{warnMsg}</p>}
              <div className="flex gap-3 justify-center">
                <button className="btn-primary text-sm" onClick={handleWarnUser} disabled={warnLoading}>{warnLoading ? 'Sending...' : 'Send Warning'}</button>
                <button className="btn-secondary text-sm" onClick={() => { setWarnUserModal({ open: false, id: null, name: '', email: '' }); setWarnReason(''); setWarnMsg(''); }}>Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report Post Modal */}
      <AnimatePresence>
        {reportPostModal.open && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="card p-6 max-w-sm w-full text-center" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <h3 className="text-lg font-bold text-dark dark:text-dark-text mb-3">Report Post</h3>
              <input className="w-full rounded-lg px-3 py-2 border border-gray-200 dark:border-dark-border text-sm mb-2 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none" placeholder="Reason" value={reportReason} onChange={e => setReportReason(e.target.value)} disabled={reportLoading} />
              {reportMsg && <p className="text-xs text-error mb-2">{reportMsg}</p>}
              <div className="flex gap-3 justify-center">
                <button className="btn-primary text-sm" onClick={() => handleReportPost(reportPostModal.id)} disabled={reportLoading}>{reportLoading ? 'Reporting...' : 'Report'}</button>
                <button className="btn-secondary text-sm" onClick={() => setReportPostModal({ open: false, id: null })} disabled={reportLoading}>Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Post Detail Modal */}
      <AnimatePresence>
        {detailPostId && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="card p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto relative" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <button className="absolute top-3 right-3 text-lg text-muted dark:text-dark-muted hover:text-dark transition" onClick={closePostDetail}>✕</button>
              {detailLoading && <p className="text-sm text-muted dark:text-dark-muted text-center py-8">Loading post...</p>}
              {detailData && detailData.error && <p className="text-sm text-error text-center py-8">{detailData.error}</p>}
              {detailData && !detailData.error && (
                <>
                  <div className="flex gap-2 items-center mb-3 justify-center">
                    {detailData.pinned && <span className="text-accent font-bold text-sm flex items-center gap-1">📌 Pinned</span>}
                    {detailData.locked && <span className="text-error font-bold text-sm flex items-center gap-1">🔒 Locked</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full text-white font-semibold ${detailData.category === 'Academics' ? 'bg-blue-500' : detailData.category === 'Class Life' ? 'bg-green-500' : detailData.category === 'Ideas' ? 'bg-yellow-500' : 'bg-primary'}`}>{detailData.category}</span>
                  </div>
                  <h2 className="text-xl font-bold text-dark dark:text-dark-text text-center mb-2">{detailData.title}</h2>
                  <p className="text-xs text-muted dark:text-dark-muted text-center mb-4">By <span className="font-semibold">{detailData.author_name}</span>{detailData.created_at && <> • {new Date(detailData.created_at).toLocaleString()}</>}</p>
                  {detailData.image_url && <img alt="" className="rounded-xl max-h-48 object-contain mx-auto mb-3" src={getAssetUrl(detailData.image_url)} />}
                  <p className="text-sm text-dark dark:text-dark-text whitespace-pre-wrap text-center mb-3">{detailData.content}</p>
                  {detailData.link_url && <a className="text-primary underline text-sm font-medium" href={detailData.link_url} target="_blank" rel="noreferrer">Visit link</a>}
                  {/* Comments */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h3 className="text-sm font-bold text-dark dark:text-dark-text mb-3">💬 Comments {detailData.locked && <span className="text-error text-xs">(Locked)</span>}</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
                      {detailCommentsLoading && <p className="text-xs text-muted dark:text-dark-muted">Loading comments...</p>}
                      {!detailCommentsLoading && detailComments.length === 0 && <p className="text-xs text-muted dark:text-dark-muted">No comments yet.</p>}
                      {detailComments.map(c => (
                        <div key={c.id} className="flex items-start gap-2 p-2.5 rounded-lg bg-gray-50 dark:bg-dark-bg">
                          <span className="text-sm">🗨️</span>
                          <div className="flex-1"><p className="text-sm text-dark dark:text-dark-text">{c.content}</p><p className="text-[10px] text-muted dark:text-dark-muted">- {c.author_name}</p></div>
                        </div>
                      ))}
                    </div>
                    {token && !detailData.locked && (
                      <div className="flex gap-2">
                        <input className="flex-1 rounded-lg px-3 py-2 border border-gray-200 dark:border-dark-border text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none" value={detailComment} onChange={e => setDetailComment(e.target.value)} placeholder="Write a comment..." />
                        <button className="btn-primary text-sm" onClick={sendDetailComment}>Send</button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
