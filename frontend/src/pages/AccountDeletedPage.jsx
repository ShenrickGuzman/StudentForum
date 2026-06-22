import { Link, useLocation } from 'react-router-dom';

export default function AccountDeletedPage() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const reason = params.get('reason');

  let message = reason === 'warnings'
    ? 'Your account was deleted for reaching 3 warnings. You can sign up again with the same username and email.'
    : 'Your account was deleted by an admin. If you believe this was a mistake, please contact support or sign up again.';

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="card p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center text-3xl mx-auto mb-4">🗑️</div>
        <h1 className="text-2xl font-bold text-dark mb-2">Account Deleted</h1>
        <p className="text-sm text-muted mb-6">{message}</p>
        <Link to="/auth" className="btn-primary text-sm inline-block">Back to Sign In</Link>
      </div>
    </div>
  );
}
