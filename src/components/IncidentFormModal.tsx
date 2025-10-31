import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createIncident, createIncidentCause } from "@/lib/incidents-queries";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  TYPE_INCIDENT_LABELS,
  CATEGORIE_INCIDENT_LABELS,
  GRAVITE_INCIDENT_LABELS,
  type TypeIncident,
  type CategorieIncident,
  type GraviteIncident,
} from "@/types/incidents";
import { ChevronRight, ChevronLeft } from "lucide-react";

interface IncidentFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IncidentFormModal({ open, onOpenChange }: IncidentFormModalProps) {
  const [step, setStep] = useState(1);
  const queryClient = useQueryClient();

  // Form state
  const [formData, setFormData] = useState({
    date_incident: new Date().toISOString().split("T")[0],
    heure_incident: new Date().toTimeString().slice(0, 5),
    site_id: "",
    zone: "",
    batiment: "",
    atelier: "",
    type_incident: "" as TypeIncident,
    categorie: "" as CategorieIncident,
    gravite: "" as GraviteIncident,
    personne_impliquee_nom: "",
    declarant_nom: "",
    declarant_fonction: "",
    description: "",
    circonstances: "",
    facteur_humain: false,
    facteur_materiel: false,
    facteur_organisationnel: false,
    facteur_environnemental: false,
    analyse_causes: "",
    responsable_suivi_id: "",
    mesures_correctives: "",
    arret_travail: false,
    jours_arret: 0,
    hospitalisation: false,
  });

  const [causes, setCauses] = useState<Array<{ question: string; reponse: string }>>([
    { question: "Pourquoi l'incident s'est-il produit ?", reponse: "" },
  ]);

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

  const createMutation = useMutation({
    mutationFn: async () => {
      const incident = await createIncident({
        ...formData,
        date_incident: new Date(`${formData.date_incident}T${formData.heure_incident}`).toISOString(),
      });

      // Create causes
      for (let i = 0; i < causes.length; i++) {
        if (causes[i].reponse.trim()) {
          await createIncidentCause({
            incident_id: incident.id,
            niveau: i + 1,
            question: causes[i].question,
            reponse: causes[i].reponse,
          });
        }
      }

      return incident;
    },
    onSuccess: () => {
      toast.success("Incident créé avec succès");
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("Erreur lors de la création de l'incident");
      console.error(error);
    },
  });

  const resetForm = () => {
    setStep(1);
    setFormData({
      date_incident: new Date().toISOString().split("T")[0],
      heure_incident: new Date().toTimeString().slice(0, 5),
      site_id: "",
      zone: "",
      batiment: "",
      atelier: "",
      type_incident: "" as TypeIncident,
      categorie: "" as CategorieIncident,
      gravite: "" as GraviteIncident,
      personne_impliquee_nom: "",
      declarant_nom: "",
      declarant_fonction: "",
      description: "",
      circonstances: "",
      facteur_humain: false,
      facteur_materiel: false,
      facteur_organisationnel: false,
      facteur_environnemental: false,
      analyse_causes: "",
      responsable_suivi_id: "",
      mesures_correctives: "",
      arret_travail: false,
      jours_arret: 0,
      hospitalisation: false,
    });
    setCauses([{ question: "Pourquoi l'incident s'est-il produit ?", reponse: "" }]);
  };

