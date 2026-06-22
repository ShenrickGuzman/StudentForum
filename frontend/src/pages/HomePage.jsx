import { useEffect, useState } from 'react';
import { format, utcToZonedTime } from 'date-fns-tz';
import RulesPopup from '../components/RulesPopup';
import { Link, useNavigate } from 'react-router-dom';
import api, { getAssetUrl } from '../lib/api';
import { useAuth } from '../state/auth';
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

function HomePage() {
  const [tourStep, setTourStep] = useState(() => {
    return localStorage.getItem('forumTourDismissed') === '1' ? null : 0;
  });
  const tourSteps = [
    { title: "Welcome!", desc: "Let's take a quick tour of the main features." },
    { title: "New Post", desc: "Click 'New Post' at the top to ask questions or share ideas." },
    { title: "Rules", desc: "Check the forum rules by clicking 'Rules' at the top." },
    { title: "Search", desc: "Use the search bar to find posts, users, or topics." },
    { title: "Reactions", desc: "React to posts with emojis below each post." },
    { title: "Enjoy!", desc: "You're ready to explore and connect!" }
  ];

  const handleTourNext = () => {
    if (tourStep < tourSteps.length - 1) setTourStep(tourStep + 1);
    else { setTourStep(null); localStorage.setItem('forumTourDismissed', '1'); }
  };
  const handleTourPrev = () => { if (tourStep > 0) setTourStep(tourStep - 1); };
  const handleTourSkip = () => { setTourStep(null); localStorage.setItem('forumTourDismissed', '1'); };

  const [showFAQ, setShowFAQ] = useState(false);
  const faqList = [
    { q: "How do I post a question?", a: "Click 'New Post' at the top, choose a category, and write your question." },
    { q: "How do I stay anonymous?", a: "Check the 'Post as Anonymous' option when creating your post or comment." },
    { q: "How do I report a post?", a: "Click the 'Report' button below any post or comment you think breaks the rules." },
    { q: "Where can I find the forum rules?", a: "Click the 'Rules' button at the top of the page." },
    { q: "How do I react to posts?", a: "Click any emoji below a post to react!" },
    { q: "How do I comment?", a: "Open any post and scroll to the bottom. Type your message in the comment box and click 'Send'." },
    { q: "How can I view my classmates' profiles?", a: "Click on any username or avatar to view their profile, posts, and badges." },
    { q: "How do I customize my profile?", a: "Go to your profile page by clicking your avatar at the top right." },
  ];

  const [showWelcome, setShowWelcome] = useState(() => localStorage.getItem('forumWelcomeDontShow') !== '1');
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const handleDismissWelcome = () => {
    setShowWelcome(false);
    if (dontShowAgain) localStorage.setItem('forumWelcomeDontShow', '1');
  };

  const [warnings, setWarnings] = useState([]);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [doNotShowWarningAgainIds, setDoNotShowWarningAgainIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('doNotShowWarningAgainIds') || '[]'); } catch { return []; }
  });

  const { user, token } = useAuth();

  useEffect(() => {
    if (user && token) {
      api.get('/auth/me/warnings', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => {
          if (Array.isArray(r.data.warnings) && r.data.warnings.length > 0) {
            const unseen = r.data.warnings.filter(w => !doNotShowWarningAgainIds.includes(w.id));
            setWarnings(r.data.warnings);
            setShowWarningModal(unseen.length > 0);
          }
        })
        .catch(() => {});
    }
  }, [user, token, doNotShowWarningAgainIds]);

  const [userSearchInput, setUserSearchInput] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [userSearchError, setUserSearchError] = useState('');
  const [userSearchTriggered, setUserSearchTriggered] = useState(false);

  const handleUserSearch = async (e) => {
    e.preventDefault();
    if (!userSearchInput.trim()) return;
    setUserSearchTriggered(true);
    setUserSearchLoading(true);
    setUserSearchError('');
    try {
      const res = await api.get('/auth/search-users', { params: { q: userSearchInput.trim() } });
      setUserSearchResults(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setUserSearchError('Failed to search users');
      setUserSearchResults([]);
    }
    setUserSearchLoading(false);
  };

  const [posts, setPosts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [q, setQ] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [cat, setCat] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();
  const [showRules, setShowRules] = useState(false);
  const [error, setError] = useState('');

  const loadPosts = async (append = false) => {
    const params = {};
    if (q) params.q = q;
    if (cat) params.category = cat;
    params.limit = 20;
    if (append) params.offset = posts.length;
    try {
      const response = await api.get('/posts', { params });
      const result = response.data;
      if (result && Array.isArray(result.posts)) {
        if (append) {
          setPosts(prev => [...prev, ...result.posts]);
        } else {
          setPosts(result.posts);
        }
        setTotalCount(result.totalCount || 0);
      } else if (Array.isArray(result)) {
        setPosts(result);
        setTotalCount(result.length);
      } else {
        setPosts([]);
        setTotalCount(0);
      }
      setError('');
    } catch (e) {
      setError('Failed to load posts');
      setPosts([]);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPosts(false);
    setRefreshing(false);
  };

  const handleLoadMore = async () => {
    setLoadingMore(true);
    await loadPosts(true);
    setLoadingMore(false);
  };

  useEffect(() => {
    setLoading(true);
    loadPosts(false).finally(() => setLoading(false));
  }, [q, cat]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-3 border-primary/30 border-t-primary animate-spin" />
          <p className="text-muted font-medium">Loading forums...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-error text-lg">{error}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <AnimatePresence>
        {tourStep !== null && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white dark:bg-dark-surface rounded-2xl shadow-elevated p-8 max-w-sm w-full mx-4 text-center"
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            >
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-2xl mx-auto mb-4">🗺️</div>
              <h3 className="text-xl font-bold text-dark dark:text-dark-text mb-2">{tourSteps[tourStep].title}</h3>
              <p className="text-muted mb-6">{tourSteps[tourStep].desc}</p>
              <div className="flex gap-3 justify-center">
                <button className="btn-secondary text-sm" onClick={handleTourPrev} disabled={tourStep === 0}>Back</button>
                <button className="btn-primary text-sm" onClick={handleTourNext}>{tourStep === tourSteps.length - 1 ? 'Finish' : 'Next'}</button>
                <button className="px-4 py-2 rounded-xl text-sm font-medium text-muted dark:text-dark-muted hover:text-dark transition-colors" onClick={handleTourSkip}>Skip</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        className="fixed bottom-6 right-6 z-40 btn-primary shadow-button flex items-center gap-2"
        onClick={() => setShowFAQ(true)}
      >
        <span>?</span> Help
      </button>

      <AnimatePresence>
        {showFAQ && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white dark:bg-dark-surface rounded-2xl shadow-elevated p-8 max-w-lg w-full mx-4"
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              style={{ maxHeight: '85vh', overflow: 'hidden' }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-dark dark:text-dark-text">Forum Guide & FAQ</h2>
                <button className="text-muted hover:text-dark text-lg" onClick={() => setShowFAQ(false)}>&times;</button>
              </div>
              <div className="flex flex-col gap-3 overflow-y-auto" style={{ maxHeight: '55vh' }}>
                {faqList.map((item, idx) => (
                  <div key={idx} className="bg-gray-50 dark:bg-dark-bg rounded-xl p-4">
                    <p className="font-semibold text-dark dark:text-dark-text text-sm mb-1">{item.q}</p>
                    <p className="text-muted text-sm">{item.a}</p>
                  </div>
                ))}
              </div>
              <button className="btn-secondary w-full mt-4 text-sm" onClick={() => { localStorage.removeItem('forumTourDismissed'); setTourStep(0); setShowFAQ(false); }}>
                Restart Tour
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showWelcome && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white dark:bg-dark-surface rounded-2xl shadow-elevated p-8 max-w-sm w-full mx-4 text-center"
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            >
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-2xl mx-auto mb-4">👋</div>
              <h3 className="text-xl font-bold text-dark dark:text-dark-text mb-2">Welcome to St. Hyacinth's Forum!</h3>
              <p className="text-muted text-sm mb-6">Ask questions, share ideas, and connect with classmates.</p>
              <label className="flex items-center justify-center gap-2 mb-4 text-sm text-muted dark:text-dark-muted">
                <input type="checkbox" checked={dontShowAgain} onChange={e => setDontShowAgain(e.target.checked)} className="rounded" />
                Don't show again
              </label>
              <button className="btn-primary w-full text-sm" onClick={handleDismissWelcome}>Got it!</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <RulesPopup open={showRules} onAgree={() => setShowRules(false)} onClose={() => setShowRules(false)} onDontShowAgain={() => {}} />

      <AnimatePresence>
        {showWarningModal && warnings.length > 0 && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white dark:bg-dark-surface rounded-2xl shadow-elevated p-8 max-w-md w-full mx-4 text-center"
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            >
              <div className="w-14 h-14 rounded-full bg-error/10 flex items-center justify-center text-2xl mx-auto mb-4">⚠️</div>
              <h3 className="text-xl font-bold text-error mb-2">You have received a warning</h3>
              <p className="text-sm text-muted dark:text-dark-muted mb-4">Current warnings: {warnings.length}/3</p>
              <p className="text-sm text-error mb-4">If your account reaches 3 warnings, it will be permanently deleted.</p>
              {warnings.filter(w => !doNotShowWarningAgainIds.includes(w.id)).map(w => (
                <div key={w.id} className="bg-error/5 rounded-xl p-3 mb-3 text-sm text-error text-left">
                  <p className="font-medium">{w.reason}</p>
                  <p className="text-xs text-muted dark:text-dark-muted mt-1">
                    {format(
                      utcToZonedTime(w.created_at.endsWith('Z') ? new Date(w.created_at) : new Date(w.created_at + 'Z'), 'Asia/Manila'),
                      'dd MMM yyyy, hh:mm a', { timeZone: 'Asia/Manila' }
                    )}
                  </p>
                </div>
              ))}
              {warnings.length >= 3 && (
                <div className="bg-error/10 rounded-xl p-4 mb-4 text-error font-medium text-sm">
                  Your account has been deleted due to repeated violations.
                </div>
              )}
              <div className="flex flex-col items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-muted dark:text-dark-muted">
                  <input type="checkbox" className="rounded" onChange={e => {
                    if (e.target.checked) {
                      const newIds = [...doNotShowWarningAgainIds, ...warnings.filter(w => !doNotShowWarningAgainIds.includes(w.id)).map(w => w.id)];
                      setDoNotShowWarningAgainIds(newIds);
                      localStorage.setItem('doNotShowWarningAgainIds', JSON.stringify(newIds));
                    } else {
                      const removeIds = warnings.filter(w => !doNotShowWarningAgainIds.includes(w.id)).map(w => w.id);
                      const newIds = doNotShowWarningAgainIds.filter(id => !removeIds.includes(id));
                      setDoNotShowWarningAgainIds(newIds);
                      localStorage.setItem('doNotShowWarningAgainIds', JSON.stringify(newIds));
                    }
                  }} />
                  Don't show again
                </label>
                <button className="btn-primary text-sm" onClick={() => setShowWarningModal(false)}>I understand</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-dark dark:text-dark-text mb-2">
          Welcome to St. Hyacinth's Forum
        </h1>
        <p className="text-muted max-w-xl mx-auto">
          A place to share ideas, ask questions, and connect with your classmates.
        </p>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        {categories.map(c => (
          <button
            key={c.key}
            onClick={() => setCat(cat === c.key ? '' : c.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${cat === c.key ? 'bg-primary text-white' : c.color}`}
          >
            {c.label}
          </button>
        ))}
        {cat && <button className="px-4 py-2 rounded-xl text-sm font-medium text-muted dark:text-dark-muted hover:text-dark transition-colors" onClick={() => setCat('')}>Clear</button>}
      </div>

      {/* Search & Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1">
          <form
            className="flex items-center bg-white dark:bg-dark-surface rounded-xl border border-gray-200 dark:border-dark-border px-4 py-2.5 shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all"
            onSubmit={e => { e.preventDefault(); setQ(searchInput); }}
          >
            <svg className="w-5 h-5 text-muted dark:text-dark-muted mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              className="flex-1 bg-transparent outline-none text-sm text-dark dark:text-dark-text placeholder:text-muted"
              placeholder="Search forum posts..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
            <button type="submit" className="btn-primary text-xs py-2 px-3">Search</button>
          </form>
        </div>
        <div className="flex-1">
          <form
            className="flex items-center bg-white dark:bg-dark-surface rounded-xl border border-gray-200 dark:border-dark-border px-4 py-2.5 shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all"
            onSubmit={handleUserSearch}
          >
            <svg className="w-5 h-5 text-muted dark:text-dark-muted mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            <input
              className="flex-1 bg-transparent outline-none text-sm text-dark dark:text-dark-text placeholder:text-muted"
              placeholder="Search users by name..."
              value={userSearchInput}
              onChange={e => setUserSearchInput(e.target.value)}
            />
            <button type="submit" className="btn-primary text-xs py-2 px-3">Search</button>
          </form>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn-secondary text-sm whitespace-nowrap flex items-center gap-2"
        >
          <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* User Search Results */}
      {userSearchLoading && <p className="text-center text-sm text-muted dark:text-dark-muted mb-4">Searching users...</p>}
      {userSearchError && <p className="text-center text-sm text-error mb-4">{userSearchError}</p>}
      {userSearchResults.length > 0 && (
        <div className="card p-4 mb-8">
          <h3 className="font-semibold text-dark dark:text-dark-text mb-3 text-sm">Users Found</h3>
          <div className="flex flex-col gap-2">
            {userSearchResults.map(u => (
              <div key={u.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <img src={u.avatar || '/Cute-Cat.png'} alt={u.name} className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-dark-border" />
                <span className="text-sm font-medium text-dark dark:text-dark-text">{u.name}</span>
                <Link to={`/profile/${u.id}`} className="ml-auto text-xs text-primary font-medium hover:underline">View Profile</Link>
              </div>
            ))}
          </div>
        </div>
      )}
      {userSearchTriggered && !userSearchLoading && !userSearchError && userSearchInput.trim() && userSearchResults.length === 0 && (
        <p className="text-center text-sm text-muted dark:text-dark-muted mb-4">No users found</p>
      )}

      {/* Posts Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {posts.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted dark:text-dark-muted">
            <p className="text-lg font-medium">No posts yet.</p>
            <p className="text-sm mt-1">Be the first to start a conversation!</p>
          </div>
        )}
        {posts.map(p => {
          if ((p.status === 'pending' || p.status === 'rejected') && (!user || user.id !== p.user_id)) {
            return null;
          }
          let imageUrls = [];
          if (Array.isArray(p.images) && p.images.length > 0) imageUrls = p.images.filter(Boolean);
          else if (Array.isArray(p.image_url) && p.image_url.length > 0) imageUrls = p.image_url.filter(Boolean);
          else if (typeof p.image_url === 'string' && p.image_url) imageUrls = [p.image_url];
          else if (typeof p.image === 'string' && p.image) imageUrls = [p.image];
          const firstImage = imageUrls.length > 0 ? imageUrls[0] : null;

          return (
            <Link
              to={`/post/${p.id}`}
              key={p.id}
              className="card p-5 hover:translate-y-[-2px] transition-all duration-200 group"
            >
              <div className="flex items-start gap-3 mb-3">
                {p.anonymous ? (
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-dark-bg flex items-center justify-center text-sm flex-shrink-0">
                    <svg className="w-4 h-4 text-muted dark:text-dark-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                ) : (
                  <img
                    src={p.avatar && p.avatar.trim() ? getAssetUrl(p.avatar) : '/Cute-Cat.png'}
                    alt={p.author_name}
                    className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-dark-border flex-shrink-0 cursor-pointer"
                    onError={e => { e.target.src = '/Cute-Cat.png'; }}
                    onClick={e => { e.preventDefault(); e.stopPropagation(); navigate(`/profile/${p.user_id}`); }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-dark dark:text-dark-text truncate cursor-pointer hover:underline" onClick={e => { if (!p.anonymous) { e.preventDefault(); e.stopPropagation(); navigate(`/profile/${p.user_id}`); } }}>
                      {p.anonymous ? 'Anonymous' : p.author_name}
                    </span>
                    {(() => {
                      let badges = Array.isArray(p.badges) ? [...p.badges] : [];
                      if (p.author_role === 'admin' && !badges.includes('ADMIN')) badges.push('ADMIN');
                      return badges.slice(0, 2).map((badge, idx) => (
                        <span key={idx} className="badge bg-primary/5 text-primary/70">{badge}</span>
                      ));
                    })()}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`badge text-xs ${categories.find(c => c.key === p.category)?.color || 'bg-gray-100 dark:bg-dark-bg text-gray-600'}`}>
                      {p.category}
                    </span>
                    {p.pinned && <span className="text-xs text-muted dark:text-dark-muted">📌</span>}
                  </div>
                </div>
              </div>

              <h3 className={`font-semibold text-dark dark:text-dark-text group-hover:text-primary transition-colors mb-1.5 line-clamp-2 ${!firstImage ? 'text-xl' : 'text-base'}`}>
                {p.title}
              </h3>

              {firstImage && (
                <div className="rounded-xl overflow-hidden mb-3 bg-gray-50">
                  <img
                    src={getAssetUrl(firstImage)}
                    alt=""
                    className="w-full h-36 object-cover"
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                </div>
              )}

              <div className="flex items-center gap-3 text-xs text-muted dark:text-dark-muted">
                <span>{p.status === 'approved' ? '' : p.status === 'pending' ? '⏳ Pending' : '❌ Rejected'}</span>
              </div>

              {(p.status === 'pending' || p.status === 'rejected') && user && user.id === p.user_id && (
                <div className={`mt-2 text-xs font-medium px-2.5 py-1 rounded-lg inline-block ${
                  p.status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'
                }`}>
                  {p.status === 'pending' ? 'Awaiting approval' : 'Rejected'}
                </div>
              )}
            </Link>
          );
        })}
      </div>
      {posts.length < totalCount && (
        <div className="text-center mt-8">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="btn-secondary px-8 py-3 text-sm"
          >
            {loadingMore ? 'Loading...' : `Load More (${posts.length}/${totalCount})`}
          </button>
        </div>
      )}
    </div>
  );
}

export default HomePage;
