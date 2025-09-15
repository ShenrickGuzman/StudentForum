import { Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
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
  return (
    <header className="sticky top-0 z-20 bg-gradient-to-r from-primary/80 to-secondary/80 shadow-cartoon border-b-4 border-accent/40">
      <div className="max-w-5xl mx-auto flex items-center gap-4 py-2 px-2 md:px-4">
        <Link to="/" className="flex items-center gap-2 text-xl md:text-2xl lg:text-3xl font-extrabold text-accent drop-shadow-lg hover:scale-105 transition-all duration-200 bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm border border-white/30">
          <span className="inline">📚 Students Forum</span>
        </Link>
        <nav className="ml-auto flex items-center gap-2">
          {user && (
            <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/70 text-dark/80 font-bold text-base shadow-fun">
              <span className="text-lg">👤</span> {user.name}
            </span>
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


