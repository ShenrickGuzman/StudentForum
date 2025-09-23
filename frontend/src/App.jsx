import { Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import ProfilePage from './pages/ProfilePage';
import { useEffect, useState } from 'react';
import HomePage from './pages/HomePage';
import PostDetailPage from './pages/PostDetailPage';
import NewPostPage from './pages/NewPostPage';
import AdminPage from './pages/AdminPage';
import AuthPage from './pages/AuthPage';
import WaitApprovalPage from './pages/WaitApprovalPage';
import RulesPage from './pages/RulesPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import AccountDeletedPage from './pages/AccountDeletedPage';
import { AuthContextProvider, useAuth } from './state/auth';
import RequireAuth from './components/RequireAuth';
import RequireAdminAuth from './components/RequireAdminAuth';

function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  // Close menu when clicking outside
  useEffect(() => {
    if (!profileMenuOpen) return;
    function handleClick(e) {
      if (!e.target.closest('.profile-menu-trigger') && !e.target.closest('.profile-menu-dropdown')) {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [profileMenuOpen]);

  return (
    <header className="sticky top-0 z-20 bg-gradient-to-r from-primary/80 to-secondary/80 shadow-cartoon border-b-4 border-accent/40">
      <div className="max-w-5xl mx-auto flex items-center gap-4 py-2 px-2 md:px-4">
        <Link to="/" className="flex items-center gap-2 text-xl md:text-2xl lg:text-3xl font-extrabold text-accent drop-shadow-lg hover:scale-105 transition-all duration-200 bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm border border-white/30">
          <span className="inline">📚 Students Forum</span>
        </Link>
        <nav className="ml-auto flex items-center gap-2">
          {/* Desktop only: New Post and Rules */}
          <Link to="/new" className="hidden sm:inline bg-green-400 hover:bg-green-500 text-white font-bold px-4 py-2 rounded-full shadow transition-all">New Post</Link>
          <Link to="/rules" className="hidden sm:inline bg-yellow-400 hover:bg-yellow-500 text-white font-bold px-4 py-2 rounded-full shadow transition-all">Rules</Link>
          {user && (
            <div className="relative">
              <button
                className="profile-menu-trigger flex items-center gap-1 px-3 py-1 rounded-full bg-white/70 text-dark/80 font-bold text-base shadow-fun focus:outline-none"
                onClick={() => setProfileMenuOpen((open) => !open)}
                aria-haspopup="true"
                aria-expanded={profileMenuOpen}
              >
                <span className="text-lg">👤</span> {user.name}
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </button>
              {profileMenuOpen && (
                <div className="profile-menu-dropdown absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg py-2 z-50">
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-100" onClick={() => { setProfileMenuOpen(false); navigate('/profile'); }}>View Profile</button>
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-100" onClick={() => { setProfileMenuOpen(false); navigate('/settings'); }}>Settings</button>
                  <button className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100" onClick={() => { setProfileMenuOpen(false); logout(); }}>Logout</button>
                </div>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

function AppShell() {
  return (
    <div>
      <NavBar />
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/wait-approval" element={<WaitApprovalPage />} />
        <Route path="/rules" element={<RulesPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/account-deleted" element={<AccountDeletedPage />} />
        <Route path="/" element={<RequireAuth><HomePage /></RequireAuth>} />
        <Route path="/post/:id" element={<RequireAuth><PostDetailPage /></RequireAuth>} />
        <Route path="/new" element={<RequireAuth><NewPostPage /></RequireAuth>} />
        <Route path="/admin" element={<RequireAdminAuth><AdminPage /></RequireAdminAuth>} />
  <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
        {/* Add a settings page route if you create one */}
        <Route path="/settings" element={<RequireAuth><div className="p-8 text-2xl">Settings Page (Coming Soon)</div></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <AuthContextProvider>
      <AppShell />
    </AuthContextProvider>
  );
}


