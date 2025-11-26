import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Shield, Settings, ChevronRight } from "lucide-react";
import { staffUsersQueries } from "@/lib/staff-users-queries";
import { staffRolesQueries } from "@/lib/staff-roles-queries";

export default function StaffDashboard() {
  const { data: staffUsers, isLoading: loadingUsers } = useQuery({
    queryKey: ["staff-users"],
    queryFn: staffUsersQueries.getAll,
  });

  const { data: staffRoles, isLoading: loadingRoles } = useQuery({
    queryKey: ["staff-roles"],
    queryFn: staffRolesQueries.getAll,
  });

  const activeUsers = staffUsers?.filter((u) => u.actif).length || 0;
  const inactiveUsers = (staffUsers?.length || 0) - activeUsers;

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Gestion du Staff ConformaPro</h1>
        <p className="text-muted-foreground mt-2">
          Administration des comptes et permissions du personnel
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Staff Users Summary */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle>Utilisateurs Staff</CardTitle>
              </div>
              <Link to="/settings/staff-users">
                <Button variant="ghost" size="sm">
                  Gérer <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
            <CardDescription>Membres de l'équipe ConformaPro</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingUsers ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="text-2xl font-bold">{staffUsers?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Actifs</span>
                  <span className="text-lg font-semibold text-green-600">{activeUsers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Inactifs</span>
                  <span className="text-lg font-semibold text-orange-600">{inactiveUsers}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Staff Roles Summary */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle>Rôles Staff</CardTitle>
              </div>
              <Link to="/settings/staff-roles">
                <Button variant="ghost" size="sm">
                  Gérer <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
            <CardDescription>Rôles et permissions</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingRoles ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Rôles définis</span>
                  <span className="text-2xl font-bold">{staffRoles?.length || 0}</span>
                </div>
                <div className="space-y-2">
                  {staffRoles?.slice(0, 3).map((role) => (
                    <div key={role.id} className="flex items-center justify-between text-sm">
                      <span>{role.nom_role}</span>
                      <span className="text-muted-foreground">
                        {staffUsers?.filter((u) => u.role_id === role.id).length || 0} utilisateur(s)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <CardTitle>Liens rapides</CardTitle>
          </div>
          <CardDescription>Accès direct aux fonctions de gestion avancée</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Link to="/settings/staff-users">
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Gestion utilisateurs
              </Button>
            </Link>
            <Link to="/settings/staff-roles">
              <Button variant="outline" className="w-full justify-start">
                <Shield className="h-4 w-4 mr-2" />
                Gestion rôles
              </Button>
            </Link>
            <Link to="/settings/staff-permissions">
              <Button variant="outline" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Configuration permissions
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