  const addCause = () => {
    if (causes.length < 5) {
      setCauses([...causes, { question: `Pourquoi ${causes.length + 1} ?`, reponse: "" }]);
    }
  };

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
      return formData.description.trim().length > 0;
    }
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Déclarer un incident HSE</DialogTitle>
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
              <div>
                <Label>Date de l'incident *</Label>
                <Input
                  type="date"
                  value={formData.date_incident}
                  onChange={(e) => setFormData({ ...formData, date_incident: e.target.value })}
                />
              </div>
              <div>
                <Label>Heure</Label>
                <Input
                  type="time"
                  value={formData.heure_incident}
                  onChange={(e) => setFormData({ ...formData, heure_incident: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Site *</Label>
              <Select value={formData.site_id} onValueChange={(v) => setFormData({ ...formData, site_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un site" />
                </SelectTrigger>
                <SelectContent>
                  {sites?.map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.nom_site}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Zone</Label>
                <Input
                  value={formData.zone}
                  onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                  placeholder="Ex: Atelier"
                />
              </div>
              <div>
                <Label>Bâtiment</Label>
                <Input
                  value={formData.batiment}
                  onChange={(e) => setFormData({ ...formData, batiment: e.target.value })}
                />
              </div>
              <div>
                <Label>Atelier</Label>
                <Input
                  value={formData.atelier}
                  onChange={(e) => setFormData({ ...formData, atelier: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type d'incident *</Label>
                <Select
                  value={formData.type_incident}
                  onValueChange={(v) => setFormData({ ...formData, type_incident: v as TypeIncident })}
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
              <div>
                <Label>Catégorie</Label>
                <Select
                  value={formData.categorie}
                  onValueChange={(v) => setFormData({ ...formData, categorie: v as CategorieIncident })}
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

            <div>
              <Label>Gravité *</Label>
              <Select
                value={formData.gravite}
                onValueChange={(v) => setFormData({ ...formData, gravite: v as GraviteIncident })}
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

            <div>
              <Label>Personne impliquée</Label>
              <Input
                value={formData.personne_impliquee_nom}
                onChange={(e) => setFormData({ ...formData, personne_impliquee_nom: e.target.value })}
                placeholder="Nom et prénom (si applicable)"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Déclarant *</Label>
                <Input
                  value={formData.declarant_nom}
                  onChange={(e) => setFormData({ ...formData, declarant_nom: e.target.value })}
                  placeholder="Votre nom"
                />
              </div>
              <div>
                <Label>Fonction</Label>
                <Input
                  value={formData.declarant_fonction}
                  onChange={(e) => setFormData({ ...formData, declarant_fonction: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Description */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Description de l'incident</h3>
            <div>
              <Label>Description détaillée *</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Décrire précisément ce qui s'est passé..."
                rows={5}
              />
            </div>

            <div>
              <Label>Circonstances</Label>
              <Textarea
                value={formData.circonstances}
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
                    value={formData.jours_arret}
                    onChange={(e) => setFormData({ ...formData, jours_arret: parseInt(e.target.value) || 0 })}
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
                  <label htmlFor="humain" className="text-sm">Facteur humain</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="materiel"
                    checked={formData.facteur_materiel}
                    onCheckedChange={(c) => setFormData({ ...formData, facteur_materiel: !!c })}
                  />
                  <label htmlFor="materiel" className="text-sm">Facteur matériel</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="org"
                    checked={formData.facteur_organisationnel}
                    onCheckedChange={(c) => setFormData({ ...formData, facteur_organisationnel: !!c })}
                  />
                  <label htmlFor="org" className="text-sm">Facteur organisationnel</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="env"
                    checked={formData.facteur_environnemental}
                    onCheckedChange={(c) => setFormData({ ...formData, facteur_environnemental: !!c })}
                  />
                  <label htmlFor="env" className="text-sm">Facteur environnemental</label>
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

            <div>
              <Label>Analyse complémentaire</Label>
              <Textarea
                value={formData.analyse_causes}
                onChange={(e) => setFormData({ ...formData, analyse_causes: e.target.value })}
                placeholder="Analyse détaillée, arbre des causes, etc."
                rows={4}
              />
            </div>
          </div>
        )}

        {/* Step 4: Suivi */}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Suivi et mesures</h3>
            
            <div>
              <Label>Responsable du suivi</Label>
              <Select
                value={formData.responsable_suivi_id}
                onValueChange={(v) => setFormData({ ...formData, responsable_suivi_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {profiles?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nom} {p.prenom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Mesures correctives appliquées</Label>
              <Textarea
                value={formData.mesures_correctives}
                onChange={(e) => setFormData({ ...formData, mesures_correctives: e.target.value })}
                placeholder="Actions immédiates mises en place..."
                rows={5}
              />
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                💡 <strong>Astuce :</strong> Vous pourrez créer des actions correctives détaillées dans le
                Plan d'action après la création de l'incident.
              </p>
            </div>
          </div>
        )}

        {/* Footer navigation */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Précédent
          </Button>

          <div className="text-sm text-muted-foreground">
            Étape {step} / 4
          </div>

          {step < 4 ? (
            <Button
              type="button"
              onClick={() => setStep(step + 1)}
              disabled={!canGoNext()}
            >
              Suivant
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Création..." : "Créer l'incident"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
