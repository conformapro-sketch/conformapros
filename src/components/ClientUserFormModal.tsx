import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { inviteClientUser, fetchSitesByClient, toggleUtilisateurActif, fetchAllClients } from "@/lib/multi-tenant-queries";
import { useToast } from "@/hooks/use-toast";
import { Building2, Loader2 } from "lucide-react";
import { supabaseAny as supabase } from "@/lib/supabase-any";

const userSchema = z.object({
  client_id: z.string().min(1, "Le client est requis"),
  email: z.string().trim().email("Email invalide").min(1, "L'email est requis"),
  fullName: z.string().trim().min(1, "Le nom complet est requis").max(100, "Le nom doit faire moins de 100 caractères"),
  is_client_admin: z.boolean().default(false),
  siteIds: z.array(z.string()).default([]),
  actif: z.boolean().default(true),
  password: z.string().optional().refine((val) => !val || val.length >= 8, {
    message: "Le mot de passe doit contenir au moins 8 caractères"
  }),
  send_reset: z.boolean().default(true),
});

type UserFormData = z.infer<typeof userSchema>;

interface ClientUserFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId?: string; // Optional - can be pre-selected or chosen in form
  user?: any; // Existing user for editing
}

export function ClientUserFormModal({ open, onOpenChange, clientId, user }: ClientUserFormModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Use provided clientId or fallback to user's client_id for editing
  const effectiveClientId = clientId || user?.client_id;

  // Fetch all clients (for selection)
  const { data: clients = [] } = useQuery({
    queryKey: ["all-clients"],
    queryFn: fetchAllClients,
    enabled: !user, // Only fetch when creating new user
  });

  // Check if current user is super admin
  const { data: currentUserRole } = useQuery({
    queryKey: ['current-user-role'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data } = await supabase
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', user.id)
        .single();
      
      return data?.roles?.name;
    },
  });

  const isSuperAdmin = currentUserRole === 'Super Admin';

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    watch,
    reset,
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      client_id: effectiveClientId || "",
      actif: true,
      siteIds: [],
      is_client_admin: false,
      password: "",
      send_reset: true,
    },
  });

  // Reset form when user data changes or modal opens
  React.useEffect(() => {
    if (open) {
      if (user) {
        // Editing existing user - populate form with user data
        reset({
          client_id: user.client_id || effectiveClientId || "",
          email: user.email || "",
          fullName: `${user.nom || ""} ${user.prenom || ""}`.trim(),
          is_client_admin: user.is_client_admin || false,
          siteIds: user.sites_data?.map((site: any) => site.id) || [],
          actif: user.actif ?? true,
          password: "",
          send_reset: true,
        });
      } else {
        // Creating new user - reset to empty form
        reset({
          client_id: effectiveClientId || "",
          email: "",
          fullName: "",
          actif: true,
          siteIds: [],
          is_client_admin: false,
          password: "",
          send_reset: true,
        });
      }
    }
  }, [open, user, effectiveClientId, reset]);

  const selectedClientId = watch("client_id");
  const selectedSiteIds = watch("siteIds");
  const passwordValue = watch("password");

  // Fetch sites for the selected client
  const { data: sites = [] } = useQuery({
    queryKey: ["sites", selectedClientId],
    queryFn: () => fetchSitesByClient(selectedClientId),
    enabled: !!selectedClientId,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      if (!data.client_id) {
        throw new Error("Veuillez sélectionner un client");
      }

      const result = await inviteClientUser(
        data.email,
        data.fullName,
        data.siteIds,
        data.client_id,
        data.is_client_admin,
        data.password,
        data.send_reset
      );

      if (result.error) {
        throw result.error;
      }

      if (user?.id && (user.actif ?? true) !== data.actif) {
        await toggleUtilisateurActif(user.id, data.actif);
      }

      return result;
    },
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ["client-users", selectedClientId] });
      queryClient.invalidateQueries({ queryKey: ["client-users", effectiveClientId] });
      queryClient.invalidateQueries({ queryKey: ["all-client-users"] });
      queryClient.invalidateQueries({ queryKey: ["all-clients"] });
      const isUpdate = result.data?.action === 'updated';
      toast({
        title: "Succès",
        description: isUpdate 
          ? "Utilisateur mis à jour avec succès" 
          : (result.data?.message || "Utilisateur invité avec succès"),
      });
      reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error?.message || "Impossible de sauvegarder l'utilisateur.",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: UserFormData) => {
    // Explicit validation before submission
    if (!data.client_id) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez sélectionner un client avant de continuer",
        variant: "destructive",
      });
      return;
    }

    if (!data.email || !data.email.includes('@')) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez saisir une adresse email valide",
        variant: "destructive",
      });
      return;
    }

    console.log('Submitting user data:', { ...data, password: data.password ? '[REDACTED]' : undefined });
    saveMutation.mutate(data);
  };

  const roleLabels: Record<string, string> = {
    admin_client: "Administrateur client",
    gestionnaire_hse: "Gestionnaire HSE",
    chef_site: "Chef de site",
    lecteur: "Lecteur",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{user ? "Modifier l'utilisateur" : "Nouvel utilisateur client"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Client Selection (only for new users) */}
          {!user && (
            <div>
              <Label htmlFor="client_id">Client * <span className="text-xs text-muted-foreground">(obligatoire)</span></Label>
              <Controller
                name="client_id"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={!!clientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un client..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clients?.map((client: any) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.nom} {client.nom_legal && `(${client.nom_legal})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.client_id && (
                <p className="text-sm text-destructive mt-1">{errors.client_id.message}</p>
              )}
            </div>
          )}

          {/* Email */}
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input 
              id="email" 
              type="email" 
              {...register("email")} 
              disabled={!!user}
              placeholder="utilisateur@exemple.com"
            />
            {errors.email && (
              <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Full Name */}
          <div>
            <Label htmlFor="fullName">Nom complet *</Label>
            <Input 
              id="fullName" 
              {...register("fullName")} 
              placeholder="Prénom Nom"
            />
            {errors.fullName && (
              <p className="text-sm text-destructive mt-1">{errors.fullName.message}</p>
            )}
          </div>

          {/* Password fields - only for new users */}
          {!user && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="password">Mot de passe (optionnel)</Label>
                <Input 
                  id="password" 
                  type="password"
                  {...register("password")} 
                  placeholder="Minimum 8 caractères"
                />
                {errors.password && (
                  <p className="text-sm text-destructive mt-1">{errors.password.message}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Si vous définissez un mot de passe, l'utilisateur pourra se connecter immédiatement.
                </p>
              </div>

              <div className="flex items-center justify-between py-2 border border-border rounded-lg px-4">
                <div>
                  <Label htmlFor="send_reset" className="cursor-pointer">
                    Envoyer un email de réinitialisation
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {passwordValue ? "L'utilisateur recevra un email pour changer son mot de passe" : "L'utilisateur recevra un email pour définir son mot de passe"}
                  </p>
                </div>
                <Controller
                  name="send_reset"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      id="send_reset"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>
            </div>
          )}

          {/* Client Admin Toggle (Super Admin only) */}
          {isSuperAdmin && (
            <div className="flex items-center justify-between py-3 border border-border rounded-lg px-4">
              <div>
                <Label htmlFor="is_client_admin" className="cursor-pointer">Administrateur client</Label>
                <p className="text-sm text-muted-foreground">
                  Les admins peuvent gérer les utilisateurs de leur organisation
                </p>
              </div>
              <Controller
                name="is_client_admin"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="is_client_admin"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>
          )}

          {/* Info message about individual permissions */}
          <div className="bg-muted/50 border border-border rounded-lg p-3">
            <p className="text-sm text-muted-foreground">
              Les permissions seront configurées individuellement après la création du compte.
            </p>
          </div>

          {/* Sites autorisés */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="h-5 w-5" />
              <Label>Sites autorisés</Label>
            </div>

            {!selectedClientId ? (
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  Veuillez d'abord sélectionner un client pour voir les sites disponibles
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-3 bg-muted/30 rounded-lg p-4 max-h-60 overflow-y-auto">
                  {sites.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucun site disponible pour ce client</p>
                  ) : (
                    <Controller
                      name="siteIds"
                      control={control}
                      render={({ field }) => (
                        <>
                          {sites.map((site: any) => (
                            <div key={site.id} className="flex items-center gap-3 py-2">
                              <Checkbox
                                id={`site-${site.id}`}
                                checked={field.value.includes(site.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    field.onChange([...field.value, site.id]);
                                  } else {
                                    field.onChange(field.value.filter((id: string) => id !== site.id));
                                  }
                                }}
                              />
                              <label
                                htmlFor={`site-${site.id}`}
                                className="flex-1 cursor-pointer text-sm font-medium"
                              >
                                {site.nom_site}
                                <span className="text-muted-foreground ml-2">({site.code_site})</span>
                              </label>
                            </div>
                          ))}
                        </>
                      )}
                    />
                  )}
                </div>
                {errors.siteIds && (
                  <p className="text-sm text-destructive mt-1">{errors.siteIds.message}</p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {selectedSiteIds.length} site(s) sélectionné(s)
                </p>
              </>
            )}
          </div>

          {/* Actif */}
          {user && (
            <div className="flex items-center justify-between py-3 border-t border-border">
              <div>
                <Label htmlFor="actif" className="cursor-pointer">Compte actif</Label>
                <p className="text-sm text-muted-foreground">
                  Désactiver empêchera l'utilisateur de se connecter
                </p>
              </div>
              <Controller
                name="actif"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="actif"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {user ? "Mise à jour..." : "Invitation..."}
                </>
              ) : (
                user ? "Mettre à jour" : "Inviter l'utilisateur"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}










