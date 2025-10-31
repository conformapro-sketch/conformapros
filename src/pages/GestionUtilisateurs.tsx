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
import { UserPlus, Edit, Key, CheckCircle, XCircle, Search, Shield } from "lucide-react";
import { supabaseAny as supabase } from "@/lib/supabase-any";

export default function GestionUtilisateurs() {
  const queryClient = useQueryClient();
  const { hasRole, loading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  
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
            Seuls les Super Admins peuvent gérer les utilisateurs internes.
          </p>
        </div>
      </div>
    );
  }

  // Fetch internal team users
  const { data: users, isLoading } = useQuery({
    queryKey: ['users', 'team'],
    queryFn: usersQueries.getConformaTeam,
  });

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
      toast.success('Utilisateur créé avec succès');
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
      toast.error(error?.message || 'Erreur lors de la création de l\'utilisateur');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      usersQueries.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Utilisateur modifié avec succès');
      setOpen(false);
      setEditingUser(null);
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la modification');
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

  const filteredUsers = users?.filter((user) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      user.nom?.toLowerCase().includes(search) ||
      user.prenom?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search)
    );
  });

  const handleSubmit = () => {
    if (editingUser) {
      const { password, ...updateData } = formData;
      updateMutation.mutate({ id: editingUser.id, data: updateData });
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
          <h1 className="text-3xl font-bold">Gestion des utilisateurs</h1>
          <p className="text-muted-foreground mt-1">
            Gérez les utilisateurs internes Conforma Pro
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
          Nouvel utilisateur
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom ou email..."
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
                      Aucun utilisateur trouvé
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
                        >
                          {user.actif !== false ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resetPasswordMutation.mutate(user.email)}
                        >
                          <Key className="w-4 h-4" />
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
              {editingUser ? 'Modifier l\'utilisateur' : 'Créer un utilisateur'}
            </DialogTitle>
            <DialogDescription>
              Remplissez les informations de l'utilisateur interne
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
    </div>
  );
}
