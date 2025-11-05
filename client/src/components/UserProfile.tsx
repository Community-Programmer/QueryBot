import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { logoutUser } from '@/store/slices/authSlice';
import { Button } from '@/components/ui/button';
import { User, LogOut } from 'lucide-react';

const UserProfile = () => {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-md mx-auto">
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 bg-primary/10 rounded-full">
          <User className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">{user.fullname}</h2>
          <p className="text-gray-600">{user.email}</p>
        </div>
      </div>
      
      <div className="space-y-2 text-sm text-gray-600 mb-4">
        <p><strong>Account Status:</strong> {user.is_active ? 'Active' : 'Inactive'}</p>
        <p><strong>Member since:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
        <p><strong>Last updated:</strong> {new Date(user.updated_at).toLocaleDateString()}</p>
      </div>

      <Button 
        onClick={handleLogout}
        variant="outline"
        className="w-full flex items-center gap-2"
      >
        <LogOut className="w-4 h-4" />
        Logout
      </Button>
    </div>
  );
};

export default UserProfile;