
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AnimatedCartoonButton from '../components/AnimatedCartoonButton';
import api from '../lib/api';


export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Get token from URL
  const params = new URLSearchParams(location.search);
  const token = params.get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!password || !confirm) {
      setError('Please fill in both fields.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (!token) {
      setError('Missing or invalid reset token.');
      return;
    }
    setLoading(true);
    try {
      const r = await api.post('/auth/reset-password', { token, newPassword: password });
      if (r.data && r.data.success) {
        setSuccess('Password updated! You can now log in.');
        setTimeout(() => navigate('/auth'), 2000);
      } else {
        setError('Failed to reset password.');
      }
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to reset password.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-200 via-pink-100 to-yellow-100 font-cartoon">
      <div className="bg-white/90 rounded-3xl shadow-2xl border-2 border-yellow-200 p-8 w-full max-w-md flex flex-col items-center">
        <h1 className="text-3xl font-bold text-pink-500 mb-4">Reset Password</h1>
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <input
            type="password"
            className="rounded-xl px-4 py-3 border-2 border-gray-200 bg-pink-50 text-lg focus:ring-2 focus:ring-pink-300 outline-none"
            placeholder="New password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <input
            type="password"
            className="rounded-xl px-4 py-3 border-2 border-gray-200 bg-pink-50 text-lg focus:ring-2 focus:ring-pink-300 outline-none"
            placeholder="Confirm new password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
          />
          {error && <div className="text-error bg-pink-100 rounded-xl px-4 py-2 border-2 border-pink-300 w-full text-center animate-wiggle">{error}</div>}
          {success && <div className="text-green-600 bg-green-100 rounded-xl px-4 py-2 border-2 border-green-300 w-full text-center animate-bounce">{success}</div>}
          <AnimatedCartoonButton type="submit" className="w-full text-lg py-3 mt-2 rounded-xl font-bold flex items-center justify-center gap-2 transition-all" disabled={loading}>
            {loading ? 'Updating...' : 'Update Password'}
          </AnimatedCartoonButton>
        </form>
      </div>
    </div>
  );
}
