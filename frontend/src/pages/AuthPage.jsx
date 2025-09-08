
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../state/auth';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
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
    <div className="bg-fun min-h-screen flex items-center justify-center font-cartoon">
      <div className="absolute top-0 left-0 w-full flex justify-center mt-8 select-none pointer-events-none z-0">
        <span className="text-[5rem] animate-bouncex">🦄</span>
      </div>
      <form
        onSubmit={submit}
        className="cartoon-card relative z-10 w-full max-w-md flex flex-col gap-6 items-center shadow-cartoon border-4 border-accent bg-gradient-to-br from-primary/30 to-secondary/30 animate-wiggle"
        style={{ backdropFilter: 'blur(4px)' }}
      >
        <div className="flex flex-col items-center gap-2">
          <span className="text-5xl animate-bouncex">📚</span>
          <h1 className="text-3xl font-extrabold text-accent drop-shadow">Class Forum</h1>
          <p className="text-dark/70 text-base">{mode==='signup' ? 'Create your account' : 'Log in to join the fun!'}</p>
        </div>
        <div className="flex gap-2 justify-center w-full">
          <button
            type="button"
            className={`fun-btn flex-1 py-2 ${mode==='login'?'ring-4 ring-accent':''}`}
            onClick={() => setMode('login')}
            tabIndex={-1}
          >Sign In</button>
          <button
            type="button"
            className={`fun-btn flex-1 py-2 ${mode==='signup'?'ring-4 ring-accent':''}`}
            onClick={() => setMode('signup')}
            tabIndex={-1}
          >Sign Up</button>
        </div>
        {error && (
          <div className="text-error bg-white/80 rounded-cartoon px-4 py-2 border-4 border-error/40 w-full text-center animate-wiggle">
            {error}
          </div>
        )}
        <input
          className="rounded-cartoon px-4 py-3 border-4 border-secondary w-full text-lg focus:ring-4 focus:ring-primary outline-none transition-all"
          placeholder="Username"
          value={name}
          onChange={e => setName(e.target.value)}
          autoFocus
        />
        <input
          type="password"
          className="rounded-cartoon px-4 py-3 border-4 border-secondary w-full text-lg focus:ring-4 focus:ring-primary outline-none transition-all"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button className="fun-btn w-full text-lg py-3 mt-2 shadow-fun" type="submit">
          {mode === 'signup' ? 'Create Account ✨' : 'Sign In 🚀'}
        </button>
        <div className="w-full flex justify-center mt-2">
          <span className="text-xs text-dark/50">{mode==='signup' ? 'Already have an account?' : "Don't have an account?"}</span>
          <button
            type="button"
            className="ml-2 text-accent underline hover:font-bold"
            onClick={() => setMode(mode==='signup'?'login':'signup')}
          >{mode==='signup' ? 'Sign In' : 'Sign Up'}</button>
        </div>
      </form>
    </div>
  );
}


