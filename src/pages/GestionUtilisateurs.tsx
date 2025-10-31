import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersQueries, rolesQueries } from "@/lib/users-queries";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { UserPlus, Edit, Trash2, Key, CheckCircle, XCircle, Search, Shield } from "lucide-react";
import { supabaseAny as supabase } from "@/lib/supabase-any";

export default function GestionUtilisateurs() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userRole } = useAuth();
  const canManageTeam = userRole === "admin_global";
  const [searchTerm, setSearchTerm] = useState("");
  const [userDialog, setUserDialog] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    userId?: string;
  }>({ open: false, mode: 'create' });
  
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    userId?: string;
    userName?: string;
  }>({ open: false });

  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    password: "",
    role_id: "",
    client_id: "",
    site_id: "",
    fonction: "",
    telephone: "",
  });

  if (!canManageTeam) {
    return (
      <Card className="shadow-soft">
        <CardContent className="py-12 text-center space-y-3 text-muted-foreground">
          <Shield className="mx-auto h-10 w-10" />
          <p>Seuls les administrateurs Conforma Pro peuvent gerer cette equipe.</p>
        </CardContent>
      </Card>
    );
  }

  // Fetch users
  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: usersQueries.getAll,
    enabled: canManageTeam,
  });

  // Fetch roles
  const { data: roles } = useQuery({
    queryKey: ["roles"],
    queryFn: rolesQueries.getAll,
    enabled: canManageTeam,
  });

  // Fetch clients
  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, nom_legal")
        .order("nom_legal");
      if (error) throw error;
      return data;
    },
  });

  // Fetch sites
  const { data: sites } = useQuery({
    queryKey: ["sites", formData.client_id],
    queryFn: async () => {
      if (!formData.client_id) return [];
      const { data, error } = await supabase
        .from("sites")
        .select("id, nom_site")
        .eq("client_id", formData.client_id)
        .order("nom_site");
      if (error) throw error;
      return data;
    },
    enabled: !!formData.client_id,
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: usersQueries.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({
        title: "Utilisateur créé",
        description: "L'utilisateur a été créé avec succès.",
      });
      setUserDialog({ open: false, mode: 'create' });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer l'utilisateur.",
        variant: "destructive",
      });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      usersQueries.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({
        title: "Utilisateur modifié",
        description: "L'utilisateur a été modifié avec succès.",
      });
      setUserDialog({ open: false, mode: 'create' });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de modifier l'utilisateur.",
        variant: "destructive",
      });
    },
  });

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, actif }: { id: string; actif: boolean }) =>
      usersQueries.toggleActive(id, actif),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({
        title: "Statut modifié",
        description: "Le statut de l'utilisateur a été modifié.",
      });
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: usersQueries.resetPassword,
    onSuccess: () => {
      toast({
        title: "Email envoyé",
        description: "Un email de réinitialisation a été envoyé à l'utilisateur.",
      });
    },
  });

  const filteredUsers = users?.filter((user) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      user.nom?.toLowerCase().includes(search) ||
      user.prenom?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search) ||
      user.roles?.nom?.toLowerCase().includes(search)
    );
  });

  const handleOpenDialog = async (mode: 'create' | 'edit', userId?: string) => {
    if (mode === 'edit' && userId) {
      const user = users?.find(u => u.id === userId);
      if (user) {
        setFormData({
          nom: user.nom || "",
          prenom: user.prenom || "",
          email: user.email || "",
          password: "",
          role_id: user.role_id || "",
          client_id: user.client_id || "",
          site_id: user.site_id || "",
          fonction: user.fonction || "",
          telephone: user.telephone || "",
        });
      }
    }
    setUserDialog({ open: true, mode, userId });
  };

  const handleSubmit = () => {
    if (userDialog.mode === 'create') {
      createUserMutation.mutate(formData);
    } else if (userDialog.userId) {
      const { password, ...updateData } = formData;
      updateUserMutation.mutate({ id: userDialog.userId, data: updateData });
    }
  };

  const resetForm = () => {
    setFormData({
      nom: "",
      prenom: "",
      email: "",
      password: "",
      role_id: "",
      client_id: "",
      site_id: "",
      fonction: "",
      telephone: "",
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion des utilisateurs</h1>
          <p className="text-muted-foreground mt-1">
            Gérez les utilisateurs et leurs rôles
          </p>
        </div>
        <Button onClick={() => handleOpenDialog('create')}>
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
              placeholder="Rechercher par nom, email ou rôle..."
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
                  <TableHead>Client</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Fonction</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : filteredUsers?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Aucun utilisateur trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.prenom} {user.nom}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.roles?.nom || "Aucun rôle"}</Badge>
                      </TableCell>
                      <TableCell>{user.client_id || "-"}</TableCell>
                      <TableCell>{user.site_id || "-"}</TableCell>
                      <TableCell>{user.fonction || "-"}</TableCell>
                      <TableCell>
                        {user.actif ? (
                          <Badge className="bg-success text-success-foreground">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Actif
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            <XCircle className="w-3 h-3 mr-1" />
                            Inactif
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenDialog('edit', user.id)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleActiveMutation.mutate({ 
                            id: user.id, 
                            actif: !user.actif 
                          })}
                        >
                          {user.actif ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => user.email && resetPasswordMutation.mutate(user.email)}
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
      <Dialog open={userDialog.open} onOpenChange={(open) => {
        setUserDialog({ ...userDialog, open });
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {userDialog.mode === 'create' ? 'Créer un utilisateur' : 'Modifier l\'utilisateur'}
            </DialogTitle>
            <DialogDescription>
              Remplissez les informations de l'utilisateur
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Prénom</Label>
              <Input
                value={formData.prenom}
                onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                placeholder="Jean"
              />
            </div>
            <div>
              <Label>Nom</Label>
              <Input
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                placeholder="Dupont"
              />
            </div>
            <div className="col-span-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="jean.dupont@example.com"
                disabled={userDialog.mode === 'edit'}
              />
            </div>
            {userDialog.mode === 'create' && (
              <div className="col-span-2">
                <Label>Mot de passe</Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
            )}
            <div className="col-span-2">
              <Label>Rôle</Label>
              <Select
                value={formData.role_id}
                onValueChange={(value) => setFormData({ ...formData, role_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  {roles?.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Client</Label>
              <Select
                value={formData.client_id}
                onValueChange={(value) => setFormData({ ...formData, client_id: value, site_id: "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  {clients?.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.nom_legal}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Site</Label>
              <Select
                value={formData.site_id}
                onValueChange={(value) => setFormData({ ...formData, site_id: value })}
                disabled={!formData.client_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un site" />
                </SelectTrigger>
                <SelectContent>
                  {sites?.map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.nom_site}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fonction</Label>
              <Input
                value={formData.fonction}
                onChange={(e) => setFormData({ ...formData, fonction: e.target.value })}
                placeholder="Responsable HSE"
              />
            </div>
            <div>
              <Label>Téléphone</Label>
              <Input
                value={formData.telephone}
                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                placeholder="+216 XX XXX XXX"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUserDialog({ ...userDialog, open: false })}>
              Annuler
            </Button>
            <Button onClick={handleSubmit}>
              {userDialog.mode === 'create' ? 'Créer' : 'Modifier'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}





