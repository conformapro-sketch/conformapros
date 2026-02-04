import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface StaffRouteGuardProps {
  children: React.ReactNode;
  redirectClientTo?: string; // Optional custom redirect
}

export function StaffRouteGuard({ children, redirectClientTo }: StaffRouteGuardProps) {
  const { loading, hasRole, isClientUser } = useAuth();
  const location = useLocation();

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
    // Smart redirect for client users accessing staff bibliotheque routes
    if (isClientUser() && location.pathname.startsWith('/bibliotheque')) {
      // Map staff routes to equivalent client routes
      let clientPath = location.pathname.replace('/bibliotheque', '/client-bibliotheque');
      
      // Handle specific route mappings
      if (clientPath === '/client-bibliotheque/dashboard') {
        clientPath = '/client-bibliotheque/dashboard';
      } else if (clientPath === '/client-bibliotheque/recherche') {
        clientPath = '/client/recherche-avancee';
      } else if (clientPath.includes('/client-bibliotheque/domain') || 
                 clientPath.includes('/client-bibliotheque/autorites') ||
                 clientPath.includes('/client-bibliotheque/parametres')) {
        // Admin-only pages redirect to client dashboard
        clientPath = '/client-bibliotheque/dashboard';
      }
      
      console.log('[StaffRouteGuard] Client user accessing staff route, redirecting:', location.pathname, '→', clientPath);
      return <Navigate to={clientPath} replace />;
    }
    
    // Default redirect to dashboard
    return <Navigate to={redirectClientTo || "/dashboard"} replace />;
  }

  return <>{children}</>;
}
