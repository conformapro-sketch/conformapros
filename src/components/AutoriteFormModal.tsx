import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { autoritesQueries, AutoriteEmettrice } from "@/lib/autorites-queries";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface AutoriteFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  autorite?: AutoriteEmettrice;
  onSuccess?: () => void;
}

export function AutoriteFormModal({
  open,
  onOpenChange,
  autorite,
  onSuccess,
}: AutoriteFormModalProps) {
  const queryClient = useQueryClient();
  const isEdit = !!autorite;

  const [formData, setFormData] = useState({
    nom: "",
    nom_court: "",
    type: "ministeriel" as "legislatif" | "executif" | "ministeriel" | "agence" | "autre",
    description: "",
    pays: "Tunisie",
    ordre: 0,
  });

  useEffect(() => {
    if (autorite) {
      setFormData({
        nom: autorite.nom,
        nom_court: autorite.nom_court || "",
        type: autorite.type || "ministeriel",
        description: autorite.description || "",
        pays: autorite.pays || "Tunisie",
        ordre: autorite.ordre,
      });
    } else {
      setFormData({
        nom: "",
        nom_court: "",
        type: "ministeriel",
        description: "",
        pays: "Tunisie",
        ordre: 0,
      });
    }
  }, [autorite, open]);

  const createMutation = useMutation({
    mutationFn: () => autoritesQueries.create({ ...formData, actif: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['autorites'] });
      toast.success("Autorité créée avec succès");
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error("Erreur lors de la création", {
        description: error.message,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => autoritesQueries.update(autorite!.id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['autorites'] });
      toast.success("Autorité mise à jour avec succès");
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error("Erreur lors de la mise à jour", {
        description: error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nom.trim()) {
      toast.error("Le nom est obligatoire");
      return;
    }

    if (isEdit) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier l'autorité émettrice" : "Nouvelle autorité émettrice"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nom">Nom complet *</Label>
            <Input
              id="nom"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              placeholder="Ex: Assemblée des Représentants du Peuple"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nom_court">Abréviation</Label>
              <Input
                id="nom_court"
                value={formData.nom_court}
                onChange={(e) => setFormData({ ...formData, nom_court: e.target.value })}
                placeholder="Ex: ARP"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: any) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="legislatif">Législatif</SelectItem>
                  <SelectItem value="executif">Exécutif</SelectItem>
                  <SelectItem value="ministeriel">Ministériel</SelectItem>
                  <SelectItem value="agence">Agence</SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pays">Pays</Label>
              <Input
                id="pays"
                value={formData.pays}
                onChange={(e) => setFormData({ ...formData, pays: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ordre">Ordre d'affichage</Label>
              <Input
                id="ordre"
                type="number"
                value={formData.ordre}
                onChange={(e) => setFormData({ ...formData, ordre: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description optionnelle de l'autorité"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Mettre à jour" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
