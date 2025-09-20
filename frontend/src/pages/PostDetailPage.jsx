
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api, { getAssetUrl } from '../lib/api';
import { useAuth } from '../state/auth';
import CommentCard from '../components/CommentCard';

export default function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reactions, setReactions] = useState({ like: 0, heart: 0, wow: 0, sad: 0, haha: 0 });
  const [userReaction, setUserReaction] = useState(null);
  const [reacting, setReacting] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  const reactionTypes = [
    { key: 'like', icon: '👍', color: 'bg-blue-200', label: 'Like' },
    { key: 'heart', icon: '❤️', color: 'bg-pink-200', label: 'Heart' },
    { key: 'wow', icon: '😮', color: 'bg-white', label: 'Wow' },
    { key: 'sad', icon: '😢', color: 'bg-purple-200', label: 'Sad' },
    { key: 'haha', icon: '😂', color: 'bg-green-200', label: 'HAHA' },
  ];

  useEffect(() => {
    setLoading(true);
    api.get(`/posts/${id}`).then(r => {
      setData(r.data);
      setLoading(false);
      if (r.data.reactions) setReactions(r.data.reactions.counts);
      if (r.data.reactions) setUserReaction(r.data.reactions.user);
    });
  }, [id]);

  useEffect(() => {
    // Fetch comments for the post
    const fetchComments = async () => {
      const response = await api.get(`/posts/${id}/comments`);
      setComments(response.data);
    };
    fetchComments();
  }, [id]);

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

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (newComment.trim()) {
      await api.post(`/posts/${id}/comments`, { content: newComment });
      setNewComment('');
      // Re-fetch comments after adding a new one
      const response = await api.get(`/posts/${id}/comments`);
      setComments(response.data);
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
  const { post } = data;
  const [showPostDeleteConfirm, setShowPostDeleteConfirm] = useState(false);
  // Helper: show status label
  const statusLabel = post.status === 'pending' ? '⏳ Waiting for Admin Approval' : post.status === 'rejected' ? '❌ Rejected by Admin' : post.status === 'approved' ? '✅ Approved' : '';
  const isAuthor = user && post.user_id === user.id;

  return (
    <div className="min-h-screen w-full font-cartoon relative overflow-x-hidden" style={{background: 'linear-gradient(120deg, #ffe0c3 0%, #fcb7ee 100%)'}}>
      {/* Close Forum Button */}
      <button
        type="button"
        className="fixed top-24 md:top-28 left-4 md:left-6 z-30 px-5 py-2 rounded-full bg-gradient-to-r from-yellow-200 via-pink-200 to-pink-300 text-purple-800 font-extrabold shadow-fun border-4 border-pink-200 hover:scale-110 hover:bg-yellow-100 transition-all flex items-center gap-2 drop-shadow-lg hover:drop-shadow-2xl"
        onClick={() => navigate('/')}
        style={{fontFamily: 'Baloo, Fredoka, Comic Neue, cursive'}}
        aria-label="Close Forum and return to Home"
      >
        <span className="text-2xl">⬅️</span> <span className="hidden sm:inline">Close Forum</span>
      </button>
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
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center text-2xl text-white font-bold shadow-fun">
                <span className="material-icons">👤</span>
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg text-gray-800 leading-tight">{post.author_name}</span>
                <span className="text-gray-400 text-xs font-semibold mt-0.5">{post.created_at && new Date(post.created_at).toLocaleString('en-PH', { timeZone: 'Asia/Manila', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
            <span className={`px-4 py-1 rounded-full text-white text-sm shadow font-extrabold font-cartoon tracking-wide border-2 border-white drop-shadow-lg mt-2 ${
              post.category === 'Academics' ? 'bg-blue-400' :
              post.category === 'Arts' ? 'bg-rose-400' :
              post.category === 'Music' ? 'bg-indigo-400' :
              post.category === 'Sports' ? 'bg-emerald-400' :
              post.category === 'Technology' ? 'bg-cyan-400' :
              post.category === 'Ideas' ? 'bg-yellow-400 text-yellow-900' :
              post.category === 'Random' ? 'bg-purple-400' :
              'bg-purple-600'
            }`}>
              {post.category}
            </span>
          </div>
          {/* Title & Status */}
          <div className="px-8 pt-2 pb-0">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-purple-700 mb-2 text-left drop-shadow-lg font-cartoon" style={{letterSpacing:1}}>
              {post.title}
              {post.locked && <span className="text-error text-2xl font-bold ml-2">🔒</span>}
            </h1>
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
                            await api.delete(`/posts/${post.id}/cancel`);
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
                <p className="whitespace-pre-wrap text-lg md:text-xl font-semibold text-gray-700 text-left w-full mb-2 drop-shadow-lg" style={{fontWeight: 600}}>{post.content}</p>
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
        </div>
        {/* Comment Section - New Format */}
        <div className="bg-white/95 rounded-[2.5rem] shadow-fun border-4 border-purple-200 p-4 sm:p-8 animate-pop" style={{backdropFilter:'blur(6px)', boxShadow:'0 8px 32px 0 rgba(186, 104, 200, 0.18), 0 1.5px 0 0 #fcb7ee'}}>
          <h3 className="text-xl sm:text-2xl font-extrabold text-purple-700 mb-4 text-center drop-shadow-lg flex items-center gap-2">
            <span className="text-3xl">💬</span> Comments
          </h3>
          {/* Only show comments if post is approved or author is viewing */}
          {(post.status === 'approved' || isAuthor) ? (
            <>
              <div className="mb-4">
                {comments.length === 0 && (
                  <div className="text-center text-purple-300 font-bold">No comments yet. Be the first to comment!</div>
                )}
                {comments.map((comment) => (
                  <CommentCard
                    key={comment.id}
                    avatar={comment.avatar || '😊'}
                    username={comment.author_name || 'User'}
                    time={comment.created_at ? new Date(comment.created_at).toLocaleString('en-PH', { hour: '2-digit', minute: '2-digit', hour12: false, month: 'short', day: 'numeric' }) : ''}
                    content={comment.content}
                    canDelete={user && (comment.user_id === user.id || user.role === 'admin')}
                    onDelete={async () => {
                      await api.delete(`/posts/comments/${comment.id}`);
                      // Re-fetch comments after deleting
                      const response = await api.get(`/posts/${id}/comments`);
                      setComments(response.data);
                    }}
                  />
                ))}
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
                    <input
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write a comment... 💭"
                      className="w-full p-3 rounded-xl border border-purple-200 focus:ring-2 focus:ring-pink-200 focus:outline-none bg-white/80 text-base shadow-sm"
                      style={{fontFamily: 'Comic Neue, Baloo, Fredoka, cursive'}}
                    />
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
            </>
          ) : (
            <div className="text-center text-purple-400 font-bold py-8">This post is not public yet. Comments will be available after admin approval.</div>
          )}
        </div>
      </div>
    </div>
  );
}
