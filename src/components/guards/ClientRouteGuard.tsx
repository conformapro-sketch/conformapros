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
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="space-y-4 text-center">
          <h1 className="text-2xl font-bold text-destructive">Accès refusé</h1>
          <p className="text-muted-foreground">
            Le personnel ConformaPro ne peut pas accéder aux interfaces clients.
          </p>
          <Navigate to="/staff/dashboard" replace />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
