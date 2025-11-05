import { useEffect, useState } from 'react';
import { useAppDispatch } from '@/hooks/redux';
import { checkAuthentication } from '@/store/slices/authSlice';

interface AuthInitializerProps {
  children: React.ReactNode;
}

const AuthInitializer = ({ children }: AuthInitializerProps) => {
  const dispatch = useAppDispatch();
  const [initialCheckComplete, setInitialCheckComplete] = useState(false);

  useEffect(() => {
    // Perform initial auth check
    const performInitialCheck = async () => {
      try {
        await dispatch(checkAuthentication());
      } finally {
        setInitialCheckComplete(true);
      }
    };

    performInitialCheck();
  }, [dispatch]);

  // Show loading spinner only during the initial auth check
  if (!initialCheckComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-gray-600">Initializing...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthInitializer;