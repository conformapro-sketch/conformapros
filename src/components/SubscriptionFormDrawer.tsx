import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as z from "zod";
import { Database } from "@/integrations/supabase/types";
import {
  fetchClients,
  fetchPlans,
  fetchSitesByClient,
  createSubscription,
  updateSubscription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

const subscriptionSchema = z.object({
  client_id: z.string({ required_error: "Client obligatoire" }).min(1, "Client obligatoire"),
  scope: z.enum(["client", "site"], {
    errorMap: () => ({ message: "Portee obligatoire" }),
  }),
  site_id: z.string().optional(),
  plan_id: z.string({ required_error: "Plan obligatoire" }).min(1, "Plan obligatoire"),
  status: z.enum(["active", "paused", "canceled"], {
    errorMap: () => ({ message: "Statut obligatoire" }),
  }),
  start_date: z.string({ required_error: "Date de debut requise" }).min(1),
  end_date: z.string().optional(),
  next_billing_date: z.string().optional(),
  price_override: z.string().optional(),
  currency: z.string({ required_error: "Devise obligatoire" }).min(1),
  notes: z.string().optional(),
});

export type SubscriptionFormValues = z.infer<typeof subscriptionSchema>;

type SubscriptionRow = Database["public"]["Tables"]["subscriptions"]["Row"];
type SubscriptionInsert = Database["public"]["Tables"]["subscriptions"]["Insert"];
type SubscriptionUpdate = Database["public"]["Tables"]["subscriptions"]["Update"];
type PlanRow = Database["public"]["Tables"]["plans"]["Row"];
type ClientRow = Database["public"]["Tables"]["clients"]["Row"];
type SiteRow = Database["public"]["Tables"]["sites"]["Row"];

export type SubscriptionWithRelations = SubscriptionRow & {
  plans?: PlanRow;
  clients?: ClientRow;
  sites?: SiteRow | null;
};

interface SubscriptionFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription?: SubscriptionWithRelations | null;
}

