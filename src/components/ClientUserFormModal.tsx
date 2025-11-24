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
import { Building2, Loader2, CheckCircle2, XCircle, AlertCircle, Eye, EyeOff } from "lucide-react";
import { supabaseAny as supabase } from "@/lib/supabase-any";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";

const userSchema = z.object({
  client_id: z.string().min(1, "Le client est requis"),
  email: z.string().trim().email("Email invalide").min(1, "L'email est requis").max(255, "L'email doit faire moins de 255 caractères"),
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
  clientId?: string;
  user?: any;
}

// Password strength calculator
const calculatePasswordStrength = (password: string): { score: number; label: string; color: string } => {
  if (!password) return { score: 0, label: "", color: "" };
  
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 2) return { score, label: "Faible", color: "text-destructive" };
  if (score <= 3) return { score, label: "Moyen", color: "text-orange-500" };
  return { score, label: "Fort", color: "text-green-500" };
};

export function ClientUserFormModal({ open, onOpenChange, clientId, user }: ClientUserFormModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = React.useState(false);
  const [emailCheckStatus, setEmailCheckStatus] = React.useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  const effectiveClientId = clientId || user?.client_id;

  // Fetch all clients
  const { data: clients = [] } = useQuery({
    queryKey: ["all-clients"],
    queryFn: fetchAllClients,
    enabled: !user,
  });

  // Get selected client details
  const selectedClient = React.useMemo(() => {
    return clients?.find((c: any) => c.id === effectiveClientId);
  }, [clients, effectiveClientId]);

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
    setError,
    clearErrors,
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

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (open) {
      if (user) {
        reset({
          client_id: user.client_id || effectiveClientId || "",
          email: user.email || "",
          fullName: `${user.nom || ""} ${user.prenom || ""}`.trim(),
          is_client_admin: user.is_client_admin || false,
          siteIds: user.access_scopes?.map((as: any) => as.site_id || as.id) || [],
          actif: user.actif ?? true,
          password: "",
          send_reset: true,
        });
      } else {
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
      setEmailCheckStatus('idle');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user, effectiveClientId]);

  const selectedClientId = watch("client_id");
  const selectedSiteIds = watch("siteIds");
  const passwordValue = watch("password");
  const emailValue = watch("email");
  const passwordStrength = calculatePasswordStrength(passwordValue || "");

  // Real-time email validation
  React.useEffect(() => {
    if (!emailValue || user?.email === emailValue) {
      setEmailCheckStatus('idle');
      return;
    }

    const checkEmail = async () => {
      if (!emailValue.includes('@')) {
        setEmailCheckStatus('idle');
        return;
      }

      setEmailCheckStatus('checking');
      
      try {
        const { data } = await supabase
          .from('client_users')
          .select('id')
          .eq('email', emailValue.toLowerCase())
          .maybeSingle();

        if (data) {
          setEmailCheckStatus('taken');
          setError('email', { 
            type: 'manual', 
            message: 'Cet email est déjà utilisé' 
          });
        } else {
          setEmailCheckStatus('available');
          clearErrors('email');
        }
      } catch (error) {
        console.error('Error checking email:', error);
        setEmailCheckStatus('idle');
      }
    };

    const timer = setTimeout(checkEmail, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emailValue, user]);

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

      // Block submission if email is taken
      if (emailCheckStatus === 'taken') {
        throw new Error("Cet email est déjà utilisé");
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
    if (!data.client_id) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez sélectionner un client avant de continuer",
        variant: "destructive",
      });
      return;
    }

    if (emailCheckStatus === 'taken') {
      toast({
        title: "Erreur de validation",
        description: "Cet email est déjà utilisé",
        variant: "destructive",
      });
      return;
    }

    saveMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{user ? "Modifier l'utilisateur" : "Nouvel utilisateur client"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Client Selection/Display - Always shown with prominent guidance */}
          <div className={cn(
            "p-4 rounded-lg border-2 transition-all",
            !selectedClientId && !user ? "border-primary bg-primary/5" : "border-border bg-muted/30"
          )}>
            {!user ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="client_id" className="text-base font-semibold">
                    Étape 1: Sélectionner le client *
                  </Label>
                  {!selectedClientId && (
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary">
                      Obligatoire
                    </Badge>
                  )}
                </div>
                <Controller
                  name="client_id"
                  control={control}
                  render={({ field }) => (
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange} 
                      disabled={!!clientId}
                    >
                      <SelectTrigger className={cn(
                        "bg-background h-12",
                        !field.value && "border-primary"
                      )}>
                        <SelectValue placeholder="🏢 Choisir une organisation client..." />
                      </SelectTrigger>
                      <SelectContent className="bg-background z-50">
                        {clients?.map((client: any) => (
                          <SelectItem key={client.id} value={client.id}>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span>{client.nom}</span>
                              {client.nom_legal && (
                                <span className="text-xs text-muted-foreground">({client.nom_legal})</span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.client_id && (
                  <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.client_id.message}
                  </p>
                )}
                {selectedClientId && selectedClient && (
                  <div className="flex items-center gap-2 pt-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Client sélectionné: <strong className="text-foreground">{selectedClient.nom}</strong></span>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <Label className="text-xs text-muted-foreground">Client</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{selectedClient?.nom || "Client"}</span>
                </div>
              </div>
            )}
          </div>

          {/* Email with validation indicator */}
          <div>
            <Label htmlFor="email">Email *</Label>
            <div className="relative">
              <Input 
                id="email" 
                type="email" 
                {...register("email")} 
                disabled={!!user}
                placeholder="utilisateur@exemple.com"
                className={cn(
                  "pr-10",
                  emailCheckStatus === 'taken' && "border-destructive",
                  emailCheckStatus === 'available' && "border-green-500"
                )}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {emailCheckStatus === 'checking' && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {emailCheckStatus === 'available' && !errors.email && (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
                {emailCheckStatus === 'taken' && (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
              </div>
            </div>
            {errors.email && (
              <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.email.message}
              </p>
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

          {/* Password with strength indicator */}
          {!user && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="password">Mot de passe (optionnel)</Label>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"}
                    {...register("password")} 
                    placeholder="Minimum 8 caractères"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                
                {/* Password strength indicator */}
                {passwordValue && (
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full transition-all duration-300",
                            passwordStrength.score <= 2 && "bg-destructive w-1/3",
                            passwordStrength.score === 3 && "bg-orange-500 w-2/3",
                            passwordStrength.score >= 4 && "bg-green-500 w-full"
                          )}
                        />
                      </div>
                      <span className={cn("text-xs font-medium", passwordStrength.color)}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Conseil: utilisez des majuscules, minuscules, chiffres et caractères spéciaux
                    </p>
                  </div>
                )}
                
                {errors.password && (
                  <p className="text-sm text-destructive mt-1">{errors.password.message}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Si vous définissez un mot de passe, l'utilisateur pourra se connecter immédiatement.
                </p>
              </div>

              <div className="flex items-center justify-between py-2 border border-border rounded-lg px-4 bg-muted/20">
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

          {/* Client Admin Toggle */}
          {isSuperAdmin && (
            <div className="flex items-center justify-between py-3 border border-border rounded-lg px-4 bg-muted/20">
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

          {/* Warning when no client is selected */}
          {!selectedClientId && !user && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  Sélectionnez d'abord un client
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                  Choisissez un client ci-dessus pour voir les sites disponibles et pouvoir créer l'utilisateur.
                </p>
              </div>
            </div>
          )}

          {/* Info message */}
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-3">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Les permissions seront configurées individuellement après la création du compte.
            </p>
          </div>

          {/* Enhanced Sites Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                <Label>Sites autorisés</Label>
              </div>
              <Badge variant="secondary" className="text-xs">
                {selectedSiteIds.length} sélectionné(s)
              </Badge>
            </div>

            {!selectedClientId ? (
              <div className="bg-muted/30 rounded-lg p-6 border-2 border-dashed border-border">
                <p className="text-sm text-muted-foreground text-center">
                  Veuillez d'abord sélectionner un client pour voir les sites disponibles
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2 bg-muted/20 rounded-lg p-4 max-h-60 overflow-y-auto border border-border">
                  {sites.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">Aucun site disponible pour ce client</p>
                    </div>
                  ) : (
                    <Controller
                      name="siteIds"
                      control={control}
                      render={({ field }) => (
                        <>
                          {sites.map((site: any) => {
                            const isSelected = field.value.includes(site.id);
                            return (
                              <div 
                                key={site.id} 
                                className={cn(
                                  "flex items-center gap-3 py-3 px-3 rounded-md transition-all border",
                                  isSelected 
                                    ? "bg-primary/10 border-primary/30 shadow-sm" 
                                    : "bg-background border-transparent hover:bg-muted/50"
                                )}
                              >
                                <Checkbox
                                  id={`site-${site.id}`}
                                  checked={isSelected}
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
                                  className="flex-1 cursor-pointer"
                                >
                                  <div className="font-medium text-sm">{site.nom_site}</div>
                                  <div className="text-xs text-muted-foreground">
                                    Code: {site.code_site}
                                  </div>
                                </label>
                                {isSelected && (
                                  <CheckCircle2 className="h-4 w-4 text-primary" />
                                )}
                              </div>
                            );
                          })}
                        </>
                      )}
                    />
                  )}
                </div>
                {errors.siteIds && (
                  <p className="text-sm text-destructive mt-1">{errors.siteIds.message}</p>
                )}
              </>
            )}
          </div>

          {/* Active Status */}
          {user && (
            <div className="flex items-center justify-between py-3 border-t border-border pt-4">
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

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={saveMutation.isPending || emailCheckStatus === 'taken' || emailCheckStatus === 'checking'}
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
