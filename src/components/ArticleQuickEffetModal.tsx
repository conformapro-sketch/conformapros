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
}

export function ArticleQuickEffetModal({
  open,
  onOpenChange,
  targetArticle,
}: ArticleQuickEffetModalProps) {
  const queryClient = useQueryClient();
  
  // État pour la sélection du texte source uniquement
  const [selectedTexteSource, setSelectedTexteSource] = useState<any>(null);
  
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
      console.log("🎯 Article cible:", {
        id: targetArticle.id,
        numero: targetArticle.numero_article,
        texte_id: targetArticle.texte_id,
        texte: targetArticle.texte,
      });
      
      if (!targetArticle.texte) {
        toast.warning("Attention : Les informations du texte parent sont manquantes");
      }
      
      setContenuModifie(targetArticle.contenu || "");
    }
  }, [open, targetArticle]);

  // Réinitialiser le texte source si fourni

  // Valider la hiérarchie des normes
  useEffect(() => {
    if (!selectedTexteSource?.type_acte && !selectedTexteSource?.type) {
      setHierarchyValidation(null);
      return;
    }
    
    if (!targetArticle?.texte?.type) {
      setHierarchyValidation(null);
      return;
    }

    const sourceType = (selectedTexteSource.type_acte || selectedTexteSource.type || "").toLowerCase();
    const targetType = targetArticle.texte.type.toLowerCase();

    // Circulaire ne peut pas modifier/abroger loi ou décret
    if (sourceType === "circulaire") {
      if (["loi", "decret", "décret", "décret-loi"].includes(targetType) && ["ABROGE", "MODIFIE", "REMPLACE"].includes(typeEffet)) {
        setHierarchyValidation({
          severity: "error",
          message: `Une circulaire ne peut pas ${typeEffet.toLowerCase()} une ${targetType}. Utilisez 'COMPLÈTE' pour ajouter une interprétation.`,
        });
        return;
      }
    }
    
    // Arrêté ne peut pas modifier une loi
    if (sourceType === "arrete" || sourceType === "arrêté") {
      if (targetType === "loi" && ["ABROGE", "MODIFIE", "REMPLACE"].includes(typeEffet)) {
        setHierarchyValidation({
          severity: "warning",
          message: "Un arrêté ne peut généralement pas modifier une loi. Vérifiez la cohérence juridique.",
        });
        return;
      }
    }
    
    // Décret peut modifier arrêté mais pas loi
    if (sourceType === "decret" || sourceType === "décret") {
      if (targetType === "loi" && ["ABROGE", "MODIFIE", "REMPLACE"].includes(typeEffet)) {
        setHierarchyValidation({
          severity: "warning",
          message: "Un décret ne peut pas modifier une loi. Seule une loi peut modifier une loi.",
        });
        return;
      }
    }
    
    setHierarchyValidation(null);
  }, [selectedTexteSource, targetArticle, typeEffet]);

  const createEffetMutation = useMutation({
    mutationFn: async () => {
      if (!targetArticle) {
        throw new Error("Article cible manquant");
      }

      if (!selectedTexteSource) {
        throw new Error("Texte source manquant");
      }

      return articlesEffetsJuridiquesQueries.create({
        texte_source_id: selectedTexteSource.id,
        article_source_id: null,
        article_cible_id: targetArticle.id,
        texte_cible_id: targetArticle.texte_id,
        type_effet: typeEffet,
        date_effet: dateEffet,
        portee: portee,
        portee_detail: porteeDetail || null,
        notes: notes || null,
        nouveau_contenu: typeEffet !== 'ABROGE' ? contenuModifie : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["texte-articles"] });
      queryClient.invalidateQueries({ queryKey: ["article-versions"] });
      queryClient.invalidateQueries({ queryKey: ["article-effets-cible"] });
      toast.success("Version créée avec succès");
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      console.error("❌ Erreur détaillée:", error);
      const errorMessage = error?.message || "Erreur inconnue";
      toast.error(`Erreur lors de la création de la version: ${errorMessage}`);
    },
  });

  const resetForm = () => {
    setSelectedTexteSource(null);
    setTypeEffet("MODIFIE");
    setContenuModifie("");
    setDateEffet(new Date().toISOString().split("T")[0]);
    setNotes("");
    setPortee("article");
    setPorteeDetail("");
    setHierarchyValidation(null);
  };

  const canSubmit = () => {
    if (!selectedTexteSource) {
      console.log("❌ Texte source manquant");
      return false;
    }
    if (hierarchyValidation?.severity === "error") {
      console.log("❌ Validation hiérarchique échouée");
      return false;
    }
    if (typeEffet !== "ABROGE" && !contenuModifie.trim()) {
      console.log("❌ Contenu modifié manquant");
      return false;
    }
    console.log("✅ Formulaire valide");
    return true;
  };

  const handleSubmit = () => {
    if (!canSubmit()) {
      toast.error("Veuillez remplir tous les champs requis");
      return;
    }
    
    if (hierarchyValidation?.severity === "error") {
      toast.error("Impossible de créer cette version en raison d'une incohérence hiérarchique");
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
      case "RENUMEROTE": return <Hash className="h-4 w-4" />;
      case "COMPLETE": return <Info className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer une version</DialogTitle>
          <DialogDescription>
            Créer une nouvelle version de l'article{" "}
            <strong>{targetArticle?.numero_article}</strong>
            {targetArticle?.texte?.reference_officielle && ` du ${targetArticle.texte.reference_officielle}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Aide contextuelle */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs space-y-1 mt-2">
              <div><strong>Comment créer une version ?</strong></div>
              <div>1️⃣ Sélectionnez le <strong>texte source</strong> (nouveau décret/loi qui modifie)</div>
              <div>2️⃣ Définissez le <strong>type de modification</strong> (MODIFIE, REMPLACE, ABROGE...)</div>
              <div>3️⃣ Saisissez le <strong>nouveau contenu</strong> (sera créé automatiquement en version 2)</div>
            </AlertDescription>
          </Alert>

          {/* Récapitulatif article cible */}
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-3">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">📌 Article cible</h4>
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <div className="font-medium">{targetArticle?.numero_article}</div>
              <div className="text-xs">{targetArticle?.texte?.reference_officielle}</div>
            </div>
          </div>
          {/* Sélection du texte source UNIQUEMENT */}
          <div className="space-y-2">
            <Label>
              📄 Texte réglementaire source *
              <span className="text-xs text-muted-foreground block mt-1">
                Le texte qui crée cette modification (décret, loi, arrêté...)
              </span>
            </Label>
            <TexteAutocomplete
              value={selectedTexteSource?.id}
              onChange={(texte) => {
                console.log("📄 Texte source sélectionné:", texte);
                setSelectedTexteSource(texte);
              }}
              placeholder="Ex: Décret n°2024-123 du 15 janvier 2024"
            />
            {selectedTexteSource && (
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">
                  {selectedTexteSource.type_acte?.toUpperCase() || "Texte"}
                </span>
                {" - "}
                {selectedTexteSource.reference_officielle}
              </div>
            )}
          </div>

          {/* Validation hiérarchique */}
          {hierarchyValidation && (
            <HierarchyAlert
              severity={hierarchyValidation.severity}
              message={hierarchyValidation.message}
            />
          )}

          {/* Type de modification */}
          <div className="space-y-2 border-t pt-4">
            <Label htmlFor="type-effet" className="flex items-center gap-2">
              Type de modification
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
                <SelectItem value="RENUMEROTE">
                  <div className="flex items-center gap-2">
                    {getEffetIcon("RENUMEROTE")}
                    RENUMEROTE - Change la numérotation
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Portée */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="portee">Portée de la modification</Label>
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
            {createEffetMutation.isPending ? "Création..." : "Créer la version"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