export function SubscriptionFormDrawer({
  open,
  onOpenChange,
  subscription,
}: SubscriptionFormDrawerProps) {
  const isEditing = Boolean(subscription?.id);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<SubscriptionFormValues>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      client_id: subscription?.client_id ?? "",
      scope: subscription?.scope ?? "client",
      site_id: subscription?.site_id ?? undefined,
      plan_id: subscription?.plan_id ?? "",
      status: subscription?.status ?? "active",
      start_date: subscription?.start_date ?? new Date().toISOString().slice(0, 10),
      end_date: subscription?.end_date ?? undefined,
      next_billing_date: subscription?.next_billing_date ?? undefined,
      price_override:
        typeof subscription?.price_override === "number"
          ? String(subscription?.price_override ?? "")
          : "",
      currency: subscription?.currency ?? "TND",
      notes: subscription?.notes ?? "",
    },
  });

  const watchClientId = form.watch("client_id");
  const watchScope = form.watch("scope");

  useEffect(() => {
    if (open) {
      form.reset({
        client_id: subscription?.client_id ?? "",
        scope: subscription?.scope ?? "client",
        site_id: subscription?.site_id ?? undefined,
        plan_id: subscription?.plan_id ?? "",
        status: subscription?.status ?? "active",
        start_date: subscription?.start_date ?? new Date().toISOString().slice(0, 10),
        end_date: subscription?.end_date ?? undefined,
        next_billing_date: subscription?.next_billing_date ?? undefined,
        price_override:
          typeof subscription?.price_override === "number"
            ? String(subscription.price_override)
            : "",
        currency: subscription?.currency ?? "TND",
        notes: subscription?.notes ?? "",
      });
    } else {
      form.reset({
        client_id: "",
        scope: "client",
        site_id: undefined,
        plan_id: "",
        status: "active",
        start_date: new Date().toISOString().slice(0, 10),
        end_date: undefined,
        next_billing_date: undefined,
        price_override: "",
        currency: "TND",
        notes: "",
      });
    }
  }, [open, subscription, form]);

  useEffect(() => {
    if (watchScope === "client") {
      form.setValue("site_id", undefined);
    }
  }, [watchScope, form]);

  const { data: clients = [], isLoading: isLoadingClients } = useQuery<ClientRow[]>({
    queryKey: ["clients", "light"],
    queryFn: fetchClients,
  });

  const { data: plans = [], isLoading: isLoadingPlans } = useQuery<PlanRow[]>({
    queryKey: ["plans"],
    queryFn: fetchPlans,
  });

  const { data: sites = [], isFetching: isLoadingSites } = useQuery<SiteRow[]>({
    queryKey: ["sites", watchClientId],
    queryFn: () => fetchSitesByClient(watchClientId),
    enabled: watchScope === "site" && Boolean(watchClientId),
  });

  const createMutation = useMutation({
    mutationFn: (payload: SubscriptionInsert) => createSubscription(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({
        title: "Abonnement cree",
        description: "Le nouvel abonnement a ete cree avec succes.",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error?.message ?? "Impossible d'enregistrer l'abonnement.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ subscriptionId, updates }: { subscriptionId: string; updates: SubscriptionUpdate }) =>
      updateSubscription(subscriptionId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({
        title: "Abonnement mis a jour",
        description: "L'abonnement a ete mis a jour avec succes.",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error?.message ?? "Impossible de mettre a jour l'abonnement.",
        variant: "destructive",
      });
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const selectedPlan = useMemo(() => plans.find((plan) => plan.id === form.watch("plan_id")), [plans, form]);
  const selectedClient = useMemo(() => clients.find((client) => client.id === watchClientId), [clients, watchClientId]);

  const onSubmit = async (values: SubscriptionFormValues) => {
    const priceOverride = values.price_override ? Number(values.price_override) : undefined;

    if (values.price_override && Number.isNaN(priceOverride)) {
      form.setError("price_override", { type: "manual", message: "Montant invalide" });
      return;
    }

    if (values.scope === "site" && !values.site_id) {
      form.setError("site_id", { type: "manual", message: "Site obligatoire pour cette portee" });
      return;
    }

    const payloadBase = {
      client_id: values.client_id,
      scope: values.scope,
      site_id: values.scope === "site" ? values.site_id ?? null : null,
      plan_id: values.plan_id,
      status: values.status,
      start_date: values.start_date,
      end_date: values.end_date ? values.end_date : null,
      next_billing_date: values.next_billing_date ? values.next_billing_date : null,
      price_override: typeof priceOverride === "number" ? priceOverride : null,
      currency: values.currency || selectedClient?.currency || "TND",
      notes: values.notes ? values.notes : null,
    } satisfies SubscriptionInsert;

    if (isEditing && subscription) {
      const updates: SubscriptionUpdate = {
        ...payloadBase,
      };
      updateMutation.mutate({ subscriptionId: subscription.id, updates });
    } else {
      createMutation.mutate(payloadBase);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Modifier l'abonnement" : "Nouvel abonnement"}</DialogTitle>
          <DialogDescription>
            Configurez la portee, le plan et la facturation de l'abonnement.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client_id">Client</Label>
              <Select
                onValueChange={(value) => form.setValue("client_id", value)}
                value={form.watch("client_id")}
                disabled={isLoadingClients || isSubmitting}
              >
                <SelectTrigger id="client_id">
                  <SelectValue placeholder={isLoadingClients ? "Chargement..." : "Selectionner un client"} />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border">
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
              <Label htmlFor="scope">Portee</Label>
              <Select
                onValueChange={(value) => form.setValue("scope", value as SubscriptionFormValues["scope"])}
                value={form.watch("scope")}
                disabled={isSubmitting}
              >
                <SelectTrigger id="scope">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border">
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="site">Site</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {watchScope === "site" && (
              <div className="space-y-2">
                <Label htmlFor="site_id">Site</Label>
                <Select
                  onValueChange={(value) => form.setValue("site_id", value)}
                  value={form.watch("site_id") ?? ""}
                  disabled={isLoadingSites || !watchClientId || isSubmitting}
                >
                  <SelectTrigger id="site_id">
                    <SelectValue placeholder={isLoadingSites ? "Chargement..." : "Selectionner un site"} />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border max-h-64">
                    {sites.map((site) => (
                      <SelectItem key={site.id} value={site.id}>
                        {site.nom_site || site.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.site_id && (
                  <p className="text-sm text-destructive">{form.formState.errors.site_id.message}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="plan_id">Plan</Label>
              <Select
                onValueChange={(value) => form.setValue("plan_id", value)}
                value={form.watch("plan_id")}
                disabled={isLoadingPlans || isSubmitting}
              >
                <SelectTrigger id="plan_id">
                  <SelectValue placeholder={isLoadingPlans ? "Chargement..." : "Selectionner un plan"} />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border max-h-64">
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.label} ({plan.periodicity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.plan_id && (
                <p className="text-sm text-destructive">{form.formState.errors.plan_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <Select
                onValueChange={(value) => form.setValue("status", value as SubscriptionFormValues["status"])}
                value={form.watch("status")}
                disabled={isSubmitting}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border">
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="paused">Suspendu</SelectItem>
                  <SelectItem value="canceled">Annule</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_date">Date de debut</Label>
              <Input
                id="start_date"
                type="date"
                {...form.register("start_date")}
                disabled={isSubmitting}
              />
              {form.formState.errors.start_date && (
                <p className="text-sm text-destructive">{form.formState.errors.start_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">Date de fin</Label>
              <Input
                id="end_date"
                type="date"
                {...form.register("end_date")}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="next_billing_date">Prochaine echeance</Label>
              <Input
                id="next_billing_date"
                type="date"
                {...form.register("next_billing_date")}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price_override">Tarif personnalise (TND)</Label>
              <Input
                id="price_override"
                type="number"
                step="0.01"
                min="0"
                placeholder={selectedPlan ? String(selectedPlan.base_price) : ""}
                {...form.register("price_override")}
                disabled={isSubmitting}
              />
              {form.formState.errors.price_override && (
                <p className="text-sm text-destructive">{form.formState.errors.price_override.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Devise</Label>
              <Input
                id="currency"
                maxLength={3}
                {...form.register("currency")}
                disabled={isSubmitting}
              />
              {selectedClient?.currency && (
                <p className="text-xs text-muted-foreground">
                  Devise client: {selectedClient.currency}
                </p>
              )}
            </div>
          </div>

          {selectedPlan && (
            <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground space-y-2">
              <p className="font-medium text-foreground">Details du plan</p>
              <p>Tarif de base: {selectedPlan.base_price.toFixed(2)} {form.watch("currency")}</p>
              {selectedPlan.per_site_price && (
                <p>Tarif par site: {selectedPlan.per_site_price.toFixed(2)} {form.watch("currency")}</p>
              )}
              <p>Periodicite: {selectedPlan.periodicity}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes internes</Label>
            <Textarea
              id="notes"
              rows={3}
              placeholder="Informations supplementaires sur l'abonnement"
              {...form.register("notes")}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting || isLoadingClients || isLoadingPlans}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Traitement...
                </>
              ) : isEditing ? (
                "Enregistrer"
              ) : (
                "Creer"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}


