import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../state/auth';
import { motion } from 'framer-motion';

export default function WaitApprovalPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const location = useLocation();
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
          login(r.data.token, r.data.user);
          navigate('/', { replace: true });
          return;
        } else if (r.data.status === 'declined') {
          setStatus('declined');
          return;
        } else if (r.data.status === 'not_found') {
          setError('Your signup request could not be found.');
          setStatus('not_found');
          return;
        }
      } catch (e) {
        setError('Network error while checking status');
      }
      setTries(t => t + 1);
      timer = setTimeout(poll, 3000);
    };
    poll();
    return () => clearTimeout(timer);
  }, [name, login, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <motion.div className="card p-8 max-w-md w-full text-center" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        {status === 'pending' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center text-2xl">📨</div>
            <h1 className="text-xl font-bold text-dark">Request Sent!</h1>
            <p className="text-sm text-muted">Waiting for an admin to approve your account. This page refreshes automatically.</p>
            <div className="flex items-center gap-2 text-sm text-muted">
              <div className="w-4 h-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
              Checking... (attempt {tries + 1})
            </div>
            <button className="btn-secondary text-sm mt-2" onClick={() => navigate('/auth', { replace: true })}>Back to Sign In</button>
          </div>
        )}
        {status === 'declined' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-error/10 flex items-center justify-center text-2xl">😢</div>
            <h1 className="text-xl font-bold text-dark">Request Declined</h1>
            <p className="text-sm text-muted">Your account request was declined by an admin.</p>
            <button className="btn-primary text-sm" onClick={() => navigate('/auth', { replace: true })}>Try Again</button>
          </div>
        )}
        {status === 'not_found' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-2xl">🤔</div>
            <h1 className="text-xl font-bold text-dark">Request Not Found</h1>
            <p className="text-sm text-muted">{error || 'Could not find your request.'}</p>
            <button className="btn-primary text-sm" onClick={() => navigate('/auth', { replace: true })}>Back to Sign Up</button>
          </div>
        )}
        {error && status !== 'not_found' && <p className="text-sm text-error mt-4">{error}</p>}
      </motion.div>
    </div>
  );
}
