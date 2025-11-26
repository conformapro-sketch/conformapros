import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, Upload, Building2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ClientOrganization {
  id: string;
  nom: string;
  nom_legal: string | null;
  email: string | null;
  telephone: string | null;
  siret: string | null;
  adresse: string | null;
  code_postal: string | null;
  pays: string | null;
  logo_url: string | null;
}

export default function OrganizationSettings() {
  const { user, getClientId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [organization, setOrganization] = useState<ClientOrganization>({
    id: '',
    nom: '',
    nom_legal: null,
    email: null,
    telephone: null,
    siret: null,
    adresse: null,
    code_postal: null,
    pays: 'Tunisie',
    logo_url: null,
  });

  useEffect(() => {
    if (user) {
      loadOrganization();
    }
  }, [user]);

  const loadOrganization = async () => {
    const clientId = getClientId();
    if (!clientId) {
      toast.error('Impossible de charger les informations de l\'organisation');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();

      if (error) throw error;

      if (data) {
        setOrganization(data);
      }
    } catch (error) {
      console.error('Error loading organization:', error);
      toast.error('Erreur lors du chargement des informations');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!organization.id) {
      toast.error('ID de l\'organisation manquant');
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from('clients')
        .update({
          nom: organization.nom,
          nom_legal: organization.nom_legal,
          email: organization.email,
          telephone: organization.telephone,
          siret: organization.siret,
          adresse: organization.adresse,
          code_postal: organization.code_postal,
          pays: organization.pays,
        })
        .eq('id', organization.id);

      if (error) throw error;

      toast.success('Informations mises à jour avec succès');
    } catch (error) {
      console.error('Error saving organization:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !organization.id) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 5 MB');
      return;
    }

    try {
      setUploadingLogo(true);

      // Create unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${organization.id}-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('client-logos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('client-logos')
        .getPublicUrl(filePath);

      // Update organization with new logo URL
      const { error: updateError } = await supabase
        .from('clients')
        .update({ logo_url: publicUrl })
        .eq('id', organization.id);

      if (updateError) throw updateError;

      setOrganization(prev => ({ ...prev, logo_url: publicUrl }));
      toast.success('Logo mis à jour avec succès');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Erreur lors du téléchargement du logo');
    } finally {
      setUploadingLogo(false);
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
      {/* Logo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Logo de l'organisation
          </CardTitle>
          <CardDescription>
            Votre logo sera utilisé dans les documents et rapports
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24 rounded-lg">
              <AvatarImage src={organization.logo_url || undefined} className="object-contain" />
              <AvatarFallback className="rounded-lg text-2xl">
                {organization.nom?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <Label htmlFor="logo-upload" className="cursor-pointer">
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploadingLogo}
                  asChild
                >
                  <span>
                    {uploadingLogo ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Téléchargement...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Changer le logo
                      </>
                    )}
                  </span>
                </Button>
              </Label>
              <Input
                id="logo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
              <p className="text-xs text-muted-foreground">
                PNG, JPG ou SVG. Max 5 MB.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informations de l'entreprise</CardTitle>
          <CardDescription>
            Gérez les informations de votre organisation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom commercial</Label>
              <Input
                id="nom"
                value={organization.nom}
                onChange={(e) => setOrganization(prev => ({ ...prev, nom: e.target.value }))}
                placeholder="Ex: ConformaPro"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nom_legal">Raison sociale</Label>
              <Input
                id="nom_legal"
                value={organization.nom_legal || ''}
                onChange={(e) => setOrganization(prev => ({ ...prev, nom_legal: e.target.value }))}
                placeholder="Ex: ConformaPro SARL"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="siret">SIRET / Matricule Fiscal</Label>
            <Input
              id="siret"
              value={organization.siret || ''}
              onChange={(e) => setOrganization(prev => ({ ...prev, siret: e.target.value }))}
              placeholder="Ex: 12345678901234"
            />
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email de contact</Label>
              <Input
                id="email"
                type="email"
                value={organization.email || ''}
                onChange={(e) => setOrganization(prev => ({ ...prev, email: e.target.value }))}
                placeholder="contact@entreprise.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telephone">Téléphone</Label>
              <Input
                id="telephone"
                type="tel"
                value={organization.telephone || ''}
                onChange={(e) => setOrganization(prev => ({ ...prev, telephone: e.target.value }))}
                placeholder="+216 XX XXX XXX"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="adresse">Adresse complète</Label>
            <Textarea
              id="adresse"
              value={organization.adresse || ''}
              onChange={(e) => setOrganization(prev => ({ ...prev, adresse: e.target.value }))}
              placeholder="Numéro, rue, quartier..."
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="code_postal">Code postal</Label>
              <Input
                id="code_postal"
                value={organization.code_postal || ''}
                onChange={(e) => setOrganization(prev => ({ ...prev, code_postal: e.target.value }))}
                placeholder="Ex: 1000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pays">Pays</Label>
              <Input
                id="pays"
                value={organization.pays || ''}
                onChange={(e) => setOrganization(prev => ({ ...prev, pays: e.target.value }))}
                placeholder="Ex: Tunisie"
              />
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer les modifications
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
