import { Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import HomePage from './pages/HomePage';
import PostDetailPage from './pages/PostDetailPage';
import NewPostPage from './pages/NewPostPage';
import AdminPage from './pages/AdminPage';
import AuthPage from './pages/AuthPage';
import { AuthContextProvider, useAuth } from './state/auth';
import RequireAuth from './components/RequireAuth';

function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="sticky top-0 z-10 bg-sky p-3 shadow">
      <div className="max-w-5xl mx-auto flex items-center gap-4">
        <Link to="/" className="text-2xl font-extrabold text-pink-700">🎈 Class Forum</Link>
        <nav className="ml-auto flex items-center gap-2">
          <Link className="btn-fun" to="/new">+ New Post</Link>
          {user?.role === 'admin' && <Link className="btn-fun" to="/admin">Admin</Link>}
          {!user && <Link className="btn-fun" to="/auth">Login</Link>}
          {user && (
            <button className="btn-fun" onClick={() => { logout(); navigate('/'); }}>Logout</button>
          )}
        </nav>
      </div>
    </div>
  );
}

function AppShell() {
  return (
    <div>
      <NavBar />
      <div className="max-w-5xl mx-auto p-4">
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={<RequireAuth><HomePage /></RequireAuth>} />
          <Route path="/post/:id" element={<RequireAuth><PostDetailPage /></RequireAuth>} />
          <Route path="/new" element={<RequireAuth><NewPostPage /></RequireAuth>} />
          <Route path="/admin" element={<RequireAuth><AdminPage /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
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


