import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { textesReglementairesQueries, domainesQueries } from "@/lib/textes-queries";
import { supabaseAny as supabase } from "@/lib/supabase-any";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TexteReglementaireFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  texte?: any | null;
  onSuccess?: () => void;
}

export function TexteReglementaireFormModal({ 
  open, 
  onOpenChange, 
  texte, 
  onSuccess 
}: TexteReglementaireFormModalProps) {
  const queryClient = useQueryClient();
  
  // Helper function to normalize old enum values to new simple values
  const normalizeType = (type: string): "LOI" | "ARRETE" | "DECRET" | "CIRCULAIRE" => {
    if (type.startsWith("LOI") || type === "DECRET_LOI") return "LOI";
    if (type.startsWith("ARRETE")) return "ARRETE";
    if (type.startsWith("DECRET")) return "DECRET";
    return "CIRCULAIRE";
  };
  
  const [formData, setFormData] = useState({
    type: "LOI" as any,
    reference_officielle: "",
    titre: "",
    autorite: "",
    date_publication: "",
    statut_vigueur: "en_vigueur" as any,
    resume: "",
    fichier_pdf_url: "",
    annee: new Date().getFullYear(),
  });
  const [selectedDomaines, setSelectedDomaines] = useState<string[]>([]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [existingPdfUrl, setExistingPdfUrl] = useState<string>("");

  const { data: domaines } = useQuery({
    queryKey: ["domaines"],
    queryFn: () => domainesQueries.getActive(),
  });

  useEffect(() => {
    if (texte) {
      setFormData({
        type: normalizeType(texte.type),
        reference_officielle: texte.reference_officielle,
        titre: texte.titre,
        autorite: texte.autorite || "",
        date_publication: texte.date_publication || "",
        statut_vigueur: texte.statut_vigueur,
        resume: texte.resume || "",
        fichier_pdf_url: texte.fichier_pdf_url || "",
        annee: texte.annee || new Date().getFullYear(),
      });
      setExistingPdfUrl(texte.fichier_pdf_url || "");
      
      // Load existing domaines
      if (texte.domaines && Array.isArray(texte.domaines)) {
        const domaineIds = texte.domaines
          .map((d: any) => d.domaine?.id)
          .filter((id: string) => !!id);
        setSelectedDomaines(domaineIds);
      }
    } else {
      resetForm();
    }
  }, [texte, open]);

  const resetForm = () => {
    setFormData({
      type: "LOI",
      reference_officielle: "",
      titre: "",
      autorite: "",
      date_publication: "",
      statut_vigueur: "en_vigueur",
      resume: "",
      fichier_pdf_url: "",
      annee: new Date().getFullYear(),
    });
    setSelectedDomaines([]);
    setPdfFile(null);
    setExistingPdfUrl("");
    setUploadProgress(0);
  };

  const handlePdfUpload = async (file: File): Promise<string> => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('textes_reglementaires_pdf')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('textes_reglementaires_pdf')
        .getPublicUrl(filePath);

      setUploadProgress(100);
      return publicUrl;
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error("Erreur lors de l'upload du PDF: " + error.message);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      // Upload PDF first if provided
      let pdfUrl = data.fichier_pdf_url;
      if (pdfFile) {
        pdfUrl = await handlePdfUpload(pdfFile);
      }

      return textesReglementairesQueries.create(
        { ...data, fichier_pdf_url: pdfUrl },
        selectedDomaines
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bibliotheque-navigation-tree"] });
      queryClient.invalidateQueries({ queryKey: ["textes-reglementaires"] });
      toast.success("Texte réglementaire ajouté avec succès");
      onOpenChange(false);
      resetForm();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de la création");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      // Upload new PDF if provided
      let pdfUrl = data.fichier_pdf_url;
      if (pdfFile) {
        pdfUrl = await handlePdfUpload(pdfFile);
      }

      return textesReglementairesQueries.update(
        texte.id,
        { ...data, fichier_pdf_url: pdfUrl },
        selectedDomaines
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bibliotheque-navigation-tree"] });
      queryClient.invalidateQueries({ queryKey: ["textes-reglementaires"] });
      queryClient.invalidateQueries({ queryKey: ["texte-detail"] });
      toast.success("Modifications enregistrées");
      onOpenChange(false);
      resetForm();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de la modification");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.type || !formData.reference_officielle.trim() || !formData.titre.trim() || 
        !formData.autorite.trim() || !formData.date_publication) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    const cleanData = {
      ...formData,
      reference_officielle: formData.reference_officielle.trim(),
      titre: formData.titre.trim(),
      autorite: formData.autorite.trim(),
      resume: formData.resume?.trim() || null,
    };

    if (texte) {
      updateMutation.mutate(cleanData);
    } else {
      createMutation.mutate(cleanData);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error("Veuillez sélectionner un fichier PDF");
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error("Le fichier ne doit pas dépasser 10 MB");
        return;
      }
      setPdfFile(file);
    }
  };

  const toggleDomaine = (domaineId: string) => {
    setSelectedDomaines(prev =>
      prev.includes(domaineId)
        ? prev.filter(id => id !== domaineId)
        : [...prev, domaineId]
    );
  };

  const isLoading = createMutation.isPending || updateMutation.isPending || isUploading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {texte ? "Modifier le texte réglementaire" : "Ajouter un texte réglementaire"}
          </DialogTitle>
          <DialogDescription>
            Remplissez les informations du texte réglementaire
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type de texte */}
          <div className="space-y-2">
            <Label htmlFor="type">Type de texte *</Label>
            <Select 
              value={formData.type} 
              onValueChange={(val) => setFormData({ ...formData, type: val })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOI">Loi</SelectItem>
                <SelectItem value="ARRETE">Arrêté</SelectItem>
                <SelectItem value="DECRET">Décret</SelectItem>
                <SelectItem value="CIRCULAIRE">Circulaire</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Référence officielle */}
          <div className="space-y-2">
            <Label htmlFor="reference_officielle">Référence officielle *</Label>
            <Input
              id="reference_officielle"
              value={formData.reference_officielle}
              onChange={(e) => setFormData({ ...formData, reference_officielle: e.target.value })}
              placeholder="Ex: Loi n° 94-28"
              required
            />
          </div>

          {/* Titre officiel */}
          <div className="space-y-2">
            <Label htmlFor="titre">Titre officiel *</Label>
            <Input
              id="titre"
              value={formData.titre}
              onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
              placeholder="Titre complet du texte"
              required
            />
          </div>

          {/* Autorité émettrice + Date publication */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="autorite">Autorité émettrice *</Label>
              <Input
                id="autorite"
                value={formData.autorite}
                onChange={(e) => setFormData({ ...formData, autorite: e.target.value })}
                placeholder="Ex: Assemblée nationale"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_publication">Date de publication *</Label>
              <Input
                id="date_publication"
                type="date"
                value={formData.date_publication}
                onChange={(e) => setFormData({ ...formData, date_publication: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Statut de vigueur */}
          <div className="space-y-2">
            <Label htmlFor="statut_vigueur">Statut de vigueur *</Label>
            <Select 
              value={formData.statut_vigueur} 
              onValueChange={(val) => setFormData({ ...formData, statut_vigueur: val })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en_vigueur">En vigueur</SelectItem>
                <SelectItem value="modifie">Modifié</SelectItem>
                <SelectItem value="abroge">Abrogé</SelectItem>
                <SelectItem value="suspendu">Suspendu</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Résumé */}
          <div className="space-y-2">
            <Label htmlFor="resume">Résumé</Label>
            <RichTextEditor
              value={formData.resume}
              onChange={(value) => setFormData({ ...formData, resume: value })}
              placeholder="Résumé du contenu du texte..."
              className="min-h-[150px]"
            />
          </div>

          {/* Domaines d'application */}
          <div className="space-y-2">
            <Label>Domaine(s) d'application</Label>
            <div className="border rounded-md p-4 max-h-48 overflow-y-auto space-y-2">
              {domaines && domaines.length > 0 ? (
                domaines.map((domaine) => (
                  <div key={domaine.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`domaine-${domaine.id}`}
                      checked={selectedDomaines.includes(domaine.id)}
                      onCheckedChange={() => toggleDomaine(domaine.id)}
                    />
                    <Label
                      htmlFor={`domaine-${domaine.id}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {domaine.libelle}
                    </Label>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Aucun domaine disponible</p>
              )}
            </div>
            {selectedDomaines.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedDomaines.map((id) => {
                  const domaine = domaines?.find(d => d.id === id);
                  return domaine ? (
                    <Badge key={id} variant="secondary">
                      {domaine.libelle}
                    </Badge>
                  ) : null;
                })}
              </div>
            )}
          </div>

          {/* Upload PDF */}
          <div className="space-y-2">
            <Label htmlFor="pdf-upload">Pièce jointe PDF</Label>
            
            {existingPdfUrl && !pdfFile && (
              <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-sm flex-1">PDF existant</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(existingPdfUrl, '_blank')}
                >
                  Voir
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setExistingPdfUrl("");
                    setFormData({ ...formData, fichier_pdf_url: "" });
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {pdfFile ? (
              <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-sm flex-1 truncate">{pdfFile.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPdfFile(null)}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-md p-6 text-center hover:border-primary/50 transition-colors">
                <Input
                  id="pdf-upload"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Label htmlFor="pdf-upload" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Cliquez pour sélectionner un fichier PDF
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum 10 MB
                  </p>
                </Label>
              </div>
            )}

            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Upload en cours... {uploadProgress}%
                </div>
              </div>
            )}
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
              {texte ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
