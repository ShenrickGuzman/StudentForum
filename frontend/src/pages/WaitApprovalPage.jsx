import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../state/auth';

// Displays waiting status after signup; polls backend until approved or declined.
export default function WaitApprovalPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const location = useLocation();
  // Name passed via location state or search param
  const initialName = location.state?.name || new URLSearchParams(location.search).get('name') || '';
  const [name] = useState(initialName);
  const [status, setStatus] = useState('pending');
  const [tries, setTries] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!name) return;
    let timer;
    const poll = async () => {
      try {
        const r = await api.get('/auth/signup-status', { params: { name } });
        if (r.data.status === 'approved' && r.data.token) {
          login(r.data.token, r.data.user); // auto login
          navigate('/', { replace: true });
          return;
        } else if (r.data.status === 'declined') {
          setStatus('declined');
          return; // stop polling
        } else if (r.data.status === 'not_found') {
          setError('Your signup request could not be found. You may re-submit.');
          setStatus('not_found');
          return;
        } else {
          setStatus('pending');
        }
      } catch (e) {
        setError('Network error while checking status');
      }
      setTries(t => t + 1);
      timer = setTimeout(poll, 3000); // poll every 3s
    };
    poll();
    return () => clearTimeout(timer);
  }, [name, login, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center font-cartoon relative overflow-hidden" style={{background: 'linear-gradient(135deg,#a18cd1 0%,#fbc2eb 100%)'}}>
      <div className="absolute inset-0 pointer-events-none select-none opacity-30">
        <div className="absolute top-10 left-10 text-6xl animate-bounce">🕒</div>
        <div className="absolute bottom-16 right-12 text-6xl animate-pulse">📨</div>
        <div className="absolute top-1/2 left-1/4 text-6xl animate-spin-slow">🛎️</div>
      </div>
      <div className="relative z-10 w-full max-w-xl bg-white/90 rounded-3xl border-4 border-purple-200 shadow-2xl p-10 text-center flex flex-col gap-6">
        <h1 className="text-4xl font-extrabold text-purple-600 drop-shadow">Account Request Status</h1>
        {status === 'pending' && (
          <div className="space-y-4">
            <p className="text-xl font-bold text-purple-700 flex flex-col gap-2">
              <span>📨 Account creation request sent!</span>
              <span className="text-pink-500">Waiting for an admin to approve it...</span>
            </p>
            <div className="flex items-center justify-center gap-2 text-lg text-purple-500">
              <span className="animate-spin inline-block">⏳</span>
              <span>Checking status (attempt {tries + 1})...</span>
            </div>
            <button
              className="fun-btn px-5 py-3 text-base"
              onClick={() => navigate('/auth', { replace: true })}
            >Back to Sign In</button>
          </div>
        )}
        {status === 'declined' && (
          <div className="space-y-4">
            <div className="text-5xl">😢</div>
            <p className="text-xl font-bold text-error">Your account request was declined.</p>
            <button
              className="fun-btn px-5 py-3 text-base"
              onClick={() => navigate('/auth', { replace: true })}
            >Try Again</button>
          </div>
        )}
        {status === 'not_found' && (
          <div className="space-y-4">
            <div className="text-5xl">🤔</div>
            <p className="text-xl font-bold text-error">We couldn't find your request.</p>
            <button
              className="fun-btn px-5 py-3 text-base"
              onClick={() => navigate('/auth', { replace: true })}
            >Return to Sign Up</button>
          </div>
        )}
        {error && <div className="text-sm text-error font-semibold">{error}</div>}
      </div>
    </div>
  );
}
