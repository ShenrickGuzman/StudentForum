import React, { useState, useRef, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { format, utcToZonedTime } from 'date-fns-tz';
import { useAuth } from '../state/auth';
import api, { getAssetUrl, reportPost } from '../lib/api';
import CommentCard from '../components/CommentCard';
import VoiceMessagePlayer from '../components/VoiceMessagePlayer';
import { motion, AnimatePresence } from 'framer-motion';

const categories = [
  { key: 'Academics', label: 'Academics', color: 'bg-primary/10 text-primary' },
  { key: 'Arts', label: 'Arts', color: 'bg-secondary/10 text-secondary' },
  { key: 'Sports', label: 'Sports', color: 'bg-green-100 text-green-700' },
  { key: 'Music', label: 'Music', color: 'bg-purple-100 text-purple-700' },
  { key: 'Technology', label: 'Technology', color: 'bg-cyan-100 text-cyan-700' },
  { key: 'Ideas', label: 'Ideas', color: 'bg-amber-100 text-amber-700' },
  { key: 'Random', label: 'Random', color: 'bg-indigo-100 text-indigo-700' },
];

function RecursiveComment({ comment, depth }) {
  const { user } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [replyImageFile, setReplyImageFile] = useState(null);
  const [replyImageUrl, setReplyImageUrl] = useState('');
  const [replyAudioBlob, setReplyAudioBlob] = useState(null);
  const [replyAudioUrl, setReplyAudioUrl] = useState('');
  const [replyAudioUploading, setReplyAudioUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [showReplies, setShowReplies] = useState(false);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new window.MediaRecorder(stream);
    audioChunksRef.current = [];
    mediaRecorderRef.current.ondataavailable = e => { audioChunksRef.current.push(e.data); };
    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      setReplyAudioBlob(blob);
      setReplyAudioUrl(URL.createObjectURL(blob));
    };
    mediaRecorderRef.current.start();
    setRecording(true);
  };
  const stopRecording = () => { mediaRecorderRef.current.stop(); setRecording(false); };

  const handleReplySubmit = async (e) => {
    if (e) e.preventDefault();
    if (!replyText.trim()) return;
    setReplyLoading(true);
    try {
      let imageUrl = '';
      if (replyImageFile) {
        const formData = new FormData();
        formData.append('file', replyImageFile);
        const uploadRes = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        imageUrl = uploadRes.data?.url || uploadRes.data?.imageUrl || '';
      }
      const postId = comment.post_id || comment.postId || window.location.pathname.split('/').pop();
      const res = await api.post(`/posts/${postId}/comments`, {
        content: replyText, anonymous: false, image_url: imageUrl, parent_comment_id: comment.id,
      });
      const commentId = res.data?.id || (res.data && res.data.comment && res.data.comment.id);
      if (replyAudioBlob && commentId) {
        setReplyAudioUploading(true);
        const audioForm = new FormData();
        audioForm.append('file', replyAudioBlob, 'voice-message.webm');
        await api.post(`/upload/audio/comment/${commentId}`, audioForm, { headers: { 'Content-Type': 'multipart/form-data' } });
        setReplyAudioUploading(false);
        setReplyAudioBlob(null);
        setReplyAudioUrl('');
      }
      setReplyText('');
      setReplyImageFile(null);
      setReplyImageUrl('');
      setShowReplyForm(false);
      window.location.reload();
    } catch (err) {
      alert('Failed to submit reply.');
    } finally { setReplyLoading(false); }
  };

  let badges = Array.isArray(comment.users?.badges) ? [...comment.users.badges] : [];
  if (comment.author_role === 'admin' && !badges.includes('ADMIN')) badges = [...badges, 'ADMIN'];
  const isCommentAnonymous = comment.anonymous;

  return (
    <div style={{ marginLeft: Math.min(depth * 20, 60) }} className="mt-3">
      <CommentCard
        key={comment.id}
        avatar={isCommentAnonymous ? (
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm flex-shrink-0">
            <svg className="w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          </div>
        ) : (
          <img src={comment.users?.avatar && comment.users.avatar.trim() ? comment.users.avatar : '/Cute-Cat.png'} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-gray-100 flex-shrink-0" onError={e => { e.target.src = '/Cute-Cat.png'; }} />
        )}
        username={isCommentAnonymous ? 'Anonymous' : (comment.author_name || 'User')}
        badges={isCommentAnonymous ? [] : badges}
        time={comment.created_at ? format(utcToZonedTime(new Date(comment.created_at + 'Z'), 'Asia/Manila'), 'dd MMM yyyy, hh:mm a', { timeZone: 'Asia/Manila' }) : ''}
        content={comment.content}
        commentId={comment.id}
        canEdit={user && (comment.user_id === user.id || user.role === 'admin')}
        onEdit={() => window.location.reload()}
        canDelete={user && (comment.user_id === user.id || user.role === 'admin')}
        onDelete={async () => { await api.delete(`/posts/comments/${comment.id}`); window.location.reload(); }}
        audio_url={comment.audio_url}
        image_url={comment.image_url}
        replyButton={
          <>
            <button className="text-xs text-primary font-medium hover:underline" onClick={() => setShowReplyForm(v => !v)}>
              {showReplyForm ? 'Cancel' : 'Reply'}
            </button>
            {showReplyForm && (
              <form onSubmit={handleReplySubmit} className="mt-2">
                <textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Write a reply..." className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none resize-none min-h-[60px]" rows={2} disabled={replyLoading} />
                <div className="flex items-center gap-2 mt-2">
                  <label className="cursor-pointer text-xs text-muted hover:text-dark">
                    <input type="file" accept="image/*" className="hidden" onChange={e => { const file = e.target.files[0]; setReplyImageFile(file); if (file) { const reader = new FileReader(); reader.onload = ev => setReplyImageUrl(ev.target.result); reader.readAsDataURL(file); } else setReplyImageUrl(''); }} disabled={replyLoading} />
                    Attach image
                  </label>
                  <button type="button" className={`text-xs text-muted hover:text-dark ${recording ? 'text-error' : ''}`} onClick={recording ? stopRecording : startRecording} disabled={replyAudioUploading}>
                    {recording ? 'Stop recording' : 'Voice'}
                  </button>
                </div>
                {replyImageUrl && <img src={replyImageUrl} alt="" className="rounded-lg max-h-20 mt-2 border border-gray-200" />}
                {replyAudioUrl && <audio controls src={replyAudioUrl} className="mt-2 h-8" />}
                <button type="submit" className="btn-primary text-xs mt-2 py-1.5 px-3" disabled={replyLoading}>Send Reply</button>
              </form>
            )}
          </>
        }
      />
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-6 mt-2">
          {!showReplies ? (
            <button className="text-xs text-primary font-medium hover:underline" onClick={() => setShowReplies(true)}>
              Show {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
            </button>
          ) : (
            <>
              <button className="text-xs text-muted hover:text-dark font-medium mb-2" onClick={() => setShowReplies(false)}>Hide replies</button>
              {comment.replies.map(reply => (
                <RecursiveComment key={reply.id} comment={reply} depth={depth + 1} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function buildCommentTree(flatComments) {
  const map = {};
  const roots = [];
  flatComments.forEach(c => { map[c.id] = { ...c, replies: [] }; });
  flatComments.forEach(c => {
    if (c.parent_comment_id && map[c.parent_comment_id]) {
      map[c.parent_comment_id].replies.push(map[c.id]);
    } else {
      roots.push(map[c.id]);
    }
  });
  return roots;
}

export default function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [comments, setComments] = useState([]);

  const [newComment, setNewComment] = useState('');
  const [commentAnonymous, setCommentAnonymous] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);

  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [audioUploading, setAudioUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [commentImageFiles, setCommentImageFiles] = useState([]);

  const [reacting, setReacting] = useState(false);
  const [userReaction, setUserReaction] = useState(null);
  const [reactions, setReactions] = useState({});

  const [postAuthorRevealed, setPostAuthorRevealed] = useState(false);
  const [showPostDeleteConfirm, setShowPostDeleteConfirm] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportMsg, setReportMsg] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState('');

  const [editingPost, setEditingPost] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editLinkUrl, setEditLinkUrl] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const reactionTypes = [
    { key: 'like', icon: '👍' },
    { key: 'heart', icon: '❤️' },
    { key: 'haha', icon: '😂' },
    { key: 'sad', icon: '😢' },
    { key: 'wow', icon: '😮' },
  ];

  useEffect(() => {
    let mounted = true;
    const fetchAll = async () => {
      try {
        const r = await api.get(`/posts/${id}`);
        if (!mounted) return;
        setData(r.data);
        if (r.data?.reactions) {
          setReactions(r.data.reactions.counts || {});
          setUserReaction(r.data.reactions.user || null);
        }
        const c = await api.get(`/posts/${id}/comments`);
        if (!mounted) return;
        setComments(c.data || []);
      } catch (err) {
        console.error('Failed to fetch post', err);
      } finally { if (mounted) setLoading(false); }
    };
    fetchAll();
    return () => { mounted = false; };
  }, [id]);

  const handleReact = async (type) => {
    if (!token || reacting) return;
    setReacting(true);
    let newType = type;
    if (userReaction === type) newType = null;
    try {
      await api.post(`/posts/post/${id}/react`, { emoji: newType });
      const r = await api.get(`/posts/${id}`);
      setData(r.data);
      if (r.data.reactions) setReactions(r.data.reactions.counts);
      if (r.data.reactions) setUserReaction(r.data.reactions.user);
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to react';
      alert(errorMsg);
    }
    setReacting(false);
  };

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new window.MediaRecorder(stream);
    audioChunksRef.current = [];
    mediaRecorderRef.current.ondataavailable = e => { audioChunksRef.current.push(e.data); };
    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      setAudioBlob(blob);
      setAudioUrl(URL.createObjectURL(blob));
    };
    mediaRecorderRef.current.start();
    setRecording(true);
  };
  const stopRecording = () => { mediaRecorderRef.current.stop(); setRecording(false); };

  const handleCommentSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!newComment.trim()) return;
    setCommentLoading(true);
    try {
      let imageUrls = [];
      if (commentImageFiles.length > 0) {
        for (const file of commentImageFiles) {
          const formData = new FormData();
          formData.append('file', file);
          const uploadRes = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
          imageUrls.push(uploadRes.data?.url || uploadRes.data?.imageUrl || '');
        }
      }
      const res = await api.post(`/posts/${id}/comments`, { content: newComment, anonymous: commentAnonymous, imageUrls });
      const commentId = res.data?.id || (res.data && res.data.comment && res.data.comment.id);
      if (audioBlob && commentId) {
        setAudioUploading(true);
        const audioForm = new FormData();
        audioForm.append('file', audioBlob, 'voice-message.webm');
        await api.post(`/upload/audio/comment/${commentId}`, audioForm, { headers: { 'Content-Type': 'multipart/form-data' } });
        setAudioUploading(false);
        setAudioBlob(null);
        setAudioUrl('');
      }
      setNewComment('');
      setCommentAnonymous(false);
      setCommentImageFiles([]);
      const response = await api.get(`/posts/${id}/comments`);
      setComments(response.data);
    } catch (err) {
      alert('Failed to submit comment.');
    } finally { setCommentLoading(false); }
  };

  const handleReportPost = async () => {
    if (!reportReason.trim()) { setReportMsg('Please enter a reason.'); return; }
    setReportLoading(true);
    try {
      await reportPost(id, reportReason);
      setReportMsg('Report submitted!');
      setTimeout(() => setShowReportModal(false), 1000);
    } catch (err) { setReportMsg('Failed to report.'); }
    finally { setReportLoading(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-3 border-primary/30 border-t-primary animate-spin" />
          <p className="text-muted font-medium">Loading post...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-error">Failed to load post.</p>
          <button className="btn-secondary mt-4 text-sm" onClick={() => navigate('/')}>Back to Forum</button>
        </div>
      </div>
    );
  }

  const post = data?.post;
  const isAnonymous = !!post?.anonymous;
  const isAuthor = user && post.user_id === user.id;
  const isAdmin = user && (user.role === 'admin' || user.role === 'teacher');
  const statusLabel = post.status === 'pending' ? 'Pending Approval' : post.status === 'rejected' ? 'Rejected' : '';
  const canReveal = user?.name === 'SHEN' || user?.name === 'Ari';

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <button
        className="btn-secondary text-sm mb-4 flex items-center gap-1.5"
        onClick={() => navigate('/')}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
        Back to Forum
      </button>

      <AnimatePresence>
        {showReportModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-white rounded-2xl shadow-elevated p-6 max-w-sm w-full mx-4" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <h3 className="text-lg font-semibold text-dark mb-3">Report Post</h3>
              <textarea className="w-full rounded-xl px-4 py-2.5 border border-gray-200 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none resize-none min-h-[80px]" placeholder="Reason for reporting" value={reportReason} onChange={e => setReportReason(e.target.value)} disabled={reportLoading} />
              {reportMsg && <p className="text-xs text-muted mt-2">{reportMsg}</p>}
              <div className="flex gap-3 mt-4">
                <button className="btn-primary text-sm flex-1" onClick={handleReportPost} disabled={reportLoading}>{reportLoading ? 'Reporting...' : 'Report'}</button>
                <button className="btn-secondary text-sm flex-1" onClick={() => setShowReportModal(false)}>Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showImageModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60" onClick={() => setShowImageModal(false)}>
          <div className="relative max-w-[90vw] max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <img src={modalImageUrl} alt="" className="rounded-2xl max-w-full max-h-[85vh] object-contain bg-white shadow-elevated" />
            <button className="absolute top-2 right-2 bg-white/80 rounded-full p-2 hover:bg-white transition-colors shadow" onClick={() => setShowImageModal(false)}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}

      {/* Post Card */}
      <motion.div className="card p-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {isAnonymous && !postAuthorRevealed ? (
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
            ) : (
              <img src={post.users?.avatar && post.users.avatar.trim() ? post.users.avatar : '/Cute-Cat.png'} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-gray-100 flex-shrink-0" onError={e => { e.target.src = '/Cute-Cat.png'; }} />
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-dark">
                  {isAnonymous && !postAuthorRevealed ? 'Anonymous' : (post.users?.name || post.author_name)}
                </span>
                {(() => {
                  let badges = Array.isArray(post.users?.badges) ? [...post.users.badges] : [];
                  if (post.users?.role === 'admin' && !badges.includes('ADMIN')) badges.push('ADMIN');
                  return badges.map((badge, idx) => (
                    <span key={idx} className="badge bg-primary/5 text-primary/70">{badge}</span>
                  ));
                })()}
              </div>
              <p className="text-xs text-muted mt-0.5">
                {post.created_at && format(utcToZonedTime(new Date(post.created_at + 'Z'), 'Asia/Manila'), 'dd MMM yyyy, hh:mm a', { timeZone: 'Asia/Manila' })}
              </p>
              {isAnonymous && canReveal && (
                <button className="text-xs text-primary font-medium hover:underline mt-1" onClick={() => setPostAuthorRevealed(v => !v)}>
                  {postAuthorRevealed ? 'Hide Author' : 'Reveal Author'}
                </button>
              )}
            </div>
          </div>
          <span className={`badge ${categories.find(c => c.key === post.category)?.color || 'bg-gray-100 text-gray-600'}`}>
            {post.category}
          </span>
        </div>

        {editingPost ? (
          <div className="flex flex-col gap-4 mb-4">
            <input className="w-full rounded-xl px-4 py-2.5 border border-gray-200 text-xl font-bold focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none" value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Title" />
            <select className="w-full rounded-xl px-4 py-2.5 border border-gray-200 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none bg-white" value={editCategory} onChange={e => setEditCategory(e.target.value)}>
              {categories.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
            <textarea className="w-full rounded-xl px-4 py-2.5 border border-gray-200 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none resize-none min-h-[120px]" value={editContent} onChange={e => setEditContent(e.target.value)} placeholder="Content" rows={5} />
            <input className="w-full rounded-xl px-4 py-2.5 border border-gray-200 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none" value={editLinkUrl} onChange={e => setEditLinkUrl(e.target.value)} placeholder="Link URL (optional)" />
            <div className="flex gap-3">
              <button className="btn-primary text-sm" disabled={editSaving} onClick={async () => {
                if (!editTitle.trim() || !editContent.trim()) return;
                setEditSaving(true);
                try {
                  await api.put(`/posts/${post.id}`, { title: editTitle, content: editContent, category: editCategory, link_url: editLinkUrl });
                  const r = await api.get(`/posts/${id}`);
                  setData(r.data);
                  setEditingPost(false);
                } catch (err) { alert('Failed to update post.'); }
                finally { setEditSaving(false); }
              }}>{editSaving ? 'Saving...' : 'Save'}</button>
              <button className="btn-secondary text-sm" onClick={() => setEditingPost(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-dark mb-2 break-words">
              {post.title}
              {post.locked && <span className="ml-2 text-muted">🔒</span>}
            </h1>

            {statusLabel && isAuthor && (
              <div className={`badge mb-3 ${post.status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'}`}>
                {statusLabel}
              </div>
            )}

            {post.pinned && <p className="text-xs text-muted mb-3">📌 Pinned by admin</p>}
            {post.locked && <p className="text-xs text-muted mb-3">🔒 Locked by admin</p>}

            <div className="prose prose-sm max-w-none text-dark mb-4">
              <p className="whitespace-pre-wrap break-words">{post.content}</p>
            </div>

            {Array.isArray(post.image_url) && post.image_url.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {post.image_url.map((url, idx) => (
                  <img key={idx} src={getAssetUrl(url)} alt="" className="rounded-xl max-h-64 object-contain cursor-pointer hover:opacity-90 transition-opacity border border-gray-100" onClick={() => { setModalImageUrl(getAssetUrl(url)); setShowImageModal(true); }} />
                ))}
              </div>
            )}
            {typeof post.image_url === 'string' && post.image_url && (
              <img src={getAssetUrl(post.image_url)} alt="" className="rounded-xl max-h-64 object-contain mb-4 cursor-pointer hover:opacity-90 transition-opacity border border-gray-100" onClick={() => { setModalImageUrl(getAssetUrl(post.image_url)); setShowImageModal(true); }} />
            )}

            {post.audio_url && <div className="mb-4"><VoiceMessagePlayer src={post.audio_url} /></div>}
            {post.link_url && <a className="text-primary font-medium text-sm hover:underline inline-flex items-center gap-1 mb-4" href={post.link_url} target="_blank" rel="noreferrer">Visit link ↗</a>}
          </>
        )}

        {/* Reactions */}
        <div className="flex items-center gap-2 py-3 border-t border-gray-100">
          {reactionTypes.map(rt => (
            <button
              key={rt.key}
              type="button"
              disabled={!token || reacting}
              onClick={() => handleReact(rt.key)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${userReaction === rt.key ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-gray-50 text-muted border border-gray-100 hover:bg-gray-100'} ${(!token || reacting) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span>{rt.icon}</span>
              <span>{reactions[rt.key] || 0}</span>
            </button>
          ))}
          <button className="ml-auto text-xs text-muted hover:text-dark font-medium flex items-center gap-1" onClick={() => { setShowReportModal(true); setReportReason(''); setReportMsg(''); }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>
            Report
          </button>
        </div>

        {isAuthor && !editingPost && (
          <div className="flex gap-3 mt-2">
            <button className="text-xs text-primary font-medium hover:underline" onClick={() => { setEditTitle(post.title); setEditContent(post.content); setEditCategory(post.category); setEditLinkUrl(post.link_url || ''); setEditingPost(true); }}>Edit post</button>
            <button className="text-xs text-error font-medium hover:underline" onClick={() => setShowPostDeleteConfirm(true)}>Delete post</button>
          </div>
        )}
      </motion.div>

      {showPostDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <motion.div className="bg-white rounded-2xl shadow-elevated p-6 max-w-sm w-full mx-4 text-center" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <p className="text-dark font-medium mb-4">Are you sure you want to delete this post?</p>
            <div className="flex gap-3 justify-center">
              <button className="btn-error text-sm" onClick={async () => { setShowPostDeleteConfirm(false); await api.delete(`/posts/${post.id}`); navigate('/'); }}>Delete</button>
              <button className="btn-secondary text-sm" onClick={() => setShowPostDeleteConfirm(false)}>Cancel</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Comments Section */}
      <motion.div className="card p-6 mt-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <h3 className="font-semibold text-dark mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          Comments ({comments.length})
        </h3>

        {(post.status === 'approved' || isAuthor) ? (
          <>
            <div className="mb-6">
              {comments.length === 0 && <p className="text-sm text-muted text-center py-4">No comments yet. Be the first!</p>}
              {buildCommentTree(comments).map(comment => (
                <RecursiveComment key={comment.id} comment={comment} depth={0} />
              ))}
            </div>

            {post.locked ? (
              <div className="bg-gray-50 rounded-xl p-4 text-center text-sm text-muted">🔒 This post is locked. Comments are disabled.</div>
            ) : (
              <form onSubmit={handleCommentSubmit}>
                <textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Write a comment..." className="w-full p-3 rounded-xl border border-gray-200 bg-white text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none resize-none min-h-[80px]" rows={2} disabled={commentLoading} />
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <label className="flex items-center gap-1.5 text-xs text-muted cursor-pointer hover:text-dark">
                    <input type="checkbox" checked={commentAnonymous} onChange={e => setCommentAnonymous(e.target.checked)} className="rounded" />
                    Comment anonymously
                  </label>
                  <label className="text-xs text-muted cursor-pointer hover:text-dark">
                    <input type="file" accept="image/*" multiple className="hidden" onChange={e => { if (e.target.files) setCommentImageFiles(Array.from(e.target.files)); }} disabled={commentLoading} />
                    Attach images
                  </label>
                  <button type="button" className={`text-xs text-muted hover:text-dark ${recording ? 'text-error' : ''}`} onClick={recording ? stopRecording : startRecording} disabled={audioUploading}>
                    {recording ? 'Stop recording' : 'Record voice'}
                  </button>
                  {audioUrl && <audio controls src={audioUrl} className="h-8" />}
                  {audioUrl && <button type="button" className="text-xs text-error" onClick={() => { setAudioBlob(null); setAudioUrl(''); }}>Remove</button>}
                  <button type="submit" className="btn-primary text-sm ml-auto py-1.5 px-4" disabled={commentLoading}>
                    {commentLoading ? 'Sending...' : 'Send'}
                  </button>
                </div>
                {commentImageFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {commentImageFiles.map((file, idx) => (
                      <img key={idx} src={URL.createObjectURL(file)} alt="" className="rounded-lg max-h-16 border border-gray-200" />
                    ))}
                  </div>
                )}
              </form>
            )}
          </>
        ) : (
          <p className="text-sm text-muted text-center py-4">Comments will be available after admin approval.</p>
        )}
      </motion.div>
    </div>
  );
}
