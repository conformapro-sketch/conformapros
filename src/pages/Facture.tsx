import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchInvoices,
  updateInvoiceStatus,
  recordPayment,
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
import { InvoiceFormDrawer } from "@/components/InvoiceFormDrawer";
import { InvoiceDetailDrawer } from "@/components/InvoiceDetailDrawer";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  CheckCircle2,
  Eye,
  FileDown,
  FileText,
  Mail,
  Plus,
  Search,
} from "lucide-react";
import type { Database } from "@/types/db";

const BILLING_MANAGER_ROLES = ["super_admin", "admin_global", "billing_manager"];

type InvoiceStatus = Database["public"]["Enums"]["invoice_status"];
type InvoiceListItem = Awaited<ReturnType<typeof fetchInvoices>> extends (infer T)[] ? T : never;

type PaymentPayload = {
  amount: number;
  paid_at: string;
  method: string;
  reference?: string | null;
  notes?: string | null;
};

const statusLabels: Record<InvoiceStatus, string> = {
  draft: "Brouillon",
  sent: "Envoyee",
  paid: "Payee",
  overdue: "En retard",
  canceled: "Annulee",
};

const statusVariants: Record<InvoiceStatus, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "secondary",
  sent: "default",
  paid: "outline",
  overdue: "destructive",
  canceled: "secondary",
};

