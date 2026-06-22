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
import ResetPasswordPage from './pages/ResetPasswordPage';
import NotificationBell from './components/NotificationBell';

function NavBar({ darkMode, toggleDarkMode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

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
    <header className="sticky top-0 z-20 bg-white/80 dark:bg-dark-surface/80 backdrop-blur-lg border-b border-gray-100 dark:border-dark-border">
      <div className="max-w-6xl mx-auto flex items-center gap-4 py-3 px-4">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold text-primary hover:opacity-80 transition-opacity">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm">S</span>
          St. Hyacinth's Forum
        </Link>
        <nav className="ml-auto flex items-center gap-2">
          <Link to="/new" className="btn-primary text-sm inline-flex items-center gap-1.5">
            <span className="sm:hidden">+</span>
            <span className="hidden sm:inline">+ New Post</span>
          </Link>
          {user && <NotificationBell />}
          <button onClick={toggleDarkMode} className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-surface text-muted dark:text-dark-muted transition-colors" aria-label="Toggle dark mode">
            {darkMode ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            )}
          </button>
          {user && (
            <div className="relative">
              <button
                className="profile-menu-trigger flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-dark-bg hover:bg-gray-100 dark:hover:bg-dark-surface text-dark dark:text-dark-text font-medium text-sm transition-colors border border-gray-200 dark:border-dark-border"
                onClick={() => setProfileMenuOpen((open) => !open)}
                aria-haspopup="true"
                aria-expanded={profileMenuOpen}
              >
                <img
                  src={user.avatar && user.avatar.trim() ? (user.avatar.startsWith('http') ? user.avatar : `${window.location.origin}/${user.avatar}`) : `${window.location.origin}/Cute-Cat.png`}
                  alt={user.name}
                  className="w-7 h-7 rounded-full object-cover border-2 border-primary/20"
                  onError={e => { e.target.src = `${window.location.origin}/Cute-Cat.png`; }}
                />
                <span className="hidden sm:inline">{user.name}</span>
                <svg className="w-3.5 h-3.5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </button>
              {profileMenuOpen && (
                <div className="profile-menu-dropdown absolute right-0 mt-2 w-48 bg-white dark:bg-dark-surface rounded-xl shadow-elevated border border-gray-100 dark:border-dark-border py-1.5 z-50 animate-scale-in">
                  <button className="w-full text-left px-4 py-2 text-sm text-dark dark:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors" onClick={() => { setProfileMenuOpen(false); navigate('/profile'); }}>View Profile</button>
                  <button className="w-full text-left px-4 py-2 text-sm text-dark dark:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors" onClick={() => { setProfileMenuOpen(false); navigate('/settings'); }}>Settings</button>
                  {user.role === 'admin' && (
                    <button className="w-full text-left px-4 py-2 text-sm text-dark dark:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors" onClick={() => { setProfileMenuOpen(false); navigate('/admin'); }}>Admin Panel</button>
                  )}
                  <hr className="my-1 border-gray-100 dark:border-dark-border" />
                  <button className="w-full text-left px-4 py-2 text-sm text-error hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors" onClick={() => { setProfileMenuOpen(false); logout(); }}>Log out</button>
                </div>
              )}
            </div>
          )}
          {!user && (
            <Link to="/auth" className="btn-primary text-sm">Sign In</Link>
          )}
        </nav>
      </div>
    </header>
  );
}

function AppShell() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('mf_dark') === 'true');
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('mf_dark', darkMode);
  }, [darkMode]);
  const toggleDarkMode = () => setDarkMode(v => !v);
  return (
    <div className="min-h-screen bg-background dark:bg-dark-bg text-dark dark:text-dark-text transition-colors">
      <NavBar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      <main>
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
          <Route path="/profile/:id" element={<ProfilePage />} />
          <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
          <Route path="/settings" element={<RequireAuth><div className="max-w-2xl mx-auto p-8 text-center text-muted">Settings page coming soon</div></RequireAuth>} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
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
