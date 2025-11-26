import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface StaffRouteGuardProps {
  children: React.ReactNode;
}

export function StaffRouteGuard({ children }: StaffRouteGuardProps) {
  const { loading, hasRole } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Check for staff roles (Super Admin or Admin Global)
  const isStaff = hasRole('Super Admin') || hasRole('Admin Global');

  if (!isStaff) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
