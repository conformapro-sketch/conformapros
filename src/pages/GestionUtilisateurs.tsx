import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersQueries } from "@/lib/users-queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { UserPlus, Edit, Key, CheckCircle, XCircle, Search, Shield, Trash2 } from "lucide-react";
import { supabaseAny as supabase } from "@/lib/supabase-any";
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

export default function GestionUtilisateurs() {
  const queryClient = useQueryClient();
  const { hasRole, loading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    nom: "",
    prenom: "",
    role_uuid: "",
    telephone: "",
  });

  // Show loading spinner while auth is loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check if user has Super Admin role
  if (!hasRole('Super Admin')) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-destructive mb-2">
            Accès restreint
          </h2>
          <p className="text-muted-foreground">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
            Seuls les Super Admins peuvent gérer les membres de l'équipe.
          </p>
        </div>
      </div>
    );
  }

  // Fetch internal team users
  const { data: users, isLoading, error: usersError } = useQuery({
    queryKey: ['users', 'team'],
    queryFn: usersQueries.getConformaTeam,
    retry: false,
  });

  // Show error toast if access is denied
  if (usersError) {
    const errorMessage = usersError instanceof Error ? usersError.message : 'Erreur lors du chargement';
    if (errorMessage.includes('Not authorized')) {
      toast.error('Accès refusé: seuls les Super Admins peuvent voir les membres de l\'équipe');
    } else {
      toast.error(errorMessage);
    }
  }

  // Fetch team roles
  const { data: roles } = useQuery({
    queryKey: ['roles', 'team'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .eq('type', 'team')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (userData: any) => {
      if (!userData.role_uuid) {
        throw new Error('Role is required');
      }
      return usersQueries.create(userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Membre ajouté avec succès');
      setOpen(false);
      setFormData({
        email: '',
        password: '',
        nom: '',
        prenom: '',
        role_uuid: '',
        telephone: '',
      });
    },
    onError: (error: any) => {
      console.error('Error creating user:', error);
      toast.error(error?.message || 'Erreur lors de l\'ajout du membre');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      usersQueries.update(id, data),
    onError: (error: any) => {
      console.error('Error updating profile:', error);
      toast.error('Erreur lors de la modification du profil');
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, roleUuid }: { userId: string; roleUuid: string }) =>
      usersQueries.updateRole(userId, roleUuid),
    onError: (error: any) => {
      console.error('Error updating role:', error);
      toast.error('Erreur lors de la modification du rôle');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, actif }: { id: string; actif: boolean }) =>
      usersQueries.toggleActive(id, actif),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Statut modifié');
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: usersQueries.resetPassword,
    onSuccess: () => {
      toast.success('Email de réinitialisation envoyé');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: usersQueries.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Utilisateur supprimé avec succès');
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    },
    onError: (error: any) => {
      console.error('Error deleting user:', error);
      toast.error(error?.message || 'Erreur lors de la suppression');
    },
  });

  const filteredUsers = users?.filter((user) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      user.nom?.toLowerCase().includes(search) ||
      user.prenom?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search)
    );
  });

  const handleSubmit = async () => {
    if (editingUser) {
      // Prevent changing Super Admin role (extra protection)
      const currentRole = editingUser.user_roles?.[0]?.roles?.name;
      if (currentRole === 'Super Admin' && formData.role_uuid !== editingUser.user_roles?.[0]?.role_uuid) {
        toast.error('Impossible de modifier le rôle Super Admin');
        return;
      }
      
      const { password, role_uuid, ...profileData } = formData;
      
      try {
        // Update profile
        await updateMutation.mutateAsync({ id: editingUser.id, data: profileData });
        
        // Update role if changed
        const currentRoleUuid = editingUser.user_roles?.[0]?.role_uuid;
        if (role_uuid && role_uuid !== currentRoleUuid) {
          await updateRoleMutation.mutateAsync({ userId: editingUser.id, roleUuid: role_uuid });
        }
        
        toast.success('Membre modifié avec succès');
        queryClient.invalidateQueries({ queryKey: ['users'] });
        setOpen(false);
        setEditingUser(null);
      } catch (error) {
        console.error('Error updating user:', error);
        // Errors are already handled by individual mutations
      }
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setFormData({
      email: user.email || '',
      password: '',
      nom: user.nom || '',
      prenom: user.prenom || '',
      role_uuid: user.user_roles?.[0]?.role_uuid || '',
      telephone: user.telephone || '',
    });
    setOpen(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion de l'équipe</h1>
          <p className="text-muted-foreground mt-1">
            Gérez les membres de l'équipe Conforma Pro
          </p>
        </div>
        <Button onClick={() => {
          setEditingUser(null);
          setFormData({
            email: '',
            password: '',
            nom: '',
            prenom: '',
            role_uuid: '',
            telephone: '',
          });
          setOpen(true);
        }}>
          <UserPlus className="w-4 h-4 mr-2" />
          Nouveau membre
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un membre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : filteredUsers?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Aucun membre trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.nom} {user.prenom}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {user.user_roles?.[0]?.roles?.name || 'Aucun'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {user.user_roles?.[0]?.roles?.type || '-'}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.telephone || '-'}</TableCell>
                      <TableCell>
                        {user.actif !== false ? (
                          <Badge className="bg-success text-success-foreground">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Actif
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <XCircle className="w-3 h-3 mr-1" />
                            Inactif
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(user)}
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleActiveMutation.mutate({ 
                            id: user.id, 
                            actif: user.actif === false 
                          })}
                          title={user.actif !== false ? "Désactiver" : "Activer"}
                        >
                          {user.actif !== false ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resetPasswordMutation.mutate(user.email)}
                          title="Réinitialiser le mot de passe"
                        >
                          <Key className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setUserToDelete(user);
                            setDeleteDialogOpen(true);
                          }}
                          disabled={user.user_roles?.[0]?.roles?.name === 'Super Admin'}
                          title={user.user_roles?.[0]?.roles?.name === 'Super Admin' ? "Impossible de supprimer un Super Admin" : "Supprimer"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* User Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Modifier le membre' : 'Ajouter un membre'}
            </DialogTitle>
            <DialogDescription>
              Remplissez les informations du membre de l'équipe
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Prénom *</Label>
              <Input
                value={formData.prenom}
                onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                placeholder="Jean"
              />
            </div>
            <div>
              <Label>Nom *</Label>
              <Input
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                placeholder="Dupont"
              />
            </div>
            <div className="col-span-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="jean.dupont@conformapro.tn"
                disabled={!!editingUser}
              />
            </div>
            {!editingUser && (
              <div className="col-span-2">
                <Label>Mot de passe *</Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
            )}
            <div className="col-span-2">
              <Label>Rôle *</Label>
              {editingUser?.user_roles?.[0]?.roles?.name === 'Super Admin' ? (
                <>
                  <div className="flex items-center gap-2 p-3 border rounded-md bg-accent/10">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="font-medium">Super Admin</span>
                    <Badge variant="secondary">Protégé</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Le rôle Super Admin ne peut pas être modifié pour préserver la sécurité du système
                  </p>
                </>
              ) : (
                <Select
                  value={formData.role_uuid}
                  onValueChange={(value) => setFormData({ ...formData, role_uuid: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles?.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name} {role.description && `- ${role.description}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="col-span-2">
              <Label>Téléphone</Label>
              <Input
                value={formData.telephone}
                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                placeholder="+216 XX XXX XXX"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingUser ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                <li>Tous les rôles et permissions associés</li>
                <li>L'accès à la plateforme</li>
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
