import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { textesReglementairesQueries, TexteReglementaire } from "@/lib/textes-queries";
import { domainesQueries } from "@/lib/textes-queries";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { TexteCodesSelector } from "@/components/TexteCodesSelector";
import { textesCodesQueries } from "@/lib/codes-queries";
import type { TypeRelationCode } from "@/types/codes";
import { supabaseAny as supabase } from "@/lib/supabase-any";
import { Upload, X, Loader2, FileText } from "lucide-react";

interface TexteFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  texte?: TexteReglementaire | null;
  onSuccess?: () => void;
}

export function TexteFormModal({ open, onOpenChange, texte, onSuccess }: TexteFormModalProps) {
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    type_acte: "loi" as "loi" | "arrete" | "decret" | "circulaire",
    reference_officielle: "",
    intitule: "",
    autorite_emettrice: "",
    date_publication: "",
    statut_vigueur: "en_vigueur" as "en_vigueur" | "abroge" | "suspendu" | "modifie",
    resume: "",
    lien_officiel: "",
    annee: new Date().getFullYear(),
  });
  const [selectedDomaines, setSelectedDomaines] = useState<string[]>([]);
  const [selectedCodes, setSelectedCodes] = useState<
    Array<{ codeId: string; typeRelation: TypeRelationCode }>
  >([]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [existingPdfUrl, setExistingPdfUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data: domaines, isLoading: domainesLoading } = useQuery({
    queryKey: ["domaines"],
    queryFn: () => domainesQueries.getActive(),
  });

  // Charger les codes associés si on édite un texte
  const { data: existingCodes } = useQuery({
    queryKey: ["texte-codes", texte?.id],
    queryFn: () => textesCodesQueries.getCodesByTexteId(texte!.id),
    enabled: !!texte?.id,
  });

  useEffect(() => {
    if (texte) {
      setFormData({
        type_acte: texte.type_acte,
        reference_officielle: texte.reference_officielle,
        intitule: texte.intitule,
        autorite_emettrice: texte.autorite_emettrice || "",
        date_publication: texte.date_publication || "",
        statut_vigueur: texte.statut_vigueur,
        resume: texte.resume || "",
        lien_officiel: texte.lien_officiel || "",
        annee: texte.annee || new Date().getFullYear(),
      });
      
      // Load existing domaines
      const texteWithRelations = texte as any;
      if (texteWithRelations.domaines) {
        const domaineIds = texteWithRelations.domaines
          .map((d: any) => d.domaine?.id)
          .filter(Boolean);
        setSelectedDomaines(domaineIds);
      }

      // Load existing codes
      if (existingCodes) {
        const codes = existingCodes.map((tc: any) => ({
          codeId: tc.codes_juridiques.id,
          typeRelation: tc.type_relation as TypeRelationCode,
        }));
        setSelectedCodes(codes);
      }

      // Load existing PDF
      setExistingPdfUrl((texte as any).pdf_url || null);
      setPdfFile(null);
    } else {
      setFormData({
        type_acte: "loi",
        reference_officielle: "",
        intitule: "",
        autorite_emettrice: "",
        date_publication: "",
        statut_vigueur: "en_vigueur",
        resume: "",
        lien_officiel: "",
        annee: new Date().getFullYear(),
      });
      setSelectedDomaines([]);
      setSelectedCodes([]);
      setPdfFile(null);
      setExistingPdfUrl(null);
    }
  }, [texte, open, existingCodes]);

  const handlePdfUpload = async () => {
    if (!pdfFile) return null;

    const fileExt = pdfFile.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `textes/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('textes_reglementaires_pdf')
      .upload(filePath, pdfFile);

    if (uploadError) {
      throw new Error(`Erreur lors de l'upload: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('textes_reglementaires_pdf')
      .getPublicUrl(filePath);

    return publicUrl;
  };

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
    mutationFn: async (data: any) => {
      setIsUploading(true);
      try {
        // Upload PDF si présent
        let pdfUrl = existingPdfUrl;
        if (pdfFile) {
          pdfUrl = await handlePdfUpload();
        }

        // Créer le texte avec l'URL du PDF
        const texteData = { ...data, pdf_url: pdfUrl };
        const newTexte = await textesReglementairesQueries.create(texteData, selectedDomaines);
        
        // Associer les codes si sélectionnés
        if (selectedCodes.length > 0) {
          await textesCodesQueries.updateTexteCodes(newTexte.id, selectedCodes);
        }
        return newTexte;
      } finally {
        setIsUploading(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["textes-reglementaires"] });
      queryClient.invalidateQueries({ queryKey: ["texte-codes"] });
      toast.success("Texte créé avec succès");
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de la création");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      setIsUploading(true);
      try {
        // Upload PDF si nouveau fichier
        let pdfUrl = existingPdfUrl;
        if (pdfFile) {
          pdfUrl = await handlePdfUpload();
        }

        // Mettre à jour le texte avec l'URL du PDF
        const texteData = { ...data, pdf_url: pdfUrl };
        await textesReglementairesQueries.update(id, texteData, selectedDomaines);
        
        // Mettre à jour les codes associés
        await textesCodesQueries.updateTexteCodes(id, selectedCodes);
      } finally {
        setIsUploading(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["textes-reglementaires"] });
      queryClient.invalidateQueries({ queryKey: ["texte-codes"] });
      toast.success("Texte modifié avec succès");
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de la modification");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    if (!formData.reference_officielle.trim()) {
      toast.error("La référence officielle est requise");
      return;
    }
    if (!formData.intitule.trim()) {
      toast.error("Le titre est requis");
      return;
    }
    
    if (texte) {
      updateMutation.mutate({ id: texte.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{texte ? "Modifier le texte" : "Créer un texte réglementaire"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type_acte">Type *</Label>
            <Select value={formData.type_acte} onValueChange={(val: any) => setFormData({ ...formData, type_acte: val })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="loi">Loi</SelectItem>
                <SelectItem value="arrete">Arrêté</SelectItem>
                <SelectItem value="decret">Décret</SelectItem>
                <SelectItem value="circulaire">Circulaire</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference_officielle">Référence officielle *</Label>
            <Input
              id="reference_officielle"
              value={formData.reference_officielle}
              onChange={(e) => setFormData({ ...formData, reference_officielle: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="intitule">Titre *</Label>
            <Input
              id="intitule"
              value={formData.intitule}
              onChange={(e) => setFormData({ ...formData, intitule: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="autorite_emettrice">Autorité émettrice</Label>
              <Input
                id="autorite_emettrice"
                value={formData.autorite_emettrice}
                onChange={(e) => setFormData({ ...formData, autorite_emettrice: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="annee">Année</Label>
              <Input
                id="annee"
                type="number"
                value={formData.annee}
                onChange={(e) => setFormData({ ...formData, annee: parseInt(e.target.value) })}
              />
            </div>
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
            <Label htmlFor="statut_vigueur">Statut *</Label>
            <Select value={formData.statut_vigueur} onValueChange={(val: any) => setFormData({ ...formData, statut_vigueur: val })}>
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

          <div className="space-y-2">
            <Label htmlFor="resume">Résumé</Label>
            <RichTextEditor
              value={formData.resume}
              onChange={(value) => setFormData({ ...formData, resume: value })}
              placeholder="Résumé ou objet du texte réglementaire..."
              className="min-h-[150px]"
            />
          </div>

          <div className="space-y-2">
            <Label>Pièce jointe PDF</Label>
            {pdfFile || existingPdfUrl ? (
              <div className="border rounded-lg p-4 bg-muted/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-md">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {pdfFile ? pdfFile.name : "Document actuel"}
                      </p>
                      <p className="text-xs text-muted-foreground">PDF</p>
                    </div>
                  </div>
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
                    <p className="text-sm font-medium">Cliquez pour télécharger un fichier PDF</p>
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

          <div className="space-y-2">
            <Label htmlFor="lien_officiel">Lien officiel</Label>
            <Input
              id="lien_officiel"
              value={formData.lien_officiel}
              onChange={(e) => setFormData({ ...formData, lien_officiel: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label>Domaines d'application</Label>
            <div className="border rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
              {domainesLoading ? (
                <p className="text-sm text-muted-foreground">Chargement des domaines...</p>
              ) : !domaines || domaines.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucun domaine disponible. Veuillez d'abord créer des domaines.
                </p>
              ) : (
                domaines.map((domaine) => (
                  <div key={domaine.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`domaine-${domaine.id}`}
                      checked={selectedDomaines.includes(domaine.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedDomaines([...selectedDomaines, domaine.id]);
                        } else {
                          setSelectedDomaines(selectedDomaines.filter((id) => id !== domaine.id));
                        }
                      }}
                    />
                    <label htmlFor={`domaine-${domaine.id}`} className="text-sm cursor-pointer">
                      {domaine.libelle}
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="border-t pt-4">
            <TexteCodesSelector
              selectedCodes={selectedCodes}
              onCodesChange={setSelectedCodes}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending || isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Upload en cours...
                </>
              ) : createMutation.isPending || updateMutation.isPending ? (
                "Enregistrement..."
              ) : texte ? (
                "Modifier"
              ) : (
                "Créer"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
