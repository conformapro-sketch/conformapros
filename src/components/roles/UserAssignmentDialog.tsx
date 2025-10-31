import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { rolesQueries } from "@/lib/roles-queries";
import { usersQueries } from "@/lib/users-queries";
import { toast } from "sonner";
import { UserPlus, Trash2, Search } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface UserAssignmentDialogProps {
  roleId: string;
  roleType: 'team' | 'client';
  tenantId?: string;
}

export function UserAssignmentDialog({
  roleId,
  roleType,
  tenantId,
}: UserAssignmentDialogProps) {
  const queryClient = useQueryClient();
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Get users assigned to this role
  const { data: assignedUsers, isLoading: loadingAssigned } = useQuery({
    queryKey: ['role-users', roleId],
    queryFn: () => rolesQueries.getUsersByRole(roleId),
  });

  // Get all available users
  const { data: allUsers } = useQuery({
    queryKey: ['users', 'all'],
    queryFn: () =>
      roleType === 'team'
        ? usersQueries.getConformaTeam()
        : usersQueries.getAll(),
  });

  const assignMutation = useMutation({
    mutationFn: (userIds: string[]) =>
      rolesQueries.assignUsers(roleId, userIds, tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-users', roleId] });
      toast.success("Utilisateurs assignés avec succès");
      setAssignDialogOpen(false);
      setSelectedUsers([]);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors de l'assignation");
    },
  });

  const removeMutation = useMutation({
    mutationFn: (userIds: string[]) =>
      rolesQueries.removeUsers(roleId, userIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-users', roleId] });
      toast.success("Utilisateur retiré avec succès");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erreur lors du retrait");
    },
  });

  const assignedUserIds = assignedUsers?.map(u => u.user_id) || [];
  const availableUsers = allUsers?.filter(u => !assignedUserIds.includes(u.id)) || [];

  const filteredAvailableUsers = availableUsers.filter(user =>
    `${user.nom} ${user.prenom} ${user.email}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const handleAssign = () => {
    if (selectedUsers.length > 0) {
      assignMutation.mutate(selectedUsers);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">
          Utilisateurs assignés ({assignedUsers?.length || 0})
        </h3>

        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <UserPlus className="mr-2 h-4 w-4" />
              Assigner des utilisateurs
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Assigner des utilisateurs au rôle</DialogTitle>
              <DialogDescription>
                Sélectionnez les utilisateurs à assigner à ce rôle
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un utilisateur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="border rounded-lg max-h-96 overflow-y-auto">
                {filteredAvailableUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucun utilisateur disponible
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Nom</TableHead>
                        <TableHead>Email</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAvailableUsers.map(user => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedUsers.includes(user.id)}
                              onCheckedChange={() => toggleUserSelection(user.id)}
                            />
                          </TableCell>
                          <TableCell>
                            {user.nom} {user.prenom}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {user.email}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-muted-foreground">
                  {selectedUsers.length} utilisateur(s) sélectionné(s)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setAssignDialogOpen(false)}
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleAssign}
                    disabled={selectedUsers.length === 0 || assignMutation.isPending}
                  >
                    Assigner
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loadingAssigned ? (
        <div className="text-center py-8 text-muted-foreground">
          Chargement...
        </div>
      ) : assignedUsers && assignedUsers.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignedUsers.map(assignment => {
              const profile = (assignment as any).profiles;
              return (
                <TableRow key={assignment.id}>
                  <TableCell>
                    {profile?.nom} {profile?.prenom}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {profile?.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">Actif</Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMutation.mutate([assignment.user_id])}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-8 text-muted-foreground border rounded-lg">
          Aucun utilisateur assigné à ce rôle
        </div>
      )}
    </div>
  );
}
