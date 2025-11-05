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
  Trash2
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchClientUsers, resendInvite, toggleUtilisateurActif } from "@/lib/multi-tenant-queries";
import { ClientUserFormModal } from "@/components/ClientUserFormModal";
import { UserPermissionDrawer } from "@/components/UserPermissionDrawer";
import { useToast } from "@/hooks/use-toast";
import { supabaseAny as supabase } from "@/lib/supabase-any";
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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

export default function ClientUsers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { clientId: urlClientId } = useParams<{ clientId: string }>();
  const { isSuperAdmin, loading: authLoading } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [permissionDrawerOpen, setPermissionDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(undefined);
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState<any>(null);
  const [currentClientId, setCurrentClientId] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);

  // Get client ID from URL or current user's profile
  useEffect(() => {
    const fetchClientId = async () => {
      if (urlClientId) {
        setCurrentClientId(urlClientId);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

      if (profile?.tenant_id) {
        setCurrentClientId(profile.tenant_id);
      }
    };
    fetchClientId();
  }, [urlClientId]);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["client-users", currentClientId],
    queryFn: () => fetchClientUsers(currentClientId),
    enabled: !!currentClientId,
  });

  const { data: userStats } = useQuery({
    queryKey: ['client-user-stats', currentClientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('max_users')
        .eq('id', currentClientId)
        .single();
      
      if (error) throw error;
      
      const current = users.filter(u => u.actif).length;
      return {
        current,
        max: data.max_users || 10,
        canAdd: current < (data.max_users || 10),
      };
    },
    enabled: !!currentClientId && !!users,
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ userId, actif }: { userId: string; actif: boolean }) =>
      toggleUtilisateurActif(userId, actif),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-users", currentClientId] });
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

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      // Server-side authorization check
      if (!isSuperAdmin()) {
        throw new Error("Seuls les Super Admins peuvent supprimer des utilisateurs");
      }

      // Delete access_scopes first
      await supabase
        .from('access_scopes')
        .delete()
        .eq('user_id', userId);

      // Delete client_user record
      const { error } = await supabase
        .from('client_users')
        .delete()
        .eq('id', userId);
      
      if (error) throw error;

      // Delete auth user
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      if (authError) throw authError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-users", currentClientId] });
      toast({
        title: "Utilisateur supprimé",
        description: "L'utilisateur a été supprimé avec succès.",
      });
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleOpenPermissions = (user: any) => {
    setSelectedUserForPermissions(user);
    setPermissionDrawerOpen(true);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      `${user.nom} ${user.prenom}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === "all" || 
      (roleFilter === "admin_client" && user.is_client_admin);
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "actif" && user.actif) ||
      (statusFilter === "inactif" && !user.actif);

    return matchesSearch && matchesRole && matchesStatus;
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

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Only Super Admins can delete users
  const canDeleteUsers = isSuperAdmin();

  if (!currentClientId) {
    return (
      <div className="flex items-center justify-center py-12">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Vous devez être associé à un client pour gérer les utilisateurs.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">Utilisateurs client</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Gérez les utilisateurs et leurs accès aux sites
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
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les utilisateurs" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border z-50">
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="admin_client">Admins uniquement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border z-50">
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="actif">Actifs</SelectItem>
                <SelectItem value="inactif">Inactifs</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-soft">
          <CardHeader className="pb-3">
            <CardDescription>Total utilisateurs</CardDescription>
            <CardTitle className="text-3xl">{users.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-soft">
          <CardHeader className="pb-3">
            <CardDescription>Actifs</CardDescription>
            <CardTitle className="text-3xl text-primary">
              {users.filter(u => u.actif).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-soft">
          <CardHeader className="pb-3">
            <CardDescription>Inactifs</CardDescription>
            <CardTitle className="text-3xl text-muted-foreground">
              {users.filter(u => !u.actif).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="shadow-soft">
          <CardHeader className="pb-3">
            <CardDescription>Résultats filtrés</CardDescription>
            <CardTitle className="text-3xl">{filteredUsers.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Users table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : filteredUsers.length > 0 ? (
        <Card className="shadow-soft">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Sites autorisés</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => {
                    const userSites = user.access_scopes || [];

                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {user.nom} {user.prenom}
                            {user.is_client_admin && (
                              <Badge variant="default" className="text-xs">
                                <Shield className="h-3 w-3 mr-1" />
                                Admin
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1">
                                  <Building2 className="h-4 w-4 text-muted-foreground" />
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
                              title="Modifier l'accès"
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
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setUserToDelete(user);
                                setDeleteDialogOpen(true);
                              }}
                              disabled={!canDeleteUsers || user.is_client_admin}
                              title={
                                !canDeleteUsers 
                                  ? "Seuls les Super Admins peuvent supprimer des utilisateurs"
                                  : user.is_client_admin 
                                    ? "Impossible de supprimer un Admin Client" 
                                    : "Supprimer"
                              }
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-soft">
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              {searchQuery || roleFilter !== "all" || statusFilter !== "all"
                ? "Aucun utilisateur ne correspond aux filtres"
                : "Aucun utilisateur enregistré"}
            </p>
            {!searchQuery && roleFilter === "all" && statusFilter === "all" && (
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
        clientId={currentClientId}
        user={editingUser}
      />

      <UserPermissionDrawer
        open={permissionDrawerOpen}
        onOpenChange={setPermissionDrawerOpen}
        user={selectedUserForPermissions}
        clientId={currentClientId}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>{userToDelete?.nom} {userToDelete?.prenom}</strong> ({userToDelete?.email}) ?
              <br /><br />
              Cette action est <strong>irréversible</strong> et supprimera :
              <ul className="list-disc list-inside mt-2">
                <li>Le compte utilisateur</li>
                <li>Tous les accès aux sites</li>
                <li>Toutes les permissions associées</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => userToDelete && deleteMutation.mutate(userToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
