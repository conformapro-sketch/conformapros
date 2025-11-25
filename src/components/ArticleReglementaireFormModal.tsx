import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { articlesQueries } from "@/lib/textes-reglementaires-queries";
import { sousDomainesQueries } from "@/lib/textes-queries";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Calendar, FileText } from "lucide-react";
import { ArticleSousDomainesSelector } from "@/components/ArticleSousDomainesSelector";

interface ArticleReglementaireFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  texteId: string;
  article?: any | null;
  onSuccess?: () => void;
}

export function ArticleReglementaireFormModal({ 
  open, 
  onOpenChange, 
  texteId,
  article, 
  onSuccess 
}: ArticleReglementaireFormModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    numero: "",
    titre: "",
    resume: "",
    est_introductif: false,
    porte_exigence: false,
  });
  const [selectedSousDomaines, setSelectedSousDomaines] = useState<string[]>([]);

  // Fetch existing versions if editing
  const { data: versions = [] } = useQuery({
    queryKey: ["article-versions", article?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("article_versions")
        .select("*")
        .eq("article_id", article.id)
        .order("numero_version", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!article?.id,
  });

  useEffect(() => {
    if (article) {
      setFormData({
        numero: article.numero || "",
        titre: article.titre || "",
        resume: article.resume || "",
        est_introductif: article.est_introductif || false,
        porte_exigence: article.porte_exigence || false,
      });
      
      // Load existing sous-domaines
      if (article.sous_domaines) {
        const sousDomaineIds = article.sous_domaines
          .map((sd: any) => sd.sous_domaine?.id)
          .filter(Boolean);
        setSelectedSousDomaines(sousDomaineIds);
      }
    } else {
      resetForm();
      setSelectedSousDomaines([]);
    }
  }, [article, open]);

  const resetForm = () => {
    setFormData({
      numero: "",
      titre: "",
      resume: "",
      est_introductif: false,
      porte_exigence: false,
    });
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const newArticle = await articlesQueries.create(data);
      
      // Link sous-domaines
      if (selectedSousDomaines.length > 0) {
        const relations = selectedSousDomaines.map(sousDomaineId => ({
          article_id: newArticle.id,
          sous_domaine_id: sousDomaineId,
        }));
        await supabase.from("article_sous_domaines").insert(relations);
      }
      
      return newArticle;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["texte-articles"] });
      queryClient.invalidateQueries({ queryKey: ["articles-active-versions"] });
      toast.success("Article créé avec succès");
      onOpenChange(false);
      resetForm();
      setSelectedSousDomaines([]);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de la création");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      await articlesQueries.update(id, data);
      
      // Update sous-domaines
      await supabase.from("article_sous_domaines").delete().eq("article_id", id);
      if (selectedSousDomaines.length > 0) {
        const relations = selectedSousDomaines.map(sousDomaineId => ({
          article_id: id,
          sous_domaine_id: sousDomaineId,
        }));
        await supabase.from("article_sous_domaines").insert(relations);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["texte-articles"] });
      queryClient.invalidateQueries({ queryKey: ["articles-active-versions"] });
      toast.success("Article modifié avec succès");
      onOpenChange(false);
      resetForm();
      setSelectedSousDomaines([]);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de la modification");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.numero.trim()) {
      toast.error("Le numéro de l'article est requis");
      return;
    }

    if (!formData.titre.trim()) {
      toast.error("Le titre de l'article est requis");
      return;
    }

    const cleanData = {
      texte_id: texteId,
      numero: formData.numero.trim(),
      titre: formData.titre.trim(),
      resume: formData.resume.trim() || null,
      est_introductif: formData.est_introductif,
      porte_exigence: formData.porte_exigence,
    };

    if (article) {
      updateMutation.mutate({ id: article.id, data: cleanData });
    } else {
      createMutation.mutate(cleanData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "en_vigueur":
        return <Badge className="bg-success text-success-foreground">En vigueur</Badge>;
      case "remplacee":
        return <Badge variant="secondary">Remplacée</Badge>;
      case "abrogee":
        return <Badge variant="destructive">Abrogée</Badge>;
      default:
        return <Badge variant="outline">{statut}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {article ? "Modifier l'article" : "Ajouter un article"}
          </DialogTitle>
          <DialogDescription>
            {article 
              ? "Modifiez les informations de base de l'article. Pour créer une nouvelle version, utilisez le gestionnaire de versions."
              : "Remplissez les informations de base de l'article réglementaire."
            }
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Informations</TabsTrigger>
            <TabsTrigger value="domaines">Sous-domaines</TabsTrigger>
            <TabsTrigger value="versions" disabled={!article}>
              Versions ({versions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4 mt-4">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Numéro */}
              <div className="space-y-2">
                <Label htmlFor="numero">Numéro de l'article *</Label>
                <Input
                  id="numero"
                  value={formData.numero}
                  onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                  placeholder="Ex: Article 1, Art. 3 bis"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Référence unique de l'article dans le texte
                </p>
              </div>

              {/* Titre */}
              <div className="space-y-2">
                <Label htmlFor="titre">Titre de l'article *</Label>
                <Input
                  id="titre"
                  value={formData.titre}
                  onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                  placeholder="Titre descriptif de l'article"
                  required
                />
              </div>

              {/* Résumé */}
              <div className="space-y-2">
                <Label htmlFor="resume">Résumé</Label>
                <Textarea
                  id="resume"
                  value={formData.resume}
                  onChange={(e) => setFormData({ ...formData, resume: e.target.value })}
                  placeholder="Résumé court de l'article (optionnel)"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Ce résumé sera affiché dans les aperçus et les recherches
                </p>
              </div>

              {/* Classification */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Classification de l'article
                </h3>
                
                {/* Article introductif */}
                <div className="flex items-start space-x-2 p-3 border rounded-md bg-muted/50">
                  <Checkbox
                    id="est_introductif"
                    checked={formData.est_introductif}
                    onCheckedChange={(checked) => setFormData({ ...formData, est_introductif: checked === true })}
                  />
                  <div className="space-y-1">
                    <Label 
                      htmlFor="est_introductif" 
                      className="text-sm font-medium cursor-pointer"
                    >
                      Article introductif ou informatif
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Articles de définition, explicatifs ou descriptifs qui ne contiennent pas d'obligations
                    </p>
                  </div>
                </div>

                {/* Article avec exigence */}
                <div className="flex items-start space-x-2 p-3 border rounded-md bg-muted/50">
                  <Checkbox
                    id="porte_exigence"
                    checked={formData.porte_exigence}
                    onCheckedChange={(checked) => setFormData({ ...formData, porte_exigence: checked === true })}
                  />
                  <div className="space-y-1">
                    <Label 
                      htmlFor="porte_exigence" 
                      className="text-sm font-medium cursor-pointer"
                    >
                      Porte une exigence réglementaire
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Articles contenant des obligations, interdictions ou prescriptions à respecter
                    </p>
                  </div>
                </div>
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
                  {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {article ? "Modifier" : "Créer"}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="domaines" className="space-y-4 mt-4">
            <ArticleSousDomainesSelector
              selectedSousDomaines={selectedSousDomaines}
              onSousDomainesChange={setSelectedSousDomaines}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {article ? "Modifier" : "Créer"}
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="versions" className="space-y-4 mt-4">
            {versions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Aucune version pour cet article</p>
                <p className="text-sm mt-1">Les versions seront créées lors de modifications réglementaires</p>
              </div>
            ) : (
              <div className="space-y-3">
                {versions.map((version) => (
                  <div
                    key={version.id}
                    className="p-4 border rounded-lg bg-card hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Version {version.numero_version}</Badge>
                        {getStatutBadge(version.statut)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {new Date(version.date_effet).toLocaleDateString("fr-FR")}
                      </div>
                    </div>
                    {version.notes_modifications && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {version.notes_modifications}
                      </p>
                    )}
                    <div 
                      className="text-sm mt-3 p-3 bg-muted/50 rounded border prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: version.contenu }}
                    />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
