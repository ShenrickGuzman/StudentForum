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
    <div className="min-h-[70vh] flex items-center justify-center">
      <form onSubmit={submit} className="card-bubble p-8 space-y-4 w-full max-w-md bg-gradient-to-br from-lemon to-mint">
        <div className="text-center">
          <div className="text-4xl">🎒</div>
          <h1 className="text-3xl font-extrabold text-pink-700">Welcome to Class Forum</h1>
          <p className="opacity-80">{mode==='signup' ? 'Create your account' : 'Log in to continue'}</p>
        </div>
        <div className="flex gap-2 justify-center">
          <button type="button" className={`btn-fun ${mode==='login'?'ring-4 ring-pink-400':''}`} onClick={() => setMode('login')}>Login</button>
          <button type="button" className={`btn-fun ${mode==='signup'?'ring-4 ring-pink-400':''}`} onClick={() => setMode('signup')}>Sign Up</button>
        </div>
        {error && <div className="text-red-700 bg-white/70 rounded-bubble px-4 py-2 border-4 border-red-300">{error}</div>}
        <input className="rounded-full px-4 py-3 border-4 border-pinky w-full" placeholder="Username" value={name} onChange={e => setName(e.target.value)} />
        <input type="password" className="rounded-full px-4 py-3 border-4 border-pinky w-full" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
        <button className="btn-fun w-full text-lg" type="submit">{mode === 'signup' ? 'Create account ✨' : 'Login 🚀'}</button>
      </form>
    </div>
  );
}


