import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, UserPlus, Search, MoreVertical, Shield, MapPin, AlertCircle, RefreshCw } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { usePagination } from '@/hooks/usePagination';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ClientUserFormModal } from '@/components/ClientUserFormModal';
import { UserPermissionDrawer } from '@/components/UserPermissionDrawer';
import { UserSitesManager } from '@/components/UserSitesManager';
import { ClientAutocomplete } from '@/components/shared/ClientAutocomplete';

interface ClientUser {
  id: string;
  email: string;
  nom: string | null;
  prenom: string | null;
  actif: boolean;
  is_client_admin: boolean;
  client_id: string;
  clients?: {
    nom: string;
  };
}

export default function ClientUsersManagement() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ClientUser | null>(null);
  const [isPermissionDrawerOpen, setIsPermissionDrawerOpen] = useState(false);
  const [isSitesDrawerOpen, setIsSitesDrawerOpen] = useState(false);
  const [userForPermissions, setUserForPermissions] = useState<ClientUser | null>(null);
  const [pageSize] = useState(20);

  // Debounce search input
  const debouncedSearch = useDebounce(search, 300);

  // Fetch all client users with site counts
  const { data: users, isLoading, error, refetch } = useQuery({
    queryKey: ['client-users', debouncedSearch, selectedClientId],
    queryFn: async () => {
      try {
        let query = supabase
          .from('client_users')
          .select(`
            *,
            clients (
              nom
            ),
            access_scopes(id, site_id)
          `)
          .order('created_at', { ascending: false });

        if (debouncedSearch) {
          query = query.or(`email.ilike.%${debouncedSearch}%,nom.ilike.%${debouncedSearch}%,prenom.ilike.%${debouncedSearch}%`);
        }

        if (selectedClientId) {
          query = query.eq('client_id', selectedClientId);
        }

        const { data, error } = await query;
        if (error) {
          console.error('Error fetching client users:', error);
          throw error;
        }
        
        // Calculate site counts
        return (data || []).map(user => ({
          ...user,
          site_count: user.access_scopes?.length || 0
        }));
      } catch (err) {
        console.error('Query error:', err);
        throw err;
      }
    },
    staleTime: 30000, // 30 seconds
    retry: 2,
  });

  // Pagination
  const allUsers = users || [];
  const {
    page,
    totalPages,
    paginatedItems: paginatedUsers,
    goToPage,
    goToNextPage,
    goToPrevPage,
    hasNextPage,
    hasPrevPage,
    resetPage,
  } = usePagination(allUsers, pageSize);

  // Reset to page 1 when filters change
  useEffect(() => {
    resetPage();
  }, [debouncedSearch, selectedClientId, resetPage]);

  // Toggle user active status
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ userId, actif }: { userId: string; actif: boolean }) => {
      const { error } = await supabase
        .from('client_users')
        .update({ actif })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-users'] });
      toast.success('Statut mis à jour avec succès');
    },
    onError: (error) => {
      console.error('Error toggling user status:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    },
  });

  // Reset password
  const resetPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Email de réinitialisation envoyé');
    },
    onError: (error) => {
      console.error('Error sending reset password:', error);
      toast.error('Erreur lors de l\'envoi de l\'email');
    },
  });

  const handleEdit = (user: ClientUser) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleViewPermissions = (user: ClientUser) => {
    setUserForPermissions(user);
    setIsPermissionDrawerOpen(true);
  };

  const handleManageSites = (user: ClientUser) => {
    setSelectedUser(user);
    setIsSitesDrawerOpen(true);
  };

  // Calculate statistics
  const stats = {
    total: allUsers.length,
    active: allUsers.filter(u => u.actif).length,
    inactive: allUsers.filter(u => !u.actif).length,
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-64" />
            </div>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="ml-2">
                Erreur lors du chargement des utilisateurs. {error instanceof Error ? error.message : 'Erreur inconnue'}
              </AlertDescription>
            </Alert>
            <div className="flex justify-center mt-4">
              <Button onClick={() => refetch()} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Réessayer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Utilisateurs Clients</CardTitle>
              <CardDescription>
                Gérer tous les utilisateurs des organisations clientes
              </CardDescription>
            </div>
            <Button onClick={() => {
              setSelectedUser(null);
              setIsFormOpen(true);
            }}>
              <UserPlus className="mr-2 h-4 w-4" />
              Nouvel utilisateur
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">Total utilisateurs</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                <p className="text-xs text-muted-foreground">Actifs</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
                <p className="text-xs text-muted-foreground">Inactifs</p>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par email, nom ou prénom..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="w-64">
              <ClientAutocomplete
                value={selectedClientId}
                onChange={setSelectedClientId}
                placeholder="Filtrer par client"
              />
            </div>
            {(search || selectedClientId) && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSearch('');
                  setSelectedClientId('');
                }}
              >
                Réinitialiser
              </Button>
            )}
          </div>

          {/* Users Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Organisation</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Sites</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    {debouncedSearch || selectedClientId ? 'Aucun utilisateur trouvé avec ces critères' : 'Aucun utilisateur enregistré'}
                  </TableCell>
                </TableRow>
                ) : (
                  paginatedUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {user.prenom} {user.nom}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {user.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {user.clients?.nom || 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {user.is_client_admin ? (
                          <Badge variant="default">
                            <Shield className="mr-1 h-3 w-3" />
                            Admin Client
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Utilisateur</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {(user as any).site_count || 0} site(s)
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.actif ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Actif
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            Inactif
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleEdit(user)}>
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleManageSites(user)}>
                              <MapPin className="mr-2 h-4 w-4" />
                              Gérer les sites
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewPermissions(user)}>
                              <Shield className="mr-2 h-4 w-4" />
                              Gérer les permissions
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => toggleActiveMutation.mutate({
                                userId: user.id,
                                actif: !user.actif
                              })}
                            >
                              {user.actif ? 'Désactiver' : 'Activer'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => resetPasswordMutation.mutate(user.email)}
                            >
                              Réinitialiser mot de passe
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Affichage de {((page - 1) * pageSize) + 1} à {Math.min(page * pageSize, allUsers.length)} sur {allUsers.length} utilisateur(s)
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPrevPage}
                  disabled={!hasPrevPage}
                >
                  Précédent
                </Button>
                <span className="text-sm">
                  Page {page} sur {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={!hasNextPage}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Modal */}
      <ClientUserFormModal
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) {
            setSelectedUser(null);
            queryClient.invalidateQueries({ queryKey: ['client-users'] });
          }
        }}
        user={selectedUser}
      />

      {/* Sites Manager Drawer */}
      {selectedUser && (
        <UserSitesManager
          userId={selectedUser.id}
          userEmail={selectedUser.email}
          clientId={selectedUser.client_id}
          open={isSitesDrawerOpen}
          onOpenChange={setIsSitesDrawerOpen}
        />
      )}

      {/* Permissions Drawer */}
      {userForPermissions && (
        <UserPermissionDrawer
          open={isPermissionDrawerOpen}
          onOpenChange={setIsPermissionDrawerOpen}
          user={userForPermissions}
          clientId={userForPermissions.client_id}
        />
      )}
    </div>
  );
}
