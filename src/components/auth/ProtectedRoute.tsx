import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  requiredPermission?: string;
  requiredRole?: string;
  fallbackPath?: string;
}

export function ProtectedRoute({ requiredPermission, requiredRole, fallbackPath = '/auth' }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to={fallbackPath} replace />;
  }

  if (requiredRole && user?.role !== requiredRole && user?.role !== 'admin') {
    return <Navigate to={fallbackPath} replace />;
  }

  if (requiredPermission && user?.role !== 'admin') {
    const { hasPermission } = await import('@/lib/permissions');
    if (!hasPermission(user!.role as any, requiredPermission as any)) {
      return <Navigate to={fallbackPath} replace />;
    }
  }

  return <Outlet />;
}