import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { textesArticlesVersionsQueries, textesArticlesQueries } from "@/lib/textes-queries";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, X, Calendar, FileText } from "lucide-react";
import { TexteAutocomplete } from "@/components/bibliotheque/TexteAutocomplete";

interface ArticleVersionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  articleId: string;
  version?: any | null;
  onSuccess?: () => void;
}

const MODIFICATION_TYPES = [
  { value: "ajout", label: "Ajout", icon: Plus },
  { value: "modification", label: "Modification", icon: Pencil },
  { value: "abrogation", label: "Abrogation", icon: Trash2 },
  { value: "remplacement", label: "Remplacement", icon: X },
  { value: "insertion", label: "Insertion", icon: Plus },
];

export function ArticleVersionModal({ 
  open, 
  onOpenChange, 
  articleId,
  version, 
  onSuccess 
}: ArticleVersionModalProps) {
  const queryClient = useQueryClient();
  
  // Fetch existing versions to calculate next version number
  const { data: existingVersions } = useQuery({
    queryKey: ["texte-article-versions", articleId],
    queryFn: () => textesArticlesVersionsQueries.getByArticleId(articleId),
    enabled: open && !version,
  });

  const [formData, setFormData] = useState({
    version_numero: 1,
    version_label: "",
    contenu: "",
    date_version: new Date().toISOString().split('T')[0],
    effective_from: "",
    effective_to: "",
    modification_type: "modification" as string,
    source_text_id: undefined as string | undefined,
    source_article_reference: "",
    notes_modification: "",
    raison_modification: "",
  });

  useEffect(() => {
    if (version) {
      setFormData({
        version_numero: version.version_numero || 1,
        version_label: version.version_label || "",
        contenu: version.contenu || "",
        date_version: version.date_version?.split('T')[0] || new Date().toISOString().split('T')[0],
        effective_from: version.effective_from?.split('T')[0] || "",
        effective_to: version.effective_to?.split('T')[0] || "",
        modification_type: version.modification_type || "modification",
        source_text_id: version.source_text_id,
        source_article_reference: version.source_article_reference || "",
        notes_modification: version.notes_modification || "",
        raison_modification: version.raison_modification || "",
      });
    } else {
      // Calculate next version number
      const maxVersion = existingVersions?.reduce((max, v) => Math.max(max, v.version_numero || 0), 0) || 0;
      setFormData(prev => ({
        ...prev,
        version_numero: maxVersion + 1,
        version_label: `Version ${maxVersion + 1}`,
      }));
    }
  }, [version, open, existingVersions]);

  const resetForm = () => {
    setFormData({
      version_numero: 1,
      version_label: "",
      contenu: "",
      date_version: new Date().toISOString().split('T')[0],
      effective_from: "",
      effective_to: "",
      modification_type: "modification",
      source_text_id: undefined,
      source_article_reference: "",
      notes_modification: "",
      raison_modification: "",
    });
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => textesArticlesVersionsQueries.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["texte-article-versions"] });
      toast.success("Version créée avec succès");
      onOpenChange(false);
      resetForm();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de la création");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      textesArticlesVersionsQueries.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["texte-article-versions"] });
      toast.success("Version modifiée avec succès");
      onOpenChange(false);
      resetForm();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de la modification");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.version_label.trim() || !formData.contenu.trim() || !formData.effective_from) {
      toast.error("Le libellé de version, le contenu et la date de début d'application sont requis");
      return;
    }

    if (formData.effective_to && formData.effective_from > formData.effective_to) {
      toast.error("La date de fin d'application doit être postérieure à la date de début");
      return;
    }

    const cleanData = {
      article_id: articleId,
      version_numero: formData.version_numero,
      version_label: formData.version_label.trim(),
      contenu: formData.contenu.trim(),
      date_version: formData.date_version,
      effective_from: formData.effective_from,
      effective_to: formData.effective_to || undefined,
      modification_type: formData.modification_type,
      source_text_id: formData.source_text_id,
      source_article_reference: formData.source_article_reference.trim() || undefined,
      notes_modification: formData.notes_modification.trim() || undefined,
      raison_modification: formData.raison_modification.trim() || undefined,
    };

    if (version) {
      updateMutation.mutate({ id: version.id, data: cleanData });
    } else {
      createMutation.mutate(cleanData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {version ? "Modifier la version" : "Ajouter une nouvelle version"}
          </DialogTitle>
          <DialogDescription>
            Créez une nouvelle version de cet article pour suivre son évolution réglementaire
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section: Identification de la version */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b pb-2">Identification de la version</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="version_numero">Numéro de version *</Label>
                <Input
                  id="version_numero"
                  type="number"
                  min="1"
                  value={formData.version_numero}
                  onChange={(e) => setFormData({ ...formData, version_numero: parseInt(e.target.value) || 1 })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="version_label">Libellé de version *</Label>
                <Input
                  id="version_label"
                  value={formData.version_label}
                  onChange={(e) => setFormData({ ...formData, version_label: e.target.value })}
                  placeholder="Ex: Version initiale, Modification 2024"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section: Modification réglementaire */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b pb-2">Modification réglementaire</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="modification_type">Type de modification *</Label>
                <Select 
                  value={formData.modification_type} 
                  onValueChange={(val) => setFormData({ ...formData, modification_type: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODIFICATION_TYPES.map((type) => {
                      const Icon = type.icon;
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_version">Date de création de la version</Label>
                <Input
                  id="date_version"
                  type="date"
                  value={formData.date_version}
                  onChange={(e) => setFormData({ ...formData, date_version: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="source_text_id">Texte modificateur (optionnel)</Label>
              <TexteAutocomplete
                value={formData.source_text_id}
                onChange={(val) => setFormData({ ...formData, source_text_id: val })}
                placeholder="Rechercher le texte qui a provoqué cette modification..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="source_article_reference">Référence de l'article source (optionnel)</Label>
              <Input
                id="source_article_reference"
                value={formData.source_article_reference}
                onChange={(e) => setFormData({ ...formData, source_article_reference: e.target.value })}
                placeholder="Ex: Article 12 du décret n°2024-123"
              />
            </div>
          </div>

          {/* Section: Période d'application */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b pb-2">Période d'application</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="effective_from" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date de début d'application *
                </Label>
                <Input
                  id="effective_from"
                  type="date"
                  value={formData.effective_from}
                  onChange={(e) => setFormData({ ...formData, effective_from: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="effective_to" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date de fin d'application (optionnel)
                </Label>
                <Input
                  id="effective_to"
                  type="date"
                  value={formData.effective_to}
                  onChange={(e) => setFormData({ ...formData, effective_to: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Laissez vide si la version est toujours en vigueur
                </p>
              </div>
            </div>
          </div>

          {/* Section: Contenu */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b pb-2">Contenu de la version</h3>
            <div className="space-y-2">
              <Label htmlFor="contenu" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Contenu complet de cette version *
              </Label>
              <RichTextEditor
                value={formData.contenu}
                onChange={(value) => setFormData({ ...formData, contenu: value })}
                placeholder="Contenu complet de cette version de l'article..."
              />
            </div>
          </div>

          {/* Section: Notes */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground border-b pb-2">Notes et justifications</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notes_modification">Notes de modification (optionnel)</Label>
                <Textarea
                  id="notes_modification"
                  value={formData.notes_modification}
                  onChange={(e) => setFormData({ ...formData, notes_modification: e.target.value })}
                  placeholder="Notes additionnelles sur cette modification..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="raison_modification">Raison de modification (optionnel)</Label>
                <Textarea
                  id="raison_modification"
                  value={formData.raison_modification}
                  onChange={(e) => setFormData({ ...formData, raison_modification: e.target.value })}
                  placeholder="Justification de cette modification..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                onOpenChange(false);
                resetForm();
              }}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {version ? "Enregistrer les modifications" : "Créer la version"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
