import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import RulesPopup from '../components/RulesPopup';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../state/auth';
import { motion } from 'framer-motion';

const RULES_KEY = 'mf_rules_agreed';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showRules, setShowRules] = useState(false);
  const [pendingNav, setPendingNav] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const validateEmail = (value) => {
    if (!value) return 'Email is required';
    const re = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
    if (!re.test(value)) return 'Must be a valid @gmail.com address';
    return '';
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (mode === 'signup') {
      const emErr = validateEmail(email);
      setEmailError(emErr);
      if (emErr) { setLoading(false); return; }
    }
    try {
      if (mode === 'signup') {
        const r = await api.post('/auth/signup', { name, password, email });
        if (r.data.status === 'pending') {
          navigate(`/wait-approval?name=${encodeURIComponent(name)}`, { state: { name } });
        } else if (r.data.token) {
          login(r.data.token, r.data.user);
          if (!localStorage.getItem(RULES_KEY)) {
            setShowRules(true);
            setPendingNav(true);
          } else {
            navigate('/');
          }
        }
      } else {
        const r = await api.post('/auth/login', { name, password });
        login(r.data.token, r.data.user);
        if (!localStorage.getItem(RULES_KEY)) {
          setShowRules(true);
          setPendingNav(true);
        } else {
          navigate('/');
        }
      }
    } catch (e) {
      const msg = e?.response?.data?.error || 'Something went wrong';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotMessage('');
    setResetLink('');
    setForgotLoading(true);
    if (!forgotEmail) {
      setForgotMessage('Email is required');
      setForgotLoading(false);
      return;
    }
    try {
      await api.post('/auth/request-password-reset', { email: forgotEmail });
      setForgotMessage('If an account with that email exists, a reset link has been sent. Please check your inbox (and spam folder).');
    } catch (err) {
      setForgotMessage(err?.response?.data?.error || 'Something went wrong.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <RulesPopup
        open={showRules}
        onAgree={() => { setShowRules(false); if (pendingNav) { setPendingNav(false); navigate('/'); } }}
        onClose={() => { setShowRules(false); }}
        onDontShowAgain={() => { localStorage.setItem(RULES_KEY, '1'); }}
      />

      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="text-center mb-8">
          <motion.div
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
          >
            S
          </motion.div>
          <h1 className="text-3xl font-bold text-dark">St. Hyacinth's Forum</h1>
          <p className="text-muted mt-1">
            {mode === 'login' ? 'Welcome back! Sign in to continue.' : 'Create your account to get started.'}
          </p>
        </div>

        <div className="card p-6">
          <div className="flex mb-6 bg-gray-50 rounded-xl p-1">
            <button
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'login' ? 'bg-white text-primary shadow-sm' : 'text-muted hover:text-dark'}`}
              onClick={() => setMode('login')}
            >
              Sign In
            </button>
            <button
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'signup' ? 'bg-white text-primary shadow-sm' : 'text-muted hover:text-dark'}`}
              onClick={() => setMode('signup')}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={submit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-dark mb-1">Username</label>
              <input
                className="w-full rounded-xl px-4 py-2.5 border border-gray-200 bg-white text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                placeholder="Enter your username"
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full rounded-xl px-4 py-2.5 border border-gray-200 bg-white text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all pr-10"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-dark text-sm"
                  onClick={() => setShowPassword(v => !v)}
                  tabIndex={-1}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {mode === 'login' && (
                <button
                  type="button"
                  className="text-xs text-primary hover:underline mt-1"
                  onClick={() => { setShowForgot(true); setForgotMessage(''); setForgotEmail(''); }}
                >
                  Forgot password?
                </button>
              )}
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-dark mb-1">Gmail</label>
                <input
                  type="email"
                  className={`w-full rounded-xl px-4 py-2.5 border bg-white text-sm focus:ring-2 outline-none transition-all ${emailError ? 'border-error focus:ring-error/10' : 'border-gray-200 focus:border-primary focus:ring-primary/10'}`}
                  placeholder="you@gmail.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); if (emailError) setEmailError(''); }}
                  onBlur={() => setEmailError(validateEmail(email))}
                />
                {emailError && <p className="mt-1 text-xs text-error">{emailError}</p>}
              </div>
            )}

            {error && (
              <div className="bg-error/5 text-error text-sm rounded-xl px-4 py-2.5 border border-error/10 text-center">
                {error}
              </div>
            )}

            <button
              className="btn-primary w-full text-center flex items-center justify-center gap-2 disabled:opacity-60 mt-1"
              disabled={loading}
              type="submit"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  {mode === 'signup' ? 'Creating account...' : 'Signing in...'}
                </span>
              ) : (
                mode === 'signup' ? 'Create Account' : 'Sign In'
              )}
            </button>
          </form>

          <p className="text-center text-xs text-muted mt-6">
            {mode === 'login' ? (
              <>Don't have an account? <button className="text-primary font-semibold hover:underline" onClick={() => setMode('signup')}>Sign up</button></>
            ) : (
              <>Already have an account? <button className="text-primary font-semibold hover:underline" onClick={() => setMode('login')}>Sign in</button></>
            )}
          </p>
        </div>

        <p className="text-center text-xs text-muted mt-6">Built with care for the Hyacinth community</p>
      </motion.div>

      {showForgot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <motion.div
            className="bg-white rounded-2xl shadow-elevated p-6 w-full max-w-sm mx-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-dark">Reset Password</h2>
              <button className="text-muted hover:text-dark text-lg" onClick={() => setShowForgot(false)}>&times;</button>
            </div>
            <form onSubmit={handleForgotPassword} className="flex flex-col gap-3">
              <input
                type="email"
                className="rounded-xl px-4 py-2.5 border border-gray-200 bg-white text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none"
                placeholder="Enter your email"
                value={forgotEmail}
                onChange={e => setForgotEmail(e.target.value)}
                required
              />
              <button
                type="submit"
                className="btn-primary w-full text-sm disabled:opacity-60"
                disabled={forgotLoading}
              >
                {forgotLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
              {forgotMessage && <p className="text-xs text-muted text-center">{forgotMessage}</p>}
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
