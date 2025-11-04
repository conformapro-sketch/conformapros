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
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabaseAny as supabase } from "@/lib/supabase-any";
import { TexteAutocomplete } from "./bibliotheque/TexteAutocomplete";
import { TexteFormModal } from "./TexteFormModal";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Info, 
  Pencil, 
  Plus, 
  Replace, 
  XCircle, 
  Hash, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle,
  Upload,
  X,
  FileText,
  AlertTriangle
} from "lucide-react";
import { HierarchyAlert } from "@/components/HierarchyAlert";

interface ArticleVersionWizardProps {
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
      intitule: string;
    };
  };
  onSuccess?: () => void;
}

export function ArticleVersionWizard({
  open,
  onOpenChange,
  targetArticle,
  onSuccess,
}: ArticleVersionWizardProps) {
  const queryClient = useQueryClient();
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  
  // Form data
  const [selectedTexteSource, setSelectedTexteSource] = useState<any>(null);
  const [typeEffet, setTypeEffet] = useState<string>("MODIFIE");
  const [contenuModifie, setContenuModifie] = useState<string>("");
  const [dateEffet, setDateEffet] = useState<string>(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState<string>("");
  const [portee, setPortee] = useState<string>("article");
  const [porteeDetail, setPorteeDetail] = useState<string>("");
  const [raisonModification, setRaisonModification] = useState<string>("");
  const [impactEstime, setImpactEstime] = useState<string>("medium");
  const [documentSource, setDocumentSource] = useState<File | null>(null);
  
  // UI state
  const [hierarchyValidation, setHierarchyValidation] = useState<{
    severity: "error" | "warning" | "info" | "success";
    message: string;
  } | null>(null);
  const [showQuickAddTexte, setShowQuickAddTexte] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize content with current article content
  useEffect(() => {
    if (open && targetArticle) {
      setContenuModifie(targetArticle.contenu || "");
    }
  }, [open, targetArticle]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setCurrentStep(1);
      resetForm();
    }
  }, [open]);

  // Validate hierarchy
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

    // Circulaire cannot modify/abrogate law or decree
    if (sourceType === "circulaire") {
      if (["loi", "decret", "décret", "décret-loi"].includes(targetType) && ["ABROGE", "MODIFIE", "REMPLACE"].includes(typeEffet)) {
        setHierarchyValidation({
          severity: "error",
          message: `Une circulaire ne peut pas ${typeEffet.toLowerCase()} une ${targetType}. Utilisez 'COMPLÈTE' pour ajouter une interprétation.`,
        });
        return;
      }
    }
    
    // Arrêté cannot modify law
    if (sourceType === "arrete" || sourceType === "arrêté") {
      if (targetType === "loi" && ["ABROGE", "MODIFIE", "REMPLACE"].includes(typeEffet)) {
        setHierarchyValidation({
          severity: "warning",
          message: "Un arrêté ne peut généralement pas modifier une loi. Vérifiez la cohérence juridique.",
        });
        return;
      }
    }
    
    // Decree cannot modify law
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

  const handleDocumentUpload = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `article-versions/${targetArticle?.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('actes_annexes')
      .upload(filePath, file);

    if (uploadError) {
      throw new Error(`Erreur lors de l'upload: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('actes_annexes')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const createVersionMutation = useMutation({
    mutationFn: async () => {
      if (!targetArticle || !selectedTexteSource) {
        throw new Error("Données manquantes");
      }

      // 1. Get current active version
      const { data: currentVersion } = await supabase
        .from("article_versions")
        .select("*")
        .eq("article_id", targetArticle.id)
        .eq("is_active", true)
        .order("version_numero", { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextVersionNumber = (currentVersion?.version_numero || 0) + 1;

      // 2. Upload document if provided
      let documentUrl = null;
      if (documentSource) {
        documentUrl = await handleDocumentUpload(documentSource);
      }

      // 3. Create new version
      const { data: newVersion, error: versionError } = await supabase
        .from("article_versions")
        .insert({
          article_id: targetArticle.id,
          version_numero: nextVersionNumber,
          version_label: `v${nextVersionNumber}`,
          contenu: typeEffet === "ABROGE" 
            ? `<p><em>Article abrogé par ${selectedTexteSource.reference_officielle}</em></p>`
            : contenuModifie,
          date_version: new Date().toISOString(),
          modification_type: typeEffet.toLowerCase(),
          source_text_id: selectedTexteSource.id,
          source_article_reference: selectedTexteSource.reference_officielle,
          effective_from: dateEffet,
          is_active: true,
          raison_modification: raisonModification,
          impact_estime: impactEstime,
          tags: [typeEffet.toLowerCase()],
        })
        .select()
        .single();

      if (versionError) throw versionError;

      // 4. Deactivate previous version
      if (currentVersion) {
        const { error: updateError } = await supabase
          .from("article_versions")
          .update({
            is_active: false,
            effective_to: dateEffet,
          })
          .eq("id", currentVersion.id);

        if (updateError) throw updateError;
      }

      // 5. Create legal effect
      const { error: effetError } = await supabase
        .from("articles_effets_juridiques")
        .insert({
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

      if (effetError) throw effetError;

      return newVersion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["texte-articles"] });
      queryClient.invalidateQueries({ queryKey: ["article-versions"] });
      queryClient.invalidateQueries({ queryKey: ["article-effets-cible"] });
      queryClient.invalidateQueries({ queryKey: ["articles-effets"] });
      queryClient.invalidateQueries({ queryKey: ["effets-juridiques-texte"] });
      toast.success("Version créée avec succès");
      onOpenChange(false);
      onSuccess?.();
      resetForm();
    },
    onError: (error: any) => {
      console.error("❌ Erreur:", error);
      toast.error(`Erreur: ${error.message}`);
      setIsSubmitting(false);
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
    setRaisonModification("");
    setImpactEstime("medium");
    setDocumentSource(null);
    setHierarchyValidation(null);
  };

  const canProceedToStep = (step: number): boolean => {
    switch (step) {
      case 2:
        return true; // Step 1 is always valid (article is passed as prop)
      case 3:
        return !!selectedTexteSource && hierarchyValidation?.severity !== "error";
      case 4:
        if (typeEffet !== "ABROGE" && !contenuModifie.trim()) return false;
        if (!raisonModification.trim()) return false;
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (hierarchyValidation?.severity === "error") {
      toast.error("Impossible de créer cette version en raison d'une incohérence hiérarchique");
      return;
    }
    
    setIsSubmitting(true);
    createVersionMutation.mutate();
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

  const getEffetBadge = (type: string) => {
    const variants: Record<string, string> = {
      MODIFIE: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      REMPLACE: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      ABROGE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      COMPLETE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      RENUMEROTE: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      AJOUTE: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
    };
    return variants[type] || "";
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Vous allez créer une nouvelle version pour cet article. L'ancienne version sera archivée et conservée dans l'historique.
              </AlertDescription>
            </Alert>
            
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Article cible
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Numéro</span>
                  <span className="font-medium">{targetArticle?.numero_article}</span>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <span className="text-sm text-muted-foreground">Texte parent</span>
                  <div className="text-right">
                    <div className="font-medium text-sm">{targetArticle?.texte?.reference_officielle}</div>
                    <div className="text-xs text-muted-foreground">{targetArticle?.texte?.intitule}</div>
                  </div>
                </div>
                <div className="pt-2 mt-2 border-t">
                  <Badge variant="outline" className="text-xs">
                    {targetArticle?.texte?.type?.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            {/* Texte source */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                📄 Texte réglementaire source *
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Le texte qui crée cette modification (décret, loi, arrêté...)
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <TexteAutocomplete
                    value={selectedTexteSource?.id}
                    onChange={(texte) => setSelectedTexteSource(texte)}
                    placeholder="Ex: Décret n°2024-123 du 15 janvier 2024"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowQuickAddTexte(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau
                </Button>
              </div>
              {selectedTexteSource && (
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {selectedTexteSource.type_acte?.toUpperCase() || "TEXTE"}
                  </Badge>
                  <span>{selectedTexteSource.reference_officielle}</span>
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
            <div className="space-y-2">
              <Label htmlFor="type-effet">Type de modification *</Label>
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
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
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
              <Label htmlFor="date-effet">Date d'entrée en vigueur *</Label>
              <Input
                id="date-effet"
                type="date"
                value={dateEffet}
                onChange={(e) => setDateEffet(e.target.value)}
              />
            </div>

            {/* Contenu modifié */}
            {typeEffet !== "ABROGE" && (
              <div className="space-y-2">
                <Label htmlFor="contenu">
                  {typeEffet === "MODIFIE" ? "Nouveau contenu (modifié)" : 
                   typeEffet === "REMPLACE" ? "Nouveau contenu (remplacement)" :
                   typeEffet === "COMPLETE" ? "Contenu à ajouter" :
                   "Contenu"}
                </Label>
                {typeEffet === "MODIFIE" && (
                  <Alert>
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
                  placeholder="Saisissez le contenu..."
                />
              </div>
            )}

            {/* Raison de modification */}
            <div className="space-y-2">
              <Label htmlFor="raison" className="flex items-center gap-1">
                Raison de la modification *
              </Label>
              <Textarea
                id="raison"
                rows={3}
                value={raisonModification}
                onChange={(e) => setRaisonModification(e.target.value)}
                placeholder="Ex: Mise en conformité suite à l'adoption de la nouvelle loi n°2024-XX..."
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Expliquez pourquoi cette modification est nécessaire
              </p>
            </div>

            {/* Impact estimé */}
            <div className="space-y-2">
              <Label>Évaluation de l'impact</Label>
              <RadioGroup value={impactEstime} onValueChange={setImpactEstime}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="low" id="impact-low" />
                  <Label htmlFor="impact-low" className="cursor-pointer">Faible</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="medium" id="impact-medium" />
                  <Label htmlFor="impact-medium" className="cursor-pointer">Moyen</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="high" id="impact-high" />
                  <Label htmlFor="impact-high" className="cursor-pointer">Élevé</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Notes / Référence JORT */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes / Référence JORT</Label>
              <Input
                id="notes"
                placeholder="Ex: JORT n°42 du 15/05/2024, p.1234"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Document source */}
            <div className="space-y-2">
              <Label>Joindre document source (PDF, image)</Label>
              {documentSource ? (
                <div className="border rounded-lg p-4 bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-md">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{documentSource.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {Math.round(documentSource.size / 1024)} Ko
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setDocumentSource(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => document.getElementById("document_file")?.click()}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <Upload className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Cliquez pour télécharger</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PDF, JPG, PNG • Max 10 Mo
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <input
                id="document_file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 10 * 1024 * 1024) {
                      toast.error("Le fichier ne doit pas dépasser 10 Mo");
                      return;
                    }
                    setDocumentSource(file);
                  }
                }}
                className="hidden"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Vérifiez les informations ci-dessous avant de créer la nouvelle version.
              </AlertDescription>
            </Alert>

            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-start justify-between">
                <span className="text-sm text-muted-foreground">Article cible</span>
                <div className="text-right">
                  <div className="font-medium">{targetArticle?.numero_article}</div>
                  <div className="text-xs text-muted-foreground">{targetArticle?.texte?.reference_officielle}</div>
                </div>
              </div>

              <div className="border-t pt-3 flex items-start justify-between">
                <span className="text-sm text-muted-foreground">Texte source</span>
                <div className="text-right">
                  <div className="font-medium">{selectedTexteSource?.reference_officielle}</div>
                  <Badge variant="secondary" className="text-xs mt-1">
                    {selectedTexteSource?.type_acte?.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div className="border-t pt-3 flex items-start justify-between">
                <span className="text-sm text-muted-foreground">Type de modification</span>
                <Badge className={getEffetBadge(typeEffet)}>
                  {typeEffet}
                </Badge>
              </div>

              <div className="border-t pt-3 flex items-start justify-between">
                <span className="text-sm text-muted-foreground">Date d'entrée en vigueur</span>
                <div className="font-medium">
                  {new Date(dateEffet).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                  })}
                </div>
              </div>

              <div className="border-t pt-3 flex items-start justify-between">
                <span className="text-sm text-muted-foreground">Impact estimé</span>
                <Badge variant="outline">
                  {impactEstime === "low" ? "⚪ Faible" : 
                   impactEstime === "medium" ? "⚠️ Moyen" : 
                   "🔴 Élevé"}
                </Badge>
              </div>

              <div className="border-t pt-3">
                <span className="text-sm text-muted-foreground block mb-2">Raison</span>
                <p className="text-sm bg-muted/50 p-3 rounded-md">{raisonModification}</p>
              </div>

              <div className="border-t pt-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Portée</span>
                <span className="text-sm font-medium">
                  {portee === "article" ? "Article complet" : portee === "alinea" ? `Alinéa: ${porteeDetail}` : `Point: ${porteeDetail}`}
                </span>
              </div>

              {notes && (
                <div className="border-t pt-3">
                  <span className="text-sm text-muted-foreground block mb-2">Notes / JORT</span>
                  <p className="text-sm">{notes}</p>
                </div>
              )}

              {documentSource && (
                <div className="border-t pt-3 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Document joint</span>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{documentSource.name}</span>
                  </div>
                </div>
              )}
            </div>

            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>⚠️ Cette action va :</strong>
                <ul className="list-disc ml-4 mt-2 space-y-1">
                  <li>Créer une nouvelle version de l'article</li>
                  <li>Archiver l'ancienne version (conservée dans l'historique)</li>
                  <li>Enregistrer un effet juridique</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer une version d'article</DialogTitle>
            <DialogDescription>
              Étape {currentStep}/4 - {
                currentStep === 1 ? "Sélection de l'article" :
                currentStep === 2 ? "Texte source et type" :
                currentStep === 3 ? "Contenu et métadonnées" :
                "Récapitulatif"
              }
            </DialogDescription>
          </DialogHeader>

          {/* Progress */}
          <div className="space-y-2">
            <Progress value={(currentStep / 4) * 100} />
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`h-2 w-2 rounded-full transition-all ${
                    step === currentStep
                      ? "bg-primary w-4"
                      : step < currentStep
                      ? "bg-success"
                      : "bg-muted"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Step content */}
          <div className="py-4">
            {renderStep()}
          </div>

          {/* Navigation */}
          <DialogFooter className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => {
                if (currentStep === 1) {
                  onOpenChange(false);
                } else {
                  setCurrentStep(currentStep - 1);
                }
              }}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              {currentStep === 1 ? "Annuler" : "Retour"}
            </Button>

            {currentStep < 4 ? (
              <Button
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!canProceedToStep(currentStep + 1)}
              >
                Suivant
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !canProceedToStep(4)}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirmer et créer
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Add Text Modal */}
      <TexteFormModal
        open={showQuickAddTexte}
        onOpenChange={setShowQuickAddTexte}
        onSuccess={() => {
          setShowQuickAddTexte(false);
          queryClient.invalidateQueries({ queryKey: ["textes-reglementaires"] });
          toast.success("Texte créé. Vous pouvez maintenant le sélectionner.");
        }}
      />
    </>
  );
}
