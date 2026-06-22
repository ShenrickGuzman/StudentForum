import { Link } from 'react-router-dom';
import { useAuth } from '../state/auth';

export default function UnauthorizedPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="card p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center text-3xl mx-auto mb-4">🚫</div>
        <h1 className="text-2xl font-bold text-dark mb-2">Access Denied</h1>
        <p className="text-sm text-muted mb-6">
          Sorry {user?.name}, you don't have permission to access this page.
        </p>
        <div className="flex gap-3 justify-center">
          <Link to="/" className="btn-primary text-sm">Go Home</Link>
          <Link to="/rules" className="btn-secondary text-sm">View Rules</Link>
        </div>
      </div>
    </div>
  );
}
