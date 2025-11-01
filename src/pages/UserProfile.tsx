import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabaseAny as supabase } from "@/lib/supabase-any";
import { usersQueries } from "@/lib/users-queries";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Camera, 
  Edit, 
  Save, 
  X,
  Building2,
  Calendar,
  Key,
  ArrowLeft
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const profileFormSchema = z.object({
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(50),
  prenom: z.string().min(2, "Le prénom doit contenir au moins 2 caractères").max(50),
  telephone: z.string().regex(/^(?:(?:\+|00)33|0)[1-9](?:\d{8})$/, "Format de téléphone invalide").optional().or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function UserProfile() {
  const { user, primaryRole, allRoles } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Fetch user profile data
  const { data: profile, isLoading } = useQuery({
    queryKey: ["user-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      nom: profile?.nom || "",
      prenom: profile?.prenom || "",
      telephone: profile?.telephone || "",
    },
    values: {
      nom: profile?.nom || "",
      prenom: profile?.prenom || "",
      telephone: profile?.telephone || "",
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      if (!user?.id) throw new Error("User not authenticated");
      return usersQueries.update(user.id, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      toast.success("Profil mis à jour avec succès");
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de la mise à jour du profil");
    },
  });

  // Upload avatar mutation
  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!user?.id) throw new Error("User not authenticated");
      
      // 1. Delete old avatar if exists
      if (profile?.avatar_url) {
        try {
          const oldPath = profile.avatar_url.split('/').slice(-2).join('/');
          await supabase.storage.from('avatars').remove([oldPath]);
        } catch (error) {
          console.warn("Could not delete old avatar:", error);
        }
      }
      
      // 2. Upload new avatar
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { 
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw new Error(`Erreur d'upload: ${uploadError.message}`);
      }

      // 3. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // 4. Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) {
        console.error("Profile update error:", updateError);
        throw new Error(`Erreur de mise à jour: ${updateError.message}`);
      }

      return publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      toast.success("Avatar mis à jour avec succès");
      setAvatarFile(null);
      setAvatarPreview(null);
    },
    onError: (error: any) => {
      console.error("Avatar upload failed:", error);
      toast.error(error.message || "Erreur lors de l'upload de l'avatar");
    },
  });

  // Delete avatar mutation
  const deleteAvatarMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");
      if (!profile?.avatar_url) throw new Error("No avatar to delete");
      
      // 1. Delete from storage
      try {
        const filePath = profile.avatar_url.split('/').slice(-2).join('/');
        const { error: storageError } = await supabase.storage
          .from('avatars')
          .remove([filePath]);
        
        if (storageError) {
          console.warn("Storage deletion error:", storageError);
        }
      } catch (error) {
        console.warn("Could not delete from storage:", error);
      }
      
      // 2. Update profile (remove avatar_url)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      toast.success("Avatar supprimé avec succès");
    },
    onError: (error: any) => {
      console.error("Avatar deletion failed:", error);
      toast.error(error.message || "Erreur lors de la suppression de l'avatar");
    },
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("La taille du fichier ne doit pas dépasser 2 MB");
      return;
    }

    // Validate file type with allowed MIME types
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Format non supporté. Utilisez JPG, PNG, WEBP ou GIF");
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarUpload = () => {
    if (avatarFile) {
      uploadAvatarMutation.mutate(avatarFile);
    }
  };

  const onSubmit = (values: ProfileFormValues) => {
    updateProfileMutation.mutate(values);
  };

  const getInitials = () => {
    if (profile?.prenom && profile?.nom) {
      return `${profile.prenom[0]}${profile.nom[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return "??";
  };

  const getRoleLabel = (role: string) => {
    const roleLabels: Record<string, string> = {
      // Team roles
      super_admin: "Super Admin",
      "Super Admin": "Super Admin",
      admin_global: "Admin Global",
      "Admin Global": "Admin Global",
      gestionnaire_hse: "Gestionnaire HSE",
      chef_site: "Chef de Site",
      "Manager HSE": "Manager HSE",
      "Analyst": "Analyste",
      "Viewer": "Visualiseur",
      
      // Client roles (synthetic)
      "Administrateur Client": "Administrateur Client",
      "Utilisateur Client": "Utilisateur Client",
    };
    return roleLabels[role] || role;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar with Return Button */}
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center gap-4 px-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au tableau de bord
          </Button>
          <h1 className="text-lg font-semibold">Mon Profil</h1>
        </div>
      </div>

      {/* Content */}
      <div className="w-full py-6 space-y-6 px-4 max-w-7xl mx-auto">
        {/* Header Section */}
        <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <div className="relative group">
              <Avatar className="h-24 w-24 ring-4 ring-sidebar-primary/10">
                <AvatarImage src={avatarPreview || profile?.avatar_url || ""} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              
              {/* Show loader during upload */}
              {uploadAvatarMutation.isPending && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              )}
              
              {/* Upload overlay */}
              {!uploadAvatarMutation.isPending && (
                <label
                  htmlFor="avatar-upload"
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Camera className="h-6 w-6 text-white" />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleAvatarChange}
                    disabled={uploadAvatarMutation.isPending}
                  />
                </label>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">
                  {profile?.prenom} {profile?.nom}
                </h1>
                <Badge variant={profile?.actif ? "default" : "secondary"}>
                  {profile?.actif ? "Actif" : "Inactif"}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{user?.email}</span>
              </div>
              {primaryRole && (
                <Badge variant="secondary" className="w-fit">
                  <Shield className="h-3 w-3 mr-1" />
                  {getRoleLabel(String(primaryRole))}
                </Badge>
              )}
              {profile?.created_at && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Membre depuis le {format(new Date(profile.created_at), "d MMMM yyyy", { locale: fr })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Avatar Actions */}
          {avatarPreview && (
            <div className="flex gap-2 mt-4">
              <Button
                onClick={handleAvatarUpload}
                disabled={uploadAvatarMutation.isPending}
                size="sm"
              >
                {uploadAvatarMutation.isPending ? "Upload..." : "Enregistrer l'avatar"}
              </Button>
              <Button
                onClick={() => {
                  setAvatarFile(null);
                  setAvatarPreview(null);
                }}
                variant="outline"
                size="sm"
              >
                Annuler
              </Button>
            </div>
          )}
          {profile?.avatar_url && !avatarPreview && (
            <Button
              onClick={() => deleteAvatarMutation.mutate()}
              variant="outline"
              size="sm"
              className="mt-4"
              disabled={deleteAvatarMutation.isPending}
            >
              Supprimer l'avatar
            </Button>
          )}
        </CardHeader>
      </Card>

      {/* Personal Information Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informations personnelles
            </CardTitle>
            <CardDescription>Gérez vos informations de profil</CardDescription>
          </div>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="prenom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prénom</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!isEditing} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!isEditing} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user?.email || ""} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">
                  L'email ne peut pas être modifié directement. Contactez un administrateur.
                </p>
              </div>

              <FormField
                control={form.control}
                name="telephone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <Input {...field} disabled={!isEditing} placeholder="+33 6 12 34 56 78" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isEditing && (
                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={updateProfileMutation.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    {updateProfileMutation.isPending ? "Enregistrement..." : "Enregistrer"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      form.reset();
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Annuler
                  </Button>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Security Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Sécurité
          </CardTitle>
          <CardDescription>Gérez la sécurité de votre compte</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Mot de passe</p>
              <p className="text-sm text-muted-foreground">
                Dernière modification : Non disponible
              </p>
            </div>
            <Button onClick={() => setPasswordDialogOpen(true)} variant="outline">
              <Key className="h-4 w-4 mr-2" />
              Changer le mot de passe
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Informations système
          </CardTitle>
          <CardDescription>Détails techniques de votre compte</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Rôles assignés</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {allRoles.length > 0 ? (
                  allRoles.map((role, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      <Shield className="h-3 w-3" />
                      {getRoleLabel(role.name)}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Aucun rôle assigné</p>
                )}
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-muted-foreground">ID Utilisateur</Label>
                <p className="font-mono text-xs mt-1 break-all">{user?.id}</p>
              </div>
              {profile?.tenant_id && (
                <div>
                  <Label className="text-muted-foreground">Tenant ID</Label>
                  <p className="font-mono text-xs mt-1 break-all">{profile.tenant_id}</p>
                </div>
              )}
              {profile?.created_at && (
                <div>
                  <Label className="text-muted-foreground">Date de création</Label>
                  <p className="mt-1">
                    {format(new Date(profile.created_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                  </p>
                </div>
              )}
              {profile?.updated_at && (
                <div>
                  <Label className="text-muted-foreground">Dernière mise à jour</Label>
                  <p className="mt-1">
                    {format(new Date(profile.updated_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <ChangePasswordDialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen} />
      </div>
    </div>
  );
}
