import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { slugifyRole } from "@/lib/utils";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading, userRole, userRoles } = useAuth();

  if (loading || (user && !userRole && userRoles.length === 0)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const effectiveRoles = userRoles.length > 0 ? userRoles : (userRole ? [userRole] : []);
    
    // Build a set with both raw role names and their slugified versions
    const normalizedUserRoles = new Set<string>();
    effectiveRoles.forEach(role => {
      normalizedUserRoles.add(role); // Add raw role name
      normalizedUserRoles.add(slugifyRole(role)); // Add slugified version
    });
    
    // Check if any allowed role matches (either raw or slugified)
    const hasAccess = allowedRoles.some(allowedRole => 
      normalizedUserRoles.has(allowedRole) || normalizedUserRoles.has(slugifyRole(allowedRole))
    );

    if (!hasAccess) {
      return (
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-destructive">Acces refuse</h1>
            <p className="text-muted-foreground">
              Vous n'avez pas les permissions necessaires pour acceder a cette page.
            </p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
