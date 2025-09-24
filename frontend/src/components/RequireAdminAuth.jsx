import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../state/auth';

export default function RequireAdminAuth({ children }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  
  // First check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  
  // Allow if user is admin, teacher, or name is 'shen' (case-insensitive)
  const isAdmin = user?.role === 'admin' || user?.role === 'teacher' || user?.name?.toLowerCase() === 'shen';
  if (!isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }
  return children;
}
