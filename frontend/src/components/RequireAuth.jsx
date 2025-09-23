import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../state/auth';

export default function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  return children;
}


