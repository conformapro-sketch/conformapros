import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  createIncident, 
  createIncidentCause,
  createIncidentPhoto,
  uploadIncidentPhoto,
  createActionFromIncident,
} from "@/lib/incidents-queries";
import { 
  TYPE_INCIDENT_LABELS, 
  CATEGORIE_INCIDENT_LABELS,
  GRAVITE_INCIDENT_LABELS,
  type Incident, 
  type TypeIncident, 
  type CategorieIncident,
  type GraviteIncident 
} from "@/types/incidents";
import { ChevronLeft, ChevronRight, Upload, Trash2, Plus } from "lucide-react";

interface IncidentFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IncidentFormModal({ open, onOpenChange }: IncidentFormModalProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<Incident>>({
    date_incident: new Date().toISOString().split("T")[0],
    heure_incident: new Date().toTimeString().split(" ")[0].substring(0, 5),
    type_incident: "accident_travail" as TypeIncident,
    gravite: "mineure" as GraviteIncident,
    statut: "en_cours",
    description: "",
    facteur_humain: false,
    facteur_materiel: false,
    facteur_organisationnel: false,
    facteur_environnemental: false,
    est_recurrent: false,
    arret_travail: false,
    hospitalisation: false,
  });
  
  const [causes, setCauses] = useState<Array<{ niveau: number; question: string; reponse: string }>>([
    { niveau: 1, question: "Pourquoi l'incident s'est-il produit ?", reponse: "" },
  ]);

  const [photos, setPhotos] = useState<File[]>([]);
  const [actions, setActions] = useState<Array<{
    titre: string;
    description: string;
    priorite: string;
    date_echeance: string;
    responsable_id?: string;
  }>>([]);

  // Fetch sites
  const { data: sites } = useQuery({
    queryKey: ["sites"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sites").select("id, nom_site").order("nom_site");
      if (error) throw error;
      return data;
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, nom, prenom").order("nom");
      if (error) throw error;
      return data;
    },
  });

  const resetForm = () => {
    setFormData({
      date_incident: new Date().toISOString().split("T")[0],
      heure_incident: new Date().toTimeString().split(" ")[0].substring(0, 5),
      type_incident: "accident_travail" as TypeIncident,
      gravite: "mineure" as GraviteIncident,
      statut: "en_cours",
      description: "",
      facteur_humain: false,
      facteur_materiel: false,
      facteur_organisationnel: false,
      facteur_environnemental: false,
      est_recurrent: false,
      arret_travail: false,
      hospitalisation: false,
    });
    setCauses([{ niveau: 1, question: "Pourquoi l'incident s'est-il produit ?", reponse: "" }]);
    setPhotos([]);
    setActions([]);
    setStep(1);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotos([...photos, ...Array.from(e.target.files)]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const addAction = () => {
    setActions([
      ...actions,
      {
        titre: "",
        description: "",
        priorite: "moyenne",
        date_echeance: "",
      },
    ]);
  };

  const removeAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  const updateAction = (index: number, field: string, value: any) => {
    const newActions = [...actions];
    newActions[index] = { ...newActions[index], [field]: value };
    setActions(newActions);
  };

  const addCause = () => {
    if (causes.length < 5) {
      setCauses([
        ...causes,
        { niveau: causes.length + 1, question: `Pourquoi ${causes.length + 1} ?`, reponse: "" },
      ]);
    }
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      // Clean empty UUID fields
      const cleanedData = {
        ...formData,
        date_incident: new Date(`${formData.date_incident}T${formData.heure_incident}`).toISOString(),
        responsable_suivi_id: formData.responsable_suivi_id || undefined,
      };
      
      const incident = await createIncident(cleanedData);

      // Upload photos
      for (const photo of photos) {
        try {
          const fileUrl = await uploadIncidentPhoto(photo, incident.id);
          await createIncidentPhoto({
            incident_id: incident.id,
            file_url: fileUrl,
            file_name: photo.name,
            file_type: photo.type,
          });
        } catch (error) {
          console.error("Error uploading photo:", error);
        }
      }

      // Create causes
      for (let i = 0; i < causes.length; i++) {
        const cause = causes[i];
        if (cause.reponse.trim()) {
          await createIncidentCause({
            incident_id: incident.id,
            niveau: cause.niveau,
            question: cause.question,
            reponse: cause.reponse,
          });
        }
      }

      // Create corrective actions
      for (const action of actions) {
        if (action.titre.trim()) {
          await createActionFromIncident(incident.id, action);
        }
      }

      return incident;
    },
    onSuccess: (incident) => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      const actionsCount = actions.filter((a) => a.titre.trim()).length;
      toast.success(
        `Incident créé avec succès${actionsCount > 0 ? ` avec ${actionsCount} action(s) corrective(s)` : ""}`
      );
      resetForm();
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Error creating incident:", error);
      toast.error("Erreur lors de la création de l'incident");
    },
  });

  const canGoNext = () => {
    if (step === 1) {
      return (
        formData.date_incident &&
        formData.site_id &&
        formData.type_incident &&
        formData.gravite &&
        formData.declarant_nom
      );
    }
    if (step === 2) {
      return formData.description && formData.description.trim().length > 0;
    }
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Déclarer un incident HSE</DialogTitle>
          <DialogDescription>
            Enregistrez les détails de l'incident en 4 étapes simples
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`h-2 w-full rounded ${
                  s <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            </div>
          ))}
        </div>

        {/* Step 1: Basic info */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Informations de base</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date de l'incident *</Label>
                <Input
                  type="date"
                  value={formData.date_incident}
                  onChange={(e) => setFormData({ ...formData, date_incident: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Heure</Label>
                <Input
                  type="time"
                  value={formData.heure_incident}
                  onChange={(e) => setFormData({ ...formData, heure_incident: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Site *</Label>
              <Select
                value={formData.site_id}
                onValueChange={(value) => setFormData({ ...formData, site_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un site" />
                </SelectTrigger>
                <SelectContent>
                  {sites?.map((site: any) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.nom_site}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Zone</Label>
                <Input
                  value={formData.zone || ""}
                  onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                  placeholder="Ex: Atelier"
                />
              </div>
              <div className="space-y-2">
                <Label>Bâtiment</Label>
                <Input
                  value={formData.batiment || ""}
                  onChange={(e) => setFormData({ ...formData, batiment: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Atelier</Label>
                <Input
                  value={formData.atelier || ""}
                  onChange={(e) => setFormData({ ...formData, atelier: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type d'incident *</Label>
                <Select
                  value={formData.type_incident}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type_incident: value as TypeIncident })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_INCIDENT_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select
                  value={formData.categorie || ""}
                  onValueChange={(value) =>
                    setFormData({ ...formData, categorie: value as CategorieIncident })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORIE_INCIDENT_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Gravité *</Label>
              <Select
                value={formData.gravite}
                onValueChange={(value) =>
                  setFormData({ ...formData, gravite: value as GraviteIncident })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(GRAVITE_INCIDENT_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Personne impliquée</Label>
              <Input
                value={formData.personne_impliquee_nom || ""}
                onChange={(e) =>
                  setFormData({ ...formData, personne_impliquee_nom: e.target.value })
                }
                placeholder="Nom et prénom (si applicable)"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Déclarant *</Label>
                <Input
                  value={formData.declarant_nom || ""}
                  onChange={(e) => setFormData({ ...formData, declarant_nom: e.target.value })}
                  placeholder="Votre nom"
                />
              </div>
              <div className="space-y-2">
                <Label>Fonction</Label>
                <Input
                  value={formData.declarant_fonction || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, declarant_fonction: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Description */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Description de l'incident</h3>
            <div className="space-y-2">
              <Label>Description détaillée *</Label>
              <Textarea
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Décrire précisément ce qui s'est passé..."
                rows={5}
              />
            </div>

            <div className="space-y-2">
              <Label>Circonstances</Label>
              <Textarea
                value={formData.circonstances || ""}
                onChange={(e) => setFormData({ ...formData, circonstances: e.target.value })}
                placeholder="Contexte, conditions, facteurs environnementaux..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Conséquences</Label>
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="arret"
                    checked={formData.arret_travail}
                    onCheckedChange={(c) => setFormData({ ...formData, arret_travail: !!c })}
                  />
                  <label htmlFor="arret" className="text-sm">
                    Arrêt de travail
                  </label>
                </div>
                {formData.arret_travail && (
                  <Input
                    type="number"
                    value={formData.jours_arret || 0}
                    onChange={(e) =>
                      setFormData({ ...formData, jours_arret: parseInt(e.target.value) || 0 })
                    }
                    placeholder="Nb jours"
                    className="w-24"
                  />
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hospit"
                  checked={formData.hospitalisation}
                  onCheckedChange={(c) => setFormData({ ...formData, hospitalisation: !!c })}
                />
                <label htmlFor="hospit" className="text-sm">
                  Hospitalisation
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Analyse */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Causes et analyse</h3>

            <div>
              <Label className="mb-3 block">Facteurs identifiés</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="humain"
                    checked={formData.facteur_humain}
                    onCheckedChange={(c) => setFormData({ ...formData, facteur_humain: !!c })}
                  />
                  <label htmlFor="humain" className="text-sm">
                    Facteur humain
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="materiel"
                    checked={formData.facteur_materiel}
                    onCheckedChange={(c) => setFormData({ ...formData, facteur_materiel: !!c })}
                  />
                  <label htmlFor="materiel" className="text-sm">
                    Facteur matériel
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="org"
                    checked={formData.facteur_organisationnel}
                    onCheckedChange={(c) =>
                      setFormData({ ...formData, facteur_organisationnel: !!c })
                    }
                  />
                  <label htmlFor="org" className="text-sm">
                    Facteur organisationnel
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="env"
                    checked={formData.facteur_environnemental}
                    onCheckedChange={(c) =>
                      setFormData({ ...formData, facteur_environnemental: !!c })
                    }
                  />
                  <label htmlFor="env" className="text-sm">
                    Facteur environnemental
                  </label>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Analyse des causes racines (5 Pourquoi)</Label>
                {causes.length < 5 && (
                  <Button type="button" variant="outline" size="sm" onClick={addCause}>
                    + Ajouter niveau
                  </Button>
                )}
              </div>
              <div className="space-y-3">
                {causes.map((cause, idx) => (
                  <div key={idx} className="space-y-1">
                    <Label className="text-sm text-muted-foreground">Niveau {idx + 1}</Label>
                    <Input
                      value={cause.question}
                      onChange={(e) => {
                        const newCauses = [...causes];
                        newCauses[idx].question = e.target.value;
                        setCauses(newCauses);
                      }}
                      placeholder="Question"
                      className="mb-1"
                    />
                    <Textarea
                      value={cause.reponse}
                      onChange={(e) => {
                        const newCauses = [...causes];
                        newCauses[idx].reponse = e.target.value;
                        setCauses(newCauses);
                      }}
                      placeholder="Réponse"
                      rows={2}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Follow-up */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="responsable_suivi_id">Responsable du suivi</Label>
              <Select
                value={formData.responsable_suivi_id || ""}
                onValueChange={(value) =>
                  setFormData({ ...formData, responsable_suivi_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un responsable" />
                </SelectTrigger>
                <SelectContent>
                  {profiles?.map((profile: any) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.nom} {profile.prenom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mesures_correctives">Mesures correctives envisagées</Label>
              <Textarea
                id="mesures_correctives"
                value={formData.mesures_correctives || ""}
                onChange={(e) =>
                  setFormData({ ...formData, mesures_correctives: e.target.value })
                }
                placeholder="Décrire les mesures à mettre en place..."
                rows={4}
              />
            </div>

            {/* Upload photos */}
            <div className="space-y-2">
              <Label>Photos de l'incident</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-4">
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">
                    Cliquez pour ajouter des photos ou vidéos
                  </span>
                </label>
              </div>
              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={photo.name}
                        className="w-full h-24 object-cover rounded"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100"
                        onClick={() => removePhoto(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Corrective actions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Actions correctives</Label>
                <Button type="button" variant="outline" size="sm" onClick={addAction}>
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter une action
                </Button>
              </div>
              {actions.map((action, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium">Action {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAction(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Input
                      placeholder="Titre de l'action"
                      value={action.titre}
                      onChange={(e) => updateAction(index, "titre", e.target.value)}
                    />
                    <Textarea
                      placeholder="Description"
                      value={action.description}
                      onChange={(e) => updateAction(index, "description", e.target.value)}
                      rows={2}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Select
                        value={action.priorite}
                        onValueChange={(value) => updateAction(index, "priorite", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="faible">Faible</SelectItem>
                          <SelectItem value="moyenne">Moyenne</SelectItem>
                          <SelectItem value="haute">Haute</SelectItem>
                          <SelectItem value="critique">Critique</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="date"
                        value={action.date_echeance}
                        onChange={(e) => updateAction(index, "date_echeance", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Incident récurrent */}
            <div className="flex items-center space-x-2 p-4 bg-muted rounded-lg">
              <Checkbox
                id="recurrent"
                checked={formData.est_recurrent}
                onCheckedChange={(c) => setFormData({ ...formData, est_recurrent: !!c })}
              />
              <label htmlFor="recurrent" className="text-sm font-medium">
                Marquer comme incident récurrent
              </label>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-6 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Précédent
          </Button>
          {step < 4 ? (
            <Button type="button" onClick={() => setStep(step + 1)} disabled={!canGoNext()}>
              Suivant
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Création..." : "Créer l'incident"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
