import { useState, useEffect } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { articlesEffetsJuridiquesQueries } from "@/lib/actes-queries";
import { textesArticlesQueries } from "@/lib/textes-queries";
import { TexteAutocomplete } from "./bibliotheque/TexteAutocomplete";
import { ArticleAutocomplete } from "./bibliotheque/ArticleAutocomplete";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, Pencil, Plus, Replace, XCircle, Hash } from "lucide-react";
import { HierarchyAlert } from "@/components/HierarchyAlert";

interface ArticleQuickEffetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetArticle?: {
    id: string;
    numero_article: string;
    contenu: string;
    texte_id: string;
    texte?: {
      type: string;
      reference_officielle: string;
    };
  };
  sourceTexte?: {
    id: string;
    reference_officielle: string;
    type?: string;
  };
  sourceArticle?: {
    id: string;
    numero_article: string;
  };
}

export function ArticleQuickEffetModal({
  open,
  onOpenChange,
  targetArticle,
  sourceTexte,
  sourceArticle,
}: ArticleQuickEffetModalProps) {
  const queryClient = useQueryClient();
  
  // États pour la sélection du texte et article source
  const [selectedTexteSource, setSelectedTexteSource] = useState<any>(null);
  const [selectedArticleSource, setSelectedArticleSource] = useState<any>(null);
  const [createNewArticle, setCreateNewArticle] = useState(false);
  const [newArticleNumero, setNewArticleNumero] = useState("");
  const [newArticleTitre, setNewArticleTitre] = useState("");
  
  // États pour l'effet juridique
  const [typeEffet, setTypeEffet] = useState<string>("MODIFIE");
  const [contenuModifie, setContenuModifie] = useState<string>("");
  const [dateEffet, setDateEffet] = useState<string>(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState<string>("");
  const [portee, setPortee] = useState<string>("article");
  const [porteeDetail, setPorteeDetail] = useState<string>("");
  const [hierarchyValidation, setHierarchyValidation] = useState<{
    severity: "error" | "warning" | "info" | "success";
    message: string;
  } | null>(null);

  // Initialiser le contenu modifié avec le contenu actuel de l'article cible
  useEffect(() => {
    if (open && targetArticle) {
      setContenuModifie(targetArticle.contenu || "");
    }
  }, [open, targetArticle]);

  // Réinitialiser les états source si fournis
  useEffect(() => {
    if (open) {
      if (sourceTexte) {
        setSelectedTexteSource(sourceTexte);
      }
      if (sourceArticle) {
        setSelectedArticleSource(sourceArticle);
      }
    }
  }, [open, sourceTexte, sourceArticle]);

  // Valider la hiérarchie des normes
  useEffect(() => {
    const texteSource = selectedTexteSource || sourceTexte;
    if (!texteSource?.type || !targetArticle?.texte?.type) {
      setHierarchyValidation(null);
      return;
    }

    const sourceType = texteSource.type.toLowerCase();
    const targetType = targetArticle.texte.type.toLowerCase();

    // Circulaire ne peut pas modifier/abroger loi ou décret
    if (sourceType === "circulaire") {
      if (["loi", "décret", "décret-loi"].includes(targetType) && ["ABROGE", "MODIFIE", "REMPLACE"].includes(typeEffet)) {
        setHierarchyValidation({
          severity: "error",
          message: `Une circulaire ne peut pas ${typeEffet.toLowerCase()} une ${targetType}. Utilisez 'COMPLÈTE' pour ajouter une interprétation.`,
        });
        return;
      }
    }
    
    // Arrêté ne peut pas modifier une loi
    if (sourceType === "arrêté") {
      if (targetType === "loi" && ["ABROGE", "MODIFIE", "REMPLACE"].includes(typeEffet)) {
        setHierarchyValidation({
          severity: "warning",
          message: "Un arrêté ne peut généralement pas modifier une loi. Vérifiez la cohérence juridique.",
        });
        return;
      }
    }
    
    // Décret peut modifier arrêté mais pas loi
    if (sourceType === "décret") {
      if (targetType === "loi" && ["ABROGE", "MODIFIE", "REMPLACE"].includes(typeEffet)) {
        setHierarchyValidation({
          severity: "warning",
          message: "Un décret ne peut pas modifier une loi. Seule une loi peut modifier une loi.",
        });
        return;
      }
    }
    
    setHierarchyValidation(null);
  }, [selectedTexteSource, sourceTexte, targetArticle, typeEffet]);

  const createEffetMutation = useMutation({
    mutationFn: async () => {
      if (!targetArticle) {
        throw new Error("Article cible manquant");
      }

      let articleSourceId = selectedArticleSource?.id;

      // Si on crée un nouvel article, le créer d'abord
      if (createNewArticle && (selectedTexteSource || sourceTexte)) {
        const texteId = (selectedTexteSource || sourceTexte)!.id;
        const newArticle = await textesArticlesQueries.create({
          texte_id: texteId,
          numero_article: newArticleNumero,
          titre_court: newArticleTitre || null,
          contenu: contenuModifie,
          ordre_affichage: 999,
        });
        articleSourceId = newArticle.id;
      }

      if (!articleSourceId) {
        throw new Error("Article source manquant");
      }

      return articlesEffetsJuridiquesQueries.create({
        article_source_id: articleSourceId,
        article_cible_id: targetArticle.id,
        texte_cible_id: targetArticle.texte_id,
        type_effet: typeEffet,
        date_effet: dateEffet,
        portee: portee,
        portee_detail: porteeDetail || null,
        notes: notes || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["texte-articles"] });
      queryClient.invalidateQueries({ queryKey: ["article-versions"] });
      queryClient.invalidateQueries({ queryKey: ["article-effets-cible"] });
      toast.success("Effet juridique créé avec succès. Une nouvelle version a été générée automatiquement.");
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error("Erreur lors de la création de l'effet juridique");
      console.error(error);
    },
  });

  const resetForm = () => {
    if (!sourceTexte) setSelectedTexteSource(null);
    if (!sourceArticle) setSelectedArticleSource(null);
    setCreateNewArticle(false);
    setNewArticleNumero("");
    setNewArticleTitre("");
    setTypeEffet("MODIFIE");
    setContenuModifie("");
    setDateEffet(new Date().toISOString().split("T")[0]);
    setNotes("");
    setPortee("article");
    setPorteeDetail("");
    setHierarchyValidation(null);
  };

  const canSubmit = () => {
    const texteSource = selectedTexteSource || sourceTexte;
    if (!texteSource) return false;
    if (createNewArticle && !newArticleNumero.trim()) return false;
    if (!createNewArticle && !selectedArticleSource && !sourceArticle) return false;
    if (hierarchyValidation?.severity === "error") return false;
    if (typeEffet !== "ABROGE" && !contenuModifie.trim()) return false;
    return true;
  };

  const handleSubmit = () => {
    if (!canSubmit()) {
      toast.error("Veuillez remplir tous les champs requis");
      return;
    }
    
    if (hierarchyValidation?.severity === "error") {
      toast.error("Impossible de créer cet effet juridique en raison d'une incohérence hiérarchique");
      return;
    }

    createEffetMutation.mutate();
  };

  const getEffetIcon = (type: string) => {
    switch (type) {
      case "MODIFIE": return <Pencil className="h-4 w-4" />;
      case "ABROGE": return <XCircle className="h-4 w-4" />;
      case "REMPLACE": return <Replace className="h-4 w-4" />;
      case "AJOUTE": return <Plus className="h-4 w-4" />;
      case "RENOMME": return <Hash className="h-4 w-4" />;
      case "COMPLETE": return <Info className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer un effet juridique</DialogTitle>
          <DialogDescription>
            Définir l'effet juridique sur l'article{" "}
            <strong>{targetArticle?.numero_article}</strong>
            {targetArticle?.texte?.reference_officielle && ` du ${targetArticle.texte.reference_officielle}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Sélection du texte source */}
          {!sourceTexte && (
            <div className="space-y-2">
              <Label>Texte réglementaire source (qui fait la modification) *</Label>
              <TexteAutocomplete
                value={selectedTexteSource?.id}
                onChange={(id) => {
                  if (id) {
                    setSelectedTexteSource({ id });
                    setSelectedArticleSource(null);
                  } else {
                    setSelectedTexteSource(null);
                    setSelectedArticleSource(null);
                  }
                }}
                placeholder="Ex: Décret n°2024-123"
              />
              {selectedTexteSource && (
                <p className="text-xs text-muted-foreground">
                  Texte sélectionné : {selectedTexteSource.reference_officielle || "Chargement..."}
                </p>
              )}
            </div>
          )}

          {/* Sélection ou création de l'article source */}
          {(selectedTexteSource || sourceTexte) && !sourceArticle && (
            <div className="space-y-3 border-t pt-4">
              <Label>Article source (dans le texte modificateur) *</Label>
              
              <RadioGroup 
                value={createNewArticle ? "new" : "existing"} 
                onValueChange={(v) => {
                  setCreateNewArticle(v === "new");
                  if (v === "new") setSelectedArticleSource(null);
                }}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="existing" id="existing" />
                  <Label htmlFor="existing" className="font-normal cursor-pointer">
                    Sélectionner un article existant
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="new" id="new" />
                  <Label htmlFor="new" className="font-normal cursor-pointer">
                    Créer un nouvel article
                  </Label>
                </div>
              </RadioGroup>
              
              {createNewArticle ? (
                <div className="space-y-3 pl-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="newNumero">Numéro d'article *</Label>
                      <Input 
                        id="newNumero"
                        placeholder="Ex: Art. 5" 
                        value={newArticleNumero}
                        onChange={(e) => setNewArticleNumero(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="newTitre">Titre (optionnel)</Label>
                      <Input 
                        id="newTitre"
                        placeholder="Ex: Dispositions modificatives" 
                        value={newArticleTitre}
                        onChange={(e) => setNewArticleTitre(e.target.value)}
                      />
                    </div>
                  </div>
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      Un nouvel article sera créé dans {(selectedTexteSource || sourceTexte)?.reference_officielle}
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <div className="pl-6">
                  <ArticleAutocomplete
                    texteId={(selectedTexteSource || sourceTexte)?.id}
                    value={selectedArticleSource}
                    onChange={setSelectedArticleSource}
                    placeholder="Rechercher un article..."
                  />
                </div>
              )}
            </div>
          )}

          {/* Validation hiérarchique */}
          {hierarchyValidation && (
            <HierarchyAlert
              severity={hierarchyValidation.severity}
              message={hierarchyValidation.message}
            />
          )}

          {/* Type d'effet */}
          <div className="space-y-2 border-t pt-4">
            <Label htmlFor="type-effet" className="flex items-center gap-2">
              Type d'effet
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <div className="space-y-1 text-xs">
                      <p><strong>MODIFIE</strong> : Change partiellement le contenu</p>
                      <p><strong>REMPLACE</strong> : Remplace complètement l'article</p>
                      <p><strong>ABROGE</strong> : Annule l'article</p>
                      <p><strong>COMPLÈTE</strong> : Ajoute un alinéa/point</p>
                      <p><strong>RENOMME</strong> : Change la numérotation</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Select value={typeEffet} onValueChange={setTypeEffet}>
              <SelectTrigger id="type-effet">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MODIFIE">
                  <div className="flex items-center gap-2">
                    {getEffetIcon("MODIFIE")}
                    MODIFIE - Change partiellement
                  </div>
                </SelectItem>
                <SelectItem value="REMPLACE">
                  <div className="flex items-center gap-2">
                    {getEffetIcon("REMPLACE")}
                    REMPLACE - Remplace complètement
                  </div>
                </SelectItem>
                <SelectItem value="ABROGE">
                  <div className="flex items-center gap-2">
                    {getEffetIcon("ABROGE")}
                    ABROGE - Annule l'article
                  </div>
                </SelectItem>
                <SelectItem value="COMPLETE">
                  <div className="flex items-center gap-2">
                    {getEffetIcon("COMPLETE")}
                    COMPLÈTE - Ajoute un alinéa/point
                  </div>
                </SelectItem>
                <SelectItem value="RENOMME">
                  <div className="flex items-center gap-2">
                    {getEffetIcon("RENOMME")}
                    RENOMME - Change la numérotation
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Portée */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="portee">Portée de l'effet</Label>
              <Select value={portee} onValueChange={setPortee}>
                <SelectTrigger id="portee">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="article">Article complet</SelectItem>
                  <SelectItem value="alinea">Alinéa spécifique</SelectItem>
                  <SelectItem value="point">Point spécifique</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {portee !== "article" && (
              <div className="space-y-2">
                <Label htmlFor="portee-detail">Détail de la portée</Label>
                <Input
                  id="portee-detail"
                  placeholder="Ex: Alinéa 2, Point c)"
                  value={porteeDetail}
                  onChange={(e) => setPorteeDetail(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Date d'effet */}
          <div className="space-y-2">
            <Label htmlFor="date-effet">Date d'entrée en vigueur</Label>
            <Input
              id="date-effet"
              type="date"
              value={dateEffet}
              onChange={(e) => setDateEffet(e.target.value)}
            />
          </div>

          {/* Contenu modifié (sauf pour ABROGE) */}
          {typeEffet !== "ABROGE" && (
            <div className="space-y-2">
              <Label htmlFor="contenu">
                {typeEffet === "MODIFIE" ? "Nouveau contenu (modifié)" : 
                 typeEffet === "REMPLACE" ? "Nouveau contenu (remplacement)" :
                 typeEffet === "COMPLETE" ? "Contenu à ajouter" :
                 "Contenu"}
              </Label>
              {typeEffet === "MODIFIE" && (
                <Alert className="mb-2">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Modifiez le contenu ci-dessous. L'ancien contenu sera conservé dans l'historique.
                  </AlertDescription>
                </Alert>
              )}
              <Textarea
                id="contenu"
                rows={8}
                value={contenuModifie}
                onChange={(e) => setContenuModifie(e.target.value)}
                placeholder={
                  typeEffet === "MODIFIE" 
                    ? "Modifiez le contenu ci-dessous. L'ancien contenu sera conservé dans l'historique."
                    : "Saisissez le contenu..."
                }
              />
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes / Référence JORT (optionnel)</Label>
            <Textarea
              id="notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: JORT n°42 du 15/05/2024, page 1234"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit() || createEffetMutation.isPending}
          >
            {createEffetMutation.isPending ? "Création..." : "Créer l'effet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
