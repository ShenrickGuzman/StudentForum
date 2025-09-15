import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api, { getAssetUrl } from '../lib/api';
import { useAuth } from '../state/auth';

export default function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reactions, setReactions] = useState({ like: 0, heart: 0, wow: 0, sad: 0, haha: 0 });
  const [userReaction, setUserReaction] = useState(null);
  const [reacting, setReacting] = useState(false);

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
    } catch {}
    setReacting(false);
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
  if (!data) return null;
  const { post } = data;

  return (
    <div className="min-h-screen w-full font-cartoon relative overflow-x-hidden" style={{background: 'linear-gradient(120deg, #ffe0c3 0%, #fcb7ee 100%)'}}>
      {/* Close Forum Button */}
      <button
        type="button"
        className="fixed top-4 left-4 z-20 px-5 py-2 rounded-full bg-gradient-to-r from-yellow-200 via-pink-200 to-pink-300 text-purple-800 font-extrabold shadow-fun border-4 border-pink-200 hover:scale-110 hover:bg-yellow-100 transition-all flex items-center gap-2 drop-shadow-lg hover:drop-shadow-2xl"
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
        {/* Post Card */}
        <div className="bg-white/95 rounded-[2.5rem] shadow-fun border-4 border-purple-200 flex flex-col gap-5 p-4 sm:p-8 animate-pop" style={{backdropFilter:'blur(6px)', boxShadow:'0 8px 32px 0 rgba(186, 104, 200, 0.18), 0 1.5px 0 0 #fcb7ee'}}>
          {/* Forum status indicators */}
          <div className="flex gap-2 items-center mb-1 justify-center">
            {post.pinned && <span className="text-accent font-bold flex items-center gap-1"><span className="text-xl">📌</span> This Forum is pinned by an admin</span>}
            {post.locked && <span className="text-error font-bold flex items-center gap-1"><span className="text-xl">🔒</span> This Forum has been locked by an admin</span>}
          </div>
          <div className="flex items-center gap-2 mb-2 justify-center">
            <span className="text-2xl">{post.pinned ? '📌' : ''}</span>
            <span className={`px-4 py-1 rounded-full text-white text-sm shadow font-extrabold font-cartoon tracking-wide border-2 border-white drop-shadow-lg ${
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
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-purple-700 mb-2 text-center drop-shadow-lg flex items-center justify-center gap-3 font-cartoon" style={{letterSpacing:1}}>
            {post.title}
            {post.locked && <span className="text-error text-2xl font-bold ml-2">🔒</span>}
          </h1>
          {/* Author and date/time (Philippines time) */}
          <div className="text-center text-purple-400 text-base mb-4 font-bold font-cartoon">
            <span className="mr-1">👤 {post.author_name}</span>
            {post.created_at && (
              <span>• {new Date(post.created_at).toLocaleString('en-PH', { timeZone: 'Asia/Manila', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            )}
          </div>
          {post.image_url && <img alt="" className="rounded-2xl my-2 max-h-64 object-contain mx-auto border-2 border-purple-100" src={getAssetUrl(post.image_url)} />}
          <p className="whitespace-pre-wrap text-lg md:text-xl font-semibold text-gray-700 text-center max-w-2xl mx-auto mb-2 drop-shadow-lg bg-white/80 rounded-xl px-4 py-2 border border-purple-100" style={{fontWeight: 600}}>{post.content}</p>
          {post.link_url && <a className="text-pink-500 underline font-bold" href={post.link_url} target="_blank" rel="noreferrer">🔗 Visit link</a>}

          {/* Reaction Row */}
          <div className="flex flex-row items-center justify-center gap-1 sm:gap-2 mt-4 mb-2">
            {reactionTypes.map(rt => (
              <button
                key={rt.key}
                type="button"
                disabled={!token || reacting}
                onClick={() => handleReact(rt.key)}
                className={`flex flex-col items-center px-1.5 sm:px-2 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl font-extrabold text-base sm:text-lg shadow-fun border-4 transition-all duration-150 focus:outline-none focus:ring-4 focus:ring-pink-200 hover:scale-105 ${userReaction === rt.key ? 'border-yellow-300 scale-105 bg-gradient-to-br from-pink-200 to-yellow-100' : 'border-yellow-200 bg-white'} ${rt.color}`}
                aria-pressed={userReaction === rt.key}
                aria-label={rt.label}
              >
                <span className="text-lg sm:text-2xl mb-0.5 drop-shadow-lg">{rt.icon}</span>
                <span className="text-[11px] sm:text-xs font-bold text-purple-700">{reactions[rt.key] || 0}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
