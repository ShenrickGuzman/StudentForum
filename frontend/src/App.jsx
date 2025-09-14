import { Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import HomePage from './pages/HomePage';
import PostDetailPage from './pages/PostDetailPage';
import NewPostPage from './pages/NewPostPage';
import AdminPage from './pages/AdminPage';
import AuthPage from './pages/AuthPage';
import WaitApprovalPage from './pages/WaitApprovalPage';
import RulesPage from './pages/RulesPage';
import { AuthContextProvider, useAuth } from './state/auth';
import RequireAuth from './components/RequireAuth';

function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-20 bg-gradient-to-r from-primary/80 to-secondary/80 shadow-cartoon border-b-4 border-accent/40">
      <div className="max-w-5xl mx-auto flex items-center gap-4 py-2 px-2 md:px-4">
        <Link to="/" className="flex items-center gap-2 text-2xl font-extrabold text-accent drop-shadow hover:scale-105 transition-transform">
          <span className="text-3xl">🦉</span>
          <span className="hidden sm:inline">Class Forum</span>
        </Link>
        <nav className="ml-auto flex items-center gap-2">
          <Link className="fun-btn px-4 py-2 text-base" to="/new">✏️ New Post</Link>
          <Link className="fun-btn px-4 py-2 text-base" to="/rules">📜 Rules</Link>
          {user?.role === 'admin' && <Link className="fun-btn px-4 py-2 text-base" to="/admin">🛠️ Admin</Link>}
          {!user && <Link className="fun-btn px-4 py-2 text-base" to="/auth">Sign In</Link>}
          {user && (
            <>
              <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/70 text-dark/80 font-bold text-base shadow-fun">
                <span className="text-lg">👤</span> {user.name}
              </span>
              <button
                className="fun-btn px-4 py-2 text-base"
                onClick={() => { logout(); navigate('/'); }}
              >Logout</button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

function AppShell() {
  return (
    <div>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/wait-approval" element={<WaitApprovalPage />} />
        <Route path="/rules" element={<RulesPage />} />
        <Route path="/" element={<RequireAuth><HomePage /></RequireAuth>} />
        <Route path="/post/:id" element={<RequireAuth><PostDetailPage /></RequireAuth>} />
        <Route path="/new" element={<RequireAuth><NewPostPage /></RequireAuth>} />
        <Route path="/admin" element={<RequireAuth><AdminPage /></RequireAuth>} />
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
