import { useEffect, useState } from 'react';
import { format, utcToZonedTime } from 'date-fns-tz';
// import { Link } from 'react-router-dom';
import RulesPopup from '../components/RulesPopup';
import { Link, useNavigate } from 'react-router-dom';
import api, { getAssetUrl } from '../lib/api';
import { useAuth } from '../state/auth';

const categories = [
  { key: 'Academics', label: '📚 Academics', color: 'bg-gradient-to-r from-pink-400 to-pink-500 text-white' },
  { key: 'Arts', label: '🎨 Arts', color: 'bg-gradient-to-r from-orange-300 to-orange-400 text-white' },
  { key: 'Sports', label: '🏅 Sports', color: 'bg-gradient-to-r from-green-400 to-teal-400 text-white' },
  { key: 'Music', label: '🎵 Music', color: 'bg-gradient-to-r from-purple-400 to-purple-500 text-white' },
  { key: 'Technology', label: '💻 Technology', color: 'bg-gradient-to-r from-cyan-400 to-blue-400 text-white' },
  { key: 'Ideas', label: '💡 Ideas', color: 'bg-gradient-to-r from-yellow-300 to-yellow-400 text-yellow-900' },
  { key: 'Random', label: '✨ Random', color: 'bg-gradient-to-r from-purple-400 to-indigo-400 text-white' },
];


