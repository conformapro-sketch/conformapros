import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save, Upload, FileText, Loader2, X } from "lucide-react";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { z } from "zod";
import { 
  actesQueries, 
  typesActeQueries, 
  domainesQueries,
  sousDomainesQueries,
  textesDomainesQueries,
  textesSousDomainesQueries,
  pdfStorageQueries
} from "@/lib/actes-queries";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const texteSchema = z.object({
  type_acte: z.string().min(1, "Le type de texte est requis"),
  reference_officielle: z.string().min(1, "La référence officielle est requise"),
  intitule: z.string().min(1, "Le titre est requis").max(500, "Le titre est trop long (max 500 caractères)"),
  autorite_emettrice: z.string().optional(),
  date_signature: z.string().optional(),
  date_publication_jort: z.string().min(1, "La date de publication est requise"),
  statut_vigueur: z.enum(["en_vigueur", "modifie", "abroge", "suspendu"], {
    errorMap: () => ({ message: "Le statut de vigueur est requis" })
  }),
  domaine_ids: z.array(z.string()).min(1, "Veuillez sélectionner au moins un domaine"),
  sous_domaine_ids: z.array(z.string()).optional(),
  objet_resume: z.string().optional(),
});

type FormData = {
  type_acte: string;
  reference_officielle: string;
  intitule: string;
  autorite_emettrice: string;
  date_signature: string;
  date_publication_jort: string;
  statut_vigueur: string;
  domaine_ids: string[];
  sous_domaine_ids: string[];
  objet_resume: string;
  pdf_file: File | null;
};

