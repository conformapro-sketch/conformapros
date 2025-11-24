import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ClientAutocomplete } from "@/components/shared/ClientAutocomplete";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createSite, 
  updateSite,
  fetchClients,
  fetchClientById,
  listModulesSysteme,
  listSiteModules,
  toggleSiteModule,
  listDomaines,
  listSiteVeilleDomaines,
  toggleSiteVeilleDomaine,
  listGouvernorats,
  listDelegationsByGouvernorat,
} from "@/lib/multi-tenant-queries";
import type { Database } from "@/types/db";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import { 
  Building2, Settings, AlertCircle, MapPin, Activity,
  Library, Bell, ClipboardCheck, FileText, Shield, 
  Users, Calendar, AlertTriangle, HardHat, Truck, Leaf, FolderOpen,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabaseAny as supabase } from "@/lib/supabase-any";
import { useEffect, useState } from "react";
import { LocationPicker } from "@/components/LocationPicker";

type SiteRow = Database["public"]["Tables"]["sites"]["Row"];

const siteSchema = z.object({
  // Required fields only
  client_id: z.string().min(1, "Le client est requis"),
  nom_site: z.string().min(1, "Le nom du site est requis"),
  code_site: z.string().min(1, "Le code site est requis"),
  
  // All other fields are optional - using actual DB column names
  classification: z.string().optional(),
  secteur_activite: z.string().optional(),
  est_siege: z.boolean().default(false),
  adresse: z.string().optional(),
  gouvernorat: z.string().optional(),
  delegation: z.string().optional(),
  localite: z.string().optional(),
  code_postal: z.string().optional(),
  latitude: z.coerce.number().optional().nullable(),
  longitude: z.coerce.number().optional().nullable(),
  nombre_employes: z.coerce.number().int().min(0).optional().nullable(),
  surface: z.coerce.number().min(0).optional().nullable(),
  activite: z.string().optional(),
  responsable_site: z.string().optional(),
  niveau_risque: z.string().optional(),
});

type SiteFormData = z.infer<typeof siteSchema>;

interface SiteFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  site?: SiteRow;
  clientId?: string;
}

const CLASSIFICATIONS = [
  "1ère catégorie",
  "2ème catégorie",
  "3ème catégorie",
  "ERP",
  "EOP",
  "Non classé",
];

const SECTEURS = [
  "Chimique",
  "Pharmaceutique",
  "Agroalimentaire",
  "Pétrolière",
  "Logistique",
  "Tertiaire",
  "Énergie",
  "Autre",
];

const MODULE_ICONS: Record<string, any> = {
  BIBLIOTHEQUE: Library,
  VEILLE: Bell,
  CONFORMITE: ClipboardCheck,
  CONTROLES: ClipboardCheck,
  INCIDENTS: AlertTriangle,
  EPI: HardHat,
  FORMATIONS: Users,
  VISITES_MED: Calendar,
  ENVIRONNEMENT: Leaf,
  AUDITS: FileText,
  DOSSIER: FolderOpen,
  PRESTATAIRES: Truck,
  PERMIS: Shield,
};

