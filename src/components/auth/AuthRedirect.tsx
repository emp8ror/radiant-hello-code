import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const AuthRedirect = () => {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user && userRole) {
    return <Navigate to={userRole === 'landlord' ? '/landlord/dashboard' : '/tenant/dashboard'} replace />;
  }

  return <Navigate to="/auth" replace />;
};

export default AuthRedirect;
