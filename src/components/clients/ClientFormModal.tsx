import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ClientFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: any;
  onSuccess: () => void;
}

export function ClientFormModal({ open, onOpenChange, client, onSuccess }: ClientFormModalProps) {
  const isEdit = !!client;
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    nom: "",
    nom_legal: "",
    secteur: "",
    email: "",
    telephone: "",
    siret: "",
    adresse: "",
    code_postal: "",
    pays: "France",
    actif: true,
  });

  useEffect(() => {
    if (client) {
      setFormData({
        nom: client.nom || "",
        nom_legal: client.nom_legal || "",
        secteur: client.secteur || "",
        email: client.email || "",
        telephone: client.telephone || "",
        siret: client.siret || "",
        adresse: client.adresse || "",
        code_postal: client.code_postal || "",
        pays: client.pays || "France",
        actif: client.actif ?? true,
      });
    } else {
      setFormData({
        nom: "",
        nom_legal: "",
        secteur: "",
        email: "",
        telephone: "",
        siret: "",
        adresse: "",
        code_postal: "",
        pays: "France",
        actif: true,
      });
    }
  }, [client]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nom) {
      toast.error("Le nom du client est requis");
      return;
    }

    setLoading(true);
    try {
      if (isEdit && client) {
        const { error } = await supabase
          .from('clients')
          .update(formData)
          .eq('id', client.id);

        if (error) throw error;
        toast.success("Client modifié avec succès");
      } else {
        const { error } = await supabase
          .from('clients')
          .insert([formData]);

        if (error) throw error;
        toast.success("Client créé avec succès");
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving client:", error);
      toast.error(error.message || "Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier le client" : "Créer un client"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations principales */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground">
              Informations principales
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="nom">Nom du client *</Label>
              <Input
                id="nom"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                placeholder="Nom commercial"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nom_legal">Nom légal</Label>
              <Input
                id="nom_legal"
                value={formData.nom_legal}
                onChange={(e) => setFormData({ ...formData, nom_legal: e.target.value })}
                placeholder="Raison sociale officielle"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="secteur">Secteur d'activité</Label>
              <Input
                id="secteur"
                value={formData.secteur}
                onChange={(e) => setFormData({ ...formData, secteur: e.target.value })}
                placeholder="ex: Industrie, Services, Construction..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="siret">SIRET</Label>
              <Input
                id="siret"
                value={formData.siret}
                onChange={(e) => setFormData({ ...formData, siret: e.target.value })}
                placeholder="Numéro SIRET"
              />
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground">
              Contact principal
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@client.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telephone">Téléphone</Label>
              <Input
                id="telephone"
                value={formData.telephone}
                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                placeholder="+33 1 23 45 67 89"
              />
            </div>
          </div>

          {/* Adresse */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground">
              Adresse (optionnel)
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="adresse">Adresse</Label>
              <Textarea
                id="adresse"
                value={formData.adresse}
                onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                placeholder="Rue, numéro..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code_postal">Code postal</Label>
                <Input
                  id="code_postal"
                  value={formData.code_postal}
                  onChange={(e) => setFormData({ ...formData, code_postal: e.target.value })}
                  placeholder="75001"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pays">Pays</Label>
                <Input
                  id="pays"
                  value={formData.pays}
                  onChange={(e) => setFormData({ ...formData, pays: e.target.value })}
                  placeholder="France"
                />
              </div>
            </div>
          </div>

          {/* Statut */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Client actif</Label>
              <p className="text-sm text-muted-foreground">
                Les clients archivés n'apparaissent plus dans les listes par défaut
              </p>
            </div>
            <Switch
              checked={formData.actif}
              onCheckedChange={(checked) => setFormData({ ...formData, actif: checked })}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Enregistrer" : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
