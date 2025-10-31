import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { RoleTable } from "@/components/roles/RoleTable";
import { RoleFormDrawer } from "@/components/roles/RoleFormDrawer";
import { rolesQueries } from "@/lib/roles-queries";
import { useAuth } from "@/contexts/AuthContext";
import type { Role } from "@/types/roles";

export default function RoleManager() {
  const { userRole, tenantId } = useAuth();
  const [activeTab, setActiveTab] = useState<'team' | 'client'>('team');
  const [searchTerm, setSearchTerm] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | undefined>();

  // Check if user is super admin
  const isSuperAdmin = userRole === 'super_admin';

  // Fetch team roles
  const { data: teamRoles, isLoading: teamLoading } = useQuery({
    queryKey: ['roles', 'team'],
    queryFn: () => rolesQueries.getByType('team'),
    enabled: isSuperAdmin,
  });

  // Fetch client roles
  const { data: clientRoles, isLoading: clientLoading } = useQuery({
    queryKey: ['roles', 'client', tenantId],
    queryFn: () => rolesQueries.getByType('client', tenantId),
    enabled: !!tenantId,
  });

  const handleCreateRole = () => {
    setSelectedRole(undefined);
    setDrawerOpen(true);
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setDrawerOpen(true);
  };

  const filteredTeamRoles = teamRoles?.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredClientRoles = clientRoles?.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isSuperAdmin && !tenantId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-2">Accès Refusé</h2>
          <p className="text-muted-foreground">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Rôles</h1>
          <p className="text-muted-foreground mt-1">
            Créez et personnalisez les rôles et permissions pour votre organisation
          </p>
        </div>
      </div>

      <Card className="p-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'team' | 'client')}>
          <div className="flex items-center justify-between mb-6">
            <TabsList>
              {isSuperAdmin && (
                <TabsTrigger value="team">Rôles Équipe</TabsTrigger>
              )}
              <TabsTrigger value="client">Rôles Client</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un rôle..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>

              <Button onClick={handleCreateRole}>
                <Plus className="mr-2 h-4 w-4" />
                Nouveau Rôle
              </Button>
            </div>
          </div>

          {isSuperAdmin && (
            <TabsContent value="team" className="mt-0">
              <RoleTable
                roles={filteredTeamRoles || []}
                isLoading={teamLoading}
                onEdit={handleEditRole}
                type="team"
              />
            </TabsContent>
          )}

          <TabsContent value="client" className="mt-0">
            <RoleTable
              roles={filteredClientRoles || []}
              isLoading={clientLoading}
              onEdit={handleEditRole}
              type="client"
            />
          </TabsContent>
        </Tabs>
      </Card>

      <RoleFormDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        role={selectedRole}
        type={activeTab}
        tenantId={activeTab === 'client' ? tenantId : undefined}
      />
    </div>
  );
}
