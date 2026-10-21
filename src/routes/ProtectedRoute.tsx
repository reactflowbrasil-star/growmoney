import { Route, Redirect } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType;
  requiredPermission?: string;
  requiredRole?: string;
}

export function ProtectedRoute({ component: Component, requiredPermission, requiredRole, ...rest }: ProtectedRouteProps) {
  const { isAuthenticated, user, hasPermission } = useAuth();

  if (!isAuthenticated) {
    return <Redirect to="/auth" />;
  }

  if (requiredRole && user?.role !== requiredRole && user?.role !== 'admin') {
    return <Redirect to="/dashboard" />;
  }

  if (requiredPermission && user?.role !== 'admin' && !hasPermission(requiredPermission)) {
    return <Redirect to="/dashboard" />;
  }

  return <Route {...rest} component={Component} />;
}