export default function TexteForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formData, setFormData] = useState<FormData>({
    type_acte: "",
    reference_officielle: "",
    intitule: "",
    autorite_emettrice: "",
    date_signature: "",
    date_publication_jort: "",
    statut_vigueur: "en_vigueur",
    domaine_ids: [],
    sous_domaine_ids: [],
    objet_resume: "",
    pdf_file: null,
  });

  const [pdfFileName, setPdfFileName] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);

  // Fetch types d'acte
  const { data: typesActe } = useQuery({
    queryKey: ["types-acte"],
    queryFn: () => typesActeQueries.getAll(),
  });

  // Fetch domaines
  const { data: domaines } = useQuery({
    queryKey: ["domaines-active"],
    queryFn: () => domainesQueries.getActive(),
  });

  // Fetch sous-domaines (all active)
  const { data: allSousDomaines } = useQuery({
    queryKey: ["sous-domaines-active"],
    queryFn: () => sousDomainesQueries.getActive(),
  });

  // Filter sous-domaines based on selected domaines
  const filteredSousDomaines = allSousDomaines?.filter(sd => 
    formData.domaine_ids.includes(sd.domaine_id)
  ) || [];

  // Fetch existing texte for editing
  const { data: texte, isLoading: isLoadingTexte } = useQuery({
    queryKey: ["acte", id],
    queryFn: async () => {
      if (!id) return null;
      const acte = await actesQueries.getById(id);
      const domaines = await textesDomainesQueries.getByTexteId(id);
      const sousDomaines = await textesSousDomainesQueries.getByTexteId(id);
      return { acte, domaines, sousDomaines };
    },
    enabled: isEdit,
  });

  // Populate form when editing
  useEffect(() => {
    if (isEdit && texte && texte.acte) {
      setFormData({
        type_acte: texte.acte.type_acte || "",
        reference_officielle: texte.acte.reference_officielle || "",
        intitule: texte.acte.intitule || "",
        autorite_emettrice: texte.acte.autorite_emettrice || "",
        date_signature: texte.acte.date_signature || "",
        date_publication_jort: texte.acte.date_publication_jort || "",
        statut_vigueur: texte.acte.statut_vigueur || "en_vigueur",
        domaine_ids: texte.domaines?.map((d: any) => d.domaine_id) || [],
        sous_domaine_ids: texte.sousDomaines?.map((sd: any) => sd.sous_domaine_id) || [],
        objet_resume: texte.acte.objet_resume || "",
        pdf_file: null,
      });
      if (texte.acte.url_pdf_ar) {
        setPdfFileName(texte.acte.url_pdf_ar.split("/").pop() || "Fichier existant");
      }
    }
  }, [isEdit, texte]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      setIsUploading(true);
      try {
        let pdfUrl = texte?.acte?.url_pdf_ar || "";
        
        // Upload PDF if a new file is provided
        if (data.pdf_file) {
          pdfUrl = await pdfStorageQueries.uploadPdf(data.pdf_file, data.pdf_file.name);
          
          // Delete old PDF if updating
          if (isEdit && texte?.acte?.url_pdf_ar) {
            await pdfStorageQueries.deletePdf(texte.acte.url_pdf_ar);
          }
        }

        // Prepare acte data
        const acteData = {
          type_acte: data.type_acte,
          reference_officielle: data.reference_officielle,
          intitule: data.intitule,
          autorite_emettrice: data.autorite_emettrice || null,
          date_signature: data.date_signature || null,
          date_publication_jort: data.date_publication_jort,
          statut_vigueur: data.statut_vigueur,
          objet_resume: data.objet_resume || null,
          url_pdf_ar: pdfUrl || null,
        };

        let texteId: string;

        if (isEdit) {
          const updated = await actesQueries.update(id!, acteData);
          texteId = updated.id;
        } else {
          const created = await actesQueries.create(acteData);
          texteId = created.id;
        }

        // Update domaines relations
        await textesDomainesQueries.deleteByTexteId(texteId);
        await textesDomainesQueries.createBulk(texteId, data.domaine_ids);

        // Update sous-domaines relations
        await textesSousDomainesQueries.deleteByTexteId(texteId);
        if (data.sous_domaine_ids.length > 0) {
          await textesSousDomainesQueries.createBulk(texteId, data.sous_domaine_ids);
        }

        return texteId;
      } finally {
        setIsUploading(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actes-reglementaires"] });
      toast({
        title: isEdit ? "Texte modifié" : "Texte créé",
        description: isEdit
          ? "Le texte réglementaire a été mis à jour avec succès"
          : "Le nouveau texte réglementaire a été créé avec succès",
      });
      navigate("/actes");
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la sauvegarde",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate file size if file is present
    if (formData.pdf_file && formData.pdf_file.size > MAX_FILE_SIZE) {
      setErrors({ pdf_file: "Le fichier ne doit pas dépasser 10 Mo" });
      toast({
        title: "Fichier trop volumineux",
        description: "La taille du fichier PDF ne doit pas dépasser 10 Mo",
        variant: "destructive",
      });
      return;
    }

    try {
      const validData = texteSchema.parse(formData);
      saveMutation.mutate({ ...validData, pdf_file: formData.pdf_file });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
        toast({
          title: "Erreurs de validation",
          description: "Veuillez corriger les erreurs dans le formulaire",
          variant: "destructive",
        });
      }
    }
  };

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleDomaineToggle = (domaineId: string) => {
    const newDomaines = formData.domaine_ids.includes(domaineId)
      ? formData.domaine_ids.filter(id => id !== domaineId)
      : [...formData.domaine_ids, domaineId];
    
    handleChange("domaine_ids", newDomaines);
    
    // Remove sous-domaines that are no longer valid
    const validSousDomaines = formData.sous_domaine_ids.filter(sdId => {
      const sd = allSousDomaines?.find(s => s.id === sdId);
      return sd && newDomaines.includes(sd.domaine_id);
    });
    if (validSousDomaines.length !== formData.sous_domaine_ids.length) {
      handleChange("sous_domaine_ids", validSousDomaines);
    }
  };

  const handleSousDomaineToggle = (sousDomaineId: string) => {
    const newSousDomaines = formData.sous_domaine_ids.includes(sousDomaineId)
      ? formData.sous_domaine_ids.filter(id => id !== sousDomaineId)
      : [...formData.sous_domaine_ids, sousDomaineId];
    
    handleChange("sous_domaine_ids", newSousDomaines);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        setErrors({ pdf_file: "Le fichier doit être au format PDF" });
        toast({
          title: "Format invalide",
          description: "Veuillez sélectionner un fichier PDF",
          variant: "destructive",
        });
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setErrors({ pdf_file: "Le fichier ne doit pas dépasser 10 Mo" });
        toast({
          title: "Fichier trop volumineux",
          description: "La taille du fichier ne doit pas dépasser 10 Mo",
          variant: "destructive",
        });
        return;
      }
      handleChange("pdf_file", file);
      setPdfFileName(file.name);
      if (errors.pdf_file) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.pdf_file;
          return newErrors;
        });
      }
    }
  };

  if (isEdit && isLoadingTexte) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate("/actes")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            {isEdit ? "Modifier un texte réglementaire" : "Créer un texte réglementaire"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isEdit ? "Modifier les informations du texte" : "Ajouter un nouveau texte à la base"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Identification */}
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle>Identification</CardTitle>
            <CardDescription>Informations principales du texte réglementaire</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="type_acte">Type de texte *</Label>
                <Select
                  value={formData.type_acte}
                  onValueChange={(value) => handleChange("type_acte", value)}
                >
                  <SelectTrigger id="type_acte" className={errors.type_acte ? "border-destructive" : ""}>
                    <SelectValue placeholder="Sélectionner un type" />
                  </SelectTrigger>
                  <SelectContent>
                    {typesActe?.map((type) => (
                      <SelectItem key={type.code} value={type.code}>
                        {type.libelle}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.type_acte && (
                  <p className="text-xs text-destructive mt-1">{errors.type_acte}</p>
                )}
              </div>

              <div>
                <Label htmlFor="reference_officielle">Référence officielle *</Label>
                <Input
                  id="reference_officielle"
                  placeholder="Ex: Loi n° 2016-772"
                  value={formData.reference_officielle}
                  onChange={(e) => handleChange("reference_officielle", e.target.value)}
                  className={errors.reference_officielle ? "border-destructive" : ""}
                />
                {errors.reference_officielle && (
                  <p className="text-xs text-destructive mt-1">{errors.reference_officielle}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="intitule">Titre *</Label>
              <Input
                id="intitule"
                placeholder="Titre complet du texte réglementaire"
                value={formData.intitule}
                onChange={(e) => handleChange("intitule", e.target.value)}
                className={errors.intitule ? "border-destructive" : ""}
              />
              {errors.intitule && (
                <p className="text-xs text-destructive mt-1">{errors.intitule}</p>
              )}
            </div>

            <div>
              <Label htmlFor="autorite_emettrice">Autorité émettrice</Label>
              <Input
                id="autorite_emettrice"
                placeholder="Ex: Ministère de l'Intérieur"
                value={formData.autorite_emettrice}
                onChange={(e) => handleChange("autorite_emettrice", e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="date_signature">Date de signature</Label>
                <Input
                  id="date_signature"
                  type="date"
                  value={formData.date_signature}
                  onChange={(e) => handleChange("date_signature", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="date_publication_jort">Date de publication *</Label>
                <Input
                  id="date_publication_jort"
                  type="date"
                  value={formData.date_publication_jort}
                  onChange={(e) => handleChange("date_publication_jort", e.target.value)}
                  className={errors.date_publication_jort ? "border-destructive" : ""}
                />
                {errors.date_publication_jort && (
                  <p className="text-xs text-destructive mt-1">{errors.date_publication_jort}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="statut_vigueur">Statut de vigueur *</Label>
              <Select
                value={formData.statut_vigueur}
                onValueChange={(value) => handleChange("statut_vigueur", value)}
              >
                <SelectTrigger id="statut_vigueur" className={errors.statut_vigueur ? "border-destructive" : ""}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en_vigueur">En vigueur</SelectItem>
                  <SelectItem value="modifie">Modifié</SelectItem>
                  <SelectItem value="abroge">Abrogé</SelectItem>
                  <SelectItem value="suspendu">Suspendu</SelectItem>
                </SelectContent>
              </Select>
              {errors.statut_vigueur && (
                <p className="text-xs text-destructive mt-1">{errors.statut_vigueur}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Classification */}
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle>Classification</CardTitle>
            <CardDescription>Domaines et sous-domaines d'application</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Domaines */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Domaines *</Label>
              {domaines && domaines.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {domaines.map((domaine) => (
                    <div key={domaine.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`domaine-${domaine.id}`}
                        checked={formData.domaine_ids.includes(domaine.id)}
                        onCheckedChange={() => handleDomaineToggle(domaine.id)}
                      />
                      <label
                        htmlFor={`domaine-${domaine.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {domaine.libelle}
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Aucun domaine disponible</p>
              )}
              {errors.domaine_ids && (
                <p className="text-xs text-destructive mt-2">{errors.domaine_ids}</p>
              )}
            </div>

            {/* Sous-domaines */}
            {filteredSousDomaines.length > 0 && (
              <div>
                <Label className="text-base font-semibold mb-3 block">Sous-domaines</Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {filteredSousDomaines.map((sousDomaine) => (
                    <div key={sousDomaine.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`sous-domaine-${sousDomaine.id}`}
                        checked={formData.sous_domaine_ids.includes(sousDomaine.id)}
                        onCheckedChange={() => handleSousDomaineToggle(sousDomaine.id)}
                      />
                      <label
                        htmlFor={`sous-domaine-${sousDomaine.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {sousDomaine.libelle}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 3: Contenu */}
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle>Contenu</CardTitle>
            <CardDescription>Résumé et document PDF</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="objet_resume">Résumé</Label>
              <RichTextEditor
                value={formData.objet_resume}
                onChange={(value) => handleChange("objet_resume", value)}
                placeholder="Résumé ou objet du texte réglementaire..."
                className="min-h-[150px]"
              />
            </div>

            <div>
              <Label htmlFor="pdf_file">Pièce jointe PDF</Label>
              <div className="mt-2">
                {pdfFileName ? (
                  <div className="border rounded-lg p-4 bg-muted/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-md">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{pdfFileName}</p>
                          <p className="text-xs text-muted-foreground">PDF</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          handleChange("pdf_file", null);
                          setPdfFileName("");
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
                {errors.pdf_file && (
                  <p className="text-xs text-destructive mt-2">{errors.pdf_file}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/actes")}
            disabled={saveMutation.isPending || isUploading}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={saveMutation.isPending || isUploading}
          >
            {(saveMutation.isPending || isUploading) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            <Save className="mr-2 h-4 w-4" />
            {isEdit ? "Enregistrer" : "Créer"}
          </Button>
        </div>
      </form>
    </div>
  );
}
