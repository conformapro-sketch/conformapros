import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, Search, Download, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { StaffUserDetailsPanel } from "@/components/staff/StaffUserDetailsPanel";
import { StaffUserDataGrid } from "@/components/staff/StaffUserDataGrid";
import { useDebounce } from "@/hooks/useDebounce";
import { useExportData } from "@/hooks/useExportData";
import { UserWithDetails, UserManagementStats } from "@/types/user-management";
import { ClientUserFormModal } from "@/components/ClientUserFormModal";

export default function StaffUserManagement() {
  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 500);
  const { exportToExcel } = useExportData();

  // Fetch users via edge function
  const { data: usersData, isLoading, refetch } = useQuery({
    queryKey: ["staff-users", debouncedSearch, clientFilter, statusFilter, page],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('staff-user-management', {
        body: {
          action: 'list',
          search: debouncedSearch || undefined,
          clientId: clientFilter || undefined,
          status: statusFilter || undefined,
          page,
          pageSize: 20,
        },
      });
      if (error) throw error;
      return data;
    },
  });

  // Fetch clients for filter
  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, nom")
        .order("nom");
      if (error) throw error;
      return data;
    },
  });

  const users: UserWithDetails[] = usersData?.users || [];
  const totalCount = users[0]?.total_count || 0;
  const totalPages = Math.ceil(totalCount / 20);

  // Calculate stats from aggregated data (more efficient than filtering)
  const stats: UserManagementStats = {
    total: totalCount,
    active: users.reduce((acc, u) => acc + (u.actif ? 1 : 0), 0),
    inactive: users.reduce((acc, u) => acc + (!u.actif ? 1 : 0), 0),
    admins: users.reduce((acc, u) => acc + (u.is_client_admin ? 1 : 0), 0),
  };

  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId);
    setIsPanelOpen(true);
  };

  const handleExport = () => {
    const exportData = users.map(u => ({
      Email: u.email,
      Nom: u.nom || '',
      Prénom: u.prenom || '',
      Téléphone: u.telephone || '',
      Statut: u.actif ? 'Actif' : 'Inactif',
      'Admin Client': u.is_client_admin ? 'Oui' : 'Non',
      Client: u.client?.nom || '',
      'Nombre de sites': u.site_count || 0,
      'Nombre de permissions': u.permission_count || 0,
    }));
    exportToExcel(exportData, 'utilisateurs-clients', 'Utilisateurs');
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestion des utilisateurs</h1>
            <p className="text-muted-foreground">Gérer tous les utilisateurs clients de la plateforme</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
            <Button onClick={() => setIsAddUserOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Ajouter utilisateur
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total utilisateurs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Actifs</CardTitle>
              <Badge variant="default" className="bg-green-500">Actif</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactifs</CardTitle>
              <Badge variant="secondary">Inactif</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inactive}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Administrateurs</CardTitle>
              <Badge variant="default">Admin</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.admins}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filtres</CardTitle>
            <CardDescription>Rechercher et filtrer les utilisateurs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par nom ou email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Tous les clients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous les clients</SelectItem>
                  {clients?.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous les statuts</SelectItem>
                  <SelectItem value="actif">Actif</SelectItem>
                  <SelectItem value="inactif">Inactif</SelectItem>
                </SelectContent>
              </Select>
              {(search || clientFilter || statusFilter) && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSearch("");
                    setClientFilter("");
                    setStatusFilter("");
                  }}
                >
                  Effacer
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* User Data Grid */}
        <StaffUserDataGrid
          users={users}
          isLoading={isLoading}
          onUserClick={handleUserClick}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />

        {/* User Details Panel */}
        <StaffUserDetailsPanel
          userId={selectedUserId}
          open={isPanelOpen}
          onOpenChange={setIsPanelOpen}
          onUpdate={() => refetch()}
        />

        {/* Add User Modal */}
        <ClientUserFormModal
          open={isAddUserOpen}
          onOpenChange={(open) => {
            setIsAddUserOpen(open);
            if (!open) {
              // Refetch when modal closes to get new user
              refetch();
            }
          }}
        />
      </div>
    );
  }
