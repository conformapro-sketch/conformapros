import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Database } from "@/integrations/supabase/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Printer } from "lucide-react";

const paymentSchema = z.object({
  amount: z.coerce.number().positive("Montant obligatoire"),
  paid_at: z.string().min(1, "Date requise"),
  method: z.string().min(1, "Mode requis"),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

type InvoiceStatus = Database["public"]["Enums"]["invoice_status"];
type InvoiceRow = Database["public"]["Tables"]["invoices"]["Row"];
type InvoiceItemRow = Database["public"]["Tables"]["invoice_items"]["Row"];
type PaymentRow = Database["public"]["Tables"]["payments"]["Row"];
type ClientRow = Database["public"]["Tables"]["clients"]["Row"];
type SiteRow = Database["public"]["Tables"]["sites"]["Row"];
type SubscriptionRow = Database["public"]["Tables"]["subscriptions"]["Row"] & {
  plans?: Database["public"]["Tables"]["plans"]["Row"] | null;
};

type InvoiceWithRelations = InvoiceRow & {
  clients: ClientRow;
  sites: SiteRow | null;
  subscriptions: SubscriptionRow | null;
  invoice_items: InvoiceItemRow[];
  payments: PaymentRow[];
};

type InvoiceDetailDrawerProps = {
  invoice: InvoiceWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (invoiceId: string, status: InvoiceStatus) => Promise<void>;
  onRecordPayment: (invoiceId: string, payload: PaymentFormValues) => Promise<void>;
  isStatusUpdating?: boolean;
  isRecordingPayment?: boolean;
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

const paymentMethods = [
  { value: "transfer", label: "Virement" },
  { value: "card", label: "Carte" },
  { value: "cash", label: "Especes" },
  { value: "check", label: "Cheque" },
  { value: "other", label: "Autre" },
];

export function InvoiceDetailDrawer({
  invoice,
  open,
  onOpenChange,
  onStatusChange,
  onRecordPayment,
  isStatusUpdating = false,
  isRecordingPayment = false,
}: InvoiceDetailDrawerProps) {
  const { toast } = useToast();
  const paymentForm = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: 0,
      paid_at: new Date().toISOString().slice(0, 10),
      method: "transfer",
      reference: "",
      notes: "",
    },
  });

  const paymentsTotal = useMemo(() => {
    if (!invoice) return 0;
    return invoice.payments?.reduce((acc, payment) => acc + Number(payment.amount ?? 0), 0);
  }, [invoice]);

  const remainingDue = invoice ? Math.max(invoice.total_ttc - paymentsTotal, 0) : 0;

  useEffect(() => {
    if (invoice && open) {
      paymentForm.reset({
        amount: Number(remainingDue.toFixed(3)),
        paid_at: new Date().toISOString().slice(0, 10),
        method: "transfer",
        reference: "",
        notes: "",
      });
    }
  }, [invoice, open, remainingDue, paymentForm]);

  if (!invoice) {
    return null;
  }

  const handleStatus = async (status: InvoiceStatus) => {
    try {
      await onStatusChange(invoice.id, status);
      toast({
        title: "Statut mis a jour",
        description: `La facture est maintenant ${statusLabels[status].toLowerCase()}.`,
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error?.message ?? "Impossible de mettre a jour la facture.",
        variant: "destructive",
      });
    }
  };

  const submitPayment = async (values: PaymentFormValues) => {
    try {
      await onRecordPayment(invoice.id, values);
      toast({
        title: "Paiement enregistre",
        description: "Le paiement a ete ajoute a la facture.",
      });
      paymentForm.reset({
        amount: Math.max(invoice.total_ttc - (paymentsTotal + values.amount), 0),
        paid_at: new Date().toISOString().slice(0, 10),
        method: "transfer",
        reference: "",
        notes: "",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error?.message ?? "Impossible d'enregistrer le paiement.",
        variant: "destructive",
      });
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({
        title: "Export",
        description: "Impossible d'ouvrir la fenetre d'impression.",
        variant: "destructive",
      });
      return;
    }

    const itemsRows = invoice.invoice_items
      .map(
        (item) => `<tr>
          <td>${item.designation}</td>
          <td>${item.description ?? ""}</td>
          <td>${item.quantity ?? 0}</td>
          <td>${(item.unit_price ?? 0).toFixed(2)}</td>
          <td>${(item.tax_rate ?? 0) * 100}%</td>
          <td>${((item.quantity ?? 0) * (item.unit_price ?? 0)).toFixed(2)}</td>
        </tr>`,
      )
      .join("");

    printWindow.document.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Facture ${invoice.invoice_no}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 24px; }
    h1 { font-size: 22px; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; }
    th { background-color: #f7f7f7; text-align: left; }
  </style>
</head>
<body>
  <h1>Facture ${invoice.invoice_no}</h1>
  <p><strong>Client :</strong> ${invoice.clients?.nom_legal ?? invoice.clients?.name ?? ""}</p>
  <p><strong>Site :</strong> ${invoice.sites?.nom_site ?? "-"}</p>
  <p><strong>Date :</strong> ${invoice.invoice_date ?? ""}</p>
  <p><strong>Statut :</strong> ${statusLabels[invoice.status]}</p>

  <table>
    <thead>
      <tr>
        <th>Designation</th>
        <th>Description</th>
        <th>Quantite</th>
        <th>Prix unitaire</th>
        <th>TVA</th>
        <th>Total HT</th>
      </tr>
    </thead>
    <tbody>
      ${itemsRows}
    </tbody>
  </table>

  <p><strong>Total HT :</strong> ${invoice.total_ht.toFixed(2)}</p>
  <p><strong>Total TVA :</strong> ${invoice.total_tva.toFixed(2)}</p>
  <p><strong>Total TTC :</strong> ${invoice.total_ttc.toFixed(2)}</p>
</body>
</html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const taxIdentity = (invoice.tax_breakdown as any)?.identity ?? null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Facture {invoice.invoice_no}</DialogTitle>
          <DialogDescription>
            Detail du document de facturation et actions de suivi.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Client</p>
              <p className="text-lg font-semibold">
                {invoice.clients?.nom_legal ?? invoice.clients?.name}
              </p>
              {invoice.sites && (
                <p className="text-sm text-muted-foreground">
                  Site: {invoice.sites.nom_site}
                </p>
              )}
              {taxIdentity && (
                <p className="text-sm text-muted-foreground">
                  Identite fiscale: {taxIdentity?.label ?? ""} ({taxIdentity?.matricule ?? ""})
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={statusVariants[invoice.status]}>{statusLabels[invoice.status]}</Badge>
              <Button variant="outline" size="sm" onClick={handlePrint} className="flex items-center gap-1">
                <Printer className="h-4 w-4" /> Imprimer / PDF
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground">Echeances</p>
              <p className="text-sm">Emise le {invoice.invoice_date ?? ""}</p>
              <p className="text-sm">Echeance le {invoice.due_date ?? "-"}</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground">Montants</p>
              <p className="text-sm">Total HT : {invoice.total_ht.toFixed(2)} {invoice.currency}</p>
              <p className="text-sm">TVA : {invoice.total_tva.toFixed(2)} {invoice.currency}</p>
              <p className="text-sm font-semibold">Total TTC : {invoice.total_ttc.toFixed(2)} {invoice.currency}</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground">Paiements</p>
              <p className="text-sm">Regle : {paymentsTotal.toFixed(2)} {invoice.currency}</p>
              <p className="text-sm font-semibold">Restant : {remainingDue.toFixed(2)} {invoice.currency}</p>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Lignes</h3>
            <div className="rounded-md border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Designation</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Quantite</TableHead>
                    <TableHead>Prix unitaire</TableHead>
                    <TableHead>TVA</TableHead>
                    <TableHead>Total HT</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.invoice_items.map((item) => {
                    const lineTotal = (item.quantity ?? 0) * (item.unit_price ?? 0);
                    return (
                      <TableRow key={item.id}>
                        <TableCell>{item.designation}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{item.description ?? "-"}</TableCell>
                        <TableCell>{item.quantity ?? 0}</TableCell>
                        <TableCell>{(item.unit_price ?? 0).toFixed(2)}</TableCell>
                        <TableCell>{((item.tax_rate ?? 0) * 100).toFixed(2)}%</TableCell>
                        <TableCell>{lineTotal.toFixed(2)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Historique des paiements</h3>
            <div className="rounded-md border border-dashed border-border p-4 space-y-4">
              {invoice.payments && invoice.payments.length > 0 ? (
                invoice.payments.map((payment) => (
                  <div key={payment.id} className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-medium">{Number(payment.amount).toFixed(2)} {invoice.currency}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(payment.paid_at).toLocaleDateString()} - {payment.method}
                        {payment.reference ? ` • Ref. ${payment.reference}` : ""}
                      </p>
                    </div>
                    {payment.notes && <p className="text-xs text-muted-foreground">{payment.notes}</p>}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Aucun paiement enregistre.</p>
              )}
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Actions</h4>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatus("sent")}
                  disabled={invoice.status === "sent" || isStatusUpdating}
                >
                  Marquer envoyee
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatus("paid")}
                  disabled={invoice.status === "paid" || isStatusUpdating}
                >
                  Marquer payee
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatus("overdue")}
                  disabled={invoice.status === "overdue" || isStatusUpdating}
                >
                  Marquer en retard
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleStatus("canceled")}
                  disabled={invoice.status === "canceled" || isStatusUpdating}
                >
                  Annuler la facture
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Enregistrer un paiement</h4>
              <form
                onSubmit={paymentForm.handleSubmit(submitPayment)}
                className="grid grid-cols-1 gap-3"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="payment_amount">Montant</Label>
                    <Input
                      id="payment_amount"
                      type="number"
                      step="0.01"
                      min="0"
                      {...paymentForm.register("amount")}
                      disabled={isRecordingPayment}
                    />
                    {paymentForm.formState.errors.amount && (
                      <p className="text-xs text-destructive">
                        {paymentForm.formState.errors.amount.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="payment_date">Date</Label>
                    <Input
                      id="payment_date"
                      type="date"
                      {...paymentForm.register("paid_at")}
                      disabled={isRecordingPayment}
                    />
                    {paymentForm.formState.errors.paid_at && (
                      <p className="text-xs text-destructive">
                        {paymentForm.formState.errors.paid_at.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="payment_method">Mode</Label>
                  <select
                    id="payment_method"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    {...paymentForm.register("method")}
                    disabled={isRecordingPayment}
                  >
                    {paymentMethods.map((method) => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="payment_reference">Reference</Label>
                  <Input
                    id="payment_reference"
                    {...paymentForm.register("reference")}
                    disabled={isRecordingPayment}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="payment_notes">Notes</Label>
                  <Textarea
                    id="payment_notes"
                    rows={2}
                    {...paymentForm.register("notes")}
                    disabled={isRecordingPayment}
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isRecordingPayment}>
                    {isRecordingPayment ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      "Ajouter le paiement"
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
