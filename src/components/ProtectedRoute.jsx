import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Wordmark } from './layout/AppShell';

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="grid min-h-full place-items-center">
        <div className="animate-rise opacity-60">
          <Wordmark className="text-lg" />
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />;
  return children;
}
