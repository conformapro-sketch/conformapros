import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { rolesQueries } from "@/lib/users-queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Shield } from "lucide-react";

const MODULES = [
  { id: 'clients', label: 'Clients' },
  { id: 'sites', label: 'Sites' },
  { id: 'utilisateurs', label: 'Utilisateurs' },
  { id: 'roles', label: 'Rôles' },
  { id: 'veille', label: 'Veille Réglementaire' },
  { id: 'conformite', label: 'Conformité' },
  { id: 'actions', label: 'Actions Correctives' },
  { id: 'incidents', label: 'Incidents' },
  { id: 'controles', label: 'Contrôles Techniques' },
  { id: 'domaines', label: 'Domaines' },
];

const ACTIONS = [
  { id: 'create', label: 'Créer' },
  { id: 'read', label: 'Lire' },
  { id: 'update', label: 'Modifier' },
  { id: 'delete', label: 'Supprimer' },
];

export default function GestionRoles() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [roleDialog, setRoleDialog] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    roleId?: string;
  }>({ open: false, mode: 'create' });

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    permissions: {} as Record<string, string[]>,
  });

  // Fetch roles
  const { data: roles, isLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: rolesQueries.getAll,
  });

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: rolesQueries.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast({
        title: "Rôle créé",
        description: "Le rôle a été créé avec succès.",
      });
      setRoleDialog({ open: false, mode: 'create' });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer le rôle.",
        variant: "destructive",
      });
    },
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      rolesQueries.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast({
        title: "Rôle modifié",
        description: "Le rôle a été modifié avec succès.",
      });
      setRoleDialog({ open: false, mode: 'create' });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de modifier le rôle.",
        variant: "destructive",
      });
    },
  });

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: rolesQueries.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast({
        title: "Rôle supprimé",
        description: "Le rôle a été supprimé avec succès.",
      });
    },
  });

  const handleOpenDialog = async (mode: 'create' | 'edit', roleId?: string) => {
    if (mode === 'edit' && roleId) {
      const role = roles?.find(r => r.id === roleId);
      if (role) {
        setFormData({
          name: role.name,
          description: role.description || "",
          permissions: role.permissions as Record<string, string[]>,
        });
      }
    }
    setRoleDialog({ open: true, mode, roleId });
  };

  const handleSubmit = () => {
    if (roleDialog.mode === 'create') {
      createRoleMutation.mutate(formData);
    } else if (roleDialog.roleId) {
      updateRoleMutation.mutate({ id: roleDialog.roleId, data: formData });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      permissions: {},
    });
  };

  const togglePermission = (moduleId: string, actionId: string) => {
    setFormData((prev) => {
      const modulePermissions = prev.permissions[moduleId] || [];
      const hasPermission = modulePermissions.includes(actionId);
      
      return {
        ...prev,
        permissions: {
          ...prev.permissions,
          [moduleId]: hasPermission
            ? modulePermissions.filter((a) => a !== actionId)
            : [...modulePermissions, actionId],
        },
      };
    });
  };

  const countPermissions = (permissions: Record<string, string[]> | null | undefined) => {
    if (!permissions) return 0;
    return Object.values(permissions).reduce((acc, actions) => acc + actions.length, 0);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion des rôles</h1>
          <p className="text-muted-foreground mt-1">
            Gérez les rôles et leurs permissions
          </p>
        </div>
        <Button onClick={() => handleOpenDialog('create')}>
          <Plus className="w-4 h-4 mr-2" />
          Nouveau rôle
        </Button>
      </div>

      {/* Roles Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : roles?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      Aucun rôle trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  roles?.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-primary" />
                          {role.name}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {role.description || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {countPermissions(role.permissions as Record<string, string[]>)} permissions
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {role.actif ? (
                          <Badge className="bg-success text-success-foreground">Actif</Badge>
                        ) : (
                          <Badge variant="outline">Inactif</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenDialog('edit', role.id)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteRoleMutation.mutate(role.id)}
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

      {/* Role Dialog */}
      <Dialog open={roleDialog.open} onOpenChange={(open) => {
        setRoleDialog({ ...roleDialog, open });
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {roleDialog.mode === 'create' ? 'Créer un rôle' : 'Modifier le rôle'}
            </DialogTitle>
            <DialogDescription>
              Définissez le nom, la description et les permissions du rôle
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Nom du rôle</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Responsable HSE"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Décrivez les responsabilités de ce rôle..."
                rows={3}
              />
            </div>

            <div>
              <Label className="text-lg">Permissions par module</Label>
              <div className="mt-4 space-y-4">
                {MODULES.map((module) => (
                  <Card key={module.id}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{module.label}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 gap-4">
                        {ACTIONS.map((action) => (
                          <div key={action.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`${module.id}-${action.id}`}
                              checked={formData.permissions[module.id]?.includes(action.id)}
                              onCheckedChange={() => togglePermission(module.id, action.id)}
                            />
                            <Label
                              htmlFor={`${module.id}-${action.id}`}
                              className="cursor-pointer"
                            >
                              {action.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialog({ ...roleDialog, open: false })}>
              Annuler
            </Button>
            <Button onClick={handleSubmit}>
              {roleDialog.mode === 'create' ? 'Créer' : 'Modifier'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
