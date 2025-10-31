import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  UserPlus, 
  Search, 
  Users, 
  Shield, 
  Building2, 
  Pencil, 
  UserX, 
  Mail,
  Filter,
  Settings,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAllClientUsers, fetchClients, resendInvite, toggleUtilisateurActif } from "@/lib/multi-tenant-queries";
import { ClientUserFormModal } from "@/components/ClientUserFormModal";
import { UserPermissionDrawer } from "@/components/UserPermissionDrawer";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AllClientUsers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [permissionDrawerOpen, setPermissionDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(undefined);
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState<any>(null);

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: fetchClients,
  });

  const { data: usersData, isLoading } = useQuery({
    queryKey: ["all-client-users", searchQuery, clientFilter, statusFilter, currentPage],
    queryFn: () => fetchAllClientUsers({
      search: searchQuery || undefined,
      clientId: clientFilter !== "all" ? clientFilter : undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
      page: currentPage,
      pageSize: 20,
    }),
  });

  const users = usersData?.data || [];
  const totalCount = usersData?.count || 0;
  const totalPages = usersData?.totalPages || 1;

  const toggleActiveMutation = useMutation({
    mutationFn: ({ userId, actif }: { userId: string; actif: boolean }) =>
      toggleUtilisateurActif(userId, actif),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-client-users"] });
      toast({ title: "Statut mis à jour" });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resendInviteMutation = useMutation({
    mutationFn: resendInvite,
    onSuccess: () => {
      toast({
        title: "Invitation renvoyée",
        description: "Un email de réinitialisation a été envoyé.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setUserFormOpen(true);
  };

  const handleToggleActive = (userId: string, currentStatus: boolean) => {
    toggleActiveMutation.mutate({ userId, actif: !currentStatus });
  };

  const handleResendInvite = (email: string) => {
    resendInviteMutation.mutate(email);
  };

  const roleLabels: Record<string, string> = {
    admin_client: "Admin client",
    gestionnaire_hse: "Gestionnaire HSE",
    chef_site: "Chef de site",
    lecteur: "Lecteur",
    admin_global: "Admin global",
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin_global":
      case "admin_client":
        return "default";
      case "gestionnaire_hse":
        return "secondary";
      case "chef_site":
        return "outline";
      default:
        return "outline";
    }
  };

  const activeUsers = users.filter(u => u.actif).length;
  const inactiveUsers = users.filter(u => !u.actif).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">Utilisateurs client</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Gérez tous les utilisateurs de tous les clients
          </p>
        </div>
        <Button 
          className="bg-gradient-primary shadow-medium"
          onClick={() => {
            setEditingUser(undefined);
            setUserFormOpen(true);
          }}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Nouvel utilisateur
        </Button>
      </div>

      {/* Filters */}
      <Card className="shadow-soft">
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou email..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={clientFilter} onValueChange={(value) => {
                setClientFilter(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les clients" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border z-50">
                  <SelectItem value="all">Tous les clients</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Select value={statusFilter} onValueChange={(value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border z-50">
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="actif">Actifs</SelectItem>
                <SelectItem value="inactif">Inactifs</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setClientFilter("all");
                setStatusFilter("all");
                setCurrentPage(1);
              }}
            >
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-soft">
          <CardHeader className="pb-3">
            <CardDescription>Total utilisateurs</CardDescription>
            <CardTitle className="text-3xl">{totalCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-soft">
          <CardHeader className="pb-3">
            <CardDescription>Actifs</CardDescription>
            <CardTitle className="text-3xl text-primary">
              {activeUsers}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-soft">
          <CardHeader className="pb-3">
            <CardDescription>Inactifs</CardDescription>
            <CardTitle className="text-3xl text-muted-foreground">
              {inactiveUsers}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-soft">
          <CardHeader className="pb-3">
            <CardDescription>Page actuelle</CardDescription>
            <CardTitle className="text-3xl">{users.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Users table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : users.length > 0 ? (
        <Card className="shadow-soft">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Sites</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user: any) => {
                    const userSites = user.access_scopes || [];
                    const userRoleObj = user.user_roles?.[0] as any;
                    const userRoles = userRoleObj?.roles;
                    const role = Array.isArray(userRoles) ? userRoles[0]?.name : userRoles?.name;
                    const clientData = user.clients;

                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.nom} {user.prenom}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {clientData?.nom || "N/A"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {role && (
                            <Badge variant={getRoleBadgeVariant(role)}>
                              <Shield className="h-3 w-3 mr-1" />
                              {roleLabels[role] || role}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1">
                                  <span className="text-sm">
                                    {userSites.length} site{userSites.length > 1 ? 's' : ''}
                                  </span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                {userSites.length > 0 ? (
                                  <ul className="space-y-1">
                                    {userSites.map((as: any) => (
                                      <li key={as.site_id} className="text-sm">
                                        • {as.sites?.nom_site}
                                        {as.read_only && (
                                          <span className="text-muted-foreground ml-1">(lecture seule)</span>
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-sm">Aucun site</p>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell>
                          {user.actif ? (
                            <Badge variant="default" className="bg-green-500">Actif</Badge>
                          ) : (
                            <Badge variant="secondary">Inactif</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedUserForPermissions(user);
                                setPermissionDrawerOpen(true);
                              }}
                              title="Gérer les permissions"
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(user)}
                              title="Modifier l'utilisateur"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleActive(user.id, user.actif)}
                              title={user.actif ? "Désactiver" : "Activer"}
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResendInvite(user.email)}
                              title="Réinitialiser l'invitation"
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} sur {totalPages} ({totalCount} utilisateurs au total)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Précédent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Suivant
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-soft">
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              {searchQuery || clientFilter !== "all" || statusFilter !== "all"
                ? "Aucun utilisateur ne correspond aux filtres"
                : "Aucun utilisateur enregistré"}
            </p>
            {!searchQuery && clientFilter === "all" && statusFilter === "all" && (
              <Button 
                onClick={() => {
                  setEditingUser(undefined);
                  setUserFormOpen(true);
                }}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Créer le premier utilisateur
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <ClientUserFormModal
        open={userFormOpen}
        onOpenChange={(open) => {
          setUserFormOpen(open);
          if (!open) setEditingUser(undefined);
        }}
        user={editingUser}
      />

      <UserPermissionDrawer
        open={permissionDrawerOpen}
        onOpenChange={setPermissionDrawerOpen}
        user={selectedUserForPermissions}
        clientId={selectedUserForPermissions?.managed_client_id || ""}
      />
    </div>
  );
}
