import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserType } from '@/hooks/useUserType';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, Upload, Shield, User } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface UserProfile {
  nom: string;
  prenom: string;
  email: string;
  avatar_url: string | null;
  timezone?: string;
  language?: string;
}

export default function AccountSettings() {
  const { user } = useAuth();
  const userType = useUserType();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    nom: '',
    prenom: '',
    email: '',
    avatar_url: null,
    timezone: 'Africa/Tunis',
    language: 'fr'
  });
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (user && userType !== 'loading') {
      loadProfile();
    }
  }, [user, userType]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Determine which table to query based on user type
      const tableName = userType === 'staff' ? 'staff_users' : 'client_users';
      
      const { data, error } = await supabase
        .from(tableName)
        .select('nom, prenom, email, avatar_url')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile({
          nom: (data as any).nom || '',
          prenom: (data as any).prenom || '',
          email: (data as any).email || user.email || '',
          avatar_url: (data as any).avatar_url || null,
          timezone: 'Africa/Tunis',
          language: 'fr'
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Erreur lors du chargement du profil');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      setSaving(true);
      const tableName = userType === 'staff' ? 'staff_users' : 'client_users';
      
      const { error } = await supabase
        .from(tableName)
        .update({
          nom: profile.nom,
          prenom: profile.prenom,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Profil mis à jour avec succès');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Erreur lors de la sauvegarde du profil');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error('Veuillez remplir tous les champs du mot de passe');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    try {
      setSaving(true);
      
      // Verify old password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: oldPassword
      });

      if (signInError) {
        toast.error('Ancien mot de passe incorrect');
        return;
      }

      // Update to new password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success('Mot de passe modifié avec succès');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Erreur lors du changement de mot de passe');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 2 MB');
      return;
    }

    try {
      setUploadingAvatar(true);
      
      // Create unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const tableName = userType === 'staff' ? 'staff_users' : 'client_users';
      const { error: updateError } = await supabase
        .from(tableName)
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
      toast.success('Photo de profil mise à jour');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Erreur lors du téléchargement de l\'image');
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Picture */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Photo de profil
          </CardTitle>
          <CardDescription>
            Votre image de profil sera visible par les autres utilisateurs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="text-2xl">
                {profile.prenom?.[0]}{profile.nom?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <Label htmlFor="avatar-upload" className="cursor-pointer">
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploadingAvatar}
                  asChild
                >
                  <span>
                    {uploadingAvatar ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Téléchargement...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Changer la photo
                      </>
                    )}
                  </span>
                </Button>
              </Label>
              <Input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
              <p className="text-xs text-muted-foreground">
                JPG, PNG ou GIF. Max 2 MB.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informations personnelles</CardTitle>
          <CardDescription>
            Mettez à jour vos informations de base
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="prenom">Prénom</Label>
              <Input
                id="prenom"
                value={profile.prenom}
                onChange={(e) => setProfile(prev => ({ ...prev, prenom: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nom">Nom</Label>
              <Input
                id="nom"
                value={profile.nom}
                onChange={(e) => setProfile(prev => ({ ...prev, nom: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={profile.email}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              L'email ne peut pas être modifié pour des raisons de sécurité
            </p>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="timezone">Fuseau horaire</Label>
              <Select value={profile.timezone} onValueChange={(value) => setProfile(prev => ({ ...prev, timezone: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Africa/Tunis">Tunis (GMT+1)</SelectItem>
                  <SelectItem value="Europe/Paris">Paris (GMT+1)</SelectItem>
                  <SelectItem value="UTC">UTC (GMT+0)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">Langue</Label>
              <Select value={profile.language} onValueChange={(value) => setProfile(prev => ({ ...prev, language: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ar">العربية</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleSaveProfile} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer les modifications
          </Button>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle>Mot de passe</CardTitle>
          <CardDescription>
            Modifiez votre mot de passe
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="old-password">Ancien mot de passe</Label>
            <Input
              id="old-password"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Votre mot de passe actuel"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">Nouveau mot de passe</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 caractères"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Retapez le nouveau mot de passe"
            />
          </div>
          <Button onClick={handleChangePassword} disabled={saving} variant="secondary">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Changer le mot de passe
          </Button>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Sécurité du compte
          </CardTitle>
          <CardDescription>
            Gérez les paramètres de sécurité avancés
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline">
            <Shield className="mr-2 h-4 w-4" />
            Gérer la sécurité du compte
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            Configuration de l'authentification à deux facteurs, sessions actives, etc.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
