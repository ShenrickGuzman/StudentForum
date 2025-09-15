import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../state/auth';

export default function RequireAdminAuth({ children }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  
  // First check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  
  // Then check if the user is specifically "SHEN"
  if (user?.name?.toLowerCase() !== 'shen') {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return children;
}