import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/hooks/redux';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

const ProtectedRoute = ({ children, requireAuth = true }: ProtectedRouteProps) => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const location = useLocation();

  // If auth is required but user is not authenticated, redirect to auth page
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If user is authenticated but trying to access auth page, redirect to home
  if (!requireAuth && isAuthenticated && location.pathname === '/auth') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;