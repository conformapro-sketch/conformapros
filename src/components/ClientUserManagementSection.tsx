import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  activateClientUser,
  deactivateClientUser,
  fetchClientUsersPaginated,
  fetchSitesByClient,
  resetClientUserPassword,
  logAudit,
} from "@/lib/multi-tenant-queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientUserFormModal } from "@/components/ClientUserFormModal";
import { useToast } from "@/hooks/use-toast";
import {
  Building2,
  Filter,
  Mail,
  Search,
  Shield,
  UserPlus,
  UserX,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";

const pageSize = 10;

interface ClientUserManagementSectionProps {
  clientId: string;
  clientName?: string;
}

const roleLabels: Record<string, string> = {
  admin_client: "Administrateur",
  gestionnaire_hse: "Gestionnaire HSE",
  chef_site: "Chef de site",
  lecteur: "Lecture seule",
};

const statusOptions = [
  { value: "all", label: "Tous les statuts" },
  { value: "actif", label: "Actifs" },
  { value: "suspendu", label: "Suspendus" },
];

export function ClientUserManagementSection({ clientId, clientName }: ClientUserManagementSectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: currentUser, userRole } = useAuth();

  const canManage = ["admin_global", "admin_client", "gestionnaire_hse"].includes(userRole ?? "");
  const canViewUsers = canManage;

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [siteFilter, setSiteFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const { data: sites = [] } = useQuery({
    queryKey: ["client-sites", clientId],
    queryFn: () => fetchSitesByClient(clientId),
    enabled: !!clientId,
  });

  const {
    data: usersData,
    isLoading,
  } = useQuery({
    queryKey: [
      "client-users",
      clientId,
      {
        search,
        roleFilter,
        siteFilter,
        statusFilter,
        page,
        pageSize,
      },
    ],
    queryFn: () =>
      fetchClientUsersPaginated(clientId, {
        search: search || undefined,
        role: roleFilter !== "all" ? roleFilter : undefined,
        site: siteFilter !== "all" ? siteFilter : undefined,
        status: statusFilter !== "all" ? (statusFilter as any) : undefined,
        page,
        pageSize,
      }),
    enabled: !!clientId && canViewUsers,
  });

  const total = usersData?.count ?? 0;
  const users = usersData?.data ?? [];
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const roleOptions = useMemo(() => {
    const roles = new Set<string>();
    users.forEach((user: any) => {
      user.user_roles?.forEach((ur: any) => {
        if (ur.role) roles.add(ur.role);
      });
    });
    return Array.from(roles);
  }, [users]);

  if (!canViewUsers) {
    return (
      <Card className="shadow-soft">
        <CardContent className="py-12 text-center space-y-3 text-muted-foreground">
          <Shield className="mx-auto h-10 w-10" />
          <p>Vous n'avez pas les autorisations necessaires pour consulter les utilisateurs de ce client.</p>
        </CardContent>
      </Card>
    );
  }

  const resetPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      if (!canManage) throw new Error('Permissions insuffisantes');
      await resetClientUserPassword(email);
    },
    onSuccess: async (_, email) => {
      await logAudit(currentUser?.id ?? null, clientId, "reset_password", { email });
      toast({
        title: "Réinitialisation envoyée",
        description: "Un email de réinitialisation a été envoyé.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error?.message ?? "Impossible d'envoyer la réinitialisation.",
        variant: "destructive",
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ userId, actif }: { userId: string; actif: boolean }) => {
      if (!canManage) throw new Error('Permissions insuffisantes');
      if (actif) {
        await deactivateClientUser(userId);
      } else {
        await activateClientUser(userId);
      }
    },
    onSuccess: async (_, { userId, actif }) => {
      await logAudit(currentUser?.id ?? null, clientId, actif ? "deactivate_user" : "activate_user", {
        userId,
      });
      queryClient.invalidateQueries({ queryKey: ["client-users"] });
      toast({ title: "Statut mis à jour" });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error?.message ?? "Impossible de changer le statut.",
        variant: "destructive",
      });
    },
  });

  function handleResetFilters() {
    setSearch("");
    setRoleFilter("all");
    setSiteFilter("all");
    setStatusFilter("all");
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-soft">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Utilisateurs du client</CardTitle>
            <CardDescription>
              Gérez les accès applicatifs du client {clientName ?? ""}.
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou email"
                className="pl-9"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
            </div>
            <Button
              onClick={() => {
                if (!canManage) return;
                setEditingUser(null);
                setModalOpen(true);
              }}
              disabled={!canManage}>
              <UserPlus className="mr-2 h-4 w-4" />
              Nouvel utilisateur
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 md:grid-cols-4">
            <Select
              value={roleFilter}
              onValueChange={(value) => {
                setRoleFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                {roleOptions.map((role) => (
                  <SelectItem key={role} value={role}>
                    {roleLabels[role] ?? role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={siteFilter}
              onValueChange={(value) => {
                setSiteFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Site" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les sites</SelectItem>
                {sites.map((site: any) => (
                  <SelectItem key={site.id} value={site.id}>
                    {site.nom_site}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              onClick={handleResetFilters}
              className="w-full"
            >
              <Filter className="mr-2 h-4 w-4" />
              Réinitialiser
            </Button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Sites</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      <TableCell colSpan={5}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                      Aucun utilisateur trouvé pour les filtres sélectionnés.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user: any) => {
                    const role = user.user_roles?.[0]?.role;
                    const sitesCount = user.access_scopes?.length ?? 0;
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{user.nom} {user.prenom}</span>
                            <span className="text-sm text-muted-foreground">{user.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {role ? (
                            <Badge variant="secondary">
                              <Shield className="mr-1 h-3 w-3" />
                              {roleLabels[role] ?? role}
                            </Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">Non défini</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {sitesCount} site{sitesCount > 1 ? "s" : ""}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.actif ? (
                            <Badge className="bg-green-500 hover:bg-green-500/90">Actif</Badge>
                          ) : (
                            <Badge variant="outline">Suspendu</Badge>
                          )}
                        </TableCell>
                        <TableCell className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (!canManage) return;
                              setEditingUser(user);
                              setModalOpen(true);
                            }}
                            title="Modifier les acces"
                            disabled={!canManage}
                          >
                            <Shield className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (!canManage) return;
                              toggleStatusMutation.mutate({ userId: user.id, actif: user.actif });
                            }}
                            title={user.actif ? "Suspendre" : "Reactiver"}
                            disabled={!canManage}
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (!canManage) return;
                              resetPasswordMutation.mutate(user.email);
                            }}
                            title="Reinitialiser le mot de passe"
                            disabled={!canManage}
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} sur {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ClientUserFormModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditingUser(null);
        }}
        clientId={clientId}
        user={editingUser}
      />
    </div>
  );
}



