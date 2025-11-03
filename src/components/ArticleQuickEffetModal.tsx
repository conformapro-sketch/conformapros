import { useState } from "react";
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
import { toast } from "sonner";
import { articlesEffetsJuridiquesQueries } from "@/lib/actes-queries";
import { textesReglementairesQueries } from "@/lib/textes-queries";
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
  };
  sourceTexte?: {
    id: string;
    reference_officielle: string;
    type?: string;
  };
}

export function ArticleQuickEffetModal({
  open,
  onOpenChange,
  targetArticle,
  sourceTexte,
}: ArticleQuickEffetModalProps) {
  const queryClient = useQueryClient();
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

  // Initialize content when modal opens
  useState(() => {
    if (open && targetArticle) {
      setContenuModifie(targetArticle.contenu || "");
    }
  });

  // Validate hierarchy when typeEffet changes
  useState(() => {
    if (!sourceTexte?.type) return;
    
    const sourceType = sourceTexte.type.toLowerCase();
    
    // Circulaire restrictions
    if (sourceType === "circulaire") {
      if (["ABROGE", "MODIFIE", "REMPLACE"].includes(typeEffet)) {
        setHierarchyValidation({
          severity: "error",
          message: "Une circulaire ne peut pas abroger, modifier ou remplacer une loi ou un décret. Utilisez 'COMPLÈTE' pour ajouter une interprétation.",
        });
      } else {
        setHierarchyValidation(null);
      }
    }
    // Arrêté restrictions
    else if (sourceType === "arrêté") {
      if (["ABROGE", "MODIFIE", "REMPLACE"].includes(typeEffet)) {
        setHierarchyValidation({
          severity: "warning",
          message: "Un arrêté ne peut généralement pas modifier une loi. Vérifiez la cohérence juridique.",
        });
      } else {
        setHierarchyValidation(null);
      }
    } else {
      setHierarchyValidation(null);
    }
  });

  const createEffetMutation = useMutation({
    mutationFn: async (data: any) => {
      // Create the legal effect
      return articlesEffetsJuridiquesQueries.create({
        article_source_id: data.articleSourceId,
        article_cible_id: targetArticle!.id,
        texte_cible_id: targetArticle!.texte_id,
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
    setTypeEffet("MODIFIE");
    setContenuModifie("");
    setDateEffet(new Date().toISOString().split("T")[0]);
    setNotes("");
    setPortee("article");
    setPorteeDetail("");
    setHierarchyValidation(null);
  };

  const handleSubmit = () => {
    if (!targetArticle || !sourceTexte) return;
    
    if (hierarchyValidation?.severity === "error") {
      toast.error("Impossible de créer cet effet juridique en raison d'une incohérence hiérarchique");
      return;
    }

    // For now, we create a temporary article source (in real implementation, this should be done separately)
    createEffetMutation.mutate({
      articleSourceId: sourceTexte.id, // This should be the actual source article ID
    });
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
            Déclarez l'impact de votre nouveau texte sur l'article{" "}
            <strong>{targetArticle?.numero_article}</strong>.
            Une nouvelle version sera créée automatiquement.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Hierarchy validation alert */}
          {hierarchyValidation && (
            <HierarchyAlert
              severity={hierarchyValidation.severity}
              message={hierarchyValidation.message}
            />
          )}

          {/* Type d'effet */}
          <div className="space-y-2">
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
                {typeEffet === "MODIFIE" ? "Nouveau contenu" : "Contenu"}
              </Label>
              <Textarea
                id="contenu"
                rows={8}
                value={contenuModifie}
                onChange={(e) => setContenuModifie(e.target.value)}
                placeholder="Saisissez le contenu modifié de l'article..."
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
            disabled={createEffetMutation.isPending || hierarchyValidation?.severity === "error"}
          >
            {createEffetMutation.isPending ? "Création..." : "Créer l'effet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
