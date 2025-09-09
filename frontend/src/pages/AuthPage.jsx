

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../state/auth';


export default function AuthPage() {
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (mode === 'signup') {
        const r = await api.post('/auth/signup', { name, password });
        login(r.data.token, r.data.user); navigate('/');
      } else {
        const r = await api.post('/auth/login', { name, password });
        login(r.data.token, r.data.user); navigate('/');
      }
    } catch (e) {
      const msg = e?.response?.data?.error || 'Something went wrong';
      setError(msg);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center font-cartoon relative overflow-hidden" style={{background: 'linear-gradient(135deg, #a8ffce 0%, #5efc82 100%)'}}>
      {/* Animated doodles and icons in the background */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none">
        <span className="absolute left-8 top-8 text-5xl opacity-30 animate-bouncex">📚</span>
        <span className="absolute right-10 top-24 text-4xl opacity-20 animate-spin-slow">✏️</span>
        <span className="absolute left-1/4 bottom-10 text-6xl opacity-20 animate-pulse">⭐</span>
        <span className="absolute right-1/3 top-1/2 text-4xl opacity-20 animate-bounce">📖</span>
        <span className="absolute left-10 bottom-24 text-4xl opacity-20 animate-wiggle">📝</span>
        <span className="absolute right-8 bottom-8 text-5xl opacity-30 animate-bouncex">📚</span>
        {/* Extra floating shapes */}
        <span className="absolute left-1/2 top-1/4 text-3xl opacity-10 animate-spin-slow">🌈</span>
        <span className="absolute right-1/4 bottom-1/3 text-4xl opacity-10 animate-pulse">🎈</span>
        <span className="absolute left-1/3 top-1/3 text-2xl opacity-10 animate-bounce">🧸</span>
      </div>
      {/* Mascot or fun icon */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 mt-8 z-10 select-none pointer-events-none">
        <span className="text-[5rem] animate-wiggle">👋</span>
      </div>
      <form
        onSubmit={submit}
        className="cartoon-card relative z-10 w-full max-w-md flex flex-col gap-6 items-center shadow-cartoon border-4 border-green-400 bg-white/90 animate-wiggle"
        style={{ backdropFilter: 'blur(4px)' }}
      >
        <div className="flex flex-col items-center gap-2 w-full">
          <h1 className="text-4xl font-extrabold text-green-600 drop-shadow text-center mb-2">
            Welcome to the Class Forum <span className="inline-block animate-bounce">🎉</span>
          </h1>
          <div className="w-full flex justify-center mb-1">
            <button
              type="button"
              className="text-green-700 underline text-sm hover:font-bold transition-all animate-pulse"
              onClick={() => navigate('/')}
            >Must have an account to see posted forums</button>
          </div>
        </div>
        {error && (
          <div className="text-error bg-white/80 rounded-cartoon px-4 py-2 border-4 border-error/40 w-full text-center animate-wiggle">
            {error}
          </div>
        )}
        <input
          className="rounded-cartoon px-4 py-3 border-4 border-green-300 w-full text-lg focus:ring-4 focus:ring-green-400 outline-none transition-all"
          placeholder="Username"
          value={name}
          onChange={e => setName(e.target.value)}
          autoFocus
        />
        <input
          type="password"
          className="rounded-cartoon px-4 py-3 border-4 border-green-300 w-full text-lg focus:ring-4 focus:ring-green-400 outline-none transition-all"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button className="fun-btn w-full text-lg py-3 mt-2 shadow-fun bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 border-none animate-bouncex" type="submit">
          {mode === 'signup' ? 'Sign Up' : 'Sign In'}
        </button>
        <div className="w-full flex flex-col items-center mt-2 gap-1">
          {mode === 'login' ? (
            <>
              <span className="text-xs text-dark/50">Don't have an account?</span>
              <button
                type="button"
                className="text-green-700 underline text-sm hover:font-bold transition-all animate-pulse"
                onClick={() => setMode('signup')}
              >Sign up</button>
            </>
          ) : (
            <>
              <span className="text-xs text-dark/50">Already have an account?</span>
              <button
                type="button"
                className="text-green-700 underline text-sm hover:font-bold transition-all animate-pulse"
                onClick={() => setMode('login')}
              >Sign in</button>
            </>
          )}
        </div>
        {/* Fun footer */}
        <div className="w-full flex justify-center mt-4">
          <span className="text-xs text-green-700 flex items-center gap-1 opacity-70 animate-wiggle">
            <span>Made with</span> <span className="text-lg">💚</span> <span>for your school community!</span>
          </span>
        </div>
      </form>
    </div>
  );
}


