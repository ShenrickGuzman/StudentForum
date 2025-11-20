

import { Link, useParams, useNavigate } from 'react-router-dom';
import { format, utcToZonedTime } from 'date-fns-tz';
import { useEffect, useState, useRef } from 'react';
import api, { getAssetUrl, reportPost } from '../lib/api';
import { useAuth } from '../state/auth';
import CommentCard from '../components/CommentCard';
import VoiceMessagePlayer from '../components/VoiceMessagePlayer';

const categories = [
  { key: 'Academics', label: '📚 Academics', color: 'bg-gradient-to-r from-pink-400 to-pink-500 text-white' },
  { key: 'Arts', label: '🎨 Arts', color: 'bg-gradient-to-r from-orange-300 to-orange-400 text-white' },
  { key: 'Sports', label: '🏅 Sports', color: 'bg-gradient-to-r from-green-400 to-teal-400 text-white' },
  { key: 'Music', label: '🎵 Music', color: 'bg-gradient-to-r from-purple-400 to-purple-500 text-white' },
  { key: 'Technology', label: '💻 Technology', color: 'bg-gradient-to-r from-cyan-400 to-blue-400 text-white' },
  { key: 'Ideas', label: '💡 Ideas', color: 'bg-gradient-to-r from-yellow-300 to-yellow-400 text-yellow-900' },
  { key: 'Random', label: '✨ Random', color: 'bg-gradient-to-r from-purple-400 to-indigo-400 text-white' },
];

