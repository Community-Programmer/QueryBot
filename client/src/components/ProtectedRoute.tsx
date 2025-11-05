import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { fetchUserProfile } from '@/store/slices/authSlice';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

const ProtectedRoute = ({ children, requireAuth = true }: ProtectedRouteProps) => {
  const { isAuthenticated, accessToken, isLoading, user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const location = useLocation();

  useEffect(() => {
    // If we have a token but no user data, fetch the user profile
    if (accessToken && !user && !isLoading && requireAuth) {
      dispatch(fetchUserProfile());
    }
  }, [accessToken, user, isLoading, dispatch, requireAuth]);

  // Show loading spinner while checking authentication (only for protected routes)
  if (isLoading && requireAuth && accessToken) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

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