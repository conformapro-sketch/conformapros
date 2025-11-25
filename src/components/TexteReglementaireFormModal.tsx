import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { textesReglementairesQueries, TexteReglementaire } from "@/lib/textes-reglementaires-queries";
import { toast } from "sonner";
import { Upload, X, Loader2, FileText, ExternalLink } from "lucide-react";

interface TexteReglementaireFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  texte?: TexteReglementaire | null;
  onSuccess?: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  loi: "Loi",
  decret: "Décret",
  arrete: "Arrêté",
  circulaire: "Circulaire"
};

export function TexteReglementaireFormModal({ 
  open, 
  onOpenChange, 
  texte, 
  onSuccess 
}: TexteReglementaireFormModalProps) {
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    type: "loi" as "loi" | "decret" | "arrete" | "circulaire",
    reference: "",
    titre: "",
    date_publication: "",
    source_url: "",
  });

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [existingPdfUrl, setExistingPdfUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (texte) {
      setFormData({
        type: texte.type,
        reference: texte.reference,
        titre: texte.titre,
        date_publication: texte.date_publication || "",
        source_url: texte.source_url || "",
      });
      setExistingPdfUrl(texte.pdf_url || null);
      setPdfFile(null);
    } else {
      setFormData({
        type: "loi",
        reference: "",
        titre: "",
        date_publication: "",
        source_url: "",
      });
      setExistingPdfUrl(null);
      setPdfFile(null);
    }
  }, [texte, open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Seuls les fichiers PDF sont acceptés');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Le fichier ne doit pas dépasser 10 Mo');
      return;
    }

    setPdfFile(file);
  };

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      try {
        setIsUploading(true);
        let pdfUrl = null;
        
        if (pdfFile) {
          pdfUrl = await textesReglementairesQueries.uploadPDF(pdfFile);
        }
        
        setIsUploading(false);

        return await textesReglementairesQueries.create({
          ...data,
          pdf_url: pdfUrl || undefined,
        });
      } catch (error) {
        setIsUploading(false);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["textes-reglementaires"] });
      toast.success("Texte créé avec succès");
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      console.error('Create error:', error);
      toast.error(error.message || "Erreur lors de la création");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      try {
        setIsUploading(true);
        let pdfUrl = existingPdfUrl;
        
        if (pdfFile) {
          // Delete old PDF if exists
          if (existingPdfUrl) {
            await textesReglementairesQueries.deletePDF(existingPdfUrl);
          }
          pdfUrl = await textesReglementairesQueries.uploadPDF(pdfFile);
        }
        
        setIsUploading(false);

        return await textesReglementairesQueries.update(id, {
          ...data,
          pdf_url: pdfUrl || undefined,
        });
      } catch (error) {
        setIsUploading(false);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["textes-reglementaires"] });
      toast.success("Texte modifié avec succès");
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      console.error('Update error:', error);
      toast.error(error.message || "Erreur lors de la modification");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.reference.trim()) {
      toast.error("La référence est requise");
      return;
    }
    if (!formData.titre.trim()) {
      toast.error("Le titre est requis");
      return;
    }
    
    if (texte) {
      updateMutation.mutate({ id: texte.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending || isUploading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {texte ? "Modifier le texte réglementaire" : "Créer un texte réglementaire"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Type de texte *</Label>
            <Select 
              value={formData.type} 
              onValueChange={(val: any) => setFormData({ ...formData, type: val })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Référence officielle *</Label>
            <Input
              id="reference"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              placeholder="Ex: Loi n° 94-28 du 21 février 1994"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="titre">Titre *</Label>
            <Textarea
              id="titre"
              value={formData.titre}
              onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
              placeholder="Intitulé complet du texte réglementaire"
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date_publication">Date de publication</Label>
            <Input
              id="date_publication"
              type="date"
              value={formData.date_publication}
              onChange={(e) => setFormData({ ...formData, date_publication: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="source_url">URL du texte officiel</Label>
            <div className="flex gap-2">
              <Input
                id="source_url"
                value={formData.source_url}
                onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
                placeholder="https://..."
              />
              {formData.source_url && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(formData.source_url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Document PDF officiel</Label>
            {pdfFile || existingPdfUrl ? (
              <div className="border rounded-lg p-4 bg-muted/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-md">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {pdfFile ? pdfFile.name : "Document PDF actuel"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {pdfFile ? `${(pdfFile.size / 1024 / 1024).toFixed(2)} Mo` : "PDF"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {existingPdfUrl && !pdfFile && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => window.open(existingPdfUrl, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setPdfFile(null);
                        if (!texte) setExistingPdfUrl(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => document.getElementById("pdf_file")?.click()}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Upload className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      Cliquez pour télécharger un fichier PDF
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      ou glissez-déposez votre fichier ici
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Format PDF uniquement • Taille max: 10 Mo
                  </p>
                </div>
              </div>
            )}
            <input
              id="pdf_file"
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isUploading ? "Upload en cours..." : "Enregistrement..."}
                </>
              ) : (
                texte ? "Modifier" : "Créer"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
