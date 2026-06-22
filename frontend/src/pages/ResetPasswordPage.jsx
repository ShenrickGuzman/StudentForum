import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../lib/api';
import { motion } from 'framer-motion';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const token = params.get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!password || !confirm) { setError('Fill in both fields.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (!token) { setError('Invalid reset token.'); return; }
    setLoading(true);
    try {
      const r = await api.post('/auth/reset-password', { token, newPassword: password });
      if (r.data && r.data.success) {
        setSuccess('Password updated! Redirecting...');
        setTimeout(() => navigate('/auth'), 2000);
      } else { setError('Failed to reset password.'); }
    } catch (err) { setError(err?.response?.data?.error || 'Failed.'); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <motion.div className="card p-6 max-w-sm w-full" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold text-dark mb-6 text-center">Reset Password</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input type="password" className="w-full rounded-xl px-4 py-2.5 border border-gray-200 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none" placeholder="New password" value={password} onChange={e => setPassword(e.target.value)} required />
          <input type="password" className="w-full rounded-xl px-4 py-2.5 border border-gray-200 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none" placeholder="Confirm new password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
          {error && <p className="text-sm text-error bg-error/5 rounded-xl px-3 py-2 text-center">{error}</p>}
          {success && <p className="text-sm text-success bg-success/5 rounded-xl px-3 py-2 text-center">{success}</p>}
          <button type="submit" className="btn-primary w-full text-sm disabled:opacity-60" disabled={loading}>
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
