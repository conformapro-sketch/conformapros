import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchSubscriptions,
  fetchPlans,
  changeSubscriptionStatus,
} from "@/lib/multi-tenant-queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SubscriptionFormDrawer, SubscriptionWithRelations } from "@/components/SubscriptionFormDrawer";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Edit,
  FileDown,
  FileText,
  PauseCircle,
  PlayCircle,
  Plus,
  Search,
  XCircle,
} from "lucide-react";
import type { Database } from "@/types/db";

const BILLING_MANAGER_ROLES = ["super_admin", "admin_global", "billing_manager"];

type SubscriptionStatus = Database["public"]["Enums"]["subscription_status"];

type SubscriptionListItem = Awaited<ReturnType<typeof fetchSubscriptions>> extends (infer T)[] ? T : never;

type PlanRow = Awaited<ReturnType<typeof fetchPlans>> extends (infer T)[] ? T : never;

const statusLabels: Record<SubscriptionStatus, string> = {
  active: "Actif",
  paused: "Suspendu",
  canceled: "Annule",
};

const statusVariants: Record<SubscriptionStatus, "outline" | "secondary" | "default"> = {
  active: "default",
  paused: "secondary",
  canceled: "outline",
};

export default function Abonnement() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { userRoles, userRole } = useAuth();

  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [scopeFilter, setScopeFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<SubscriptionWithRelations | null>(null);

  const canManage = useMemo(() => {
    const effectiveRoles = userRoles.length > 0 ? userRoles : userRole ? [userRole] : [];
    return effectiveRoles.some((role) => BILLING_MANAGER_ROLES.includes(role));
  }, [userRoles, userRole]);

  const { data: plans = [] } = useQuery<PlanRow[]>({
    queryKey: ["plans"],
    queryFn: fetchPlans,
  });

  const {
    data: subscriptions = [],
    isLoading,
  } = useQuery<SubscriptionListItem[]>({
    queryKey: ["subscriptions", search, planFilter, statusFilter, scopeFilter],
    queryFn: () =>
      fetchSubscriptions({
        status: statusFilter !== "all" ? (statusFilter as SubscriptionStatus) : undefined,
        scope: scopeFilter !== "all" ? (scopeFilter as Database["public"]["Enums"]["subscription_scope"]) : undefined,
      }),
  });

  const changeStatusMutation = useMutation({
    mutationFn: ({ subscriptionId, status }: { subscriptionId: string; status: SubscriptionStatus }) =>
      changeSubscriptionStatus(subscriptionId, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      toast({
        title: "Statut mis a jour",
        description: `L'abonnement a ete ${statusLabels[variables.status].toLowerCase()} avec succes.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error?.message ?? "Impossible de mettre a jour le statut.",
        variant: "destructive",
      });
    },
  });

  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((subscription) => {
      const haystack = [
        subscription.clients?.nom_legal,
        subscription.clients?.name,
        subscription.sites?.nom_site,
        subscription.plans?.label,
        subscription.plans?.code,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = haystack.includes(search.trim().toLowerCase());
      const matchesPlan = planFilter === "all" || subscription.plan_id === planFilter;
      const matchesStatus = statusFilter === "all" || subscription.status === statusFilter;
      const matchesScope = scopeFilter === "all" || subscription.scope === scopeFilter;

      return matchesSearch && matchesPlan && matchesStatus && matchesScope;
    });
  }, [subscriptions, search, planFilter, statusFilter, scopeFilter]);

  const activeCount = subscriptions.filter((subscription) => subscription.status === "active").length;
  const pausedCount = subscriptions.filter((subscription) => subscription.status === "paused").length;
  const canceledCount = subscriptions.filter((subscription) => subscription.status === "canceled").length;

  const handleOpenForm = (subscription: SubscriptionWithRelations | null = null) => {
    setSelectedSubscription(subscription);
    setFormOpen(true);
  };

  const handleCloseForm = (open: boolean) => {
    setFormOpen(open);
    if (!open) {
      setSelectedSubscription(null);
    }
  };

  const handleStatusChange = (subscription: SubscriptionWithRelations, status: SubscriptionStatus) => {
    changeStatusMutation.mutate({ subscriptionId: subscription.id, status });
  };

  const handleExportCsv = () => {
    if (filteredSubscriptions.length === 0) {
      toast({
        title: "Export CSV",
        description: "Aucune donnee a exporter avec les filtres actuels.",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      "Client",
      "Portee",
      "Site",
      "Plan",
      "Statut",
      "Debut",
      "Fin",
      "Prochaine echeance",
      "Tarif",
    ];

    const rows = filteredSubscriptions.map((subscription) => {
      const price = subscription.price_override ?? subscription.plans?.base_price ?? 0;
      const currency = subscription.currency ?? subscription.clients?.currency ?? "TND";
      return [
        subscription.clients?.nom_legal ?? subscription.clients?.name ?? "",
        subscription.scope,
        subscription.sites?.nom_site ?? "",
        subscription.plans?.label ?? "",
        statusLabels[subscription.status],
        subscription.start_date ?? "",
        subscription.end_date ?? "",
        subscription.next_billing_date ?? "",
        `${price.toFixed(2)} ${currency}`,
      ].join(";");
    });

    const csvContent = [headers.join(";"), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `abonnements_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = () => {
    if (filteredSubscriptions.length === 0) {
      toast({
        title: "Export PDF",
        description: "Aucune donnee a exporter avec les filtres actuels.",
        variant: "destructive",
      });
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({
        title: "Export PDF",
        description: "Impossible d'ouvrir la fenetre d'impression.",
        variant: "destructive",
      });
      return;
    }

    const tableRows = filteredSubscriptions
      .map((subscription) => {
        const price = subscription.price_override ?? subscription.plans?.base_price ?? 0;
        const currency = subscription.currency ?? subscription.clients?.currency ?? "TND";
        return `<tr>
            <td>${subscription.clients?.nom_legal ?? subscription.clients?.name ?? ""}</td>
            <td>${subscription.scope}</td>
            <td>${subscription.sites?.nom_site ?? "-"}</td>
            <td>${subscription.plans?.label ?? ""}</td>
            <td>${statusLabels[subscription.status]}</td>
            <td>${subscription.start_date ?? ""}</td>
            <td>${subscription.end_date ?? ""}</td>
            <td>${subscription.next_billing_date ?? ""}</td>
            <td>${price.toFixed(2)} ${currency}</td>
          </tr>`;
      })
      .join("");

    printWindow.document.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Export abonnements</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 24px; }
    h1 { font-size: 20px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; }
    th { background-color: #f7f7f7; text-align: left; }
  </style>
</head>
<body>
  <h1>Abonnements (${new Date().toLocaleDateString()})</h1>
  <table>
    <thead>
      <tr>
        <th>Client</th>
        <th>Porte</th>
        <th>Site</th>
        <th>Plan</th>
        <th>Statut</th>
        <th>Debut</th>
        <th>Fin</th>
        <th>Prochaine echeance</th>
        <th>Tarif</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>
</body>
</html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestion des abonnements</h1>
          <p className="text-muted-foreground">Suivez les plans attribues a vos clients et sites.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleExportCsv} className="flex items-center gap-2">
            <FileDown className="h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={handleExportPdf} className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Export PDF
          </Button>
          {canManage && (
            <Button onClick={() => handleOpenForm(null)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nouvel abonnement
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Abonnements actifs</CardTitle>
            <CardDescription className="text-3xl font-semibold text-foreground">{activeCount}</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Suspendus</CardTitle>
            <CardDescription className="text-3xl font-semibold text-foreground">{pausedCount}</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Annules</CardTitle>
            <CardDescription className="text-3xl font-semibold text-foreground">{canceledCount}</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card className="shadow-soft">
        <CardHeader className="pb-4">
          <CardTitle>Liste des abonnements</CardTitle>
          <CardDescription>
            Filtrez les abonnements par plan, statut ou portee.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un client, un site ou un plan..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="min-w-[160px]">
                  <SelectValue placeholder="Filtrer par plan" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border">
                  <SelectItem value="all">Tous les plans</SelectItem>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="min-w-[160px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border">
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="paused">Suspendu</SelectItem>
                  <SelectItem value="canceled">Annule</SelectItem>
                </SelectContent>
              </Select>

              <Select value={scopeFilter} onValueChange={setScopeFilter}>
                <SelectTrigger className="min-w-[160px]">
                  <SelectValue placeholder="Portee" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border">
                  <SelectItem value="all">Toutes les portees</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="site">Site</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Portee</TableHead>
                  <TableHead className="hidden lg:table-cell">Calendrier</TableHead>
                  <TableHead className="hidden lg:table-cell">Tarif</TableHead>
                  <TableHead>Statut</TableHead>
                  {canManage && <TableHead className="w-[160px]">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {!isLoading && filteredSubscriptions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={canManage ? 7 : 6} className="py-10 text-center text-sm text-muted-foreground">
                      Aucun abonnement ne correspond aux filtres.
                    </TableCell>
                  </TableRow>
                )}

                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={canManage ? 7 : 6} className="py-10 text-center text-sm text-muted-foreground">
                      Chargement des abonnements...
                    </TableCell>
                  </TableRow>
                )}

                {filteredSubscriptions.map((subscription) => {
                  const price = subscription.price_override ?? subscription.plans?.base_price ?? 0;
                  const currency = subscription.currency ?? subscription.clients?.currency ?? "TND";

                  return (
                    <TableRow key={subscription.id} className="align-top">
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">{subscription.plans?.label ?? "Plan inconnu"}</p>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">
                            {subscription.plans?.code}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {subscription.plans?.periodicity ?? ""}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">
                            {subscription.clients?.nom_legal ?? subscription.clients?.name ?? "Client"}
                          </p>
                          {subscription.clients?.matricule_fiscale && (
                            <p className="text-xs text-muted-foreground">
                              Matricule: {subscription.clients.matricule_fiscale}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge variant="secondary" className="text-xs">
                            {subscription.scope === "client" ? "Client" : "Site"}
                          </Badge>
                          {subscription.scope === "site" ? (
                            <p className="text-sm text-muted-foreground">
                              {subscription.sites?.nom_site ?? "Site"}
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground">Portee globale client</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p>Debut: {subscription.start_date ?? "-"}</p>
                          <p>Fin: {subscription.end_date ?? "-"}</p>
                          <p>Echeance: {subscription.next_billing_date ?? "-"}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="space-y-1 text-sm text-foreground">
                          <p>{price.toFixed(2)} {currency}</p>
                          {subscription.price_override && (
                            <p className="text-xs text-muted-foreground">Tarif personnalise</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariants[subscription.status]}>
                          {statusLabels[subscription.status]}
                        </Badge>
                      </TableCell>
                      {canManage && (
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleOpenForm(subscription)}
                              title="Modifier"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {subscription.status === "active" && (
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleStatusChange(subscription, "paused")}
                                title="Suspendre"
                                disabled={changeStatusMutation.isPending}
                              >
                                <PauseCircle className="h-4 w-4" />
                              </Button>
                            )}
                            {subscription.status === "paused" && (
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleStatusChange(subscription, "active")}
                                title="Reprendre"
                                disabled={changeStatusMutation.isPending}
                              >
                                <PlayCircle className="h-4 w-4" />
                              </Button>
                            )}
                            {subscription.status !== "canceled" && (
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleStatusChange(subscription, "canceled")}
                                title="Annuler"
                                disabled={changeStatusMutation.isPending}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <SubscriptionFormDrawer
        open={formOpen}
        onOpenChange={handleCloseForm}
        subscription={selectedSubscription}
      />
    </div>
  );
}
