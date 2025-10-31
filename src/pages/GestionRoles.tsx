import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { rolesQueries } from "@/lib/roles-queries";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Shield, Copy } from "lucide-react";
import {
  MODULES,
  ACTIONS,
  MODULE_LABELS,
  ACTION_LABELS,
  type Role,
  type RolePermission,
} from "@/types/roles";

interface PermissionState {
  module: string;
  action: string;
  decision: 'allow' | 'deny' | 'inherit';
  scope: 'global' | 'tenant' | 'site';
}

export default function GestionRoles() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [roleType, setRoleType] = useState<'team' | 'client'>('team');
  const [roleDialog, setRoleDialog] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    roleId?: string;
  }>({ open: false, mode: 'create' });

  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    type: 'team' | 'client';
    permissions: PermissionState[];
  }>({
    name: "",
    description: "",
    type: 'team',
    permissions: [],
  });

  // Fetch roles by type
  const { data: roles, isLoading } = useQuery({
    queryKey: ["roles", roleType],
    queryFn: () => rolesQueries.getByType(roleType),
  });

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const role = await rolesQueries.create({
        type: data.type,
        name: data.name,
        description: data.description,
      });
      
      if (data.permissions.length > 0) {
        await rolesQueries.updatePermissions(role.id, data.permissions);
      }
      
      return role;
    },
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
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      await rolesQueries.update(id, {
        name: data.name,
        description: data.description,
      });
      
      await rolesQueries.updatePermissions(id, data.permissions);
    },
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
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer le rôle.",
        variant: "destructive",
      });
    },
  });

  const handleOpenDialog = async (mode: 'create' | 'edit', roleId?: string) => {
    if (mode === 'edit' && roleId) {
      const role = await rolesQueries.getById(roleId);
      if (role) {
        setFormData({
          name: role.name,
          description: role.description || "",
          type: role.type,
          permissions: (role.role_permissions || []).map(p => ({
            module: p.module,
            action: p.action,
            decision: p.decision,
            scope: p.scope,
          })),
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
      type: roleType,
      permissions: [],
    });
  };

  const togglePermission = (module: string, action: string) => {
    setFormData((prev) => {
      const existing = prev.permissions.find(
        p => p.module === module && p.action === action
      );
      
      if (existing) {
        // Remove permission
        return {
          ...prev,
          permissions: prev.permissions.filter(
            p => !(p.module === module && p.action === action)
          ),
        };
      } else {
        // Add permission
        return {
          ...prev,
          permissions: [
            ...prev.permissions,
            { module, action, decision: 'allow' as const, scope: 'tenant' as const },
          ],
        };
      }
    });
  };

  const hasPermission = (module: string, action: string) => {
    return formData.permissions.some(
      p => p.module === module && p.action === action
    );
  };

  const countPermissions = (permissions?: RolePermission[]) => {
    return permissions?.length || 0;
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
        <div className="flex gap-2">
          <Select value={roleType} onValueChange={(v: 'team' | 'client') => setRoleType(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="team">Équipe Interne</SelectItem>
              <SelectItem value="client">Clients</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => handleOpenDialog('create')}>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau rôle
          </Button>
        </div>
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
                  <TableHead>Type</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Utilisateurs</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : roles?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
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
                          {role.is_system && (
                            <Badge variant="outline" className="text-xs">Système</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {role.description || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {role.type === 'team' ? 'Équipe' : 'Client'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {countPermissions(role.role_permissions)} permissions
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {role.user_count || 0} utilisateurs
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenDialog('edit', role.id)}
                          disabled={role.is_system}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteRoleMutation.mutate(role.id)}
                          disabled={role.is_system}
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nom du rôle</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Responsable HSE"
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v: 'team' | 'client') => setFormData({ ...formData, type: v })}
                  disabled={roleDialog.mode === 'edit'}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="team">Équipe Interne</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                  <Card key={module}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{MODULE_LABELS[module]}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 gap-4">
                        {ACTIONS.map((action) => (
                          <div key={action} className="flex items-center space-x-2">
                            <Checkbox
                              id={`${module}-${action}`}
                              checked={hasPermission(module, action)}
                              onCheckedChange={() => togglePermission(module, action)}
                            />
                            <Label
                              htmlFor={`${module}-${action}`}
                              className="cursor-pointer text-sm"
                            >
                              {ACTION_LABELS[action]}
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
            <Button onClick={handleSubmit} disabled={!formData.name.trim()}>
              {roleDialog.mode === 'create' ? 'Créer' : 'Modifier'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