function HomePage() {
        // Step-by-step tour state
        const [tourStep, setTourStep] = useState(() => {
          // Show tour unless dismissed (can be improved for per-user)
          return localStorage.getItem('forumTourDismissed') === '1' ? null : 0;
        });
        const tourSteps = [
          {
            title: "Welcome to the Student Forum!",
            desc: "Let's take a quick tour of the main features.",
            target: null
          },
          {
            title: "New Post",
            desc: "Click 'New Post' at the top to ask questions or share ideas.",
            target: "#new-post-btn"
          },
          {
            title: "Rules",
            desc: "Check the forum rules by clicking 'Rules' at the top.",
            target: "#rules-btn"
          },
          {
            title: "Search",
            desc: "Use the search bar to find posts, users, or topics.",
            target: "#search-bar"
          },
          {
            title: "Reactions",
            desc: "React to posts with emojis below each post.",
            target: "#reactions-section"
          },
          {
            title: "Need Help?",
            desc: "Click the 'Need Help?' button for FAQ and guidance.",
            target: "#need-help-btn"
          },
          {
            title: "Enjoy!",
            desc: "You're ready to explore and connect!",
            target: null
          }
        ];

        const handleTourNext = () => {
          if (tourStep < tourSteps.length - 1) setTourStep(tourStep + 1);
          else {
            setTourStep(null);
            localStorage.setItem('forumTourDismissed', '1');
          }
        };
        const handleTourPrev = () => {
          if (tourStep > 0) setTourStep(tourStep - 1);
        };
        const handleTourSkip = () => {
          setTourStep(null);
          localStorage.setItem('forumTourDismissed', '1');
        };
      // Forum Guide: FAQ modal
      const [showFAQ, setShowFAQ] = useState(false);
      const faqList = [
        { q: "How do I post a question?", a: "Click 'New Post' at the top, choose a category, and write your question." },
        { q: "How do I stay anonymous?", a: "Check the 'Post as Anonymous' option when creating your post or comment." },
        { q: "How do I report a post?", a: "Click the 'Report' button below any post or comment you think breaks the rules." },
        { q: "Where can I find the forum rules?", a: "Click the 'Rules' button at the top of the page." },
        { q: "How do I react to posts?", a: "Click any emoji below a post to react!" },
        { q: "How do I comment?", a: "Open any post and scroll to the bottom. Type your message in the comment box and click 'Send'. You can also reply to other comments!" },
        { q: "How can I view my classmates' profiles?", a: "Click on any username or avatar to view their profile, posts, and badges." },
        { q: "How do I send or comment with a voice message?", a: "In the comment box, click the microphone icon to record and send a voice message. You can listen to voice comments by pressing the play button." },
        { q: "How do I post pictures?", a: "When creating a post or comment, click the image icon to upload a picture from your device." },
        { q: "How do I customize my profile?", a: "Go to your profile page by clicking your avatar at the top right. Here you can change your avatar, bio, and other details." },
        { q: "About notifications", a: "Click the bell icon at the top to view new notifications. You'll get alerts for replies, reactions, and important updates!" },
      ];
    // Forum Guide: Welcome popup/banner for new users
    // Show every time unless 'Don't show again' is checked
    const [showWelcome, setShowWelcome] = useState(() => {
      return localStorage.getItem('forumWelcomeDontShow') !== '1';
    });
    const [dontShowAgain, setDontShowAgain] = useState(false);

    const handleDismissWelcome = () => {
      setShowWelcome(false);
      if (dontShowAgain) {
        localStorage.setItem('forumWelcomeDontShow', '1');
      }
    };
  // ...existing code...
  const [warnings, setWarnings] = useState([]);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [acknowledgedWarnings, setAcknowledgedWarnings] = useState([]);
  const [doNotShowWarningAgainIds, setDoNotShowWarningAgainIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('doNotShowWarningAgainIds') || '[]');
    } catch {
      return [];
    }
  });

  const { user, token, logout } = useAuth();

  useEffect(() => {
    if (user && token) {
      api.get('/auth/me/warnings', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => {
          if (Array.isArray(r.data.warnings) && r.data.warnings.length > 0) {
            // Only show modal if there are warnings not in doNotShowWarningAgainIds
            const unseen = r.data.warnings.filter(w => !doNotShowWarningAgainIds.includes(w.id));
            setWarnings(r.data.warnings);
            setShowWarningModal(unseen.length > 0);
          }
        })
        .catch(() => {});
    }
  }, [user, token, doNotShowWarningAgainIds]);
  // ...existing code...
  const [userSearchInput, setUserSearchInput] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [userSearchError, setUserSearchError] = useState('');
  const [userSearchTriggered, setUserSearchTriggered] = useState(false);

  // Search users by name
  const API_BASE = process.env.REACT_APP_API_BASE_URL || '';
  const handleUserSearch = async (e) => {
  e.preventDefault();
  if (!userSearchInput.trim()) return;
  setUserSearchTriggered(true);
  setUserSearchLoading(true);
  setUserSearchError('');
    try {
      const token = user?.token;
      const res = await fetch(
        `${API_BASE}/api/auth/search-users?q=${encodeURIComponent(userSearchInput.trim())}`,
        {
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        }
      );
      const data = await res.json();
      setUserSearchResults(Array.isArray(data) ? data : []);
    } catch (err) {
      setUserSearchError('Failed to search users');
      setUserSearchResults([]);
    }
    setUserSearchLoading(false);
  };
  const [posts, setPosts] = useState([]);
  const [q, setQ] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [cat, setCat] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();
  const [showRules, setShowRules] = useState(false);

  // Mobile only: Rules button
  const mobileActionButtons = user ? (
    <div className="block sm:hidden w-full max-w-3xl mx-auto px-2 mt-4 mb-2 z-20">
      <div className="flex flex-col gap-3">
        <button
          className="w-full rounded-2xl px-6 py-3 font-bold bg-gradient-to-r from-yellow-400 to-pink-400 text-white shadow-lg hover:from-yellow-500 hover:to-pink-500 transition-all"
          onClick={() => setShowRules(true)}
        >
          📜 Rules
        </button>
      </div>
      <div className="my-3" />
    </div>
  ) : null;

  const [error, setError] = useState('');
  const loadPosts = async () => {
    const params = {};
    if (q) params.q = q;
    if (cat) params.category = cat;
    try {
      const response = await api.get('/posts', { params });
      setPosts(Array.isArray(response.data) ? response.data : []);
      setError('');
    } catch (error) {
      console.error('Failed to load posts:', error);
      // Fallback to fetch if api.get fails
      try {
        const res = await fetch('/api/posts');
        const data = await res.json();
        setPosts(Array.isArray(data) ? data : []);
        setError('');
      } catch (e) {
        setError('Failed to load posts');
        setPosts([]);
      }
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
      <>
        {/* Step-by-step Tour Overlay */}
        {tourStep !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="cartoon-card border-4 border-accent bg-white/95 shadow-2xl flex flex-col items-center gap-4 max-w-md w-full animate-pop p-8">
              <div className="text-5xl">🗺️</div>
              <div className="text-2xl font-extrabold text-accent text-center">{tourSteps[tourStep].title}</div>
              <div className="text-lg text-dark text-center">{tourSteps[tourStep].desc}</div>
              <div className="flex gap-4 mt-4">
                <button className="fun-btn px-4 py-2 text-base" onClick={handleTourPrev} disabled={tourStep === 0}>Back</button>
                <button className="fun-btn px-4 py-2 text-base" onClick={handleTourNext}>{tourStep === tourSteps.length - 1 ? 'Finish' : 'Next'}</button>
                <button className="fun-btn px-4 py-2 text-base bg-gradient-to-r from-gray-400 to-gray-600" onClick={handleTourSkip}>Skip Tour</button>
              </div>
            </div>
          </div>
        )}
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
      </>
    );
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-500 text-2xl">{error}</div>;
  }

  if (posts.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-500 text-2xl bg-gradient-to-br from-pink-100 to-yellow-100">
        <div>No posts found.</div>
        <button
          className="mt-8 px-6 py-3 rounded-2xl bg-gradient-to-r from-green-400 to-blue-500 text-white font-bold shadow-lg hover:from-green-500 hover:to-blue-600 transition-all text-lg"
          onClick={() => window.location.href = '/'}
        >
          ⬅️ Return to Forums
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full font-cartoon relative overflow-x-hidden" style={{background: 'linear-gradient(120deg, #ffe0c3 0%, #fcb7ee 100%)'}}>
      {/* Step-by-step Tour Overlay - only visible if tourStep !== null and FAQ modal is not open */}
      {tourStep !== null && !showFAQ && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="cartoon-card border-4 border-accent bg-white/95 shadow-2xl flex flex-col items-center gap-4 max-w-md w-full animate-pop p-8">
            <div className="text-5xl">🗺️</div>
            <div className="text-2xl font-extrabold text-accent text-center">{tourSteps[tourStep].title}</div>
            <div className="text-lg text-dark text-center">{tourSteps[tourStep].desc}</div>
            <div className="flex gap-4 mt-4">
              <button className="fun-btn px-4 py-2 text-base" onClick={handleTourPrev} disabled={tourStep === 0}>Back</button>
              <button className="fun-btn px-4 py-2 text-base" onClick={handleTourNext}>{tourStep === tourSteps.length - 1 ? 'Finish' : 'Next'}</button>
              <button className="fun-btn px-4 py-2 text-base bg-gradient-to-r from-gray-400 to-gray-600" onClick={handleTourSkip}>Skip Tour</button>
            </div>
          </div>
        </div>
      )}
      {/* Need Help Button - cartoon style, fixed bottom right */}
      <button
        className="fixed bottom-8 right-8 z-40 fun-btn px-6 py-3 text-lg rounded-full shadow-lg bg-gradient-to-r from-pink-400 to-yellow-300 text-purple-800 font-bold border-4 border-purple-300 hover:scale-105 transition-all"
        style={{ fontFamily: 'Baloo, Fredoka, Comic Neue, cursive' }}
        onClick={() => setShowFAQ(true)}
      >
        <span className="mr-2">❓</span> Need Help?
      </button>

      {/* FAQ Modal - cartoon style */}
      {showFAQ && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-pink-100 via-yellow-100 to-blue-100">
          <div className="cartoon-card border-4 border-accent bg-white/95 shadow-2xl flex flex-col items-center gap-6 max-w-lg w-full animate-pop p-10 relative" style={{ maxHeight: '90vh', overflow: 'hidden' }}>
            <div className="flex flex-col items-center mb-2">
              <div className="text-6xl mb-2 animate-wiggle">📚</div>
              <div className="text-3xl font-extrabold text-accent text-center mb-2 drop-shadow-lg" style={{fontFamily: 'Fredoka, Baloo, Comic Neue, cursive'}}>Forum Guide & FAQ</div>
              <div className="text-base text-dark text-center mb-2">Everything you need to know to get started!</div>
            </div>
            <div className="flex flex-col gap-5 w-full overflow-y-auto px-1" style={{ maxHeight: '55vh', scrollbarWidth: 'thin' }}>
              {faqList.map((item, idx) => (
                <div key={idx} className="rounded-2xl border-4 border-pink-300 bg-gradient-to-r from-pink-50 via-yellow-50 to-blue-50 p-5 shadow-fun transition-transform hover:scale-105 animate-pop">
                  <div className="font-extrabold text-purple-700 text-lg mb-1 flex items-center gap-2">
                    <span className="text-xl">💡</span> {item.q}
                  </div>
                  <div className="text-base text-gray-700 pl-6">{item.a}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-3 w-full items-center mt-4">
              <button className="fun-btn px-5 py-2 text-base rounded-full bg-gradient-to-r from-green-300 to-blue-300 text-purple-800 font-bold shadow-lg border-2 border-purple-300 hover:scale-105 transition-all flex items-center gap-2" onClick={() => {
                localStorage.removeItem('forumTourDismissed');
                setTourStep(0);
                setShowFAQ(false);
              }}>
                <span className="text-lg">🗺️</span> <span>Restart Tour</span>
              </button>
              <button className="fun-btn px-5 py-2 text-base rounded-full bg-gradient-to-r from-yellow-300 to-pink-300 text-purple-800 font-bold shadow-lg border-2 border-purple-300 hover:scale-105 transition-all flex items-center gap-2" onClick={() => setShowFAQ(false)}>
                <span className="text-lg">❌</span> <span>Close Guide</span>
              </button>
            </div>
            {/* Decorative pastel circles */}
            <span className="absolute left-4 top-4 w-12 h-12 rounded-full bg-yellow-200 opacity-30 animate-pulse"></span>
            <span className="absolute right-8 top-8 w-16 h-16 rounded-full bg-pink-200 opacity-20 animate-bounce"></span>
            <span className="absolute left-1/4 bottom-8 w-20 h-20 rounded-full bg-blue-200 opacity-20 animate-pulse"></span>
            <span className="absolute right-1/3 top-1/2 w-10 h-10 rounded-full bg-purple-200 opacity-20 animate-bounce"></span>
            <span className="absolute left-10 bottom-10 w-14 h-14 rounded-full bg-green-200 opacity-20 animate-pulse"></span>
          </div>
        </div>
      )}
      {/* Forum Guide Welcome Popup */}
      {showWelcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="cartoon-card border-4 border-accent bg-white/95 shadow-2xl flex flex-col items-center gap-4 max-w-md w-full animate-pop p-8">
            <div className="text-5xl">👋</div>
            <div className="text-2xl font-extrabold text-accent text-center">Welcome to the Student Forum!</div>
            <div className="text-lg text-dark text-center">Here you can ask questions, share ideas, and connect with classmates. Need help? Check the Rules or use the search bar above!</div>
            <label className="flex items-center gap-2 mt-2">
              <input type="checkbox" checked={dontShowAgain} onChange={e => setDontShowAgain(e.target.checked)} />
              <span className="text-base text-gray-700">Don't show again</span>
            </label>
            <button className="fun-btn px-6 py-3 text-lg mt-2" onClick={handleDismissWelcome}>Got it!</button>
          </div>
        </div>
      )}
      <RulesPopup open={showRules} onAgree={() => setShowRules(false)} onClose={() => setShowRules(false)} onDontShowAgain={() => {}} />

      {/* Warning Modal for users */}
      {showWarningModal && warnings.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="cartoon-card max-w-md w-full border-4 border-red-400 bg-gradient-to-br from-yellow-100 via-pink-100 to-red-100 animate-pop rounded-3xl shadow-2xl p-8 text-center font-cartoon">
            <h2 className="text-2xl font-extrabold mb-2 text-red-500 drop-shadow">You have received a warning from an admin</h2>
            <div className="mb-4 text-lg font-bold text-red-700">Current warnings: {warnings.length}</div>
            <div className="mb-2 text-base text-red-600 font-semibold">Notice: If your account reaches 3 warnings, it will be permanently deleted.</div>
            {warnings.filter(w => !doNotShowWarningAgainIds.includes(w.id)).map(w => (
              <div key={w.id} className="mb-4 text-lg text-red-700 font-bold bg-red-50 rounded-xl border border-red-300 p-3">
                {w.reason}
                <div className="text-xs text-gray-500 mt-1">
                  Sent on: {format(
                    utcToZonedTime(
                      w.created_at.endsWith('Z') ? new Date(w.created_at) : new Date(w.created_at + 'Z'),
                      'Asia/Manila'
                    ),
                    'dd MMMM yyyy, hh:mm a',
                    { timeZone: 'Asia/Manila' }
                  )}
                </div>
              </div>
            ))}
            {warnings.length >= 3 ? (
              <div className="text-xl font-bold text-red-700 bg-red-100 rounded-xl border-2 border-red-400 p-4 mb-2">
                You have reached 3 warnings. Your account has been deleted due to repeated violations.
              </div>
            ) : null}
            <div className="flex flex-col items-center gap-2 mt-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={warnings.filter(w => !doNotShowWarningAgainIds.includes(w.id)).every(w => doNotShowWarningAgainIds.includes(w.id))}
                  onChange={e => {
                    if (e.target.checked) {
                      // Add all currently shown warning ids to localStorage
                      const newIds = [...doNotShowWarningAgainIds, ...warnings.filter(w => !doNotShowWarningAgainIds.includes(w.id)).map(w => w.id)];
                      setDoNotShowWarningAgainIds(newIds);
                      localStorage.setItem('doNotShowWarningAgainIds', JSON.stringify(newIds));
                    } else {
                      // Remove all currently shown warning ids from localStorage
                      const removeIds = warnings.filter(w => !doNotShowWarningAgainIds.includes(w.id)).map(w => w.id);
                      const newIds = doNotShowWarningAgainIds.filter(id => !removeIds.includes(id));
                      setDoNotShowWarningAgainIds(newIds);
                      localStorage.setItem('doNotShowWarningAgainIds', JSON.stringify(newIds));
                    }
                  }}
                />
                Do not show again
              </label>
              <button className="fun-btn px-6 py-3 text-lg bg-gradient-to-r from-yellow-400 to-red-400 mt-2" onClick={() => { setShowWarningModal(false); setAcknowledgedWarnings(warnings.map(w => w.id)); }}>
                I understand
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Floating pastel circles */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none">
        <span className="absolute left-8 top-8 w-20 h-20 rounded-full bg-yellow-200 opacity-30"></span>
        <span className="absolute right-10 top-24 w-12 h-12 rounded-full bg-green-200 opacity-20"></span>
        <span className="absolute left-1/4 bottom-10 w-32 h-32 rounded-full bg-pink-200 opacity-20 animate-pulse"></span>
        <span className="absolute right-1/3 top-1/2 w-16 h-16 rounded-full bg-blue-200 opacity-20 animate-bounce"></span>
        <span className="absolute left-10 bottom-24 w-12 h-12 rounded-full bg-purple-200 opacity-20 animate-pulse"></span>
        <span className="absolute right-8 bottom-8 w-24 h-24 rounded-full bg-yellow-100 opacity-30"></span>
      </div>
      {/* Mobile only: Rules and New Post buttons */}
      {mobileActionButtons}

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
            <span key={c.key} className={`px-6 py-4 rounded-xl font-extrabold shadow-lg text-lg flex items-center gap-2 ${c.color}`}> 
              {c.label}
            </span>
          ))}
        </div>
      </div>

      {/* Search & New Post (mobile) + User Search */}
      <div className="flex flex-col md:flex-row gap-3 items-center mb-8 z-10 relative max-w-3xl mx-auto">
        {/* Forum Search */}
        <div className="w-full md:w-1/2 mb-2 md:mb-0">
          <label className="block text-sm font-bold text-gray-600 mb-1" htmlFor="forum-search">Forum Search</label>
          <form
            className="flex items-center bg-white/80 rounded-2xl shadow-lg px-4 py-3 border-2 border-white/60"
            onSubmit={e => {
              e.preventDefault();
              setQ(searchInput);
            }}
          >
            <span className="text-xl text-gray-400 mr-2" role="img" aria-label="search">🔍</span>
            <input
              id="forum-search"
              className="flex-1 bg-transparent outline-none text-lg text-gray-700 placeholder-gray-400"
              placeholder="Search forum posts or topics..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
            <button type="submit" className="ml-2 px-4 py-2 rounded-xl bg-blue-400 text-white font-bold">Search</button>
          </form>
        </div>
        {/* User Search */}
        <div className="w-full md:w-1/2">
          <label className="block text-sm font-bold text-gray-600 mb-1" htmlFor="user-search">User Search</label>
          <form
            className="flex items-center bg-white/80 rounded-2xl shadow-lg px-4 py-3 border-2 border-white/60"
            onSubmit={handleUserSearch}
          >
            <span className="text-xl text-gray-400 mr-2" role="img" aria-label="user">👤</span>
            <input
              id="user-search"
              className="flex-1 bg-transparent outline-none text-lg text-gray-700 placeholder-gray-400"
              placeholder="Search users by name..."
              value={userSearchInput}
              onChange={e => setUserSearchInput(e.target.value)}
            />
            <button type="submit" className="ml-2 px-4 py-2 rounded-xl bg-purple-400 text-white font-bold">Search</button>
          </form>
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
          className={`rounded-2xl px-4 py-3 font-bold shadow-lg transition-all duration-200 border-2 border-white/60 ${refreshing ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-400 text-white hover:bg-blue-500'}`}
          title="Refresh posts to see new content"
        >
          <span className={`text-xl ${refreshing ? 'animate-spin' : ''}`} role="img" aria-label="refresh">🔄</span>
          <span className="ml-2">
            {refreshing ? 'Refreshing...' : 'Refresh Forum'}
          </span>
        </button>
        {/* Mobile only: New Post button under Refresh Forum button */}
        <button
          className="block sm:hidden w-full rounded-2xl px-6 py-3 font-bold bg-gradient-to-r from-green-400 to-blue-500 text-white shadow-lg hover:from-green-500 hover:to-blue-600 transition-all mt-2"
          onClick={() => navigate('/new')}
        >
          <span role="img" aria-label="new">✨</span> New Post
        </button>
      </div>

      {/* User Search Results */}
      {userSearchLoading && (
        <div className="text-center text-purple-500 font-bold mb-4">Searching users...</div>
      )}
      {userSearchError && (
        <div className="text-center text-red-500 font-bold mb-4">{userSearchError}</div>
      )}
      {userSearchResults.length > 0 && (
        <div className="max-w-3xl mx-auto mb-8">
          <div className="bg-white/90 rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-purple-700 mb-4">User Results</h3>
            <ul className="divide-y divide-purple-100">
              {userSearchResults.map(u => (
                <li key={u.id} className="py-3 flex items-center gap-4">
                  <img src={u.avatar || '/Cute-Cat.png'} alt={u.name} className="w-10 h-10 rounded-full border border-gray-300 object-cover" />
                  <span className="font-bold text-lg text-gray-700">{u.name}</span>
                  <Link to={`/profile/${u.id}`} className="ml-auto px-4 py-2 rounded-xl bg-purple-400 text-white font-bold">View Profile</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {/* User not found feedback */}
      {(userSearchTriggered && !userSearchLoading && !userSearchError && userSearchInput.trim() && userSearchResults.length === 0) && (
        <div className="text-center text-red-500 font-bold mb-4">User not found</div>
      )}

      {/* Posts */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 z-10 relative">
        {posts.length === 0 && (
          <div className="bg-white/90 rounded-2xl shadow-lg text-center text-xl text-gray-400 col-span-full py-8">
            No posts yet. Be the first to start a conversation!
          </div>
        )}
        {posts.map(p => {
          // Only show pending/rejected posts to their author
          if ((p.status === 'pending' || p.status === 'rejected') && (!user || user.id !== p.user_id)) {
            return null;
          }
          // If post has image and is mobile, move author info above image preview
          if (p.image_url) {
            return (
              <Link
                to={`/post/${p.id}`}
                key={p.id}
                className="bg-white/90 rounded-2xl shadow-xl hover:scale-105 transition-transform duration-150 border-2 border-white/60 flex flex-col sm:flex-row gap-4 relative p-6 items-start"
              >
                <div className="absolute top-2 right-4 text-2xl">{p.pinned ? '📌' : ''}</div>
                {/* Main content and author info (left on PC, top on mobile) */}
                <div className="flex flex-col flex-1 justify-between">
                  <div>
                    <div className="text-sm font-bold mb-1">
                      <span className={`px-3 py-1 rounded-full text-xs shadow font-extrabold ${categories.find(c => c.key === p.category)?.color || 'bg-gray-400 text-white'}`}>
                        {categories.find(c => c.key === p.category)?.label || p.category}
                      </span>
                    </div>
                        <div className="text-3xl sm:text-4xl font-extrabold text-gray-800 drop-shadow mb-2 leading-tight break-words whitespace-pre-wrap" style={{wordBreak: 'break-word', whiteSpace: 'pre-wrap'}}>{p.title}</div>
                    <div className="text-base text-gray-400 italic mb-2">Open to view content</div>
                  </div>
                  {/* Author info always at the bottom left, like posts without images */}
                  <div className="mt-2 text-sm text-gray-400 flex items-center gap-2">
                    <div className="flex items-center">
                      {p.anonymous ? (
                        <>
                          <span className="mr-2 w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xl text-white font-bold shadow-fun select-none">👤</span>
                          <span className="font-bold text-gray-500 select-none">Anonymous</span>
                        </>
                      ) : (
                        <>
                          <Link to={`/profile/${p.user_id}`} className="mr-2">
                            <img
                              src={p.avatar && p.avatar.trim() ? getAssetUrl(p.avatar) : '/Cute-Cat.png'}
                              alt={p.author_name}
                              className="w-8 h-8 rounded-full object-cover border border-gray-300 hover:ring-2 hover:ring-purple-400 transition-all"
                              onError={e => { e.target.src = '/Cute-Cat.png'; }}
                            />
                          </Link>
                          <Link to={`/profile/${p.user_id}`} className="font-bold text-gray-700 hover:text-purple-600 transition-all">
                            {p.author_name}
                          </Link>
                        </>
                      )}
                    </div>
                    {(() => {
                      let badges = Array.isArray(p.badges) ? [...p.badges] : [];
                      if (p.author_role === 'admin' && !badges.includes('ADMIN')) badges.push('ADMIN');
                      return badges.length > 0 ? (
                        <span className="flex gap-1 ml-2">
                          {badges.map((badge, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded-full bg-yellow-100 border border-yellow-300 text-yellow-800 text-xs font-bold uppercase tracking-wider">{badge}</span>
                          ))}
                        </span>
                      ) : null;
                    })()}
                  </div>
                  {/* Status label for pending/rejected posts */}
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
                {/* Post image preview (right on PC, top on mobile) */}
                <div className="flex-shrink-0 w-[150px] h-[150px] rounded-xl shadow-md overflow-hidden mb-2 sm:mb-0 sm:ml-4 order-first sm:order-none">
                  <img
                    src={getAssetUrl(p.image_url)}
                    alt="Post image"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              </Link>
            );
          }
          // Otherwise, use the original layout
          return (
            <Link
              to={`/post/${p.id}`}
              key={p.id}
              className="bg-white/90 rounded-2xl shadow-xl hover:scale-105 transition-transform duration-150 border-2 border-white/60 flex flex-row gap-4 relative p-6"
            >
              <div className="absolute top-2 right-4 text-2xl">{p.pinned ? '📌' : ''}</div>
              <div className="flex flex-col flex-1">
                <div className="text-sm font-bold mb-1">
                  <span className={`px-3 py-1 rounded-full text-xs shadow font-extrabold ${categories.find(c => c.key === p.category)?.color || 'bg-gray-400 text-white'}`}>
                    {categories.find(c => c.key === p.category)?.label || p.category}
                  </span>
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold text-gray-800 drop-shadow mb-2 leading-tight break-words whitespace-pre-wrap" style={{wordBreak: 'break-word', whiteSpace: 'pre-wrap'}}>{p.title}</div>
                <div className="text-base text-gray-400 italic mb-2">Open to view content</div>
                <div className="mt-2 text-sm text-gray-400 flex items-center gap-2">
                  <div className="flex items-center">
                    {p.anonymous ? (
                      <>
                        <span className="mr-2 w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xl text-white font-bold shadow-fun select-none">👤</span>
                        <span className="font-bold text-gray-500 select-none">Anonymous</span>
                      </>
                    ) : (
                      <>
                        <Link to={`/profile/${p.user_id}`} className="mr-2">
                          <img
                            src={p.avatar && p.avatar.trim() ? getAssetUrl(p.avatar) : '/Cute-Cat.png'}
                            alt={p.author_name}
                            className="w-8 h-8 rounded-full object-cover border border-gray-300 hover:ring-2 hover:ring-purple-400 transition-all"
                            onError={e => { e.target.src = '/Cute-Cat.png'; }}
                          />
                        </Link>
                        <Link to={`/profile/${p.user_id}`} className="font-bold text-gray-700 hover:text-purple-600 transition-all">
                          {p.author_name}
                        </Link>
                      </>
                    )}
                  </div>
                  {(() => {
                    let badges = Array.isArray(p.badges) ? [...p.badges] : [];
                    if (p.author_role === 'admin' && !badges.includes('ADMIN')) badges.push('ADMIN');
                    return badges.length > 0 ? (
                      <span className="flex gap-1 ml-2">
                        {badges.map((badge, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-full bg-yellow-100 border border-yellow-300 text-yellow-800 text-xs font-bold uppercase tracking-wider">{badge}</span>
                        ))}
                      </span>
                    ) : null;
                  })()}
                </div>
                {/* Status label for pending/rejected posts */}
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
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default HomePage;
