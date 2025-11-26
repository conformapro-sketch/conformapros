import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { staffUsersQueries } from '@/lib/staff-users-queries';
import { StaffUserFormModal } from '@/components/staff/StaffUserFormModal';
import { UserTableSkeleton } from '@/components/UserTableSkeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function StaffMemberManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  const { data: staffUsers, isLoading, error, refetch } = useQuery({
    queryKey: ['staff-users'],
    queryFn: () => staffUsersQueries.getAll(),
  });

  const handleCreate = () => {
    setSelectedUser(null);
    setIsFormOpen(true);
  };

  const handleEdit = (user: any) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (userId: string) => {
    setDeleteUserId(userId);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteUserId) return;

    try {
      await staffUsersQueries.delete(deleteUserId);
      toast.success('Utilisateur staff supprimé');
      refetch();
    } catch (err: any) {
      toast.error('Erreur lors de la suppression', {
        description: err.message,
      });
    } finally {
      setDeleteUserId(null);
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      await staffUsersQueries.toggleActive(userId, !currentStatus);
      toast.success(currentStatus ? 'Utilisateur désactivé' : 'Utilisateur activé');
      refetch();
    } catch (err: any) {
      toast.error('Erreur lors de la modification du statut', {
        description: err.message,
      });
    }
  };

  const handleResetPassword = async (email: string) => {
    try {
      await staffUsersQueries.resetPassword(email);
      toast.success('Email de réinitialisation envoyé');
    } catch (err: any) {
      toast.error('Erreur lors de l\'envoi', {
        description: err.message,
      });
    }
  };

  const handleSuccess = () => {
    refetch();
  };

  const filteredUsers = staffUsers?.filter((user) => {
    const search = searchTerm.toLowerCase();
    return (
      user.nom?.toLowerCase().includes(search) ||
      user.prenom?.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search) ||
      user.role?.nom_role?.toLowerCase().includes(search)
    );
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestion du personnel ConformaPro</h1>
            <p className="text-muted-foreground mt-2">
              Gérez les comptes des employés internes
            </p>
          </div>
        </div>
        <UserTableSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erreur lors du chargement des utilisateurs: {(error as Error).message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion du personnel ConformaPro</h1>
          <p className="text-muted-foreground mt-2">
            Gérez les comptes des employés internes
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvel utilisateur
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Input
          placeholder="Rechercher par nom, email ou rôle..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-lg border bg-card">
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
                    <Badge variant="outline">
                      {user.role?.nom_role || 'Sans rôle'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.actif ? 'default' : 'secondary'}>
                      {user.actif ? 'Actif' : 'Inactif'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(user)}
                    >
                      Modifier
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(user.id, user.actif)}
                    >
                      {user.actif ? 'Désactiver' : 'Activer'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleResetPassword(user.email)}
                    >
                      Réinit. MDP
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(user.id)}
                    >
                      Supprimer
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <StaffUserFormModal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        user={selectedUser}
        onSuccess={handleSuccess}
      />

      <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cet utilisateur staff ? Cette action est irréversible.
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
