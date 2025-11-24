import { useState, useEffect, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabaseAny as supabase } from "@/lib/supabase-any";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Briefcase, User as UserIcon, Upload, ChevronRight } from "lucide-react";
import { PermissionMatrix } from "@/components/roles/PermissionMatrix";
import { cn } from "@/lib/utils";
import {
  fetchUserSitesWithPermissions,
  fetchSitePermissions,
  saveSitePermissions,
  listDomaines,
  listEnabledModuleCodesForSite,
  listEnabledDomainIdsForSites,
} from "@/lib/multi-tenant-queries";
import type { PermissionScope } from "@/types/roles";
import { SiteModulesQuickConfig } from "@/components/permissions/SiteModulesQuickConfig";
import { Badge } from "@/components/ui/badge";

interface ClientUserManagementDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
  clientId: string;
}

export function ClientUserManagementDrawer({
  open,
  onOpenChange,
  user,
  clientId,
}: ClientUserManagementDrawerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDomaines, setSelectedDomaines] = useState<string[]>([]);
  const [profileData, setProfileData] = useState({
    nom: "",
    prenom: "",
    telephone: "",
    actif: true,
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [expandedSite, setExpandedSite] = useState<string | null>(null);
  const [sitePermissions, setSitePermissions] = useState<Record<string, any[]>>({});
  const [siteScopes, setSiteScopes] = useState<Record<string, PermissionScope>>({});

  // Fetch user's sites with permission counts
  const { data: userSites = [], isLoading: loadingSites, error: sitesError, refetch: refetchSites } = useQuery({
    queryKey: ["user-sites-permissions", user?.id],
    queryFn: async () => {
      console.log('Fetching sites for user:', user.id);
      const data = await fetchUserSitesWithPermissions(user.id);
      console.log('Sites fetched:', data);
      return data;
    },
    enabled: !!user?.id && open,
  });

  // Get site IDs for filtering domains
  const siteIds = useMemo(() => userSites.map(s => s.site_id), [userSites]);

  // Fetch enabled domains for all user's sites (staff-authorized domains)
  const { data: enabledDomainIds = [] } = useQuery({
    queryKey: ["user-sites-enabled-domaines", user?.id, siteIds],
    queryFn: () => listEnabledDomainIdsForSites(siteIds),
    enabled: !!user?.id && open && siteIds.length > 0,
  });

  // Fetch permissions for expanded site
  const { data: currentSitePerms, isLoading: loadingCurrentSitePerms } = useQuery({
    queryKey: ["site-permissions", user?.id, expandedSite],
    queryFn: () => fetchSitePermissions(user.id, expandedSite!),
    enabled: !!user?.id && !!expandedSite && open,
  });

  // Fetch enabled modules for the expanded site
  const { 
    data: enabledModulesForSite = [], 
    error: modulesError,
    isLoading: loadingModules 
  } = useQuery({
    queryKey: ["site-enabled-modules", expandedSite],
    queryFn: async () => {
      const modules = await listEnabledModuleCodesForSite(expandedSite!);
      console.log('🔍 Modules enabled for site', expandedSite, ':', modules);
      return modules;
    },
    enabled: !!expandedSite && open,
  });

  // Update site permissions when fetched
  useEffect(() => {
    if (currentSitePerms && expandedSite) {
      setSitePermissions(prev => ({
        ...prev,
        [expandedSite]: currentSitePerms.map(p => ({
          module: p.module,
          action: p.action,
          decision: p.decision,
        })),
      }));
      
      if (currentSitePerms.length > 0) {
        setSiteScopes(prev => ({
          ...prev,
          [expandedSite]: currentSitePerms[0].scope as PermissionScope,
        }));
      }
    }
  }, [currentSitePerms, expandedSite]);

  // Pre-populate permission matrix with 'inherit' for all available modules/actions
  // This ensures clicking cells works even when no permissions exist yet
  useEffect(() => {
    if (expandedSite && enabledModulesForSite.length > 0) {
      // Only initialize if no permissions exist for this site yet
      if (!sitePermissions[expandedSite] || sitePermissions[expandedSite].length === 0) {
        const actions = ['view', 'create', 'edit', 'delete', 'approve', 'export'];
        const initialPerms: any[] = [];
        
        enabledModulesForSite.forEach(moduleCode => {
          actions.forEach(actionCode => {
            initialPerms.push({
              module: moduleCode.toLowerCase(),
              action: actionCode,
              decision: 'inherit',
            });
          });
        });
        
        setSitePermissions(prev => ({
          ...prev,
          [expandedSite]: initialPerms,
        }));
      }
    }
  }, [expandedSite, enabledModulesForSite]);

  // Fetch user domain scopes
  const { data: userDomains } = useQuery({
    queryKey: ["user-domains", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_domain_scopes")
        .select("domaine_id")
        .eq("user_id", user.id);
      if (error) throw error;
      return data?.map(d => d.domaine_id) || [];
    },
    enabled: !!user?.id && open,
  });

  // Fetch all domaines
  const { data: allDomaines = [] } = useQuery({
    queryKey: ["domaines-reglementaires"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("domaines_reglementaires")
        .select("*")
        .eq("actif", true)
        .is("deleted_at", null)
        .order("libelle");
      if (error) throw error;
      return data || [];
    },
    enabled: open,
    refetchOnMount: "always",
    staleTime: 0,
  });

  // Filter displayed domains to only enabled ones
  const displayDomaines = useMemo(
    () => allDomaines.filter(d => enabledDomainIds.includes(d.id)),
    [allDomaines, enabledDomainIds]
  );

  // Initialize states when data loads
  useEffect(() => {
    if (userDomains) {
      const safeSelection = userDomains.filter((id) => enabledDomainIds.includes(id));
      setSelectedDomaines(safeSelection);
    }
    if (user) {
      setProfileData({
        nom: user.nom || "",
        prenom: user.prenom || "",
        telephone: user.telephone || "",
        actif: user.actif ?? true,
      });
      setAvatarPreview(user.avatar_url || "");
    }
  }, [userDomains, user, enabledDomainIds]);

  // Save site permissions mutation
  const saveSitePermissionsMutation = useMutation({
    mutationFn: async ({ siteId }: { siteId: string }) => {
      const perms = sitePermissions[siteId] || [];
      const scope = siteScopes[siteId] || 'site';
      
      // Send ALL permissions to RPC - it will filter out 'inherit' on the backend
      const permissionsToSave = perms.map(p => ({
        module: p.module,
        action: p.action,
        decision: p.decision,
        scope: scope,
      }));
      
      // Check if user has actually configured any permissions (at least one non-inherit)
      const hasActualPermissions = perms.some(p => p.decision !== 'inherit');
      if (!hasActualPermissions) {
        throw new Error("Aucune permission configurée. Cliquez sur les cellules pour autoriser ou refuser des permissions.");
      }
      
      console.log('💾 Saving site permissions:', {
        userId: user.id,
        siteId,
        clientId,
        permissions: permissionsToSave,
        permissionCount: permissionsToSave.length,
        nonInheritCount: permissionsToSave.filter(p => p.decision !== 'inherit').length,
        timestamp: new Date().toISOString()
      });

      const result = await saveSitePermissions(user.id, siteId, clientId, permissionsToSave);
      console.log('✅ Permissions saved successfully:', result);
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["user-sites-permissions", user.id] });
      queryClient.invalidateQueries({ queryKey: ["site-permissions", user.id, variables.siteId] });
      toast({
        title: "Permissions mises à jour",
        description: "Les permissions pour ce site ont été enregistrées.",
      });
    },
    onError: (error: any) => {
      console.error('❌ Permission save mutation error:', error);
      toast({
        title: "Erreur",
        description: error?.message || error?.details || "Impossible de sauvegarder les permissions.",
        variant: "destructive",
      });
    },
  });

  // Save domains mutation
  const saveDomainsMutation = useMutation({
    mutationFn: async () => {
      console.log('💾 Saving user domains:', {
        userId: user.id,
        domaineIds: selectedDomaines,
        domainCount: selectedDomaines.length,
        timestamp: new Date().toISOString()
      });

      const { data, error } = await supabase.rpc("set_user_domain_scopes", {
        target_user_id: user.id,
        domaine_ids: selectedDomaines,
      });

      if (error) {
        console.error('❌ Error saving domains:', {
          error,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log('✅ Domains saved successfully:', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-domains", user.id] });
      toast({
        title: "Domaines mis à jour",
        description: "Les domaines de veille réglementaire ont été enregistrés.",
      });
    },
    onError: (error: any) => {
      console.error('❌ Domain save mutation error:', error);
      toast({
        title: "Erreur",
        description: error?.message || error?.details || "Impossible de sauvegarder les domaines.",
        variant: "destructive",
      });
    },
  });

  // Save profile mutation
  const saveProfileMutation = useMutation({
    mutationFn: async () => {
      let avatarUrl = user.avatar_url;

      // Upload avatar if changed
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("client-logos")
          .upload(filePath, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("client-logos")
          .getPublicUrl(filePath);

        avatarUrl = publicUrl;
      }

      // Update profile
      const { error } = await supabase
        .from("client_users")
        .update({
          nom: profileData.nom,
          prenom: profileData.prenom,
          telephone: profileData.telephone,
          actif: profileData.actif,
          avatar_url: avatarUrl,
        })
        .eq("id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-client-users"] });
      queryClient.invalidateQueries({ queryKey: ["client-users"] });
      toast({
        title: "Profil mis à jour",
        description: "Les informations du profil ont été enregistrées.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le profil.",
        variant: "destructive",
      });
    },
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleDomaine = (domaineId: string) => {
    setSelectedDomaines(prev =>
      prev.includes(domaineId)
        ? prev.filter(id => id !== domaineId)
        : [...prev, domaineId]
    );
  };

  const updateSitePermissions = (siteId: string, perms: any[]) => {
    setSitePermissions(prev => ({
      ...prev,
      [siteId]: perms,
    }));
  };

  const updateSiteScope = (siteId: string, scope: PermissionScope) => {
    setSiteScopes(prev => ({
      ...prev,
      [siteId]: scope,
    }));
  };

  // Check if user has access to Bibliothèque réglementaire module
  const hasBibliothequeAccess = useMemo(() => {
    return Object.values(sitePermissions).some(perms => 
      perms.some(p => 
        p.module === 'bibliotheque' && 
        p.decision === 'allow'
      )
    );
  }, [sitePermissions]);

  if (!user) return null;

  const userInitials = `${user.prenom?.charAt(0) || ""}${user.nom?.charAt(0) || ""}`.toUpperCase() || "U";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Gestion de l'utilisateur</SheetTitle>
          <SheetDescription>
            {user.prenom} {user.nom} ({user.email})
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="sites" className="mt-6">
          <TabsList className={cn(
            "grid w-full",
            hasBibliothequeAccess ? "grid-cols-3" : "grid-cols-2"
          )}>
            <TabsTrigger value="sites">
              <MapPin className="h-4 w-4 mr-2" />
              Sites & Permissions
            </TabsTrigger>
            {hasBibliothequeAccess && (
              <TabsTrigger value="domaines">
                <Briefcase className="h-4 w-4 mr-2" />
                Domaines
              </TabsTrigger>
            )}
            <TabsTrigger value="profile">
              <UserIcon className="h-4 w-4 mr-2" />
              Profil
            </TabsTrigger>
          </TabsList>

          {/* Sites & Permissions Tab */}
          <TabsContent value="sites" className="space-y-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Gérez les permissions de cet utilisateur pour chaque site auquel il a accès.
              </p>

              {loadingSites ? (
                <div className="text-center py-8 text-muted-foreground">
                  Chargement des sites...
                </div>
              ) : sitesError ? (
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div className="text-center text-destructive">
                      <p className="font-semibold">Erreur lors du chargement des sites</p>
                      <p className="text-sm mt-2">{sitesError.message}</p>
                    </div>
                    <div className="flex justify-center">
                      <Button onClick={() => refetchSites()} variant="outline">
                        Réessayer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : userSites.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    <p>Cet utilisateur n'a pas encore été assigné à des sites.</p>
                    <p className="text-sm mt-2">Utilisez le formulaire d'édition pour lui donner accès à des sites.</p>
                  </CardContent>
                </Card>
              ) : (
                <Accordion
                  type="single"
                  collapsible
                  value={expandedSite || undefined}
                  onValueChange={setExpandedSite}
                >
                  {userSites.map((site: any) => {
                    const siteModuleCount = enabledModulesForSite.length;
                    const isCurrentSite = expandedSite === site.site_id;
                    
                    return (
                      <AccordionItem key={site.site_id} value={site.site_id}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center justify-between w-full pr-4">
                            <div className="flex items-center gap-3">
                              <MapPin className="h-5 w-5 text-primary" />
                              <div className="text-left">
                                <div className="font-medium">{site.site_name}</div>
                                <div className="text-xs text-muted-foreground flex items-center gap-2">
                                  {site.permission_count || 0} permission(s) configurée(s)
                                  {isCurrentSite && siteModuleCount > 0 && (
                                    <Badge variant="secondary" className="text-xs">
                                      {siteModuleCount} module{siteModuleCount > 1 ? 's' : ''}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            {!site.site_active && (
                              <span className="text-xs bg-muted px-2 py-1 rounded">Inactif</span>
                            )}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="pt-4 space-y-4">
                            {loadingCurrentSitePerms && expandedSite === site.site_id ? (
                              <div className="text-center py-4 text-muted-foreground">
                                Chargement des permissions...
                              </div>
                            ) : modulesError && expandedSite === site.site_id ? (
                              <Card className="border-destructive">
                                <CardContent className="pt-6 text-center">
                                  <p className="text-destructive font-medium">Erreur lors du chargement des modules</p>
                                  <p className="text-sm text-muted-foreground mt-2">
                                    {modulesError instanceof Error ? modulesError.message : 'Erreur inconnue'}
                                  </p>
                                </CardContent>
                              </Card>
                            ) : loadingModules && expandedSite === site.site_id ? (
                              <div className="text-center py-4 text-muted-foreground">
                                Chargement des modules...
                              </div>
                            ) : expandedSite === site.site_id && enabledModulesForSite.length === 0 ? (
                              <SiteModulesQuickConfig 
                                siteId={site.site_id}
                                siteName={site.site_name}
                                onModulesEnabled={() => {
                                  queryClient.invalidateQueries({ queryKey: ["site-enabled-modules", site.site_id] });
                                }}
                              />
                            ) : (
                              <>
                                <PermissionMatrix
                                  permissions={sitePermissions[site.site_id] || []}
                                  onPermissionsChange={(perms) => updateSitePermissions(site.site_id, perms)}
                                  scope={siteScopes[site.site_id] || 'site'}
                                  onScopeChange={(scope) => updateSiteScope(site.site_id, scope)}
                                  roleType="client"
                                  userType="client"
                                  siteId={site.site_id}
                                  modules={expandedSite === site.site_id ? enabledModulesForSite : []}
                                />
                                <div className="flex justify-end gap-2">
                                  <div className="text-sm text-muted-foreground self-center">
                                    {(() => {
                                      const perms = sitePermissions[site.site_id] || [];
                                      const configuredCount = perms.filter(p => p.decision !== 'inherit').length;
                                      return configuredCount > 0 
                                        ? `${configuredCount} permission(s) configurée(s)` 
                                        : 'Aucune permission configurée';
                                    })()}
                                  </div>
                                  <Button
                                    onClick={() => saveSitePermissionsMutation.mutate({ siteId: site.site_id })}
                                    disabled={saveSitePermissionsMutation.isPending}
                                  >
                                    {saveSitePermissionsMutation.isPending 
                                      ? "Enregistrement..." 
                                      : "Enregistrer les permissions"
                                    }
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              )}
            </div>
          </TabsContent>

          {/* Domaines Tab - Only show if user has Bibliothèque access */}
          {hasBibliothequeAccess && (
            <TabsContent value="domaines" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Domaines de veille réglementaire</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Sélectionnez les domaines réglementaires auxquels cet utilisateur a accès.
                  </p>
                </div>

                <div className="flex gap-2 mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDomaines(displayDomaines.map(d => d.id))}
                  >
                    Tout sélectionner
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDomaines([])}
                  >
                    Tout effacer
                  </Button>
                </div>

                <ScrollArea className="h-[400px] border rounded-lg p-4">
                  {displayDomaines.length > 0 ? (
                    <div className="space-y-3">
                      {displayDomaines.map((domaine) => (
                        <div key={domaine.id} className="flex items-center gap-3 py-2">
                          <Checkbox
                            id={`domaine-${domaine.id}`}
                            checked={selectedDomaines.includes(domaine.id)}
                            onCheckedChange={() => toggleDomaine(domaine.id)}
                          />
                          <label
                            htmlFor={`domaine-${domaine.id}`}
                            className="flex-1 cursor-pointer text-sm font-medium"
                          >
                            {domaine.libelle}
                            {domaine.description && (
                              <span className="text-muted-foreground block text-xs">
                                {domaine.description}
                              </span>
                            )}
                          </label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Aucun domaine activé par le staff pour les sites de cet utilisateur.
                    </p>
                  )}
                </ScrollArea>

                <div className="flex justify-end">
                  <Button
                    onClick={() => saveDomainsMutation.mutate()}
                    disabled={saveDomainsMutation.isPending}
                  >
                    {saveDomainsMutation.isPending ? "Enregistrement..." : "Enregistrer les domaines"}
                  </Button>
                </div>
              </div>
            </TabsContent>
          )}

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            <div className="space-y-6">
              {/* Avatar Upload */}
              <div className="flex flex-col items-center gap-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatarPreview} />
                  <AvatarFallback className="text-2xl">{userInitials}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-center gap-2">
                  <Label
                    htmlFor="avatar-upload"
                    className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
                  >
                    <Upload className="h-4 w-4" />
                    Changer la photo
                  </Label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG ou GIF, max 2MB
                  </p>
                </div>
              </div>

              {/* Profile Fields */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="prenom">Prénom</Label>
                  <Input
                    id="prenom"
                    value={profileData.prenom}
                    onChange={(e) =>
                      setProfileData({ ...profileData, prenom: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="nom">Nom</Label>
                  <Input
                    id="nom"
                    value={profileData.nom}
                    onChange={(e) =>
                      setProfileData({ ...profileData, nom: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="telephone">Téléphone</Label>
                  <Input
                    id="telephone"
                    value={profileData.telephone}
                    onChange={(e) =>
                      setProfileData({ ...profileData, telephone: e.target.value })
                    }
                  />
                </div>

                <div className="flex items-center justify-between py-3 border border-border rounded-lg px-4">
                  <div>
                    <Label htmlFor="actif" className="cursor-pointer">
                      Compte actif
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Désactiver empêchera l'utilisateur de se connecter
                    </p>
                  </div>
                  <Switch
                    id="actif"
                    checked={profileData.actif}
                    onCheckedChange={(checked) =>
                      setProfileData({ ...profileData, actif: checked })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => saveProfileMutation.mutate()}
                  disabled={saveProfileMutation.isPending}
                >
                  {saveProfileMutation.isPending ? "Enregistrement..." : "Enregistrer le profil"}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
