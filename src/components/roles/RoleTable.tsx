import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { MoreHorizontal, Edit, Copy, Archive, Trash2, Users, ArchiveRestore } from "lucide-react";
import { rolesQueries } from "@/lib/roles-queries";
import { toast } from "sonner";
import type { Role } from "@/types/roles";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface RoleTableProps {
  roles: Role[];
  isLoading: boolean;
  onEdit: (role: Role) => void;
  type: 'team' | 'client';
}

export function RoleTable({ roles, isLoading, onEdit, type }: RoleTableProps) {
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

  const archiveMutation = useMutation({
    mutationFn: rolesQueries.archive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles', type] });
      toast.success("Rôle archivé avec succès");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de l'archivage du rôle");
    },
  });

  const restoreMutation = useMutation({
    mutationFn: rolesQueries.restore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles', type] });
      toast.success("Rôle restauré avec succès");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de la restauration du rôle");
    },
  });

  const cloneMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      rolesQueries.clone(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles', type] });
      toast.success("Rôle cloné avec succès");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors du clonage du rôle");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: rolesQueries.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles', type] });
      toast.success("Rôle supprimé avec succès");
      setDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de la suppression du rôle");
    },
  });

  const handleClone = (role: Role) => {
    const newName = `${role.name} (Copie)`;
    cloneMutation.mutate({ id: role.id, name: newName });
  };

  const handleArchive = (role: Role) => {
    if (role.archived_at) {
      restoreMutation.mutate(role.id);
    } else {
      archiveMutation.mutate(role.id);
    }
  };

  const handleDeleteClick = (role: Role) => {
    setRoleToDelete(role);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (roleToDelete) {
      deleteMutation.mutate(roleToDelete.id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!roles || roles.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
        <p>Aucun rôle trouvé</p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Utilisateurs</TableHead>
            <TableHead>Dernière MAJ</TableHead>
            <TableHead className="w-20"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles.map((role) => (
            <TableRow key={role.id} className={role.archived_at ? 'opacity-50' : ''}>
              <TableCell className="font-medium">
                {role.name}
                {role.is_system && (
                  <Badge variant="secondary" className="ml-2">
                    Système
                  </Badge>
                )}
                {role.archived_at && (
                  <Badge variant="outline" className="ml-2">
                    Archivé
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {role.description || '-'}
              </TableCell>
              <TableCell>
                <Badge variant={role.type === 'team' ? 'default' : 'secondary'}>
                  {role.type === 'team' ? 'Équipe' : 'Client'}
                </Badge>
              </TableCell>
              <TableCell>{role.user_count || 0}</TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {formatDistanceToNow(new Date(role.updated_at), {
                  addSuffix: true,
                  locale: fr,
                })}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(role)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Modifier
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleClone(role)}>
                      <Copy className="mr-2 h-4 w-4" />
                      Cloner
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleArchive(role)}>
                      {role.archived_at ? (
                        <>
                          <ArchiveRestore className="mr-2 h-4 w-4" />
                          Restaurer
                        </>
                      ) : (
                        <>
                          <Archive className="mr-2 h-4 w-4" />
                          Archiver
                        </>
                      )}
                    </DropdownMenuItem>
                    {!role.is_system && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(role)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le rôle "{roleToDelete?.name}" ?
              Cette action est irréversible et ne peut être effectuée que si aucun
              utilisateur n'est assigné à ce rôle.
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
    </>
  );
}
