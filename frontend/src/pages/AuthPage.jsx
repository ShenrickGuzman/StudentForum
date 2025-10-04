

import { useState } from 'react';
import RulesPopup from '../components/RulesPopup';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../state/auth';
import AnimatedCartoonBackground from '../components/AnimatedCartoonBackground';
import AnimatedCartoonButton from '../components/AnimatedCartoonButton';
import { motion } from 'framer-motion';


const RULES_KEY = 'mf_rules_agreed';

export default function AuthPage() {
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState(''); // gmail only for signup
  const [emailError, setEmailError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showRules, setShowRules] = useState(false);
  const [pendingNav, setPendingNav] = useState(false);

  const validateEmail = (value) => {
    if (!value) return 'Email is required';
    // Allow only gmail.com addresses
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
          // fallback if backend returns immediate token (not expected now)
          login(r.data.token, r.data.user);
          // Show rules popup if not agreed
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
        // Show rules popup if not agreed
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

  // Show/hide password
  const [showPassword, setShowPassword] = useState(false);

  // Removed palette toggle; fixed vibrant style for signup

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center font-cartoon relative overflow-hidden" style={{background: 'linear-gradient(135deg, #7fbcff 0%, #b388ff 50%, #ff7eb3 100%)'}}>
      <AnimatedCartoonBackground />
      <RulesPopup
        open={showRules}
        onAgree={() => { setShowRules(false); if (pendingNav) { setPendingNav(false); navigate('/'); } }}
        onClose={() => { setShowRules(false); }}
        onDontShowAgain={() => { localStorage.setItem(RULES_KEY, '1'); }}
      />
      {/* Floating pastel circles and stars */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none">
        <span className="absolute left-8 top-8 w-16 h-16 rounded-full bg-blue-200 opacity-40"></span>
        <span className="absolute right-10 top-24 w-10 h-10 rounded-full bg-pink-200 opacity-30"></span>
        <span className="absolute left-1/4 bottom-10 w-24 h-24 rounded-full bg-purple-200 opacity-30"></span>
        <span className="absolute right-1/3 top-1/2 w-12 h-12 rounded-full bg-yellow-200 opacity-30"></span>
        <span className="absolute left-10 bottom-24 w-10 h-10 rounded-full bg-green-200 opacity-30"></span>
        <span className="absolute right-8 bottom-8 w-20 h-20 rounded-full bg-blue-100 opacity-40"></span>
        <span className="absolute left-1/2 top-1/4 text-3xl opacity-20 animate-spin-slow">⭐</span>
        <span className="absolute right-1/4 bottom-1/3 text-4xl opacity-20 animate-pulse">✨</span>
        <span className="absolute left-1/3 top-1/3 text-2xl opacity-20 animate-bounce">📚</span>
      </div>
      {/* Heading and subheading */}
      <motion.div
        className="mt-8 mb-4 z-10 text-center"
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 120, delay: 0.2 }}
      >
        <motion.h1
          className="text-5xl font-extrabold text-white drop-shadow mb-2 tracking-wide"
          style={{fontFamily: 'Fredoka, Comic Neue, Baloo, cursive'}}
          initial={{ scale: 0.8, rotate: -5 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.4 }}
        >
          Students Forum
        </motion.h1>
        <motion.div
          className="text-lg font-bold text-white/90 flex flex-col items-center gap-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <span className="inline-flex items-center gap-2 animate-bounce-slow">🎓 Welcome to Students Forum! <span className="text-xl">🚀</span></span>
          <span className="inline-flex gap-2 text-xl animate-pulse">📚 <span className="text-pink-200">✨</span> 🎯</span>
        </motion.div>
      </motion.div>
      {/* Auth card */}
      <motion.form
        onSubmit={submit}
        className="relative z-10 w-full max-w-md flex flex-col gap-6 items-center bg-white/90 rounded-3xl shadow-2xl border-2 border-yellow-200 p-8"
        style={{ backdropFilter: 'blur(4px)' }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 120, delay: 0.5 }}
      >
        {/* Tabs */}
        <div className="flex w-full mb-2 rounded-full bg-gray-100 p-1 shadow-inner">
          <AnimatedCartoonButton
            type="button"
            className={`flex-1 py-2 rounded-full font-bold text-lg transition-all ${mode==='login' ? '!bg-gradient-to-r !from-pink-500 !to-rose-400 !text-white !shadow-lg !scale-[1.02]' : '!bg-gray-200 !text-gray-500 !shadow-none !scale-100 !bg-none !border-none'}`}
            style={{ borderRadius: '9999px', border: 'none', background: mode==='login' ? undefined : '#e5e7eb' }}
            onClick={() => setMode('login')}
          >🔑 Sign In</AnimatedCartoonButton>
          <AnimatedCartoonButton
            type="button"
            className={`flex-1 py-2 rounded-full font-bold text-lg transition-all ${mode==='signup' ? '!bg-gradient-to-r !from-indigo-400 !via-fuchsia-400 !to-pink-400 !text-white !shadow-lg !scale-[1.02]' : '!bg-gray-200 !text-gray-500 !shadow-none !scale-100 !bg-none !border-none'}`}
            style={{ borderRadius: '9999px', border: 'none', background: mode==='signup' ? undefined : '#e5e7eb' }}
            onClick={() => setMode('signup')}
          >✴️ Sign Up</AnimatedCartoonButton>
        </div>
        {/* Username */}
        <div className="w-full">
          <label className="block text-sm font-bold text-gray-500 mb-1 flex items-center gap-1"><span className="text-base">👤</span> Username</label>
          <input
            className="w-full rounded-xl px-4 py-3 border-2 border-gray-200 bg-pink-50 text-lg focus:ring-2 focus:ring-pink-300 outline-none transition-all"
            placeholder="Enter your username"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
          />
        </div>
        {/* Password */}
        <div className="w-full relative">
          <label className="block text-sm font-bold text-gray-500 mb-1 flex items-center gap-1"><span className="text-base">🔒</span> Password</label>
          <input
            type={showPassword ? 'text' : 'password'}
            className="w-full rounded-xl px-4 py-3 border-2 border-gray-200 bg-pink-50 text-lg focus:ring-2 focus:ring-pink-300 outline-none transition-all pr-10"
            placeholder="Your password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <button
            type="button"
            tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xl text-pink-400 hover:text-pink-600 focus:outline-none"
            onClick={() => setShowPassword(v => !v)}
            aria-label="Show/hide password"
          >{showPassword ? '🙈' : '👁️'}</button>
        </div>
        {/* Gmail Email (signup only) */}
        {mode === 'signup' && (
          <div className="w-full">
            <label className="block text-sm font-bold text-gray-500 mb-1 flex items-center gap-1"><span className="text-base">📧</span> Gmail</label>
            <input
              type="email"
              className={`w-full rounded-xl px-4 py-3 border-2 bg-pink-50 text-lg focus:ring-2 outline-none transition-all ${emailError ? 'border-pink-400 focus:ring-pink-400' : 'border-gray-200 focus:ring-pink-300'}`}
              placeholder="you@gmail.com"
              value={email}
              onChange={e => { setEmail(e.target.value); if (emailError) setEmailError(''); }}
              onBlur={() => setEmailError(validateEmail(email))}
            />
            {emailError && <div className="mt-1 text-sm text-pink-600 font-semibold">{emailError}</div>}
          </div>
        )}
        {/* Error */}
        {error && (
          <div className="text-error bg-pink-100 rounded-xl px-4 py-2 border-2 border-pink-300 w-full text-center animate-wiggle">
            {error}
          </div>
        )}
        {/* Submit */}
        <AnimatedCartoonButton
          className={`w-full text-lg py-3 mt-2 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-70 ${mode==='signup' ? '!bg-gradient-to-r !from-indigo-500 !via-fuchsia-500 !to-pink-500 hover:!from-indigo-600 hover:!via-fuchsia-600 hover:!to-pink-600' : '!bg-gradient-to-r !from-pink-400 !to-orange-300 hover:!from-pink-500 hover:!to-orange-400'}`}
          disabled={loading}
          type="submit"
        >
          {loading
            ? (<span className="animate-pulse">{mode === 'signup' ? 'Signing up, please wait a moment...' : 'Logging in, please wait a moment...'}</span>)
            : (mode === 'signup' ? <><span className="animate-bounce">✨</span>Sign Up</> : <><span className="animate-bounce">🚀</span>Sign in<span className="animate-bounce">💬</span></>)}
        </AnimatedCartoonButton>
        {/* Welcome message */}
        <div className="w-full bg-white/80 rounded-xl p-4 text-center shadow border-2 border-yellow-100 mt-2">
          {mode === 'login' ? (
            <>
              <span className="text-lg">👋 <b>Welcome back, student!</b> <span className="text-yellow-400">⭐</span></span>
              <div className="text-pink-500 mt-1">Don't have an account yet? Sign up now<span className="text-lg">🤗</span></div>
            </>
          ) : (
            <>
              <span className="text-lg">🎉 <b>Ready to join the fun?</b> <span className="text-pink-400">✨</span></span>
              <div className="text-pink-500 mt-1">Create your account and start posting! <span className="text-lg">�🎈</span></div>
            </>
          )}
        </div>
  </motion.form>
      {/* Simple custom footer below card */}
      <motion.div
        className="mt-6 w-full max-w-md px-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
      >
        <div className="text-center text-base text-blue-500 font-bold animate-wiggle">Made with 💖 by shen</div>
      </motion.div>
    </div>
  );
}


