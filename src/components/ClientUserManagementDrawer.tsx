import { useState } from "react";
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabaseAny as supabase } from "@/lib/supabase-any";
import { useToast } from "@/hooks/use-toast";
import { Shield, Briefcase, User as UserIcon, Upload } from "lucide-react";
import { PermissionMatrix } from "@/components/roles/PermissionMatrix";
import { MODULES, ACTIONS, type PermissionScope } from "@/types/roles";

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
  const [permissions, setPermissions] = useState<any[]>([]);
  const [scope, setScope] = useState<PermissionScope>("tenant");
  const [selectedDomaines, setSelectedDomaines] = useState<string[]>([]);
  const [profileData, setProfileData] = useState({
    nom: "",
    prenom: "",
    telephone: "",
    actif: true,
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");

  // Fetch user permissions
  const { data: userPermissions, isLoading: loadingPermissions } = useQuery({
    queryKey: ["user-permissions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_permissions")
        .select("*")
        .eq("user_id", user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && open,
  });

  // Fetch user domain scopes
  const { data: userDomains, isLoading: loadingDomains } = useQuery({
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
        .order("libelle");
      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  // Initialize states when data loads
  useState(() => {
    if (userPermissions) {
      setPermissions(userPermissions);
    }
    if (userDomains) {
      setSelectedDomaines(userDomains);
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
  });

  // Save permissions mutation
  const savePermissionsMutation = useMutation({
    mutationFn: async () => {
      const permissionsToSave = permissions.filter(p => p.decision !== 'inherit');
      
      // Delete existing permissions
      await supabase
        .from("user_permissions")
        .delete()
        .eq("user_id", user.id);

      // Insert new permissions
      if (permissionsToSave.length > 0) {
        const { error } = await supabase
          .from("user_permissions")
          .insert(
            permissionsToSave.map(p => ({
              user_id: user.id,
              module: p.module,
              action: p.action,
              decision: p.decision,
              scope: scope,
            }))
          );
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-permissions", user.id] });
      toast({
        title: "Permissions mises à jour",
        description: "Les permissions de l'utilisateur ont été enregistrées.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les permissions.",
        variant: "destructive",
      });
    },
  });

  // Save domains mutation
  const saveDomainsMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("set_user_domain_scopes", {
        target_user_id: user.id,
        domaine_ids: selectedDomaines,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-domains", user.id] });
      toast({
        title: "Domaines mis à jour",
        description: "Les domaines de veille réglementaire ont été enregistrés.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les domaines.",
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
        .from("profiles")
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
    onError: (error) => {
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

  if (!user) return null;

  const userInitials = `${user.prenom?.charAt(0) || ""}${user.nom?.charAt(0) || ""}`.toUpperCase() || "U";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Gestion de l'utilisateur</SheetTitle>
          <SheetDescription>
            {user.prenom} {user.nom} ({user.email})
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="permissions" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="permissions">
              <Shield className="h-4 w-4 mr-2" />
              Permissions
            </TabsTrigger>
            <TabsTrigger value="domaines">
              <Briefcase className="h-4 w-4 mr-2" />
              Domaines
            </TabsTrigger>
            <TabsTrigger value="profile">
              <UserIcon className="h-4 w-4 mr-2" />
              Profil
            </TabsTrigger>
          </TabsList>

          {/* Permissions Tab */}
          <TabsContent value="permissions" className="space-y-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Configurez les permissions individuelles pour cet utilisateur.
              </p>
              <PermissionMatrix
                permissions={permissions}
                onPermissionsChange={setPermissions}
                scope={scope}
                onScopeChange={setScope}
              />
              <div className="flex justify-end">
                <Button
                  onClick={() => savePermissionsMutation.mutate()}
                  disabled={savePermissionsMutation.isPending}
                >
                  {savePermissionsMutation.isPending ? "Enregistrement..." : "Enregistrer les permissions"}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Domaines Tab */}
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
                  onClick={() => setSelectedDomaines(allDomaines.map(d => d.id))}
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
                <div className="space-y-3">
                  {allDomaines.map((domaine) => (
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
