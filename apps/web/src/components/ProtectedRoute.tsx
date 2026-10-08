import { Navigate, Outlet } from 'react-router-dom';
import { useCurrentUser } from '../features/auth/useAuth';

export function ProtectedRoute() {
  const { data: user, isLoading, isError } = useCurrentUser();

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;
  if (isError || !user) return <Navigate to="/login" replace />;

  return <Outlet />;
}