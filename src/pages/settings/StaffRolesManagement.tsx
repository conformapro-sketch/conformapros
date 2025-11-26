import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { staffRolesQueries, type StaffRole } from "@/lib/staff-roles-queries";
import { Plus, Edit, Trash2, Shield } from "lucide-react";
import { StaffRoleFormModal } from "@/components/staff/StaffRoleFormModal";

export default function StaffRolesManagement() {
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<StaffRole | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: staffRoles, isLoading } = useQuery({
    queryKey: ["staff-roles"],
    queryFn: staffRolesQueries.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: staffRolesQueries.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-roles"] });
      toast({ description: "Rôle supprimé avec succès" });
      setRoleToDelete(null);
    },
    onError: () => {
      toast({ variant: "destructive", description: "Erreur lors de la suppression du rôle" });
    },
  });

  const handleCreate = () => {
    setSelectedRole(null);
    setShowFormModal(true);
  };

  const handleEdit = (role: StaffRole) => {
    setSelectedRole(role);
    setShowFormModal(true);
  };

  const handleDeleteClick = (id: string) => {
    setRoleToDelete(id);
  };

  const handleDeleteConfirm = () => {
    if (roleToDelete) {
      deleteMutation.mutate(roleToDelete);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rôles Staff</h1>
          <p className="text-muted-foreground mt-1">
            Gestion des rôles de l'équipe ConformaPro
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau rôle
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rôle</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staffRoles?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  Aucun rôle défini
                </TableCell>
              </TableRow>
            ) : (
              staffRoles?.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      {role.nom_role}
                    </div>
                  </TableCell>
                  <TableCell>{role.description || "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(role)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(role.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <StaffRoleFormModal
        open={showFormModal}
        onOpenChange={setShowFormModal}
        role={selectedRole}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["staff-roles"] });
          setShowFormModal(false);
        }}
      />

      <AlertDialog open={!!roleToDelete} onOpenChange={() => setRoleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce rôle ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
