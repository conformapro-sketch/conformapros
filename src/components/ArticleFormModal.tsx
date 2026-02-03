import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { textesArticlesQueries, textesReglementairesQueries } from "@/lib/textes-queries";
import { articlesEffetsJuridiquesQueries } from "@/lib/actes-queries";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Pencil, XCircle, RefreshCw, PlusCircle, Hash, FileEdit } from "lucide-react";
import { ArticleSousDomainesSelector } from "@/components/ArticleSousDomainesSelector";
import { TexteAutocomplete } from "@/components/bibliotheque/TexteAutocomplete";
import { ArticleAutocomplete } from "@/components/bibliotheque/ArticleAutocomplete";
import { HierarchyAlert } from "@/components/HierarchyAlert";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import type { TypeEffet, PorteeEffet } from "@/types/textes";
import { TagManager } from "@/components/TagManager";

interface ArticleFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  texteId: string;
  article?: any | null;
  onSuccess?: () => void;
}

export function ArticleFormModal({ 
  open, 
  onOpenChange, 
  texteId,
  article, 
  onSuccess 
}: ArticleFormModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    numero: "",
    titre: "",
    contenu: "", // Used only for initial version creation
    porte_exigence: false,
    date_effet: new Date().toISOString().split('T')[0], // For initial version
  });
  const [selectedSousDomaines, setSelectedSousDomaines] = useState<string[]>([]);
  
  // État pour l'effet juridique
  const [hasEffet, setHasEffet] = useState(false);
  const [effetData, setEffetData] = useState({
    type_effet: "MODIFIE" as TypeEffet,
    texte_cible_id: "",
    article_cible_id: "",
    nouvelle_numerotation: "",
    date_effet: "",
    date_fin_effet: "",
    reference_citation: "",
    notes: "",
    portee: "article" as PorteeEffet,
    portee_detail: "",
  });
  const [hierarchyValidation, setHierarchyValidation] = useState<{
    valid: boolean;
    severity: "error" | "warning" | "info" | "success";
    message: string;
  } | null>(null);

  // Load parent text to get its domains and type
  const { data: texteData } = useQuery({
    queryKey: ["texte", texteId],
    queryFn: () => textesReglementairesQueries.getById(texteId),
    enabled: !!texteId,
  });

  // Load target text data when selected
  const { data: texteCibleData } = useQuery({
    queryKey: ["texte-cible", effetData.texte_cible_id],
    queryFn: () => textesReglementairesQueries.getById(effetData.texte_cible_id),
    enabled: !!effetData.texte_cible_id && hasEffet,
  });

  // Extract domain IDs from parent text
  const texteDomaineIds = texteData?.domaines
    ?.map((d: any) => d.domaine?.id)
    .filter(Boolean) || [];

  useEffect(() => {
    if (article) {
      setFormData({
        numero: article.numero || article.numero_article || "",
        titre: article.titre || article.titre_court || "",
        contenu: article.contenu || "",
        porte_exigence: article.porte_exigence ?? article.is_exigence ?? false,
        date_effet: new Date().toISOString().split('T')[0],
      });
      
      // Load existing sous-domaines
      const articleWithRelations = article as any;
      if (articleWithRelations.sous_domaines) {
        const sousDomaineIds = articleWithRelations.sous_domaines
          .map((sd: any) => sd.sous_domaine?.id)
          .filter(Boolean);
        setSelectedSousDomaines(sousDomaineIds);
      }
    } else {
      resetForm();
      setSelectedSousDomaines([]);
      setHasEffet(false);
      setEffetData({
        type_effet: "MODIFIE" as TypeEffet,
        texte_cible_id: "",
        article_cible_id: "",
        nouvelle_numerotation: "",
        date_effet: "",
        date_fin_effet: "",
        reference_citation: "",
        notes: "",
        portee: "article" as PorteeEffet,
        portee_detail: "",
      });
      setHierarchyValidation(null);
    }
  }, [article, open]);

  // Validate hierarchy when source/target/effect type changes
  useEffect(() => {
    if (!hasEffet || !effetData.texte_cible_id || !texteCibleData || !texteData) {
      setHierarchyValidation(null);
      return;
    }

    const sourceType = texteData.type;
    const targetType = texteCibleData.type;
    const effectType = effetData.type_effet;

    // Call hierarchy validation function (client-side simplified version)
    const hierarchy: Record<string, number> = {
      "loi": 5,
      "decret-loi": 4,
      "decret": 3,
      "arrete": 2,
      "circulaire": 1
    };

    const sourceLevel = hierarchy[sourceType] || 0;
    const targetLevel = hierarchy[targetType] || 0;

    if (effectType === "ABROGE" || effectType === "MODIFIE" || effectType === "REMPLACE") {
      if (sourceLevel < targetLevel) {
        setHierarchyValidation({
          valid: false,
          severity: "error",
          message: `Un ${sourceType} ne peut pas ${effectType.toLowerCase()} une ${targetType} (hiérarchie des normes)`
        });
        return;
      }
    } else if (effectType === "COMPLETE") {
      if (sourceType === "circulaire" && sourceLevel < targetLevel) {
        setHierarchyValidation({
          valid: true,
          severity: "info",
          message: "Une circulaire peut compléter/interpréter des textes de niveau supérieur"
        });
        return;
      }
    } else if (effectType === "AJOUTE") {
      if (sourceLevel < targetLevel) {
        setHierarchyValidation({
          valid: false,
          severity: "warning",
          message: `Attention: Un ${sourceType} ajoute un article à une ${targetType} (inhabituel)`
        });
        return;
      }
    }

    setHierarchyValidation({
      valid: true,
      severity: "success",
      message: "Effet juridique conforme à la hiérarchie des normes"
    });
  }, [hasEffet, effetData.texte_cible_id, effetData.type_effet, texteCibleData, texteData]);

  const resetForm = () => {
    setFormData({
      numero: "",
      titre: "",
      contenu: "",
      porte_exigence: false,
      date_effet: new Date().toISOString().split('T')[0],
    });
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      // 1. Create the article (without contenu - it goes in article_versions)
      const articleData = {
        texte_id: texteId,
        numero: data.numero,
        titre: data.titre || null,
        porte_exigence: data.porte_exigence,
        est_introductif: false,
      };
      const newArticle = await textesArticlesQueries.create(articleData);
      
      // 2. Create initial version with the content
      if (data.contenu && data.contenu.trim()) {
        await supabase
          .from("article_versions")
          .insert({
            article_id: newArticle.id,
            numero_version: 1,
            contenu: data.contenu,
            date_effet: data.date_effet || new Date().toISOString().split('T')[0],
            statut: "en_vigueur",
            source_texte_id: texteId,
            notes_modifications: "Version initiale",
          });
      }
      
      // 3. Link sous-domaines
      if (selectedSousDomaines.length > 0) {
        await textesArticlesQueries.updateArticleSousDomaines(
          newArticle.id,
          selectedSousDomaines
        );
      }
        
      // 4. Handle juridical effects if specified
      if (hasEffet && effetData.article_cible_id) {
        // Get current version of target article
        const { data: currentVersion } = await supabase
          .from("article_versions")
          .select("*")
          .eq("article_id", effetData.article_cible_id)
          .eq("statut", "en_vigueur")
          .order("numero_version", { ascending: false })
          .limit(1)
          .maybeSingle();
        
        const nextVersionNumber = (currentVersion?.numero_version || 0) + 1;
        
        // Create new version in target article
        const newVersionContent = effetData.type_effet === "ABROGE" 
          ? `<div class="abrogation-notice"><p><strong>Article abrogé</strong></p><p>Par : ${texteData?.reference} - Article ${data.numero}</p><p>Date d'effet : ${new Date(effetData.date_effet).toLocaleDateString("fr-FR")}</p></div>`
          : (effetData.type_effet === "MODIFIE" || effetData.type_effet === "REMPLACE")
          ? data.contenu
          : currentVersion?.contenu || "";
        
        await supabase
          .from("article_versions")
          .insert({
            article_id: effetData.article_cible_id,
            numero_version: nextVersionNumber,
            contenu: newVersionContent,
            date_effet: effetData.date_effet,
            statut: "en_vigueur",
            source_texte_id: texteId,
            notes_modifications: effetData.notes || `${effetData.type_effet} par ${texteData?.reference}`,
          });
        
        // Replace old version
        if (currentVersion) {
          await supabase
            .from("article_versions")
            .update({ statut: "remplacee" })
            .eq("id", currentVersion.id);
        }
        
        // Create juridical effect record
        await articlesEffetsJuridiquesQueries.create({
          article_source_id: newArticle.id,
          texte_source_id: texteId,
          type_effet: effetData.type_effet,
          texte_cible_id: effetData.texte_cible_id || undefined,
          article_cible_id: effetData.article_cible_id,
          nouvelle_numerotation: effetData.nouvelle_numerotation || undefined,
          date_effet: effetData.date_effet,
          date_fin_effet: effetData.date_fin_effet || undefined,
          reference_citation: effetData.reference_citation || undefined,
          notes: effetData.notes || undefined,
          portee: effetData.portee || undefined,
          portee_detail: effetData.portee_detail || undefined,
        });
      } else if (hasEffet) {
        // Effect targets a whole text without specific article
        await articlesEffetsJuridiquesQueries.create({
          article_source_id: newArticle.id,
          texte_source_id: texteId,
          type_effet: effetData.type_effet,
          texte_cible_id: effetData.texte_cible_id || undefined,
          article_cible_id: effetData.article_cible_id || undefined,
          nouvelle_numerotation: effetData.nouvelle_numerotation || undefined,
          date_effet: effetData.date_effet,
          date_fin_effet: effetData.date_fin_effet || undefined,
          reference_citation: effetData.reference_citation || undefined,
          notes: effetData.notes || undefined,
          portee: effetData.portee || undefined,
          portee_detail: effetData.portee_detail || undefined,
        });
      }
      
      return newArticle;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["texte-articles"] });
      queryClient.invalidateQueries({ queryKey: ["bibliotheque-articles"] });
      queryClient.invalidateQueries({ queryKey: ["article-versions"] });
      queryClient.invalidateQueries({ queryKey: ["effets-juridiques"] });
      const message = hasEffet && effetData.article_cible_id
        ? "Article créé et version de l'article cible mise à jour automatiquement"
        : hasEffet
        ? "Article créé et effet juridique enregistré avec succès"
        : "Article créé avec succès";
      toast.success(message);
      onOpenChange(false);
      resetForm();
      setSelectedSousDomaines([]);
      setHasEffet(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de la création");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      // Update article metadata only (not content - that's in versions)
      const articleData = {
        numero: data.numero,
        titre: data.titre || null,
        porte_exigence: data.porte_exigence,
      };
      await textesArticlesQueries.update(id, articleData);
      await textesArticlesQueries.updateArticleSousDomaines(id, selectedSousDomaines);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["texte-articles"] });
      queryClient.invalidateQueries({ queryKey: ["bibliotheque-articles"] });
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
      toast.error("La référence de l'article est requise");
      return;
    }

    // Content is required only for new articles (to create initial version)
    if (!article && !formData.contenu.trim()) {
      toast.error("Le contenu de l'article est requis pour créer la version initiale");
      return;
    }

    // Validation des effets juridiques
    if (hasEffet) {
      if (!effetData.article_cible_id && !effetData.texte_cible_id) {
        toast.error("Vous devez sélectionner un texte ou un article cible");
        return;
      }
      
      if (!effetData.date_effet) {
        toast.error("La date d'effet est obligatoire pour les effets juridiques");
        return;
      }
      
      if ((effetData.type_effet === "MODIFIE" || effetData.type_effet === "REMPLACE") 
          && !formData.contenu.trim()) {
        toast.error("Le contenu est obligatoire pour ce type de modification");
        return;
      }
      
      // Validation hiérarchique
      if (hierarchyValidation && !hierarchyValidation.valid && hierarchyValidation.severity === "error") {
        toast.error("Impossible de créer cet effet juridique : " + hierarchyValidation.message);
        return;
      }
    }

    // Prepare clean data - article metadata only
    const cleanData = {
      numero: formData.numero.trim(),
      titre: formData.titre.trim() || null,
      porte_exigence: formData.porte_exigence,
      contenu: formData.contenu, // Passed for initial version creation
      date_effet: formData.date_effet,
    };

    if (article) {
      updateMutation.mutate({ id: article.id, data: cleanData });
    } else {
      createMutation.mutate(cleanData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {article ? "Modifier l'article" : "Ajouter un article"}
          </DialogTitle>
          <DialogDescription>
            {article 
              ? "Modifiez les informations de l'article (corrections éditoriales uniquement). Pour créer une nouvelle version juridique, utilisez le bouton 'Versions' dans la liste des articles."
              : "Remplissez les informations de l'article réglementaire. Si cet article modifie un texte existant, cochez l'option 'A un effet' pour créer automatiquement une version dans l'article cible."
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 📋 Informations de base */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <span>📋</span> Informations de base
            </h3>
            
            {/* Référence de l'article */}
            <div className="space-y-2">
              <Label htmlFor="numero">Référence de l'article *</Label>
              <Input
                id="numero"
                value={formData.numero}
                onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                placeholder="Ex: Article 1, Art. 3 bis"
                required
              />
            </div>

            {/* Titre */}
            <div className="space-y-2">
              <Label htmlFor="titre">Titre de l'article</Label>
              <Input
                id="titre"
                value={formData.titre}
                onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                placeholder="Titre descriptif de l'article"
              />
            </div>

          </div>

          {/* ⚠️ Classification */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <span>⚠️</span> Classification
            </h3>
            
            {/* Article exigence réglementaire */}
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
                  Cochez si cet article impose des obligations applicables nécessitant une évaluation de conformité
                </p>
              </div>
            </div>
          </div>

          {/* 📝 Contenu */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <span>📝</span> Contenu de l'article
            </h3>
            
            <div className="space-y-2">
              <RichTextEditor
                value={formData.contenu}
                onChange={(value) => setFormData({ ...formData, contenu: value })}
                placeholder="Contenu complet de l'article..."
              />
              <p className="text-xs text-muted-foreground">
                Le contenu peut être modifié ultérieurement via le système de versions
              </p>
            </div>
          </div>

          {/* 🏷️ Domaines d'application */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <span>🏷️</span> Domaines d'application
            </h3>
            
            <ArticleSousDomainesSelector
              selectedSousDomaines={selectedSousDomaines}
              onSousDomainesChange={setSelectedSousDomaines}
              texteDomaineIds={texteDomaineIds}
            />
          </div>

          {/* 🏷️ Tags */}
          {article && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <span>🏷️</span> Tags
              </h3>
              
              <TagManager entityId={article.id} entityType="article" />
            </div>
          )}

          {/* 🎯 Effet juridique */}
          {!article && (
            <div className="space-y-4 border-t pt-4 bg-muted/20 rounded-lg p-4">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <span>🎯</span> 
                  Cet article a-t-il un effet sur un autre texte ?
                </h3>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={!hasEffet ? "default" : "outline"}
                    className="justify-start h-auto py-3"
                    onClick={() => setHasEffet(false)}
                  >
                    <div className="text-left">
                      <div className="font-medium">🟢 Nouvel article</div>
                      <div className="text-xs opacity-80">Aucun effet juridique</div>
                    </div>
                  </Button>
                  <Button
                    type="button"
                    variant={hasEffet ? "default" : "outline"}
                    className="justify-start h-auto py-3"
                    onClick={() => setHasEffet(true)}
                  >
                    <div className="text-left">
                      <div className="font-medium">⚡ A un effet</div>
                      <div className="text-xs opacity-80">Modifie un texte existant</div>
                    </div>
                  </Button>
                </div>
              </div>

              {hasEffet && (
                <div className="space-y-4 pt-4 border-t">
                  {/* Type d'effet */}
                  <div className="space-y-2">
                    <Label className="font-medium">Type d'effet juridique *</Label>
                    <Select 
                      value={effetData.type_effet} 
                      onValueChange={(value) => setEffetData({ ...effetData, type_effet: value as TypeEffet })}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MODIFIE">
                          <div className="flex items-center gap-2 py-1">
                            <Pencil className="h-4 w-4 text-yellow-600" />
                            <div>
                              <div className="font-medium">🟡 Modifie</div>
                              <div className="text-xs text-muted-foreground">un article existant</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="REMPLACE">
                          <div className="flex items-center gap-2 py-1">
                            <RefreshCw className="h-4 w-4 text-blue-600" />
                            <div>
                              <div className="font-medium">🟠 Remplace</div>
                              <div className="text-xs text-muted-foreground">un article précédent</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="ABROGE">
                          <div className="flex items-center gap-2 py-1">
                            <XCircle className="h-4 w-4 text-red-600" />
                            <div>
                              <div className="font-medium">🔴 Abroge</div>
                              <div className="text-xs text-muted-foreground">un article précédent</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="AJOUTE">
                          <div className="flex items-center gap-2 py-1">
                            <PlusCircle className="h-4 w-4 text-green-600" />
                            <div>
                              <div className="font-medium">➕ Ajoute</div>
                              <div className="text-xs text-muted-foreground">un nouvel article</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="RENUMEROTE">
                          <div className="flex items-center gap-2 py-1">
                            <Hash className="h-4 w-4 text-purple-600" />
                            <div>
                              <div className="font-medium">🔵 Rénuméroté</div>
                              <div className="text-xs text-muted-foreground">change le numéro</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="COMPLETE">
                          <div className="flex items-center gap-2 py-1">
                            <FileEdit className="h-4 w-4 text-cyan-600" />
                            <div>
                              <div className="font-medium">🔷 Complète</div>
                              <div className="text-xs text-muted-foreground">ajoute des précisions</div>
                            </div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Alert for automatic version creation */}
                  {effetData.article_cible_id && (
                    <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
                      <Info className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        <strong>Création automatique :</strong> Une nouvelle version sera automatiquement 
                        créée dans l'article cible pour documenter cette modification.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Hierarchy validation alert */}
                  {hierarchyValidation && (
                    <HierarchyAlert 
                      severity={hierarchyValidation.severity} 
                      message={hierarchyValidation.message} 
                    />
                  )}

                  {/* Texte concerné */}
                  <div className="space-y-2">
                    <Label className="font-medium">Texte réglementaire concerné *</Label>
                    <div className="space-y-2">
                      <TexteAutocomplete
                        value={effetData.texte_cible_id}
                        onChange={(value) => {
                          setEffetData({ ...effetData, texte_cible_id: value || "", article_cible_id: "" });
                        }}
                        placeholder="🔍 Rechercher par type, numéro, année..."
                      />
                      <p className="text-xs text-muted-foreground">
                        Sélectionnez le texte (Loi, Décret, Arrêté, Circulaire) concerné par cet effet
                      </p>
                    </div>
                  </div>

                  {/* Article cible */}
                  {effetData.texte_cible_id && effetData.type_effet !== 'AJOUTE' && (
                    <div className="space-y-2">
                      <Label>Article visé *</Label>
                      <ArticleAutocomplete
                        texteId={effetData.texte_cible_id}
                        value={effetData.article_cible_id}
                        onChange={(value) => setEffetData({ ...effetData, article_cible_id: value || "" })}
                        placeholder="Sélectionner l'article modifié..."
                      />
                    </div>
                  )}

                  {/* Nouvelle numérotation */}
                  {effetData.type_effet === 'RENUMEROTE' && (
                    <div className="space-y-2">
                      <Label>Nouvelle numérotation *</Label>
                      <Input
                        value={effetData.nouvelle_numerotation}
                        onChange={(e) => setEffetData({ ...effetData, nouvelle_numerotation: e.target.value })}
                        placeholder="Ex: Article 12 bis"
                      />
                    </div>
                  )}

                  {/* Portée de l'effet */}
                  {effetData.type_effet !== 'AJOUTE' && effetData.article_cible_id && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Portée de l'effet</Label>
                        <Select 
                          value={effetData.portee} 
                          onValueChange={(value) => setEffetData({ ...effetData, portee: value as PorteeEffet })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="article">Article entier</SelectItem>
                            <SelectItem value="alinea">Alinéa spécifique</SelectItem>
                            <SelectItem value="point">Point précis</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {(effetData.portee === "alinea" || effetData.portee === "point") && (
                        <div className="space-y-2">
                          <Label>Précision</Label>
                          <Input
                            value={effetData.portee_detail}
                            onChange={(e) => setEffetData({ ...effetData, portee_detail: e.target.value })}
                            placeholder={effetData.portee === "alinea" ? "Ex: alinéa 2" : "Ex: point b)"}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Dates d'effet */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date d'entrée en vigueur *</Label>
                      <Input
                        type="date"
                        value={effetData.date_effet}
                        onChange={(e) => setEffetData({ ...effetData, date_effet: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Date de fin (optionnel)</Label>
                      <Input
                        type="date"
                        value={effetData.date_fin_effet}
                        onChange={(e) => setEffetData({ ...effetData, date_fin_effet: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Pour les effets temporaires uniquement
                      </p>
                    </div>
                  </div>

                  {/* Référence de citation */}
                  <div className="space-y-2">
                    <Label>Référence de citation</Label>
                    <Input
                      value={effetData.reference_citation}
                      onChange={(e) => setEffetData({ ...effetData, reference_citation: e.target.value })}
                      placeholder="Ex: Article 4 de la Loi n°2025-10"
                    />
                    <p className="text-xs text-muted-foreground">
                      Comment cet effet est-il mentionné dans le texte officiel ?
                    </p>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label>Notes explicatives</Label>
                    <Textarea
                      value={effetData.notes}
                      onChange={(e) => setEffetData({ ...effetData, notes: e.target.value })}
                      placeholder="Contexte ou précisions sur cette modification..."
                      rows={2}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

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
              {article ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