export function SiteFormModal({ open, onOpenChange, site, clientId }: SiteFormModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [selectedGouvernoratId, setSelectedGouvernoratId] = useState<string | null>(null);

  // Check user role
  useEffect(() => {
    const checkRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userRoles } = await supabase
        .from("user_roles")
        .select(`
          role_uuid,
          roles!inner(name, type)
        `)
        .eq("user_id", user.id);

      const hasAdminRole = userRoles?.some((ur: any) => {
        const roleName = ur.roles?.name;
        if (!roleName) return false;
        const normalized = roleName.toLowerCase().replace(/\s+/g, '_');
        return ['super_admin', 'admin_global', 'admin_client', 'gestionnaire'].includes(normalized);
      });
      
      setIsAdmin(hasAdminRole || false);
    };
    checkRole();
  }, []);

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: fetchClients,
  });

  const { data: clientData } = useQuery({
    queryKey: ["client", site?.client_id || clientId],
    queryFn: () => fetchClientById(site?.client_id || clientId || ""),
    enabled: !!(site?.client_id || clientId),
  });

  const { data: gouvernorats = [] } = useQuery({
    queryKey: ["gouvernorats"],
    queryFn: listGouvernorats,
  });

  const { data: delegations = [] } = useQuery({
    queryKey: ["delegations", selectedGouvernoratId],
    queryFn: () => listDelegationsByGouvernorat(selectedGouvernoratId!),
    enabled: !!selectedGouvernoratId,
  });

  const { data: modulesSysteme = [] } = useQuery({
    queryKey: ["modules-systeme"],
    queryFn: listModulesSysteme,
  });

  const { data: siteModules = [], refetch: refetchSiteModules } = useQuery({
    queryKey: ["site-modules", site?.id],
    queryFn: () => site?.id ? listSiteModules(site.id) : Promise.resolve([]),
    enabled: !!site?.id,
  });

  const { data: domaines = [] } = useQuery({
    queryKey: ["domaines"],
    queryFn: listDomaines,
  });

  const { data: siteVeilleDomaines = [], refetch: refetchVeilleDomaines } = useQuery({
    queryKey: ["site-veille-domaines", site?.id],
    queryFn: () => site?.id ? listSiteVeilleDomaines(site.id) : Promise.resolve([]),
    enabled: !!site?.id,
  });

  const veilleModule = siteModules.find((sm: any) => sm.modules_systeme?.code === 'VEILLE');
  const isVeilleEnabled = veilleModule?.enabled || false;
  
  const bibliothequeModule = siteModules.find((sm: any) => sm.modules_systeme?.code === 'BIBLIOTHEQUE');
  const isBibliothequeEnabled = bibliothequeModule?.enabled || false;

  // Load gouvernorat for delegation loading when editing a site
  useEffect(() => {
    if (open && site?.gouvernorat && gouvernorats.length > 0) {
      const gov = gouvernorats.find((g: any) => g.nom === site.gouvernorat);
      if (gov) {
        setSelectedGouvernoratId(gov.id);
      }
    } else if (open && !site) {
      setSelectedGouvernoratId(null);
    }
  }, [open, site, gouvernorats]);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    control,
  } = useForm<SiteFormData>({
    resolver: zodResolver(siteSchema),
  });
  
  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      if (site) {
        reset({
          client_id: site.client_id,
          nom_site: site.nom_site,
          code_site: site.code_site,
          classification: site.classification || "",
          secteur_activite: site.secteur_activite || "",
          est_siege: site.est_siege || false,
          adresse: site.adresse || "",
          gouvernorat: site.gouvernorat || "",
          delegation: site.delegation || "",
          localite: site.localite || "",
          code_postal: site.code_postal || "",
          latitude: site.latitude ? Number(site.latitude) : null,
          longitude: site.longitude ? Number(site.longitude) : null,
          nombre_employes: site.nombre_employes || 0,
          surface: site.surface ? Number(site.surface) : null,
          activite: site.activite || "",
          responsable_site: site.responsable_site || "",
          niveau_risque: site.niveau_risque || "",
        });
      } else {
        reset({
          client_id: clientId || "",
          nom_site: "",
          code_site: "",
          classification: "",
          secteur_activite: "",
          est_siege: false,
          adresse: "",
          gouvernorat: "",
          delegation: "",
          localite: "",
          code_postal: "",
          nombre_employes: null,
          surface: null,
          activite: "",
          latitude: null,
          longitude: null,
          responsable_site: "",
          niveau_risque: "",
        });
      }
      setActiveTab("essentiels");
    }
  }, [open, site, clientId, reset]);

  const createMutation = useMutation({
    mutationFn: async (data: SiteFormData) => {
      // Remove empty/optional fields to avoid conflicts
      const cleanData: any = {
        client_id: data.client_id,
        nom_site: data.nom_site.trim(),
        code_site: data.code_site.trim(),
        est_siege: data.est_siege || false,
      };

      // Add optional fields only if they have values
      if (data.classification?.trim()) cleanData.classification = data.classification.trim();
      if (data.secteur_activite?.trim()) cleanData.secteur_activite = data.secteur_activite.trim();
      if (data.adresse?.trim()) cleanData.adresse = data.adresse.trim();
      if (data.gouvernorat?.trim()) cleanData.gouvernorat = data.gouvernorat.trim();
      if (data.delegation?.trim()) cleanData.delegation = data.delegation.trim();
      if (data.localite?.trim()) cleanData.localite = data.localite.trim();
      if (data.code_postal?.trim()) cleanData.code_postal = data.code_postal.trim();
      if (data.latitude) cleanData.latitude = data.latitude;
      if (data.longitude) cleanData.longitude = data.longitude;
      if (data.surface) cleanData.surface = data.surface;
      if (data.activite?.trim()) cleanData.activite = data.activite.trim();
      if (data.responsable_site?.trim()) cleanData.responsable_site = data.responsable_site.trim();
      if (data.niveau_risque?.trim()) cleanData.niveau_risque = data.niveau_risque.trim();
      if (data.nombre_employes !== null && data.nombre_employes !== undefined) cleanData.nombre_employes = data.nombre_employes;

      return createSite(cleanData);
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ["sites"] });
      const previousSites = queryClient.getQueryData(["sites"]);
      
      // Optimistic update
      queryClient.setQueryData(["sites"], (old: any) => {
        const optimisticSite = {
          id: `temp-${Date.now()}`,
          ...data,
          created_at: new Date().toISOString(),
        };
        return [...(old || []), optimisticSite];
      });
      
      return { previousSites };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({ title: "✓ Site créé avec succès" });
      reset();
      setSelectedGouvernoratId(null);
      onOpenChange(false);
    },
    onError: (error: any, _, context) => {
      if (context?.previousSites) {
        queryClient.setQueryData(["sites"], context.previousSites);
      }
      
      console.error("Site creation error:", error);
      const actionHint = error?.code === '23505' 
        ? "Un site avec ce code existe déjà pour ce client." 
        : "Vérifiez les champs obligatoires et réessayez.";
      
      toast({
        title: "Erreur lors de la création",
        description: `${error.message || "Une erreur est survenue"} ${actionHint}`,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: SiteFormData }) => {
      // Remove empty/optional fields
      const cleanData: any = {
        nom_site: data.nom_site.trim(),
        code_site: data.code_site.trim(),
        est_siege: data.est_siege || false,
      };

      // Add optional fields only if they have values
      if (data.classification?.trim()) cleanData.classification = data.classification.trim();
      if (data.secteur_activite?.trim()) cleanData.secteur_activite = data.secteur_activite.trim();
      if (data.adresse?.trim()) cleanData.adresse = data.adresse.trim();
      if (data.gouvernorat?.trim()) cleanData.gouvernorat = data.gouvernorat.trim();
      if (data.delegation?.trim()) cleanData.delegation = data.delegation.trim();
      if (data.localite?.trim()) cleanData.localite = data.localite.trim();
      if (data.code_postal?.trim()) cleanData.code_postal = data.code_postal.trim();
      if (data.latitude) cleanData.latitude = data.latitude;
      if (data.longitude) cleanData.longitude = data.longitude;
      if (data.surface) cleanData.surface = data.surface;
      if (data.activite?.trim()) cleanData.activite = data.activite.trim();
      if (data.responsable_site?.trim()) cleanData.responsable_site = data.responsable_site.trim();
      if (data.niveau_risque?.trim()) cleanData.niveau_risque = data.niveau_risque.trim();
      if (data.nombre_employes !== null && data.nombre_employes !== undefined) cleanData.nombre_employes = data.nombre_employes;

      return updateSite(id, cleanData);
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ["sites"] });
      const previousSites = queryClient.getQueryData(["sites"]);
      
      // Optimistic update
      queryClient.setQueryData(["sites"], (old: any) => {
        return old?.map((s: any) => 
          s.id === id ? { ...s, ...data, updated_at: new Date().toISOString() } : s
        );
      });
      
      return { previousSites };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({ title: "✓ Site modifié avec succès" });
      onOpenChange(false);
    },
    onError: (error: any, _, context) => {
      if (context?.previousSites) {
        queryClient.setQueryData(["sites"], context.previousSites);
      }
      
      console.error("Site update error:", error);
      const actionHint = "Vérifiez votre connexion et réessayez.";
      
      toast({
        title: "Erreur lors de la modification",
        description: `${error.message || "Une erreur est survenue"} ${actionHint}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SiteFormData) => {
    if (site) {
      updateMutation.mutate({ id: site.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleToggleModule = async (moduleCode: string, enabled: boolean) => {
    if (!site?.id || !isAdmin) {
      toast({
        title: "Non autorisé",
        description: "Vous n'avez pas l'autorisation de modifier les modules de ce site.",
        variant: "destructive",
      });
      return;
    }

    // Vérifier les dépendances lors de l'activation
    if (enabled && moduleCode === 'VEILLE' && !isBibliothequeEnabled) {
      toast({
        title: "Dépendance manquante",
        description: "Vous devez d'abord activer le module 'Bibliothèque réglementaire'",
        variant: "destructive",
      });
      return;
    }

    // Vérifier si on désactive BIBLIOTHEQUE alors que VEILLE est actif
    if (!enabled && moduleCode === 'BIBLIOTHEQUE' && isVeilleEnabled) {
      toast({
        title: "Impossible de désactiver",
        description: "Vous devez d'abord désactiver le module 'Veille réglementaire'",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      await toggleSiteModule(site.id, moduleCode, enabled, user?.id);
      await refetchSiteModules();
      
      // Si on désactive BIBLIOTHEQUE, désactiver aussi tous les domaines
      if (moduleCode === 'BIBLIOTHEQUE' && !enabled) {
        await refetchVeilleDomaines();
        toast({
          title: "Module désactivé",
          description: "La bibliothèque réglementaire a été désactivée. Les domaines associés ont été désactivés.",
        });
      } else if (moduleCode === 'VEILLE' && !enabled) {
        await refetchVeilleDomaines();
        toast({
          title: "Module désactivé",
          description: "La veille réglementaire a été désactivée.",
        });
      } else {
        toast({
          title: enabled ? "Module activé pour ce site" : "Module désactivé pour ce site",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleToggleDomaine = async (domaineId: string, enabled: boolean) => {
    if (!site?.id || !isAdmin) {
      toast({
        title: "Non autorisé",
        description: "Vous n'avez pas l'autorisation de modifier les domaines de ce site.",
        variant: "destructive",
      });
      return;
    }

    try {
      await toggleSiteVeilleDomaine(site.id, domaineId, enabled);
      await refetchVeilleDomaines();
      toast({
        title: enabled ? "Domaine activé" : "Domaine désactivé",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const isModuleEnabled = (moduleCode: string) => {
    const module = siteModules.find((sm: any) => 
      sm.modules_systeme?.code === moduleCode
    );
    return module?.enabled || module?.actif || false;
  };

  const isDomaineEnabled = (domaineId: string) => {
    return siteVeilleDomaines.find((svd: any) => 
      svd.domaine_id === domaineId
    )?.enabled || false;
  };

  const handleGouvernoratChange = async (gouvernoratNom: string) => {
    setValue("gouvernorat", gouvernoratNom);
    setValue("delegation", "");
    
    const gov = gouvernorats.find((g: any) => g.nom === gouvernoratNom);
    setSelectedGouvernoratId(gov?.id || null);
  };

  const handleDelegationChange = async (delegationNom: string) => {
    setValue("delegation", delegationNom);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{site ? "Modifier le site" : "Nouveau site"}</DialogTitle>
        </DialogHeader>

        {(site || clientId) && clientData && (
          <div className="mb-4 p-3 bg-muted rounded-md flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              <strong>Client:</strong> {clientData.nom_legal}
            </span>
            {clientData.statut && (
              <Badge variant="outline">{clientData.statut}</Badge>
            )}
          </div>
        )}

        <p className="text-sm text-muted-foreground mb-4">
          Les champs marqués d'un <span className="text-destructive">*</span> sont obligatoires
        </p>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="essentiels">Informations essentielles</TabsTrigger>
            <TabsTrigger value="activite">Activité</TabsTrigger>
            <TabsTrigger value="modules">Modules</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6">
            {/* Tab 1: Informations essentielles */}
            <TabsContent value="essentiels" className="space-y-4">
              {/* Client Selection - Prominent styling matching ClientUserFormModal */}
              {!site && !clientId && (
                <div className={cn(
                  "p-4 rounded-lg border-2 transition-all",
                  !watch("client_id") ? "border-primary bg-primary/5" : "border-border bg-muted/30"
                )}>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="client_id" className="text-base font-semibold">
                        Étape 1: Sélectionner le client *
                      </Label>
                      {!watch("client_id") && (
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary">
                          Obligatoire
                        </Badge>
                      )}
                    </div>
                    <Controller
                      name="client_id"
                      control={control}
                      render={({ field }) => (
                        <ClientAutocomplete
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="🏢 Rechercher un client..."
                        />
                      )}
                    />
                    {errors.client_id && (
                      <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.client_id.message}
                      </p>
                    )}
                    {watch("client_id") && clients.find((c: any) => c.id === watch("client_id")) && (
                      <div className="flex items-center gap-2 pt-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>Client sélectionné: <strong className="text-foreground">{clients.find((c: any) => c.id === watch("client_id"))?.nom}</strong></span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nom_site">
                    Nom du site <span className="text-destructive">*</span>
                  </Label>
                  <Input id="nom_site" {...register("nom_site")} />
                  {errors.nom_site && (
                    <p className="text-sm text-destructive mt-1">{errors.nom_site.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="code_site">
                    Code site <span className="text-destructive">*</span>
                  </Label>
                  <Input id="code_site" {...register("code_site")} placeholder="SITE-001" />
                  {errors.code_site && (
                    <p className="text-sm text-destructive mt-1">{errors.code_site.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="classification">
                    Classification <span className="text-muted-foreground text-xs ml-1">(optionnel)</span>
                  </Label>
                  <Controller
                    name="classification"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner..." />
                        </SelectTrigger>
                        <SelectContent className="bg-background border border-border z-50">
                          {CLASSIFICATIONS.map((classif) => (
                            <SelectItem key={classif} value={classif}>
                              {classif}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div>
                  <Label htmlFor="secteur_activite">
                    Secteur d'activité <span className="text-muted-foreground text-xs ml-1">(optionnel)</span>
                  </Label>
                  <Controller
                    name="secteur_activite"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner..." />
                        </SelectTrigger>
                        <SelectContent className="bg-background border border-border z-50">
                          {SECTEURS.map((secteur) => (
                            <SelectItem key={secteur} value={secteur}>
                              {secteur}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="adresse">
                  Adresse <span className="text-muted-foreground text-xs ml-1">(optionnel)</span>
                </Label>
                <Textarea id="adresse" {...register("adresse")} rows={2} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="gouvernorat">
                    Gouvernorat <span className="text-muted-foreground text-xs ml-1">(optionnel)</span>
                  </Label>
                  <Controller
                    name="gouvernorat"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleGouvernoratChange(value);
                        }}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner..." />
                        </SelectTrigger>
                        <SelectContent className="bg-background border border-border z-50 max-h-60 overflow-y-auto">
                          {gouvernorats.map((gov: any) => (
                            <SelectItem key={gov.id} value={gov.nom}>
                              {gov.nom}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div>
                  <Label htmlFor="delegation">
                    Délégation <span className="text-muted-foreground text-xs ml-1">(optionnel)</span>
                  </Label>
                  <Controller
                    name="delegation"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleDelegationChange(value);
                        }}
                        value={field.value}
                        disabled={!selectedGouvernoratId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner..." />
                        </SelectTrigger>
                        <SelectContent className="bg-background border border-border z-50 max-h-60 overflow-y-auto">
                          {delegations.map((deleg: any) => (
                            <SelectItem key={deleg.id} value={deleg.nom}>
                              {deleg.nom}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div>
                  <Label htmlFor="localite">
                    Localité <span className="text-muted-foreground text-xs ml-1">(optionnel)</span>
                  </Label>
                  <Input id="localite" {...register("localite")} placeholder="Ex: Bardo" />
                </div>
              </div>

              <div>
                <Label htmlFor="code_postal">
                  Code postal <span className="text-muted-foreground text-xs ml-1">(optionnel)</span>
                </Label>
                <Input id="code_postal" {...register("code_postal")} placeholder="Ex: 1000" />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Controller
                  name="est_siege"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      id="est_siege"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label htmlFor="est_siege" className="cursor-pointer">
                  Est siège social
                  <span className="text-xs text-muted-foreground ml-2">
                    (un seul siège par client)
                  </span>
                </Label>
              </div>
            </TabsContent>

            {/* Tab 2: Activité */}
            <TabsContent value="activite" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nombre_employes">
                    Effectif <span className="text-muted-foreground text-xs ml-1">(optionnel)</span>
                  </Label>
                  <Input
                    id="nombre_employes"
                    type="number"
                    min="0"
                    {...register("nombre_employes")}
                  />
                </div>

                <div>
                  <Label htmlFor="surface">
                    Superficie (m²) <span className="text-muted-foreground text-xs ml-1">(optionnel)</span>
                  </Label>
                  <Input
                    id="surface"
                    type="number"
                    min="0"
                    step="0.01"
                    {...register("surface")}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="activite">
                  Activités <span className="text-muted-foreground text-xs ml-1">(optionnel)</span>
                </Label>
                <Textarea
                  id="activite"
                  {...register("activite")}
                  rows={4}
                  placeholder="Décrivez les activités principales du site..."
                />
              </div>

              <LocationPicker
                lat={watch("latitude")}
                lng={watch("longitude")}
                onLocationChange={(lat, lng) => {
                  setValue("latitude", lat);
                  setValue("longitude", lng);
                }}
              />
            </TabsContent>

            {/* Tab 3: Modules & Domaines */}
            <TabsContent value="modules" className="space-y-6">
              {!site && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Les modules seront configurables après la création du site.
                  </AlertDescription>
                </Alert>
              )}
              
              {site && (
                <>
                {!isAdmin && (
                  <div className="bg-muted/50 border border-border rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                      Vous n'avez pas l'autorisation de modifier les modules de ce site.
                    </p>
                  </div>
                )}

                {/* Modules du site */}
                <div className="space-y-4">
                  {(() => {
                    const MODULE_CATEGORIES: Record<string, string[]> = {
                      'Réglementation': ['BIBLIOTHEQUE', 'VEILLE', 'DOSSIER', 'EVALUATION'],
                      'Santé & Sécurité': ['INCIDENTS', 'EPI', 'EQUIPEMENTS', 'CONTROLES', 'VISITES_MED'],
                      'Formation & Compétences': ['FORMATIONS', 'AUDITS', 'PERMIS'],
                      'Environnement': ['ENVIRONNEMENT'],
                      'Gestion': ['PLAN_ACTION'],
                    };

                    const filteredModules = modulesSysteme.filter((m: any) => m.code !== 'CONFORMITE');
                    const enabledCount = filteredModules.filter((m: any) => isModuleEnabled(m.code)).length;
                    const totalCount = filteredModules.length;

                    const handleSelectAll = () => {
                      filteredModules
                        .filter((m: any) => !isModuleEnabled(m.code))
                        .forEach((m: any) => {
                          const isVeilleDisabled = m.code === 'VEILLE' && !isBibliothequeEnabled;
                          if (!isVeilleDisabled) {
                            handleToggleModule(m.code, true);
                          }
                        });
                    };

                    const handleDeselectAll = () => {
                      filteredModules
                        .filter((m: any) => isModuleEnabled(m.code))
                        .forEach((m: any) => handleToggleModule(m.code, false));
                    };

                    return (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            <h3 className="font-semibold">Modules du site</h3>
                            <Badge variant="secondary">{enabledCount} / {totalCount}</Badge>
                          </div>
                          {isAdmin && (
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={handleSelectAll}
                                type="button"
                              >
                                Tout sélectionner
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={handleDeselectAll}
                                type="button"
                              >
                                Tout désélectionner
                              </Button>
                            </div>
                          )}
                        </div>

                        {Object.entries(MODULE_CATEGORIES).map(([category, moduleCodes]) => {
                          const categoryModules = filteredModules.filter((m: any) => 
                            moduleCodes.includes(m.code)
                          );

                          if (categoryModules.length === 0) return null;

                          return (
                            <Card key={category} className="p-4">
                              <h4 className="font-medium text-sm mb-3">{category}</h4>
                              <div className="space-y-3">
                                {categoryModules.map((module: any) => {
                                  const IconComponent = MODULE_ICONS[module.code] || Settings;
                                  const isEnabled = isModuleEnabled(module.code);
                                  const isVeilleDisabled = module.code === 'VEILLE' && !isBibliothequeEnabled && !isEnabled;
                                  
                                  return (
                                    <div key={module.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                                      <div className="flex items-center gap-3 flex-1">
                                        <IconComponent className="h-5 w-5 text-primary flex-shrink-0" />
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2">
                                            <p className="font-medium">{module.libelle}</p>
                                            {isEnabled && (
                                              <Badge variant="default" className="text-xs">Activé</Badge>
                                            )}
                                          </div>
                                          {module.description && (
                                            <p className="text-sm text-muted-foreground">{module.description}</p>
                                          )}
                                          {module.code === 'VEILLE' && !isBibliothequeEnabled && !isEnabled && (
                                            <Badge variant="outline" className="text-xs mt-1">
                                              Nécessite: Bibliothèque réglementaire
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                      <Switch
                                        checked={isEnabled}
                                        onCheckedChange={(checked) => handleToggleModule(module.code, checked)}
                                        disabled={!isAdmin || isVeilleDisabled}
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            </Card>
                          );
                        })}
                      </>
                    );
                  })()}
                </div>

                {/* Domaines réglementaires (visible if BIBLIOTHEQUE module is enabled) */}
                {isBibliothequeEnabled && (
                  <div className="space-y-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        <h3 className="font-semibold">Domaines réglementaires autorisés</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Ces domaines seront disponibles dans la bibliothèque réglementaire
                        {isVeilleEnabled && " et la veille réglementaire"}
                      </p>
                    </div>
                    
                    <Card className="p-4">
                      <div className="space-y-3">
                        {domaines.map((domaine: any) => (
                          <div key={domaine.id} className="flex items-start gap-3 py-2">
                            <Checkbox
                              id={`domaine-${domaine.id}`}
                              checked={isDomaineEnabled(domaine.id)}
                              onCheckedChange={(checked) => handleToggleDomaine(domaine.id, checked as boolean)}
                              disabled={!isAdmin}
                              className="mt-1"
                            />
                            <Label
                              htmlFor={`domaine-${domaine.id}`}
                              className="flex-1 cursor-pointer leading-tight"
                            >
                              <span className="font-medium">{domaine.libelle}</span>
                              {domaine.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {domaine.description}
                                </p>
                              )}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                )}

                {!isBibliothequeEnabled && (
                  <div className="bg-muted/50 border border-border rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">
                      Activez le module "Bibliothèque réglementaire" pour configurer les domaines autorisés.
                    </p>
                  </div>
                )}
                </>
              )}
            </TabsContent>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {site ? "Modifier" : "Créer"}
              </Button>
            </div>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
