import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { createClient, updateClient, fetchSites } from "@/lib/multi-tenant-queries";
import type { Database } from "@/types/db";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
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
import { Building2, Settings, User as UserIcon, Upload, Palette } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { ClientUserFormModal } from "./ClientUserFormModal";
import { fetchClientUsersPaginated, resetClientUserPassword, activateClientUser, deactivateClientUser, logAudit } from "@/lib/multi-tenant-queries";
import { supabase } from "@/integrations/supabase/client";

type ClientRow = Database["public"]["Tables"]["clients"]["Row"];

const clientSchema = z.object({
  nom_legal: z.string().min(1, "Le nom légal est requis"),
  secteur: z.string().optional(),
  matricule_fiscale: z.string().optional(),
  rne_rc: z.string().optional(),
  telephone: z.string().optional(),
  email: z.string().email("Format email invalide").optional().or(z.literal("")),
  site_web: z.string().url("Format URL invalide").optional().or(z.literal("")),
  adresse_siege: z.string().optional(),
  gouvernorat: z.string().optional(),
  delegation: z.string().optional(),
  code_postal: z.string().optional(),
  statut: z.string().optional(),
  notes: z.string().optional(),
  logo_url: z.string().optional(),
  couleur_primaire: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: ClientRow;
}

export function ClientFormModal({ open, onOpenChange, client }: ClientFormModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: clientSites } = useQuery({
    queryKey: ["sites", client?.id],
    queryFn: () => fetchSites().then(sites => sites.filter(s => s.client_id === client?.id)),
    enabled: !!client?.id,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: client || { statut: "actif" },
  });

  // Reset form when modal opens or client changes
  useEffect(() => {
    if (open && client) {
      reset({
        nom_legal: client.nom_legal || "",
        secteur: client.secteur || "",
        matricule_fiscale: client.matricule_fiscale || "",
        rne_rc: client.rne_rc || "",
        telephone: client.telephone || "",
        email: client.email || "",
        site_web: client.site_web || "",
        adresse_siege: client.adresse_siege || "",
        gouvernorat: client.gouvernorat || "",
        delegation: client.delegation || "",
        code_postal: client.code_postal || "",
        statut: client.statut || "actif",
        notes: client.notes || "",
        logo_url: client.logo_url || "",
        couleur_primaire: client.couleur_primaire || "#3b82f6",
      });
    } else if (open && !client) {
      reset({ statut: "actif" });
    }
  }, [open, client, reset]);

  const logoUrl = watch('logo_url');
  const couleurPrimaire = watch('couleur_primaire');

const createMutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
      console.log("Creating client with data:", data);
      const newClient = await createClient(data as any);
      console.log("Client created successfully:", newClient);
      return newClient;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({
        title: "Client créé",
        description: "Le client a été créé avec succès.",
      });
      reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error("Full error object:", error);
      console.error("Error message:", error?.message);
      console.error("Error details:", error?.details);
      console.error("Error hint:", error?.hint);
      console.error("Error code:", error?.code);
      
      const errorMessage = error?.message || error?.details || "Impossible de créer le client.";
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ clientId, updates }: { clientId: string; updates: any }) => 
      updateClient(clientId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({
        title: "Client modifié",
        description: "Le client a été modifié avec succès.",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le client.",
        variant: "destructive",
      });
      console.error(error);
    },
  });

  const onSubmit = async (data: ClientFormData) => {
    if (client) {
      updateMutation.mutate({ clientId: client.id, updates: data as any });
    } else {
      createMutation.mutate(data);
    }
  };

  const gouvernorats = [
    "Ariana", "Béja", "Ben Arous", "Bizerte", "Gabès", "Gafsa", "Jendouba",
    "Kairouan", "Kasserine", "Kébili", "Le Kef", "Mahdia", "La Manouba",
    "Médenine", "Monastir", "Nabeul", "Sfax", "Sidi Bouzid", "Siliana",
    "Sousse", "Tataouine", "Tozeur", "Tunis", "Zaghouan"
  ];

  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [searchUsers, setSearchUsers] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [siteFilter, setSiteFilter] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: usersPage, isLoading: usersLoading } = useQuery({
    queryKey: ["client-users", client?.id, searchUsers, roleFilter, statusFilter, siteFilter, page, pageSize],
    queryFn: () => fetchClientUsersPaginated(client!.id, { search: searchUsers, role: roleFilter as any, site: siteFilter, status: statusFilter as any, page, pageSize }),
    enabled: !!client?.id,
  });

  const users: any[] = usersPage?.data || [];
  const totalCount: number = usersPage?.count || 0;

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setShowUserModal(true);
  };

  const handleResetPassword = async (user: any) => {
    if (!user?.email) return;
    if (!confirm(`Réinitialiser le mot de passe pour ${user.email} ?`)) return;
    try {
      await resetClientUserPassword(user.email);
      toast({ title: "Email de réinitialisation envoyé" });
      await logAudit(null, client?.id || null, 'reset_password', { userId: user.id });
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Impossible de réinitialiser.", variant: 'destructive' });
    }
  };

  const handleToggleActive = async (user: any) => {
    if (!user?.id) return;
    const willDeactivate = !!user.actif;
    const confirmMsg = willDeactivate ? `Désactiver ${user.email} ?` : `Activer ${user.email} ?`;
    if (!confirm(confirmMsg)) return;
    try {
      if (willDeactivate) {
        await deactivateClientUser(user.id);
        await logAudit(null, client?.id || null, 'deactivate_user', { userId: user.id });
      } else {
        await activateClientUser(user.id);
        await logAudit(null, client?.id || null, 'activate_user', { userId: user.id });
      }
      queryClient.invalidateQueries({ queryKey: ["client-users", client?.id] });
      toast({ title: willDeactivate ? "Utilisateur désactivé" : "Utilisateur activé" });
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Impossible de changer le statut.", variant: 'destructive' });
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une image",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Erreur",
        description: "L'image ne doit pas dépasser 2 Mo",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('client-logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('client-logos')
        .getPublicUrl(fileName);

      setValue('logo_url', publicUrl);
      
      toast({
        title: "Logo téléchargé",
        description: "Le logo a été téléchargé avec succès",
      });
    } catch (error: any) {
      console.error('Logo upload error:', error);
      toast({
        title: "Erreur de téléchargement",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={client ? "max-w-5xl max-h-[90vh] overflow-y-auto" : "max-w-md"}>
        <DialogHeader>
          <DialogTitle>{client ? "Modifier le client" : "Nouveau client"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {!client ? (
            // Simple creation form - only essentials
            <div className="space-y-4">
              <div>
                <Label htmlFor="nom_legal">Nom légal *</Label>
                <Input 
                  id="nom_legal" 
                  {...register("nom_legal")} 
                  placeholder="Ex: ACME Corporation"
                />
                {errors.nom_legal && (
                  <p className="text-sm text-destructive mt-1">{errors.nom_legal.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="secteur">Secteur d'activité</Label>
                <Select onValueChange={(value) => setValue("secteur", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border z-50">
                    <SelectItem value="Industriel">Industriel</SelectItem>
                    <SelectItem value="Services">Services</SelectItem>
                    <SelectItem value="Commerce">Commerce</SelectItem>
                    <SelectItem value="Administration">Administration</SelectItem>
                    <SelectItem value="Autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="gouvernorat">Gouvernorat</Label>
                <Select onValueChange={(value) => setValue("gouvernorat", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border z-50 max-h-60 overflow-y-auto">
                    {gouvernorats.map(gov => (
                      <SelectItem key={gov} value={gov}>{gov}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="statut">Statut</Label>
                <Select onValueChange={(value) => setValue("statut", value)} defaultValue="actif">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border z-50">
                    <SelectItem value="actif">Actif</SelectItem>
                    <SelectItem value="suspendu">Suspendu</SelectItem>
                    <SelectItem value="archivé">Archivé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            // Full edit form with tabs
            <Tabs defaultValue="identification" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="identification">
                  <Building2 className="h-4 w-4 mr-2" />
                  Identification
                </TabsTrigger>
                <TabsTrigger value="branding">
                  <Palette className="h-4 w-4 mr-2" />
                  Branding
                </TabsTrigger>
                <TabsTrigger value="configuration">
                  <Settings className="h-4 w-4 mr-2" />
                  Sites
                </TabsTrigger>
                <TabsTrigger value="utilisateurs">
                  <UserIcon className="h-4 w-4 mr-2" />
                  Utilisateurs
                </TabsTrigger>
              </TabsList>

              <TabsContent value="identification" className="space-y-6 mt-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm">Identification</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="nom_legal">Nom légal *</Label>
                      <Input id="nom_legal" {...register("nom_legal")} />
                      {errors.nom_legal && (
                        <p className="text-sm text-destructive mt-1">{errors.nom_legal.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="secteur">Secteur d'activité</Label>
                      <Select onValueChange={(value) => setValue("secteur", value)} defaultValue={client?.secteur || ""}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner..." />
                        </SelectTrigger>
                        <SelectContent className="bg-background border border-border z-50">
                          <SelectItem value="Industriel">Industriel</SelectItem>
                          <SelectItem value="Services">Services</SelectItem>
                          <SelectItem value="Commerce">Commerce</SelectItem>
                          <SelectItem value="Administration">Administration</SelectItem>
                          <SelectItem value="Autre">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="matricule_fiscale">Matricule fiscal</Label>
                      <Input id="matricule_fiscale" {...register("matricule_fiscale")} />
                    </div>

                    <div>
                      <Label htmlFor="rne_rc">RNE / RC</Label>
                      <Input id="rne_rc" {...register("rne_rc")} />
                    </div>

                    <div>
                      <Label htmlFor="telephone">Téléphone</Label>
                      <Input 
                        id="telephone" 
                        {...register("telephone")} 
                        placeholder="+216 xx xxx xxx"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        type="email"
                        {...register("email")} 
                        placeholder="contact@entreprise.tn"
                      />
                      {errors.email && (
                        <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                      )}
                    </div>

                    <div className="col-span-2">
                      <Label htmlFor="site_web">Site web</Label>
                      <Input 
                        id="site_web" 
                        {...register("site_web")} 
                        placeholder="https://www.entreprise.tn"
                      />
                      {errors.site_web && (
                        <p className="text-sm text-destructive mt-1">{errors.site_web.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-sm">Adresse du siège social</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="adresse_siege">Adresse complète</Label>
                      <Textarea id="adresse_siege" {...register("adresse_siege")} rows={2} />
                    </div>

                    <div>
                      <Label htmlFor="gouvernorat">Gouvernorat</Label>
                      <Select 
                        onValueChange={(value) => setValue("gouvernorat", value)} 
                        defaultValue={client?.gouvernorat || ""}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner..." />
                        </SelectTrigger>
                        <SelectContent className="bg-background border border-border z-50 max-h-60 overflow-y-auto">
                          {gouvernorats.map(gov => (
                            <SelectItem key={gov} value={gov}>{gov}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="delegation">Délégation</Label>
                      <Input 
                        id="delegation" 
                        {...register("delegation")} 
                        placeholder="Ex: La Marsa"
                      />
                    </div>

                    <div>
                      <Label htmlFor="code_postal">Code postal</Label>
                      <Input 
                        id="code_postal" 
                        {...register("code_postal")} 
                        placeholder="Ex: 2046"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="branding" className="space-y-6 mt-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm">Logo et identité visuelle</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label>Logo de l'entreprise</Label>
                      <div className="mt-2 flex items-center gap-4">
                        {logoUrl && (
                          <div className="flex-shrink-0">
                            <img
                              src={logoUrl}
                              alt="Logo client"
                              className="h-20 w-20 object-contain rounded-lg border border-border"
                            />
                          </div>
                        )}
                        <div className="flex-1 space-y-2">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleLogoUpload}
                          />
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={uploading}
                            >
                              {uploading ? (
                                <>
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2" />
                                  Téléchargement...
                                </>
                              ) : (
                                <>
                                  <Upload className="h-4 w-4 mr-2" />
                                  {logoUrl ? 'Changer le logo' : 'Télécharger un logo'}
                                </>
                              )}
                            </Button>
                            {logoUrl && (
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => setValue("logo_url", "")}
                              >
                                Supprimer
                              </Button>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Format: PNG, JPG, SVG. Taille max: 2 Mo
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="couleur_primaire">Couleur primaire de la marque</Label>
                      <div className="flex gap-3 items-center mt-2">
                        <div
                          className="w-12 h-12 rounded-lg border-2 border-border shadow-sm transition-all cursor-pointer"
                          style={{ backgroundColor: couleurPrimaire || "#3b82f6" }}
                          onClick={() => document.getElementById('couleur_primaire_input')?.click()}
                        />
                        <Input
                          id="couleur_primaire_input"
                          type="color"
                          {...register("couleur_primaire")}
                          className="w-24 h-12 p-1 cursor-pointer"
                        />
                        <Input
                          type="text"
                          {...register("couleur_primaire")}
                          placeholder="#3b82f6"
                          className="flex-1 font-mono uppercase"
                          maxLength={7}
                          pattern="^#[0-9A-Fa-f]{6}$"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Cette couleur sera utilisée pour personnaliser l'interface du client
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="configuration" className="space-y-6 mt-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm">Configuration</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="statut">Statut</Label>
                      <Select onValueChange={(value) => setValue("statut", value)} defaultValue={client?.statut || "actif"}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-background border border-border z-50">
                          <SelectItem value="actif">Actif</SelectItem>
                          <SelectItem value="suspendu">Suspendu</SelectItem>
                          <SelectItem value="archivé">Archivé</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {clientSites && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm">Sites associés</h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          onOpenChange(false);
                          navigate(`/sites?client=${client.id}`);
                        }}
                      >
                        Gérer les sites
                      </Button>
                    </div>

                    <Card className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Nombre de sites</span>
                        <Badge variant="secondary">{clientSites.length}</Badge>
                      </div>
                    </Card>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="utilisateurs" className="space-y-6 mt-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Utilisateurs du client</h3>
                  <div className="flex items-center gap-2">
                    <Input placeholder="Rechercher..." value={""} onChange={() => {}} />
                    <Button variant="outline" size="sm" onClick={() => setShowUserModal(true)}>
                      Ajouter un utilisateur
                    </Button>
                  </div>
                </div>

                <div>
                  {/* Users table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr>
                          <th className="text-left p-2">Nom</th>
                          <th className="text-left p-2">Email</th>
                          <th className="text-left p-2">Rôles</th>
                          <th className="text-left p-2">Sites</th>
                          <th className="text-left p-2">Statut</th>
                          <th className="text-left p-2">Dernier accès</th>
                          <th className="text-left p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usersLoading ? (
                          <tr>
                            <td colSpan={7} className="text-center py-8">
                              <div className="flex items-center justify-center gap-2">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                <span className="text-muted-foreground">Chargement...</span>
                              </div>
                            </td>
                          </tr>
                        ) : users.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center py-8">
                              <div className="text-muted-foreground">
                                Aucun utilisateur trouvé
                              </div>
                            </td>
                          </tr>
                        ) : (
                          users.map((user) => (
                            <tr key={user.id} className="border-b border-border">
                              <td className="p-2">
                                <div className="font-medium">{user.prenom} {user.nom}</div>
                              </td>
                              <td className="p-2 text-muted-foreground">{user.email}</td>
                              <td className="p-2">
                                <Badge variant={user.role === 'super_admin' ? 'default' : 'secondary'}>
                                  {user.role === 'super_admin' ? 'Super Admin' :
                                   user.role === 'admin_client' ? 'Admin Client' :
                                   user.role === 'consultant' ? 'Consultant' :
                                   user.role === 'user' ? 'Utilisateur' :
                                   user.role}
                                </Badge>
                              </td>
                              <td className="p-2">
                                {user.sites && user.sites.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {user.sites.slice(0, 2).map((site: any) => (
                                      <Badge key={site.id} variant="outline" className="text-xs">
                                        {site.nom}
                                      </Badge>
                                    ))}
                                    {user.sites.length > 2 && (
                                      <Badge variant="outline" className="text-xs">
                                        +{user.sites.length - 2}
                                      </Badge>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-sm">Tous les sites</span>
                                )}
                              </td>
                              <td className="p-2">
                                <Badge variant={user.actif ? 'default' : 'secondary'}>
                                  {user.actif ? 'Actif' : 'Inactif'}
                                </Badge>
                              </td>
                              <td className="p-2 text-muted-foreground text-sm">
                                {user.last_access ? new Date(user.last_access).toLocaleDateString() : 'Jamais'}
                              </td>
                              <td className="p-2">
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditUser(user)}
                                  >
                                    Modifier
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button type="submit">
              {client ? "Modifier" : "Créer"}
            </Button>
          </div>
        </form>
        {/* Client User modal/drawer for add/edit */}
        {client?.id && (
          <ClientUserFormModal
            open={showUserModal}
            onOpenChange={(open) => {
              setShowUserModal(open);
              if (!open) setEditingUser(null);
            }}
            clientId={client.id}
            user={editingUser}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
