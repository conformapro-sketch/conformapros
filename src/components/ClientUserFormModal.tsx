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
import { inviteClientUser, fetchSitesByClient, toggleUtilisateurActif } from "@/lib/multi-tenant-queries";
import { useToast } from "@/hooks/use-toast";
import { Building2 } from "lucide-react";

const userSchema = z.object({
  email: z.string().trim().email("Email invalide").min(1, "L'email est requis"),
  fullName: z.string().trim().min(1, "Le nom complet est requis").max(100, "Le nom doit faire moins de 100 caractères"),
  role_uuid: z.string().min(1, "Le rôle est requis"),
  siteIds: z.array(z.string()).default([]),
  actif: z.boolean().default(true),
});

type UserFormData = z.infer<typeof userSchema>;

interface ClientUserFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  user?: any; // Existing user for editing
}

export function ClientUserFormModal({ open, onOpenChange, clientId, user }: ClientUserFormModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch sites for this client
  const { data: sites = [] } = useQuery({
    queryKey: ["sites", clientId],
    queryFn: () => fetchSitesByClient(clientId),
    enabled: !!clientId,
  });

  const { data: roles } = useQuery({
    queryKey: ['roles', 'client', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .eq('type', 'client')
        .or(`tenant_id.eq.${clientId},tenant_id.is.null`)
        .order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    watch,
    reset,
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: user ? {
      email: user.email || "",
      fullName: `${user.nom || ""} ${user.prenom || ""}`.trim(),
      role_uuid: user.user_roles?.[0]?.role_uuid || '',
      siteIds: user.access_scopes?.map((as: any) => as.site_id) || [],
      actif: user.actif ?? true,
    } : {
      actif: true,
      siteIds: [],
      role_uuid: '',
    },
  });

  const selectedRole = watch("role_uuid");
  const selectedSiteIds = watch("siteIds");

  const saveMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      const result = await inviteClientUser(
        data.email,
        data.fullName,
        data.role_uuid,
        clientId,
        data.siteIds
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
      queryClient.invalidateQueries({ queryKey: ["client-users", clientId] });
      toast({
        title: "Succès",
        description: result.data?.message || "Utilisateur invité avec succès",
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
    const selectedRole = roles?.find(r => r.id === data.role_uuid);
    const requiresSites = selectedRole?.name !== 'Admin' && selectedRole?.name !== 'Owner';
    
    if (requiresSites && data.siteIds.length === 0) {
      toast({
        title: 'Sites requis',
        description: 'Au moins un site doit être sélectionné pour ce rôle.',
        variant: 'destructive',
      });
      return;
    }
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

          {/* Role */}
          <div>
            <Label htmlFor="role_uuid">Rôle *</Label>
            <Controller
              name="role_uuid"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un rôle..." />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border z-50">
                    {roles?.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name} {role.description && `- ${role.description}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.role_uuid && (
              <p className="text-sm text-destructive mt-1">{errors.role_uuid.message}</p>
            )}
          </div>

          {/* Sites autorisés */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="h-5 w-5" />
              <Label>Sites autorisés *</Label>
            </div>
            
            {roles?.find(r => r.id === selectedRole)?.name === 'Admin' && (
              <div className="bg-muted/50 border border-border rounded-lg p-3 mb-3">
                <p className="text-sm text-muted-foreground">
                  Les administrateurs client ont accès à tous les sites par défaut.
                </p>
              </div>
            )}

            <div className="space-y-3 bg-muted/30 rounded-lg p-4 max-h-60 overflow-y-auto">
              {sites.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun site disponible</p>
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
              {user ? "Mettre à jour" : "Inviter l'utilisateur"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}










