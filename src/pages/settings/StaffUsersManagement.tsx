import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { staffUsersQueries, type StaffUserWithRole } from "@/lib/staff-users-queries";
import { Plus, Search, Edit, Power, KeyRound, Trash2 } from "lucide-react";
import { StaffUserFormModal } from "@/components/staff/StaffUserFormModal";

export default function StaffUsersManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<StaffUserWithRole | null>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: staffUsers, isLoading } = useQuery({
    queryKey: ["staff-users"],
    queryFn: staffUsersQueries.getAll,
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, actif }: { id: string; actif: boolean }) =>
      staffUsersQueries.toggleActive(id, actif),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-users"] });
      toast({ description: "Statut mis à jour avec succès" });
    },
    onError: () => {
      toast({ variant: "destructive", description: "Erreur lors de la mise à jour du statut" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: staffUsersQueries.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-users"] });
      toast({ description: "Utilisateur supprimé avec succès" });
      setUserToDelete(null);
    },
    onError: () => {
      toast({ variant: "destructive", description: "Erreur lors de la suppression" });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: staffUsersQueries.resetPassword,
    onSuccess: () => {
      toast({ description: "Email de réinitialisation envoyé avec succès" });
    },
    onError: () => {
      toast({ variant: "destructive", description: "Erreur lors de l'envoi de l'email" });
    },
  });

  const filteredUsers = staffUsers?.filter((user) =>
    [user.nom, user.prenom, user.email].some((field) =>
      field?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleCreate = () => {
    setSelectedUser(null);
    setShowFormModal(true);
  };

  const handleEdit = (user: StaffUserWithRole) => {
    setSelectedUser(user);
    setShowFormModal(true);
  };

  const handleToggleActive = (user: StaffUserWithRole) => {
    toggleActiveMutation.mutate({ id: user.id, actif: !user.actif });
  };

  const handleResetPassword = (email: string) => {
    resetPasswordMutation.mutate(email);
  };

  const handleDeleteClick = (id: string) => {
    setUserToDelete(id);
  };

  const handleDeleteConfirm = () => {
    if (userToDelete) {
      deleteMutation.mutate(userToDelete);
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
          <h1 className="text-3xl font-bold">Utilisateurs Staff</h1>
          <p className="text-muted-foreground mt-1">
            Gestion des membres de l'équipe ConformaPro
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau staff
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un utilisateur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
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
                    <Badge variant="outline">{user.role?.nom_role || "Sans rôle"}</Badge>
                  </TableCell>
                  <TableCell>
                    {user.actif ? (
                      <Badge variant="default" className="bg-green-600">
                        Actif
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Inactif</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(user)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleActive(user)}
                      >
                        <Power className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleResetPassword(user.email)}
                      >
                        <KeyRound className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(user.id)}
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

      <StaffUserFormModal
        open={showFormModal}
        onOpenChange={setShowFormModal}
        user={selectedUser}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["staff-users"] });
          setShowFormModal(false);
        }}
      />

      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.
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