export default function PostDetailPage() {
  // State for reporting post (moved inside component)
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportMsg, setReportMsg] = useState('');
  const [reportLoading, setReportLoading] = useState(false);

  // Essential hooks and state used throughout the page
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

  const [reacting, setReacting] = useState(false);
  const [userReaction, setUserReaction] = useState(null);
  const [reactions, setReactions] = useState({});

  const [postAuthorRevealed, setPostAuthorRevealed] = useState(false);
  const [revealedComments, setRevealedComments] = useState({});
  const [showProfileBtnFor, setShowProfileBtnFor] = useState(null);
  const [showPostDeleteConfirm, setShowPostDeleteConfirm] = useState(false);

  // Restore original reaction types (including sad)
  const reactionTypes = [
    { key: 'like', icon: '👍', color: '', label: 'Like' },
    { key: 'heart', icon: '❤️', color: 'bg-pink-100', label: 'Heart' },
    { key: 'haha', icon: '😂', color: '', label: 'Haha' },
    { key: 'sad', icon: '😢', color: 'bg-blue-100', label: 'Sad' },
    { key: 'wow', icon: '😮', color: 'bg-purple-100', label: 'Wow' },
  ];

  // Fetch post and comments when `id` changes
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
        console.error('Failed to fetch post or comments', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchAll();
    return () => { mounted = false; };
  }, [id]);

  const handleReportPost = async () => {
    if (!reportReason.trim()) {
      setReportMsg('Please enter a reason.');
      return;
    }
    // Add your report logic here (e.g., send report to backend)
    setReportLoading(true);
    try {
      await reportPost(id, reportReason);
      setReportMsg('Report submitted successfully!');
      setShowReportModal(false);
    } catch (err) {
      setReportMsg('Failed to report post.');
    } finally {
      setReportLoading(false);
    }
  };

  const handleReact = async (type) => {
      if (!token || reacting) {
        console.log('Reaction blocked:', { hasToken: !!token, reacting });
        return;
      }
      setReacting(true);
      let newType = type;
      if (userReaction === type) newType = null;
    
      console.log('Starting reaction process:', { 
        type: newType, 
        postId: id, 
        hasToken: !!token,
        tokenLength: token?.length,
        userAgent: navigator.userAgent
      });
    
      try {
        // Check if we can get post data first (to verify API connectivity)
        console.log('Testing API connectivity...');
        await api.get(`/posts/${id}`);
        console.log('API connectivity OK, sending reaction...');
      
        const response = await api.post(`/posts/post/${id}/react`, { emoji: newType });
        console.log('Reaction response:', response.data);
      
        // Refresh the post data to get updated reactions
        console.log('Refreshing post data...');
        const r = await api.get(`/posts/${id}`);
        setData(r.data);
        if (r.data.reactions) setReactions(r.data.reactions.counts);
        if (r.data.reactions) setUserReaction(r.data.reactions.user);
        console.log('Reaction completed successfully');
      } catch (error) {
        console.error('Reaction failed:', {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          headers: error.response?.headers,
          url: error.config?.url,
          method: error.config?.method
        });
      
        // Show user feedback on error with more specific info
        const errorMsg = error.response?.data?.error || error.response?.statusText || error.message || 'Unknown error';
        alert(`Failed to add reaction: ${errorMsg} (Status: ${error.response?.status || 'Unknown'})`);
      }
      setReacting(false);
  };

  // Audio recording handlers
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new window.MediaRecorder(stream);
    audioChunksRef.current = [];
    mediaRecorderRef.current.ondataavailable = e => {
      audioChunksRef.current.push(e.data);
    };
    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      setAudioBlob(blob);
      setAudioUrl(URL.createObjectURL(blob));
    };
    mediaRecorderRef.current.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setRecording(false);
  };

  const handleCommentSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!newComment.trim()) return;
    setCommentLoading(true);
    try {
      // 1. Create comment
      const res = await api.post(`/posts/${id}/comments`, { content: newComment, anonymous: commentAnonymous });
      const commentId = res.data?.id || (res.data && res.data.comment && res.data.comment.id);
      // 2. If audio, upload it
      if (audioBlob && commentId) {
        setAudioUploading(true);
        const audioForm = new FormData();
        audioForm.append('file', audioBlob, 'voice-message.webm');
        await api.post(`/upload/audio/comment/${commentId}`, audioForm, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setAudioUploading(false);
        setAudioBlob(null);
        setAudioUrl('');
        // Re-fetch comments after uploading audio
        const response = await api.get(`/posts/${id}/comments`);
        setComments(response.data);
      } else {
        setNewComment('');
        setCommentAnonymous(false);
        // Re-fetch comments after adding a new one
        const response = await api.get(`/posts/${id}/comments`);
        setComments(response.data);
      }
    } catch (err) {
      alert('Failed to submit comment. Please try again.');
    } finally {
      setCommentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 to-yellow-100">
        <div className="cartoon-card text-2xl font-bold text-primary bg-white/90 p-8 shadow-fun flex flex-col items-center gap-2">
          <span className="text-4xl animate-spin">💬</span>
          Loading Forum...
        </div>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 to-yellow-100">
        <div className="cartoon-card text-2xl font-bold text-red-600 bg-white/90 p-8 shadow-fun flex flex-col items-center gap-2">
          <span className="text-4xl">❌</span>
          Failed to load post. Please check your connection or try again later.
        </div>
      </div>
    );
  }
  const post = data?.post;
  // Always use backend anonymous flag
  const isAnonymous = !!post?.anonymous;
  // Helper: show status label
  const statusLabel = post.status === 'pending' ? '⏳ Waiting for Admin Approval' : post.status === 'rejected' ? '❌ Rejected by Admin' : post.status === 'approved' ? '✅ Approved' : '';
  const isAuthor = user && post.user_id === user.id;

  const isAdmin = user && (user.role === 'admin' || user.role === 'teacher' || user.role === 'shen');

  return (
  <div className="min-h-screen w-full font-cartoon relative overflow-x-hidden" style={{background: 'linear-gradient(120deg, #ffe0c3 0%, #fcb7ee 100%)'}}>
      {/* Navigation Bar Placeholder (if any) */}
      <div className="h-16 w-full" />
      {/* Close Forum Button just above the post card for mobile */}
      <div className="w-full flex justify-start px-4 mb-2" style={{ maxWidth: '700px', margin: '0 auto' }}>
        <button
          type="button"
          className="px-5 py-2 rounded-full bg-gradient-to-r from-yellow-200 via-pink-200 to-pink-300 text-purple-800 font-extrabold shadow-fun border-4 border-pink-200 hover:scale-110 hover:bg-yellow-100 transition-all flex items-center gap-2 drop-shadow-lg hover:drop-shadow-2xl"
          style={{ fontFamily: 'Baloo, Fredoka, Comic Neue, cursive' }}
          onClick={() => navigate('/')}
          aria-label="Close Forum and return to Home"
        >
    <span className="text-2xl">⬅️</span> <span className="inline">Close Forum</span>
        </button>
      </div>
      {/* Floating pastel circles */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none">
        <span className="absolute left-8 top-8 w-20 h-20 rounded-full bg-yellow-200 opacity-30"></span>
        <span className="absolute right-10 top-24 w-12 h-12 rounded-full bg-green-200 opacity-20"></span>
        <span className="absolute left-1/4 bottom-10 w-32 h-32 rounded-full bg-pink-200 opacity-20"></span>
        <span className="absolute right-1/3 top-1/2 w-16 h-16 rounded-full bg-blue-200 opacity-20"></span>
        <span className="absolute left-10 bottom-24 w-12 h-12 rounded-full bg-purple-200 opacity-20"></span>
        <span className="absolute right-8 bottom-8 w-24 h-24 rounded-full bg-yellow-100 opacity-30"></span>
      </div>
  <div className="relative z-10 max-w-3xl mx-auto py-12 space-y-8">
        {/* Post Card - Redesigned */}
  <div className="bg-white/95 rounded-3xl shadow-fun border-4 border-purple-200 p-0 sm:p-0 animate-pop flex flex-col gap-0" style={{backdropFilter:'blur(6px)', boxShadow:'0 8px 32px 0 rgba(186, 104, 200, 0.18), 0 1.5px 0 0 #fcb7ee'}}>
          {/* Header Row: User info left, category right */}
          <div className="flex justify-between items-start px-8 pt-8 pb-2">
            <div className="flex items-center gap-4">
              {/* Author info: hide if anonymous */}
              {isAnonymous && !postAuthorRevealed ? (
                <div className="flex items-center gap-4 ml-2">
                  <div className="w-20 h-20 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-5xl text-white font-bold shadow-fun overflow-hidden">
                    <span className="text-5xl">👤</span>
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className="font-extrabold text-base sm:text-lg text-gray-500 leading-tight">Anonymous</span>
                    <span className="text-gray-400 text-xs font-semibold">{post.created_at && format(utcToZonedTime(new Date(post.created_at + 'Z'), 'Asia/Manila'), 'dd MMMM yyyy, hh:mm a', { timeZone: 'Asia/Manila' })}</span>
                    {(user?.name === 'SHEN' || user?.name === 'Ari') && (
                      <button
                        className="mt-2 px-3 py-1 rounded-xl bg-yellow-200 text-purple-800 font-bold text-xs border border-yellow-400 hover:bg-yellow-300 transition-all"
                        onClick={() => setPostAuthorRevealed(true)}
                      >Reveal Author</button>
                    )}
                  </div>
                </div>
              ) : isAnonymous && postAuthorRevealed ? (
                <div className="flex items-center gap-4 ml-2">
                  <img
                    src={post.users?.avatar && post.users.avatar.trim() ? post.users.avatar : '/Cute-Cat.png'}
                    alt="author avatar"
                    className="w-20 h-20 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-purple-300 shadow"
                    onError={e => { e.target.src = '/Cute-Cat.png'; }}
                  />
                  <div className="flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-extrabold text-base sm:text-lg text-gray-800 leading-tight">{post.users?.name || post.author_name}</span>
                      <Link to={`/profile/${post.user_id}`} className="px-2 py-1 rounded-xl bg-purple-400 text-white font-bold text-xs">View Profile</Link>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-1">
                      {(() => {
                        let badges = Array.isArray(post.users?.badges) ? [...post.users.badges] : [];
                        if (post.users?.role === 'admin' && !badges.includes('ADMIN')) badges.push('ADMIN');
                        return badges.map((badge, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-full bg-yellow-100 border border-yellow-300 text-yellow-800 text-xs font-bold uppercase tracking-wider">{badge}</span>
                        ));
                      })()}
                    </div>
                    <span className="text-gray-400 text-xs font-semibold">{post.created_at && format(utcToZonedTime(new Date(post.created_at + 'Z'), 'Asia/Manila'), 'dd MMMM yyyy, hh:mm a', { timeZone: 'Asia/Manila' })}</span>
                    {isAdmin && (
                      <button
                        className="mt-2 px-3 py-1 rounded-xl bg-yellow-100 text-purple-800 font-bold text-xs border border-yellow-400 hover:bg-yellow-200 transition-all"
                        onClick={() => setPostAuthorRevealed(false)}
                      >Hide Author</button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 ml-2">
                  <img
                    src={post.users?.avatar && post.users.avatar.trim() ? post.users.avatar : '/Cute-Cat.png'}
                    alt="author avatar"
                    className="w-20 h-20 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-purple-300 shadow"
                    onError={e => { e.target.src = '/Cute-Cat.png'; }}
                  />
                  <div className="flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-extrabold text-base sm:text-lg text-gray-800 leading-tight">{post.users?.name || post.author_name}</span>
                      <Link to={`/profile/${post.user_id}`} className="px-2 py-1 rounded-xl bg-purple-400 text-white font-bold text-xs">View Profile</Link>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-1">
                      {(() => {
                        let badges = Array.isArray(post.users?.badges) ? [...post.users.badges] : [];
                        if (post.users?.role === 'admin' && !badges.includes('ADMIN')) badges.push('ADMIN');
                        return badges.map((badge, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-full bg-yellow-100 border border-yellow-300 text-yellow-800 text-xs font-bold uppercase tracking-wider">{badge}</span>
                        ));
                      })()}
                    </div>
                    <span className="text-gray-400 text-xs font-semibold">{post.created_at && format(utcToZonedTime(new Date(post.created_at + 'Z'), 'Asia/Manila'), 'dd MMMM yyyy, hh:mm a', { timeZone: 'Asia/Manila' })}</span>
                  </div>
                </div>
              )}
            </div>
            <span className={`px-4 py-1 rounded-full text-sm shadow font-extrabold font-cartoon tracking-wide drop-shadow-lg mt-2 ${categories.find(c => c.key === post.category)?.color || 'bg-gray-400 text-white'}`}>
              {categories.find(c => c.key === post.category)?.label || post.category}
            </span>
          </div>
          {/* Title & Status */}
          <div className="px-8 pt-2 pb-0">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-purple-700 mb-2 text-left drop-shadow-lg font-cartoon break-words whitespace-pre-wrap" style={{letterSpacing:1, wordBreak: 'break-word', whiteSpace: 'pre-wrap'}}>
                {post.title}
                {post.locked && <span className="text-error text-2xl font-bold ml-2">🔒</span>}
              </h1>
            </div>
            {/* Report Post Modal */}
            {showReportModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="cartoon-card max-w-md w-full border-4 border-yellow-400 bg-gradient-to-br from-yellow-100 via-pink-100 to-red-100 animate-pop rounded-3xl shadow-2xl p-8 text-center font-cartoon">
                  <h2 className="text-2xl font-extrabold mb-2 text-pink-500 drop-shadow">Report Post</h2>
                  <div className="mb-4 text-lg font-bold text-yellow-700">Why are you reporting this post?</div>
                  <input
                    className="w-full rounded-xl px-4 py-3 border-2 border-pink-300 bg-yellow-50 text-lg focus:ring-2 focus:ring-pink-300 outline-none mb-4"
                    placeholder="Reason for reporting"
                    value={reportReason}
                    onChange={e => setReportReason(e.target.value)}
                    disabled={reportLoading}
                  />
                  {reportMsg && <div className="text-error bg-pink-100 rounded-xl px-4 py-2 border-2 border-pink-300 w-full text-center animate-wiggle mb-2">{reportMsg}</div>}
                  <div className="flex gap-4 justify-center mt-2">
                    <button className="fun-btn px-6 py-3 text-lg bg-gradient-to-r from-yellow-400 to-pink-400" onClick={handleReportPost} disabled={reportLoading}>{reportLoading ? 'Reporting...' : 'Report'}</button>
                    <button className="fun-btn px-6 py-3 text-lg bg-gradient-to-r from-gray-400 to-gray-600" onClick={() => setShowReportModal(false)} disabled={reportLoading}>Cancel</button>
                  </div>
                </div>
              </div>
            )}
            {/* Forum status indicators */}
            <div className="flex gap-2 items-center mb-1">
              {post.pinned && <span className="text-accent font-bold flex items-center gap-1"><span className="text-xl">📌</span> This Forum is pinned by an admin</span>}
              {post.locked && <span className="text-error font-bold flex items-center gap-1"><span className="text-xl">🔒</span> This Forum has been locked by an admin</span>}
              {statusLabel && isAuthor && (
                <span className={`ml-2 px-3 py-1 rounded-full font-bold text-xs shadow ${post.status === 'pending' ? 'bg-yellow-200 text-yellow-900' : post.status === 'rejected' ? 'bg-red-200 text-red-700' : 'bg-green-200 text-green-700'}`}>{statusLabel}</span>
              )}
            </div>
            {/* Cancel Post button for author if pending */}
            {isAuthor && (
              <>
                <button
                  className="mt-2 px-4 py-2 rounded-xl bg-gradient-to-r from-gray-400 to-gray-600 text-white font-bold shadow-fun border-2 border-red-200 hover:scale-105 transition-all"
                  onClick={() => setShowPostDeleteConfirm(true)}
                >Delete Post</button>
                {showPostDeleteConfirm && (
                  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
                    <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center">
                      <div className="font-bold text-lg mb-3 text-purple-700">Are you sure you want to delete this forum?</div>
                      <div className="flex gap-4">
                        <button
                          className="px-4 py-2 rounded bg-gradient-to-r from-pink-400 to-orange-300 text-white font-bold shadow hover:scale-105 transition-all"
                          onClick={async () => {
                            setShowPostDeleteConfirm(false);
                            await api.delete(`/posts/${post.id}`);
                            navigate('/');
                          }}
                        >Yes</button>
                        <button
                          className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-bold shadow hover:scale-105 transition-all"
                          onClick={() => setShowPostDeleteConfirm(false)}
                        >No</button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          {/* Content with gradient border */}
          <div className="px-8 pt-4 pb-4">
            <div className="rounded-3xl p-1" style={{background: 'linear-gradient(120deg, #ffe0c3 0%, #fcb7ee 100%)'}}>
              <div className="bg-white rounded-2xl p-6 min-h-[180px] flex flex-col items-center justify-center">
                {post.image_url && <img alt="" className="rounded-2xl my-2 max-h-64 object-contain mx-auto border-2 border-purple-100" src={getAssetUrl(post.image_url)} />}
                <p className="whitespace-pre-wrap break-words text-lg md:text-xl font-semibold text-gray-700 text-left w-full mb-2 drop-shadow-lg" style={{fontWeight: 600}}>{post.content}</p>
                {/* Voice message audio player for post */}
                {post.audio_url && (
                  <div className="mt-3 w-full flex justify-center">
                    <VoiceMessagePlayer src={post.audio_url} />
                  </div>
                )}
                {post.link_url && <a className="text-pink-500 underline font-bold" href={post.link_url} target="_blank" rel="noreferrer">🔗 Visit link</a>}
              </div>
            </div>
          </div>
          {/* Reaction Row - improved */}
          <div className="flex flex-row items-center justify-start gap-2 sm:gap-3 px-4 sm:px-8 pb-6 pt-2 overflow-x-auto">
            {reactionTypes.map(rt => (
              <button
                key={rt.key}
                type="button"
                disabled={!token || reacting}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Button clicked:', rt.key, 'disabled:', !token || reacting);
                  if (!reacting && token) {
                    handleReact(rt.key);
                  }
                }}
                className={`flex flex-col items-center px-3 sm:px-4 py-3 sm:py-4 rounded-2xl font-extrabold text-lg shadow-fun border-4 transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-pink-200 hover:scale-105 active:scale-95 touch-manipulation min-w-[60px] sm:min-w-[70px] cursor-pointer ${userReaction === rt.key ? 'border-yellow-300 scale-105 bg-gradient-to-br from-pink-200 to-yellow-100' : 'border-yellow-200 bg-white'} ${rt.color} ${(!token || reacting) ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-pressed={userReaction === rt.key}
                aria-label={rt.label}
                style={{ WebkitTapHighlightColor: 'transparent', userSelect: 'none' }}
              >
                <span className="text-xl sm:text-2xl mb-0.5 drop-shadow-lg pointer-events-none select-none">{rt.icon}</span>
                <span className="text-xs font-bold text-purple-700 pointer-events-none select-none">{reactions[rt.key] || 0}</span>
              </button>
            ))}
          </div>
          {/* Report Button moved below reactions, bottom right corner */}
          <div className="w-full flex justify-end px-8 pb-4">
            <button
              className="fun-btn px-4 py-2 text-base bg-gradient-to-r from-yellow-400 to-pink-400 hover:from-yellow-500 hover:to-pink-500"
              onClick={() => { setShowReportModal(true); setReportReason(''); setReportMsg(''); }}
              title="Report post"
            >Report 🚩</button>
          </div>
        </div>
        {/* Comment Section - New Format */}
        <div className="bg-white/95 rounded-[2.5rem] shadow-fun border-4 border-purple-200 p-4 sm:p-8 animate-pop" style={{backdropFilter:'blur(6px)', boxShadow:'0 8px 32px 0 rgba(186, 104, 200, 0.18), 0 1.5px 0 0 #fcb7ee'}}>
          <h3 className="text-xl sm:text-2xl font-extrabold text-purple-700 mb-4 text-center drop-shadow-lg flex items-center gap-2">
            <span className="text-3xl">💬</span> Comments
          </h3>
          <style>{`
            @media (max-width: 640px) {
              .comment-card-mobile {
                flex-direction: row !important;
                align-items: center !important;
                gap: 0.75rem !important;
                padding: 1rem !important;
                position: relative !important;
              }
              .comment-avatar-mobile {
                width: 3rem !important;
                height: 3rem !important;
                border-radius: 50% !important;
                object-fit: cover !important;
                margin-bottom: 0 !important;
                box-shadow: 0 2px 8px rgba(186,104,200,0.12);
              }
              .comment-meta-mobile {
                flex-direction: row !important;
                align-items: center !important;
                gap: 0.5rem !important;
              }
              .comment-delete-mobile {
                margin-top: 0 !important;
                align-self: flex-end !important;
              }
              .comment-date-mobile {
                position: absolute !important;
                right: 1rem !important;
                bottom: 0.5rem !important;
                font-size: 0.85rem !important;
                color: #888 !important;
                text-align: right !important;
              }
            }
          `}</style>
          {/* Only show comments if post is approved or author is viewing */}
          {(post.status === 'approved' || isAuthor) ? (
            <>
              <div className="mb-4">
                {comments.length === 0 && (
                  <div className="text-center text-purple-300 font-bold">No comments yet. Be the first to comment!</div>
                )}
                {comments.map((comment) => {
                  let badges = Array.isArray(comment.users?.badges) ? [...comment.users.badges] : [];
                  if (comment.author_role === 'admin' && !badges.includes('ADMIN')) {
                    badges = [...badges, 'ADMIN'];
                  }
                  const isCommentAnonymous = comment.anonymous && !revealedComments[comment.id];
                  return (
                    <CommentCard
                      key={comment.id}
                      avatar={isCommentAnonymous ? <span className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-2xl">👤</span> : (
                        <img
                          src={comment.users?.avatar && comment.users.avatar.trim() ? comment.users.avatar : '/Cute-Cat.png'}
                          alt="author avatar"
                          className="w-12 h-12 rounded-full object-cover border-2 border-purple-300 shadow"
                          onError={e => { e.target.src = '/Cute-Cat.png'; }}
                        />
                      )}
                      username={comment.anonymous ? (
                        <span className="font-bold text-gray-500">
                          {revealedComments[comment.id] ? (
                            <>
                              {comment.author_name || 'User'}
                              {isAdmin && (
                                <button
                                  className="ml-2 px-2 py-0.5 rounded bg-yellow-100 text-purple-800 text-xs font-bold border border-yellow-400 hover:bg-yellow-200 transition-all"
                                  onClick={() => setRevealedComments(rc => ({ ...rc, [comment.id]: false }))}
                                >Hide Author</button>
                              )}
                            </>
                          ) : (
                            <>
                              Anonymous
                              {isAdmin && (
                                <button
                                  className="ml-2 px-2 py-0.5 rounded bg-yellow-200 text-purple-800 text-xs font-bold border border-yellow-400 hover:bg-yellow-300 transition-all"
                                  onClick={() => setRevealedComments(rc => ({ ...rc, [comment.id]: true }))}
                                >Reveal Author</button>
                              )}
                            </>
                          )}
                        </span>
                      ) : (
                        <div className="relative inline-block">
                          <button
                            className="font-bold text-purple-800 hover:text-purple-600 transition-all bg-transparent border-none p-0 cursor-pointer"
                            onClick={() => setShowProfileBtnFor(showProfileBtnFor === comment.id ? null : comment.id)}
                            style={{ background: 'none' }}
                          >
                            {comment.author_name || 'User'}
                          </button>
                          {showProfileBtnFor === comment.id && (
                            <Link to={`/profile/${comment.user_id}`} className="ml-2 px-3 py-1 rounded-xl bg-purple-400 text-white font-bold text-xs absolute left-full top-1/2 -translate-y-1/2 z-10 shadow-lg">
                              View Profile
                            </Link>
                          )}
                        </div>
                      )}
                      badges={isCommentAnonymous ? [] : badges}
                      time={comment.created_at ? format(utcToZonedTime(new Date(comment.created_at + 'Z'), 'Asia/Manila'), 'dd MMM yyyy, hh:mm a', { timeZone: 'Asia/Manila' }) : ''}
                      content={<span style={{wordBreak: 'break-word', whiteSpace: 'pre-wrap'}}>{comment.content}</span>}
                      canDelete={user && (comment.user_id === user.id || user.role === 'admin')}
                      onDelete={async () => {
                        await api.delete(`/posts/comments/${comment.id}`);
                        // Re-fetch comments after deleting
                        const response = await api.get(`/posts/${id}/comments`);
                        setComments(response.data);
                      }}
                      audio_url={comment.audio_url}
                    />
                  );
                })}
              </div>
              {post.locked ? (
                <div className="flex flex-col items-center justify-center mt-6">
                  <div className="text-error font-extrabold text-lg flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-6 py-4 mb-2">
                    <span className="text-2xl">🔒</span> This Forum has been locked by an admin
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCommentSubmit} className="flex items-end gap-3 mt-6">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-pink-200 to-yellow-200 text-2xl font-bold">
                    😊
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write a comment... 💭"
                      className="w-full p-3 rounded-xl border border-purple-200 focus:ring-2 focus:ring-pink-200 focus:outline-none bg-white/80 text-base shadow-sm resize-none min-h-[48px] max-h-[200px] sm:min-h-[48px] min-h-[70px] sm:text-base text-lg comment-textarea-mobile"
                      style={{fontFamily: 'Comic Neue, Baloo, Fredoka, cursive'}}
                      rows={1}
                      maxLength={500}
                      disabled={commentLoading}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          handleCommentSubmit();
                        }
                      }}
                    />
                    <style>{`
                      @media (max-width: 600px) {
                        .comment-textarea-mobile {
                          min-height: 90px !important;
                          font-size: 1.08rem !important;
                        }
                      }
                    `}</style>
                    <label className="flex items-center gap-2 mt-2">
                      <input
                        type="checkbox"
                        checked={commentAnonymous}
                        onChange={e => setCommentAnonymous(e.target.checked)}
                        className="w-5 h-5 accent-pink-500"
                      />
                      <span className="font-bold text-pink-500">Comment Anonymously</span>
                    </label>
                    {/* Voice Message UI for Comment - only in input form */}
                    <div className="mt-2">
                      <label className="block mb-1 font-bold text-pink-500 text-sm">Voice Message <span className="font-normal text-purple-400">(optional)</span></label>
                      <div className="flex gap-2 items-center">
                        <button
                          type="button"
                          className={`rounded px-3 py-1 font-bold shadow border border-pink-300 bg-gradient-to-r from-pink-100 to-yellow-100 text-purple-700 transition-all ${recording ? 'bg-yellow-200' : ''}`}
                          onClick={recording ? stopRecording : startRecording}
                          disabled={audioUploading}
                        >{recording ? 'Stop Recording' : 'Record Voice'}</button>
                        {audioUrl && (
                          <audio controls src={audioUrl} className="ml-2" />
                        )}
                        {audioUrl && (
                          <button type="button" className="ml-2 text-red-500 font-bold" onClick={() => { setAudioBlob(null); setAudioUrl(''); }}>Remove</button>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-pink-400 to-orange-300 text-white font-extrabold shadow-fun hover:scale-105 transition-all flex items-center gap-2 text-base"
                    style={{fontFamily: 'Comic Neue, Baloo, Fredoka, cursive'}}
                  >
                    <span className="text-lg">✈️</span> Send
                  </button>
                </form>
              )}
            {/* End comments and comment form section */}
          </>
          ) : (
            <div className="text-center text-purple-400 font-bold py-8">This post is not public yet. Comments will be available after admin approval.</div>
          )}
        </div>
      </div>
    </div>
  );
}
