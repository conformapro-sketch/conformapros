import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
import { toast } from "sonner";
import { staffRolesQueries, StaffRole } from "@/lib/staff-roles-queries";
import { StaffRoleFormModal } from "@/components/staff/StaffRoleFormModal";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function StaffRoleManagement() {
  const [selectedRole, setSelectedRole] = useState<StaffRole | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<StaffRole | null>(null);
  const queryClient = useQueryClient();

  const { data: roles, isLoading, error } = useQuery({
    queryKey: ['staff-roles'],
    queryFn: () => staffRolesQueries.getAll()
  });

  const handleCreate = () => {
    setSelectedRole(null);
    setFormOpen(true);
  };

  const handleEdit = (role: StaffRole) => {
    setSelectedRole(role);
    setFormOpen(true);
  };

  const handleDeleteClick = (role: StaffRole) => {
    setRoleToDelete(role);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!roleToDelete) return;

    try {
      await staffRolesQueries.delete(roleToDelete.id);
      toast.success('Rôle supprimé avec succès');
      queryClient.invalidateQueries({ queryKey: ['staff-roles'] });
    } catch (error: any) {
      console.error('Failed to delete role:', error);
      toast.error('Erreur', {
        description: error.message || 'Impossible de supprimer le rôle'
      });
    } finally {
      setDeleteDialogOpen(false);
      setRoleToDelete(null);
    }
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['staff-roles'] });
  };

  const getPermissionCount = (roleId: string) => {
    // This could be enhanced to actually fetch permission counts
    return '—';
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Card className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erreur lors du chargement des rôles: {(error as Error).message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Gestion des rôles Staff
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez les rôles internes ConformaPro et leurs permissions
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Créer un rôle
        </Button>
      </div>

      {/* Roles Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom du rôle</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-center">Permissions</TableHead>
              <TableHead className="text-center">Utilisateurs</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles && roles.length > 0 ? (
              roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>
                    <div className="font-medium">{role.nom_role}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground max-w-md">
                      {role.description || '—'}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">{getPermissionCount(role.id)}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">—</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(role)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(role)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <div className="text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun rôle défini</p>
                    <p className="text-sm mt-2">Créez votre premier rôle pour commencer</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Form Modal */}
      <StaffRoleFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        role={selectedRole}
        onSuccess={handleSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le rôle "{roleToDelete?.nom_role}" ?
              Cette action est irréversible et supprimera toutes les permissions associées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
