import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { staffRolesQueries, type StaffRole } from "@/lib/staff-roles-queries";
import { staffUsersQueries } from "@/lib/staff-users-queries";
import { useStaffPermission, STAFF_PERMISSIONS } from "@/lib/staff-permission-middleware";
import { Plus, Edit, Trash2, Shield, ShieldAlert, Users } from "lucide-react";
import { StaffRoleFormModal } from "@/components/staff/StaffRoleFormModal";

export default function StaffRolesManagement() {
  const navigate = useNavigate();
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<StaffRole | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Permission check
  const { authorized, loading: permissionLoading } = useStaffPermission(STAFF_PERMISSIONS.MANAGE_STAFF);

  useEffect(() => {
    if (!permissionLoading && !authorized) {
      toast({ 
        variant: "destructive", 
        title: "Accès refusé",
        description: "Vous n'avez pas la permission d'accéder à cette page" 
      });
      navigate("/dashboard");
    }
  }, [authorized, permissionLoading, navigate, toast]);

  const { data: staffRoles, isLoading } = useQuery({
    queryKey: ["staff-roles"],
    queryFn: staffRolesQueries.getAll,
    enabled: authorized,
  });

  const { data: staffUsers = [] } = useQuery({
    queryKey: ["staff-users"],
    queryFn: staffUsersQueries.getAll,
    enabled: authorized,
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

  // Count users per role
  const getUserCountForRole = (roleId: string) => {
    return staffUsers.filter(user => user.role_id === roleId).length;
  };

  if (permissionLoading || isLoading) {
    return (
      <div className="container mx-auto py-8 space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>
            Vous n'avez pas la permission d'accéder à cette page. Contactez votre administrateur.
          </AlertDescription>
        </Alert>
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
              <TableHead className="text-center">Utilisateurs</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staffRoles?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Aucun rôle défini
                </TableCell>
              </TableRow>
            ) : (
              staffRoles?.map((role) => {
                const userCount = getUserCountForRole(role.id);
                return (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        {role.nom_role}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md">
                      {role.description || "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <Badge variant="secondary">{userCount}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEdit(role)}
                          title="Éditer le rôle et ses permissions"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(role.id)}
                          disabled={userCount > 0}
                          title={userCount > 0 ? "Impossible de supprimer un rôle ayant des utilisateurs" : "Supprimer le rôle"}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
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
