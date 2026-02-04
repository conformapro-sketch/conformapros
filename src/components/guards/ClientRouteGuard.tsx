import { Navigate } from 'react-router-dom';
import { useUserType } from '@/hooks/useUserType';
import { Loader2 } from 'lucide-react';

interface ClientRouteGuardProps {
  children: React.ReactNode;
}

export function ClientRouteGuard({ children }: ClientRouteGuardProps) {
  const userType = useUserType();

  if (userType === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (userType === 'staff') {
    // Redirect immediately without showing message to avoid flash
    return <Navigate to="/staff/dashboard" replace />;
  }

  return <>{children}</>;
}
