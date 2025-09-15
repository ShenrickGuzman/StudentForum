

import { useEffect, useState } from 'react';
import RulesPopup from '../components/RulesPopup';
import { Link, useNavigate } from 'react-router-dom';
import api, { getAssetUrl } from '../lib/api';
import { useAuth } from '../state/auth';

const categories = [
  { key: 'Academics', label: '📚 Academics', color: 'bg-primary/30' },
  { key: 'Class Life', label: '🎉 Class Life', color: 'bg-secondary/30' },
  { key: 'Ideas', label: '💡 Ideas & Suggestions', color: 'bg-accent/30' },
  { key: 'Random', label: '🗨️ Random Thoughts', color: 'bg-success/30' },
];


function HomePage() {
  const [posts, setPosts] = useState([]);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showRules, setShowRules] = useState(false);

  const loadPosts = async () => {
    const params = {};
    if (q) params.q = q;
    if (cat) params.category = cat;
    try {
      const response = await api.get('/posts', { params });
      setPosts(response.data);
    } catch (error) {
      console.error('Failed to load posts:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  useEffect(() => {
    setLoading(true);
    loadPosts().finally(() => setLoading(false));
  }, [q, cat]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pink-100 to-yellow-100 relative overflow-hidden">
        {/* Animated pastel circles */}
        <div className="absolute inset-0 z-0 pointer-events-none select-none">
          <span className="absolute left-8 top-8 w-24 h-24 rounded-full bg-yellow-200 opacity-30 animate-pulse"></span>
          <span className="absolute right-10 top-24 w-16 h-16 rounded-full bg-green-200 opacity-20 animate-bounce"></span>
          <span className="absolute left-1/4 bottom-10 w-32 h-32 rounded-full bg-pink-200 opacity-20 animate-pulse"></span>
          <span className="absolute right-1/3 top-1/2 w-20 h-20 rounded-full bg-blue-200 opacity-20 animate-bounce"></span>
          <span className="absolute left-10 bottom-24 w-16 h-16 rounded-full bg-purple-200 opacity-20 animate-pulse"></span>
          <span className="absolute right-8 bottom-8 w-28 h-28 rounded-full bg-yellow-100 opacity-30 animate-bounce"></span>
        </div>
        <div className="relative z-10 flex flex-col items-center">
          {/* Fun animated spinner */}
          <div className="mb-6">
            <div className="w-20 h-20 rounded-full border-8 border-pink-300 border-t-yellow-300 border-b-blue-300 animate-spin shadow-lg flex items-center justify-center">
              <span className="text-4xl">🎈</span>
            </div>
          </div>
          <div className="cartoon-card text-3xl font-extrabold text-purple-600 bg-white/90 px-10 py-6 shadow-fun flex flex-col items-center gap-2 rounded-3xl">
            <span className="text-4xl mb-2">🎉 Loading Forums...</span>
            <span className="text-lg text-pink-400 font-bold flex items-center gap-2">Please wait <span className="animate-bounce">💬</span> <span className="animate-pulse">✨</span></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full font-cartoon relative overflow-x-hidden" style={{background: 'linear-gradient(120deg, #ffe0c3 0%, #fcb7ee 100%)'}}>
      <RulesPopup open={showRules} onAgree={() => setShowRules(false)} onClose={() => setShowRules(false)} onDontShowAgain={() => {}} />
      {/* Floating pastel circles */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none">
        <span className="absolute left-8 top-8 w-20 h-20 rounded-full bg-yellow-200 opacity-30"></span>
        <span className="absolute right-10 top-24 w-12 h-12 rounded-full bg-green-200 opacity-20"></span>
        <span className="absolute left-1/4 bottom-10 w-32 h-32 rounded-full bg-pink-200 opacity-20"></span>
        <span className="absolute right-1/3 top-1/2 w-16 h-16 rounded-full bg-blue-200 opacity-20"></span>
        <span className="absolute left-10 bottom-24 w-12 h-12 rounded-full bg-purple-200 opacity-20"></span>
        <span className="absolute right-8 bottom-8 w-24 h-24 rounded-full bg-yellow-100 opacity-30"></span>
      </div>
      {/* Action buttons: above search on mobile, top-right on desktop */}
      {user && (
        <>
          {/* Mobile: Rules and Logout at top */}
          <div className="block sm:hidden w-full max-w-3xl mx-auto px-2 mt-4 mb-2 z-20">
            <div className="flex flex-col gap-3">
              <button
                className="w-full rounded-2xl px-6 py-3 font-bold bg-gradient-to-r from-yellow-400 to-pink-400 text-white shadow-lg hover:from-yellow-500 hover:to-pink-500 transition-all"
                onClick={() => setShowRules(true)}
              >
                📜 Rules
              </button>
              <button
                className="w-full rounded-2xl px-6 py-3 font-bold bg-gradient-to-r from-pink-400 to-orange-400 text-white shadow-lg hover:from-pink-500 hover:to-orange-500 transition-all"
                onClick={logout}
              >
                🔓 Logout
              </button>
            </div>
            <div className="my-3" />
          </div>
          {/* Desktop: top-right */}
          <div className="hidden sm:flex absolute right-0 top-0 mt-6 mr-8 z-20 gap-4">
            <button
              className="rounded-2xl px-6 py-3 font-bold bg-gradient-to-r from-green-400 to-blue-500 text-white shadow-lg hover:from-green-500 hover:to-blue-600 transition-all"
              onClick={() => navigate('/new')}
            >
              ✨ New Post
            </button>
            <button
              className="rounded-2xl px-6 py-3 font-bold bg-gradient-to-r from-yellow-400 to-pink-400 text-white shadow-lg hover:from-yellow-500 hover:to-pink-500 transition-all"
              onClick={() => setShowRules(true)}
            >
              📜 Rules
            </button>
            <button
              className="rounded-2xl px-6 py-3 font-bold bg-gradient-to-r from-pink-400 to-orange-400 text-white shadow-lg hover:from-pink-500 hover:to-orange-500 transition-all"
              onClick={logout}
            >
              🔓 Logout
            </button>
          </div>
        </>
      )}

      {/* Hero Section */}
      <div className="flex flex-col items-center mb-10 z-10 relative">
        <div className="w-full flex justify-center">
          <div className="bg-white rounded-3xl shadow-2xl px-10 py-8 max-w-2xl flex flex-col items-center border-4 border-purple-200">
            <div className="text-5xl mb-2">🎓</div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-purple-700 mb-2 text-center drop-shadow-lg" style={{letterSpacing: '0.03em'}}>
              Welcome to Students Forum!
            </h1>
            <p className="text-lg md:text-xl font-semibold text-gray-700 text-center max-w-xl mb-2 drop-shadow-lg bg-white/80 rounded-xl px-4 py-2 border border-purple-100" style={{fontWeight: 600}}>
              A playful place to share ideas, ask questions, and connect with your classmates. Jump in and join the conversation!
            </p>
            <div className="flex gap-2 text-2xl mb-2">
              <span>📚</span><span>✨</span><span>🎯</span><span>🧩</span>
            </div>
          </div>
        </div>
        <div className="flex gap-4 flex-wrap justify-center mt-6">
          {categories.map(c => (
            <span key={c.key} className={`px-6 py-2 rounded-full font-bold text-white shadow-lg text-base ${
              c.key === 'Academics' ? 'bg-blue-500' :
              c.key === 'Class Life' ? 'bg-green-500' :
              c.key === 'Ideas' ? 'bg-yellow-400 text-yellow-900' :
              'bg-purple-600'
            }`}>
              {c.label}
            </span>
          ))}
        </div>
      </div>

      {/* Search & New Post (mobile) */}
      <div className="flex flex-col md:flex-row gap-3 items-center mb-8 z-10 relative max-w-3xl mx-auto">
        <div className="flex-1 flex items-center bg-white/80 rounded-2xl shadow-lg px-4 py-3 border-2 border-white/60">
          <span className="text-xl text-gray-400 mr-2">🔍</span>
          <input
            className="flex-1 bg-transparent outline-none text-lg text-gray-700 placeholder-gray-400"
            placeholder="Search posts, topics, or ask anything..."
            value={q}
            onChange={e => setQ(e.target.value)}
          />
        </div>
        <select
          className="rounded-2xl px-4 py-3 border-2 border-white/60 text-lg focus:ring-2 focus:ring-pink-200 outline-none transition-all bg-white/80 shadow-lg"
          value={cat}
          onChange={e => setCat(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map(c => (
            <option key={c.key} value={c.key}>{c.label}</option>
          ))}
        </select>
        {/* Refresh Button */}
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className={`rounded-2xl px-4 py-3 font-bold shadow-lg transition-all duration-200 border-2 border-white/60 ${
            refreshing 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-white hover:scale-105 active:scale-95'
          }`}
          title="Refresh posts to see new content"
        >
          <span className={`text-xl ${refreshing ? 'animate-spin' : ''}`}>
            {refreshing ? '🔄' : '🔄'}
          </span>
          <span className="hidden sm:inline ml-2">
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </span>
        </button>
        {/* Show New Post button here on mobile only */}
        {user && (
          <button
            className="block sm:hidden w-full rounded-2xl px-6 py-3 font-bold bg-gradient-to-r from-green-400 to-blue-500 text-white shadow-lg hover:from-green-500 hover:to-blue-600 transition-all"
            onClick={() => navigate('/new')}
          >
            ✨ New Post
          </button>
        )}
      </div>

      {/* Posts */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 z-10 relative">
        {posts.length === 0 && (
          <div className="bg-white/90 rounded-2xl shadow-lg text-center text-xl text-gray-400 col-span-full py-8">
            No posts yet. Be the first to start a conversation!
          </div>
        )}
        {posts.map(p => (
          <Link
            to={`/post/${p.id}`}
            key={p.id}
            className="bg-white/90 rounded-2xl shadow-xl hover:scale-105 transition-transform duration-150 border-2 border-white/60 flex flex-row gap-4 relative p-6"
          >
            <div className="absolute top-2 right-4 text-2xl">{p.pinned ? '📌' : ''}</div>
            <div className="flex flex-col flex-1">
              <div className="text-sm font-bold mb-1">
                <span className={`px-3 py-1 rounded-full text-white text-xs shadow ${
                  p.category === 'Academics' ? 'bg-blue-500' :
                  p.category === 'Class Life' ? 'bg-green-500' :
                  p.category === 'Ideas' ? 'bg-yellow-400 text-yellow-900' :
                  'bg-purple-600'
                }`}>
                  {categories.find(c => c.key === p.category)?.label || p.category}
                </span>
              </div>
              <div className="text-2xl font-extrabold text-gray-800 drop-shadow mb-1">{p.title}</div>
              <div className="opacity-80 line-clamp-2 flex-1 text-gray-700">{p.content}</div>
              <div className="mt-2 text-sm text-gray-400 flex items-center gap-2">
                <span>👤</span> {p.author_name}
              </div>
            </div>
            {p.image_url && (
              <div className="flex-shrink-0 w-[150px] h-[150px] rounded-xl shadow-md overflow-hidden">
                <img
                  src={getAssetUrl(p.image_url)}
                  alt="Post image"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default HomePage;