export default function Facture() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { userRoles, userRole } = useAuth();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [scopeFilter, setScopeFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceListItem | null>(null);

  const canManage = useMemo(() => {
    const effectiveRoles = userRoles.length > 0 ? userRoles : userRole ? [userRole] : [];
    return effectiveRoles.some((role) => BILLING_MANAGER_ROLES.includes(role));
  }, [userRoles, userRole]);

  const {
    data: invoices = [],
    isLoading,
  } = useQuery<InvoiceListItem[]>({
    queryKey: ["invoices", statusFilter, scopeFilter],
    queryFn: () =>
      fetchInvoices({
        status: statusFilter !== "all" ? (statusFilter as InvoiceStatus) : undefined,
      }),
  });

  useEffect(() => {
    if (selectedInvoice) {
      const fresh = invoices.find((invoice) => invoice.id === selectedInvoice.id);
      if (fresh) {
        setSelectedInvoice(fresh);
      }
    }
  }, [invoices, selectedInvoice?.id]);

  const statusMutation = useMutation({
    mutationFn: ({ invoiceId, status }: { invoiceId: string; status: InvoiceStatus }) =>
      updateInvoiceStatus(invoiceId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error?.message ?? "Impossible de mettre a jour la facture.",
        variant: "destructive",
      });
    },
  });

  const paymentMutation = useMutation({
    mutationFn: ({ invoiceId, payload }: { invoiceId: string; payload: PaymentPayload }) =>
      recordPayment({
        invoice_id: invoiceId,
        amount: payload.amount,
        paid_at: payload.paid_at,
        method: payload.method,
        reference: payload.reference ?? null,
        notes: payload.notes ?? null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error?.message ?? "Impossible d'enregistrer le paiement.",
        variant: "destructive",
      });
    },
  });

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const haystack = [
        invoice.invoice_no,
        invoice.clients?.nom_legal,
        invoice.clients?.name,
        invoice.sites?.nom_site,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = haystack.includes(search.trim().toLowerCase());
      const matchesScope =
        scopeFilter === "all" ||
        (scopeFilter === "client" && !invoice.site_id) ||
        (scopeFilter === "site" && Boolean(invoice.site_id));

      return matchesSearch && matchesScope;
    });
  }, [invoices, search, scopeFilter]);

  const totals = useMemo(() => {
    const totalHt = filteredInvoices.reduce((acc, invoice) => acc + Number(invoice.total_ht ?? 0), 0);
    const totalTtc = filteredInvoices.reduce((acc, invoice) => acc + Number(invoice.total_ttc ?? 0), 0);
    const totalPaid = filteredInvoices.reduce((acc, invoice) => {
      const paid = invoice.payments?.reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0) ?? 0;
      return acc + paid;
    }, 0);
    const totalOutstanding = totalTtc - totalPaid;
    return { totalHt, totalTtc, totalPaid, totalOutstanding };
  }, [filteredInvoices]);


  const handleOpenForm = () => {
    setFormOpen(true);
  };

  const handleOpenDetails = (invoice: InvoiceListItem) => {
    setSelectedInvoice(invoice);
    setDetailOpen(true);
  };

  const handleCloseDetails = (open: boolean) => {
    setDetailOpen(open);
    if (!open) {
      setSelectedInvoice(null);
    }
  };

  const handleStatusChange = async (invoiceId: string, status: InvoiceStatus) => {
    await statusMutation.mutateAsync({ invoiceId, status });
  };

  const handleRecordPayment = async (invoiceId: string, values: PaymentPayload) => {
    await paymentMutation.mutateAsync({ invoiceId, payload: values });
  };

  const handleExportCsv = () => {
    if (filteredInvoices.length === 0) {
      toast({
        title: "Export CSV",
        description: "Aucune facture ne correspond aux filtres.",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      "Numero",
      "Client",
      "Site",
      "Date",
      "Echeance",
      "Statut",
      "Total HT",
      "Total TTC",
      "Montant regle",
    ];

    const rows = filteredInvoices.map((invoice) => {
      const paid = invoice.payments?.reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0) ?? 0;
      return [
        invoice.invoice_no,
        invoice.clients?.nom_legal ?? invoice.clients?.name ?? "",
        invoice.sites?.nom_site ?? "",
        invoice.invoice_date ?? "",
        invoice.due_date ?? "",
        statusLabels[invoice.status],
        Number(invoice.total_ht ?? 0).toFixed(2),
        Number(invoice.total_ttc ?? 0).toFixed(2),
        paid.toFixed(2),
      ].join(";");
    });

    const csvContent = [headers.join(";"), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `factures_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = () => {
    if (filteredInvoices.length === 0) {
      toast({
        title: "Export PDF",
        description: "Aucune facture ne correspond aux filtres.",
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

    const rows = filteredInvoices
      .map(
        (invoice) => `<tr>
          <td>${invoice.invoice_no}</td>
          <td>${invoice.clients?.nom_legal ?? invoice.clients?.name ?? ""}</td>
          <td>${invoice.sites?.nom_site ?? "-"}</td>
          <td>${invoice.invoice_date ?? ""}</td>
          <td>${invoice.due_date ?? ""}</td>
          <td>${statusLabels[invoice.status]}</td>
          <td>${Number(invoice.total_ht ?? 0).toFixed(2)}</td>
          <td>${Number(invoice.total_ttc ?? 0).toFixed(2)}</td>
        </tr>`,
      )
      .join("");

    printWindow.document.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Export factures</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 24px; }
    h1 { font-size: 20px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; }
    th { background-color: #f7f7f7; text-align: left; }
  </style>
</head>
<body>
  <h1>Factures (${new Date().toLocaleDateString()})</h1>
  <table>
    <thead>
      <tr>
        <th>Numero</th>
        <th>Client</th>
        <th>Site</th>
        <th>Date</th>
        <th>Echeance</th>
        <th>Statut</th>
        <th>Total HT</th>
        <th>Total TTC</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
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
          <h1 className="text-2xl font-bold tracking-tight">Gestion des factures</h1>
          <p className="text-muted-foreground">Suivez la facturation par client ou par site et l'etat des paiements.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleExportCsv} className="flex items-center gap-2">
            <FileDown className="h-4 w-4" /> Export CSV
          </Button>
          <Button variant="outline" onClick={handleExportPdf} className="flex items-center gap-2">
            <FileText className="h-4 w-4" /> Export PDF
          </Button>
          {canManage && (
            <Button onClick={handleOpenForm} className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> Nouvelle facture
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total HT</CardTitle>
            <CardDescription className="text-3xl font-semibold text-foreground">
              {totals.totalHt.toFixed(2)}
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total TTC</CardTitle>
            <CardDescription className="text-3xl font-semibold text-foreground">
              {totals.totalTtc.toFixed(2)}
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Regle</CardTitle>
            <CardDescription className="text-3xl font-semibold text-foreground">
              {totals.totalPaid.toFixed(2)}
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Restant du</CardTitle>
            <CardDescription className="text-3xl font-semibold text-foreground">
              {totals.totalOutstanding.toFixed(2)}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card className="shadow-soft">
        <CardHeader className="pb-4">
          <CardTitle>Liste des factures</CardTitle>
          <CardDescription>Filtrez par statut, portee ou recherchez une facture.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par numero, client ou site..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="min-w-[160px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border">
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="sent">Envoyee</SelectItem>
                  <SelectItem value="paid">Payee</SelectItem>
                  <SelectItem value="overdue">En retard</SelectItem>
                  <SelectItem value="canceled">Annulee</SelectItem>
                </SelectContent>
              </Select>

              <Select value={scopeFilter} onValueChange={setScopeFilter}>
                <SelectTrigger className="min-w-[160px]">
                  <SelectValue placeholder="Portee" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border">
                  <SelectItem value="all">Toutes les factures</SelectItem>
                  <SelectItem value="client">Factures client</SelectItem>
                  <SelectItem value="site">Factures site</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numero</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Echeance</TableHead>
                  <TableHead className="hidden lg:table-cell">Montant TTC</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-[180px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!isLoading && filteredInvoices.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                      Aucune facture ne correspond aux filtres en cours.
                    </TableCell>
                  </TableRow>
                )}

                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                      Chargement des factures...
                    </TableCell>
                  </TableRow>
                )}

                {filteredInvoices.map((invoice) => {
                  const paidAmount = invoice.payments?.reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0) ?? 0;
                  const outstanding = Number(invoice.total_ttc ?? 0) - paidAmount;

                  return (
                    <TableRow key={invoice.id} className="align-top">
                      <TableCell className="font-medium text-foreground">
                        <div className="space-y-1">
                          <p>{invoice.invoice_no}</p>
                          <p className="text-xs text-muted-foreground">{invoice.currency}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-foreground">
                          {invoice.clients?.nom_legal ?? invoice.clients?.name ?? "Client"}
                        </p>
                        {invoice.clients?.matricule_fiscale && (
                          <p className="text-xs text-muted-foreground">
                            Matricule: {invoice.clients.matricule_fiscale}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-muted-foreground">
                          {invoice.sites?.nom_site ?? "Facturation client"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{invoice.invoice_date ?? ""}</p>
                        <p className="text-xs text-muted-foreground">Regle: {paidAmount.toFixed(2)}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{invoice.due_date ?? "-"}</p>
                        <p className="text-xs text-muted-foreground">Restant: {Math.max(outstanding, 0).toFixed(2)}</p>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <p className="font-semibold">{Number(invoice.total_ttc ?? 0).toFixed(2)}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariants[invoice.status]}>{statusLabels[invoice.status]}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleOpenDetails(invoice)}
                            title="Consulter"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {canManage && (
                            <>
                              {(invoice.status === "draft" || invoice.status === "sent") && (
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleStatusChange(invoice.id, "sent")}
                                  disabled={statusMutation.isPending}
                                  title="Marquer envoyee"
                                >
                                  <Mail className="h-4 w-4" />
                                </Button>
                              )}
                              {invoice.status !== "paid" && invoice.status !== "canceled" && (
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleStatusChange(invoice.id, "paid")}
                                  disabled={statusMutation.isPending}
                                  title="Marquer payee"
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <InvoiceFormDrawer open={formOpen} onOpenChange={setFormOpen} />

      <InvoiceDetailDrawer
        invoice={selectedInvoice}
        open={detailOpen}
        onOpenChange={handleCloseDetails}
        onStatusChange={handleStatusChange}
        onRecordPayment={async (invoiceId, values) => {
          await handleRecordPayment(invoiceId, values as any);
        }}
        isStatusUpdating={statusMutation.isPending}
        isRecordingPayment={paymentMutation.isPending}
      />
    </div>
  );
}

