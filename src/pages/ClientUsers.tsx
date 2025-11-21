import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  RefreshCw,
  FilterX,
  ArrowUpDown,
  CheckCheck
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
import { UserAvatar } from "@/components/UserAvatar";
import { UserTableSkeleton } from "@/components/UserTableSkeleton";
import { cn } from "@/lib/utils";

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
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<'nom' | 'email' | 'created_at' | 'sites'>('nom');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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

  // Sort users
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case 'nom':
        comparison = `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`);
        break;
      case 'email':
        comparison = (a.email || '').localeCompare(b.email || '');
        break;
      case 'created_at':
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      case 'sites':
        comparison = (a.access_scopes?.length || 0) - (b.access_scopes?.length || 0);
        break;
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
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

  // Bulk actions
  const handleSelectAll = () => {
    if (selectedUserIds.size === sortedUsers.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(sortedUsers.map(u => u.id)));
    }
  };

  const handleSelectUser = (userId: string) => {
    const newSelection = new Set(selectedUserIds);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUserIds(newSelection);
  };

  const handleBulkActivate = async () => {
    try {
      await Promise.all(
        Array.from(selectedUserIds).map(userId => 
          toggleUtilisateurActif(userId, true)
        )
      );
      queryClient.invalidateQueries({ queryKey: ["client-users", currentClientId] });
      toast({ 
        title: "Utilisateurs activés",
        description: `${selectedUserIds.size} utilisateur(s) activé(s) avec succès.`
      });
      setSelectedUserIds(new Set());
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleBulkDeactivate = async () => {
    try {
      await Promise.all(
        Array.from(selectedUserIds).map(userId => 
          toggleUtilisateurActif(userId, false)
        )
      );
      queryClient.invalidateQueries({ queryKey: ["client-users", currentClientId] });
      toast({ 
        title: "Utilisateurs désactivés",
        description: `${selectedUserIds.size} utilisateur(s) désactivé(s) avec succès.`
      });
      setSelectedUserIds(new Set());
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Export to CSV
  const handleExport = () => {
    const headers = ['Nom', 'Prénom', 'Email', 'Téléphone', 'Admin', 'Statut', 'Sites', 'Date création'];
    const rows = sortedUsers.map(user => [
      user.nom || '',
      user.prenom || '',
      user.email || '',
      user.telephone || '',
      user.is_client_admin ? 'Oui' : 'Non',
      user.actif ? 'Actif' : 'Inactif',
      (user.access_scopes?.length || 0).toString(),
      new Date(user.created_at).toLocaleDateString('fr-FR'),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `utilisateurs-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: "Export réussi",
      description: `${sortedUsers.length} utilisateur(s) exporté(s).`
    });
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setRoleFilter('all');
    setStatusFilter('all');
  };

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const hasActiveFilters = searchQuery || roleFilter !== 'all' || statusFilter !== 'all';

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
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
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

            <div className="flex gap-2">
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilters}
                  className="flex-1"
                >
                  <FilterX className="h-4 w-4 mr-2" />
                  Effacer
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => queryClient.invalidateQueries({ queryKey: ["client-users", currentClientId] })}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk actions bar */}
      {selectedUserIds.size > 0 && (
        <Card className="shadow-soft border-primary/50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCheck className="h-5 w-5 text-primary" />
                <span className="font-medium">
                  {selectedUserIds.size} utilisateur{selectedUserIds.size > 1 ? 's' : ''} sélectionné{selectedUserIds.size > 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkActivate}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Activer
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDeactivate}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Désactiver
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedUserIds(new Set())}
                >
                  Annuler
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
            <CardTitle className="text-3xl">{sortedUsers.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Users table */}
      {isLoading ? (
        <UserTableSkeleton />
      ) : sortedUsers.length > 0 ? (
        <Card className="shadow-soft">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Utilisateurs</CardTitle>
                <CardDescription className="mt-1">
                  {sortedUsers.length} utilisateur{sortedUsers.length > 1 ? 's' : ''}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
              >
                <Download className="h-4 w-4 mr-2" />
                Exporter CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedUserIds.size === sortedUsers.length && sortedUsers.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('nom')}
                        className="-ml-3 h-8 data-[state=open]:bg-accent"
                      >
                        Utilisateur
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('email')}
                        className="-ml-3 h-8 data-[state=open]:bg-accent"
                      >
                        Email
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('sites')}
                        className="-ml-3 h-8 data-[state=open]:bg-accent"
                      >
                        Sites
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedUsers.map((user) => {
                    const userSites = user.access_scopes || [];
                    const siteCount = userSites.length;

                    return (
                      <TableRow 
                        key={user.id}
                        className="group hover:bg-muted/50 transition-colors"
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedUserIds.has(user.id)}
                            onCheckedChange={() => handleSelectUser(user.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <UserAvatar
                              nom={user.nom}
                              prenom={user.prenom}
                              avatarUrl={user.avatar_url}
                            />
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {user.prenom} {user.nom}
                                </span>
                                {user.is_client_admin && (
                                  <Badge variant="default" className="text-xs bg-primary/10 text-primary border-primary/20">
                                    <Shield className="h-3 w-3 mr-1" />
                                    Admin
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Créé le {new Date(user.created_at).toLocaleDateString('fr-FR')}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">{user.email}</div>
                            {user.telephone && (
                              <div className="text-xs text-muted-foreground">{user.telephone}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-2 cursor-help">
                                  <Building2 className="h-4 w-4 text-muted-foreground" />
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">{siteCount}</span>
                                    <Badge 
                                      variant="secondary" 
                                      className={cn(
                                        "text-xs",
                                        siteCount === 0 && "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300"
                                      )}
                                    >
                                      {siteCount === 0 ? "Aucun accès" : `${siteCount} site${siteCount > 1 ? 's' : ''}`}
                                    </Badge>
                                  </div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="left" className="max-w-md bg-background border shadow-lg">
                                <div className="space-y-3 p-1">
                                  <div className="flex items-center gap-2 pb-2 border-b">
                                    <Building2 className="h-4 w-4 text-primary" />
                                    <h4 className="font-semibold text-sm">Sites autorisés</h4>
                                  </div>
                                  {siteCount > 0 ? (
                                    <ul className="space-y-2">
                                      {userSites.map((as: any) => (
                                        <li key={as.site_id} className="flex items-start gap-2 text-sm">
                                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                          <div className="flex-1">
                                            <div className="font-medium">{as.sites?.nom_site}</div>
                                            <div className="text-xs text-muted-foreground">
                                              Code: {as.sites?.code_site}
                                              {as.read_only && " • Lecture seule"}
                                            </div>
                                          </div>
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                                      <XCircle className="h-4 w-4 text-orange-500" />
                                      <span>Aucun site assigné</span>
                                    </div>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div>
                                  {user.actif ? (
                                    <Badge className="bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20 hover:bg-green-500/20">
                                      <CheckCircle2 className="h-3 w-3 mr-1" />
                                      Actif
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="bg-muted text-muted-foreground">
                                      <XCircle className="h-3 w-3 mr-1" />
                                      Inactif
                                    </Badge>
                                  )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-xs">
                                  {user.actif 
                                    ? "Cet utilisateur peut se connecter" 
                                    : "Cet utilisateur ne peut pas se connecter"}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedUserForPermissions(user);
                                      setPermissionDrawerOpen(true);
                                    }}
                                    className="hover:bg-primary/10 hover:text-primary"
                                  >
                                    <Settings className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Gérer les permissions</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEdit(user)}
                                    className="hover:bg-blue-500/10 hover:text-blue-600"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Modifier l'accès</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleToggleActive(user.id, user.actif)}
                                    className={cn(
                                      user.actif 
                                        ? "hover:bg-orange-500/10 hover:text-orange-600" 
                                        : "hover:bg-green-500/10 hover:text-green-600"
                                    )}
                                  >
                                    {user.actif ? <UserX className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {user.actif ? "Désactiver le compte" : "Activer le compte"}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleResendInvite(user.email)}
                                    className="hover:bg-purple-500/10 hover:text-purple-600"
                                  >
                                    <Mail className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Renvoyer l'invitation</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setUserToDelete(user);
                                      setDeleteDialogOpen(true);
                                    }}
                                    disabled={!canDeleteUsers || user.is_client_admin}
                                    className="hover:bg-destructive/10 hover:text-destructive disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {!canDeleteUsers 
                                    ? "Seuls les Super Admins peuvent supprimer" 
                                    : user.is_client_admin 
                                      ? "Impossible de supprimer un Admin Client" 
                                      : "Supprimer l'utilisateur"}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
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
              {hasActiveFilters
                ? "Aucun utilisateur ne correspond aux filtres"
                : "Aucun utilisateur enregistré"}
            </p>
            {!hasActiveFilters && (
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
