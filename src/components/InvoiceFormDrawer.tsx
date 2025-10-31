import { useEffect, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as z from "zod";
import { Database } from "@/integrations/supabase/types";
import {
  createInvoice,
  fetchClients,
  fetchSitesByClient,
  fetchSubscriptions,
  CreateInvoicePayload,
} from "@/lib/multi-tenant-queries";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2 } from "lucide-react";

const invoiceItemSchema = z.object({
  designation: z.string().min(1, "Designation requise"),
  description: z.string().optional(),
  quantity: z.coerce.number().min(1, "Quantite minimale 1"),
  unit_price: z.coerce.number().min(0, "Prix invalide"),
  tax_rate: z.coerce.number().min(0).max(100).optional(),
});

const invoiceSchema = z.object({
  client_id: z.string().min(1, "Client obligatoire"),
  site_id: z.string().optional(),
  subscription_id: z.string().optional(),
  invoice_date: z.string().min(1, "Date obligatoire"),
  due_date: z.string().optional(),
  status: z.enum(["draft", "sent", "paid", "overdue", "canceled"]),
  currency: z.string().min(1, "Devise obligatoire"),
  notes: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, "Ajouter au moins une ligne"),
});

export type InvoiceFormValues = z.infer<typeof invoiceSchema>;

type ClientRow = Database["public"]["Tables"]["clients"]["Row"];
type SiteRow = Database["public"]["Tables"]["sites"]["Row"];
type SubscriptionRow = Database["public"]["Tables"]["subscriptions"]["Row"] & {
  plans?: Database["public"]["Tables"]["plans"]["Row"];
};

type InvoiceFormDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function InvoiceFormDrawer({ open, onOpenChange }: InvoiceFormDrawerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      client_id: "",
      site_id: undefined,
      subscription_id: undefined,
      invoice_date: new Date().toISOString().slice(0, 10),
      due_date: undefined,
      status: "draft",
      currency: "TND",
      notes: "",
      items: [
        {
          designation: "",
          description: "",
          quantity: 1,
          unit_price: 0,
          tax_rate: 19,
        },
      ],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "items",
  });

  useEffect(() => {
    if (!open) {
      form.reset({
        client_id: "",
        site_id: undefined,
        subscription_id: undefined,
        invoice_date: new Date().toISOString().slice(0, 10),
        due_date: undefined,
        status: "draft",
        currency: "TND",
        notes: "",
        items: [
          {
            designation: "",
            description: "",
            quantity: 1,
            unit_price: 0,
            tax_rate: 19,
          },
        ],
      });
    }
  }, [open, form]);

  const watchClientId = form.watch("client_id");
  const watchSubscriptionId = form.watch("subscription_id");
  const watchItems = form.watch("items");

  const { data: clients = [], isLoading: isLoadingClients } = useQuery<ClientRow[]>({
    queryKey: ["clients", "invoice"],
    queryFn: fetchClients,
  });

  const { data: sites = [] } = useQuery<SiteRow[]>({
    queryKey: ["sites", watchClientId, "invoice"],
    queryFn: () => fetchSitesByClient(watchClientId),
    enabled: Boolean(watchClientId),
  });

  const { data: subscriptions = [] } = useQuery<SubscriptionRow[]>({
    queryKey: ["subscriptions", "for-invoice", watchClientId],
    queryFn: async () => {
      const data = await fetchSubscriptions({ clientId: watchClientId, status: "active" });
      return data as SubscriptionRow[];
    },
    enabled: Boolean(watchClientId),
  });

  useEffect(() => {
    const client = clients.find((entry) => entry.id === watchClientId);
    if (client?.currency) {
      form.setValue("currency", client.currency);
    }
  }, [clients, watchClientId, form]);

  useEffect(() => {
    if (!watchSubscriptionId) {
      return;
    }
    const subscription = subscriptions.find((entry) => entry.id === watchSubscriptionId);
    if (!subscription) {
      return;
    }

    if (subscription.scope === "site" && subscription.site_id) {
      form.setValue("site_id", subscription.site_id);
    }

    if (subscription.plans) {
      const price = subscription.price_override ?? subscription.plans.base_price ?? 0;
      replace([
        {
          designation: subscription.plans.label,
          description: subscription.plans.code ?? "",
          quantity: 1,
          unit_price: price,
          tax_rate: 19,
        },
      ]);
    }
  }, [watchSubscriptionId, subscriptions, form, replace]);

  const totals = useMemo(() => {
    return watchItems.reduce(
      (acc, item) => {
        const quantity = Number(item.quantity) || 0;
        const unitPrice = Number(item.unit_price) || 0;
        const lineTotal = quantity * unitPrice;
        const taxRate = item.tax_rate ? Number(item.tax_rate) / 100 : 0;
        const taxAmount = lineTotal * taxRate;
        return {
          ht: acc.ht + lineTotal,
          tva: acc.tva + taxAmount,
          ttc: acc.ttc + lineTotal + taxAmount,
        };
      },
      { ht: 0, tva: 0, ttc: 0 },
    );
  }, [watchItems]);

  const createInvoiceMutation = useMutation({
    mutationFn: (payload: CreateInvoicePayload) => createInvoice(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast({
        title: "Facture creee",
        description: "La facture a ete creee avec succes.",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error?.message ?? "Impossible de creer la facture.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: InvoiceFormValues) => {
    const payload: CreateInvoicePayload = {
      clientId: values.client_id,
      siteId: values.site_id ? values.site_id : undefined,
      subscriptionId: values.subscription_id ? values.subscription_id : undefined,
      invoiceDate: values.invoice_date,
      dueDate: values.due_date || null,
      status: values.status,
      currency: values.currency,
      notes: values.notes || null,
      items: values.items.map((item) => ({
        designation: item.designation,
        description: item.description || undefined,
        quantity: Number(item.quantity) || 1,
        unit_price: Number(item.unit_price) || 0,
        tax_rate:
          typeof item.tax_rate === "number" && !Number.isNaN(item.tax_rate)
            ? Number(item.tax_rate) / 100
            : 0,
      })),
    };

    createInvoiceMutation.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Nouvelle facture</DialogTitle>
          <DialogDescription>
            Selectionnez le client, ajoutez les lignes et validez les montants a facturer.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2 space-y-2">
              <Label htmlFor="client_id">Client</Label>
              <Select
                value={form.watch("client_id")}
                onValueChange={(value) => form.setValue("client_id", value)}
                disabled={isLoadingClients || createInvoiceMutation.isPending}
              >
                <SelectTrigger id="client_id">
                  <SelectValue placeholder={isLoadingClients ? "Chargement..." : "Selectionner un client"} />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border max-h-64">
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.nom_legal || client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.client_id && (
                <p className="text-sm text-destructive">{form.formState.errors.client_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="site_id">Site</Label>
              <Select
                value={form.watch("site_id") ?? ""}
                onValueChange={(value) => form.setValue("site_id", value)}
                disabled={!watchClientId || createInvoiceMutation.isPending}
              >
                <SelectTrigger id="site_id">
                  <SelectValue placeholder="Tous les sites" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border max-h-64">
                  <SelectItem value="">Tous les sites / Client</SelectItem>
                  {sites.map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.nom_site || site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subscription_id">Abonnement</Label>
              <Select
                value={form.watch("subscription_id") ?? ""}
                onValueChange={(value) => form.setValue("subscription_id", value || undefined)}
                disabled={!watchClientId || createInvoiceMutation.isPending}
              >
                <SelectTrigger id="subscription_id">
                  <SelectValue placeholder="Optionnel" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border max-h-64">
                  <SelectItem value="">Sans abonnement</SelectItem>
                  {subscriptions.map((subscription) => (
                    <SelectItem key={subscription.id} value={subscription.id}>
                      {subscription.plans?.label ?? "Abonnement"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoice_date">Date de facture</Label>
              <Input
                id="invoice_date"
                type="date"
                {...form.register("invoice_date")}
                disabled={createInvoiceMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="due_date">Date d'echeance</Label>
              <Input
                id="due_date"
                type="date"
                {...form.register("due_date")}
                disabled={createInvoiceMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <Select
                value={form.watch("status")}
                onValueChange={(value) => form.setValue("status", value as InvoiceFormValues["status"])}
                disabled={createInvoiceMutation.isPending}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border">
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="sent">Envoyee</SelectItem>
                  <SelectItem value="paid">Payee</SelectItem>
                  <SelectItem value="overdue">En retard</SelectItem>
                  <SelectItem value="canceled">Annulee</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Devise</Label>
              <Input id="currency" maxLength={3} {...form.register("currency")}
                disabled={createInvoiceMutation.isPending}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Lignes de facturation</h3>
                <p className="text-xs text-muted-foreground">Ajoutez les postes avec les quantites et taux de TVA.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({ designation: "", description: "", quantity: 1, unit_price: 0, tax_rate: 19 })
                }
                disabled={createInvoiceMutation.isPending}
                className="flex items-center gap-1"
              >
                <Plus className="h-4 w-4" /> Ajouter une ligne
              </Button>
            </div>

            <div className="rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Designation</TableHead>
                    <TableHead className="hidden lg:table-cell">Description</TableHead>
                    <TableHead className="w-[100px]">Quantite</TableHead>
                    <TableHead className="w-[140px]">Prix unitaire</TableHead>
                    <TableHead className="w-[100px]">TVA %</TableHead>
                    <TableHead className="w-[100px]">Total HT</TableHead>
                    <TableHead className="w-[48px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => {
                    const quantity = Number(form.watch(`items.${index}.quantity`)) || 0;
                    const unitPrice = Number(form.watch(`items.${index}.unit_price`)) || 0;
                    const lineTotal = quantity * unitPrice;

                    return (
                      <TableRow key={field.id}>
                        <TableCell>
                          <Input
                            placeholder="Designation"
                            {...form.register(`items.${index}.designation` as const)}
                            disabled={createInvoiceMutation.isPending}
                          />
                          {form.formState.errors.items?.[index]?.designation && (
                            <p className="text-xs text-destructive mt-1">
                              {form.formState.errors.items[index]?.designation?.message}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Input
                            placeholder="Description"
                            {...form.register(`items.${index}.description` as const)}
                            disabled={createInvoiceMutation.isPending}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            {...form.register(`items.${index}.quantity` as const, { valueAsNumber: true })}
                            disabled={createInvoiceMutation.isPending}
                          />
                          {form.formState.errors.items?.[index]?.quantity && (
                            <p className="text-xs text-destructive mt-1">
                              {form.formState.errors.items[index]?.quantity?.message}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            {...form.register(`items.${index}.unit_price` as const, { valueAsNumber: true })}
                            disabled={createInvoiceMutation.isPending}
                          />
                          {form.formState.errors.items?.[index]?.unit_price && (
                            <p className="text-xs text-destructive mt-1">
                              {form.formState.errors.items[index]?.unit_price?.message}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.5"
                            {...form.register(`items.${index}.tax_rate` as const, { valueAsNumber: true })}
                            disabled={createInvoiceMutation.isPending}
                          />
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-medium">{lineTotal.toFixed(2)}</p>
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                            disabled={fields.length === 1 || createInvoiceMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1 space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                rows={4}
                placeholder="Conditions ou remarques a faire figurer sur la facture"
                {...form.register("notes")}
                disabled={createInvoiceMutation.isPending}
              />
            </div>
            <div className="w-full max-w-sm space-y-2 rounded-lg border border-border p-4">
              <p className="text-sm font-medium text-muted-foreground">Recapitulatif</p>
              <div className="flex items-center justify-between text-sm">
                <span>Total HT</span>
                <span className="font-medium">{totals.ht.toFixed(2)} {form.watch("currency")}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Total TVA</span>
                <span className="font-medium">{totals.tva.toFixed(2)} {form.watch("currency")}</span>
              </div>
              <div className="flex items-center justify-between text-base font-semibold">
                <span>Total TTC</span>
                <span>{totals.ttc.toFixed(2)} {form.watch("currency")}</span>
              </div>
              {watchSubscriptionId && (
                <Badge variant="outline" className="mt-2 text-xs">
                  Lignes pre-remplies depuis l'abonnement selectionne
                </Badge>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createInvoiceMutation.isPending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={createInvoiceMutation.isPending}>
              {createInvoiceMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generation...
                </>
              ) : (
                "Creer la facture"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
