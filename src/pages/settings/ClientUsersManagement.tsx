import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, UserPlus, Search, MoreVertical, Shield, MapPin } from 'lucide-react';
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
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ClientUser | null>(null);
  const [isPermissionDrawerOpen, setIsPermissionDrawerOpen] = useState(false);
  const [userForPermissions, setUserForPermissions] = useState<string | null>(null);

  // Fetch all client users
  const { data: users, isLoading } = useQuery({
    queryKey: ['client-users', search],
    queryFn: async () => {
      let query = supabase
        .from('client_users')
        .select(`
          *,
          clients (
            nom
          )
        `)
        .order('created_at', { ascending: false });

      if (search) {
        query = query.or(`email.ilike.%${search}%,nom.ilike.%${search}%,prenom.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ClientUser[];
    },
  });

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

  const handleViewPermissions = (userId: string) => {
    setUserForPermissions(userId);
    setIsPermissionDrawerOpen(true);
  };

  const filteredUsers = users || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
          {/* Search */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par email, nom ou prénom..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Users Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Organisation</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Aucun utilisateur trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
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
                            <DropdownMenuItem onClick={() => handleViewPermissions(user.id)}>
                              <MapPin className="mr-2 h-4 w-4" />
                              Voir permissions & sites
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

          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t">
            <span>Total: {filteredUsers.length} utilisateur(s)</span>
            <span>
              Actifs: {filteredUsers.filter(u => u.actif).length} | 
              Inactifs: {filteredUsers.filter(u => !u.actif).length}
            </span>
          </div>
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

      {/* Permissions Drawer */}
      {userForPermissions && users && (
        <UserPermissionDrawer
          open={isPermissionDrawerOpen}
          onOpenChange={setIsPermissionDrawerOpen}
          user={users.find(u => u.id === userForPermissions) || null}
          clientId={users.find(u => u.id === userForPermissions)?.client_id || ''}
        />
      )}
    </div>
  );
}
