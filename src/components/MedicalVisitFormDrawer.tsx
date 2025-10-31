import { useState, useEffect } from "react";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Loader2, Save, Upload, FileText } from "lucide-react";
import {
  createMedicalVisit,
  updateMedicalVisit,
  fetchMedicalVisitById,
  fetchVisitDocuments,
  fetchConfidentialNote,
  upsertConfidentialNote,
} from "@/lib/medical-queries";

const visitSchema = z.object({
  employe_id: z.string().min(1, "Employé requis"),
  type_visite: z.enum(["EMBAUCHE", "PERIODIQUE", "REPRISE", "CHANGEMENT_POSTE", "SMS"]),
  date_planifiee: z.string().min(1, "Date planifiée requise"),
  motif: z.string().optional(),
  statut_visite: z.enum(["PLANIFIEE", "REALISEE", "REPORTEE", "ANNULEE", "NO_SHOW"]),
  date_realisee: z.string().optional(),
  resultat_aptitude: z.enum(["APTE", "APTE_RESTRICTIONS", "INAPTE_TEMP", "INAPTE_DEFINITIVE", "AVIS_RESERVE", "EN_ATTENTE"]).optional(),
  restrictions: z.string().optional(),
  validite_jusqua: z.string().optional(),
  prochaine_echeance: z.string().optional(),
  medecin_nom: z.string().optional(),
  medecin_organisme: z.string().optional(),
  sms_flags: z.array(z.string()).optional(),
});

type VisitFormData = z.infer<typeof visitSchema>;

interface MedicalVisitFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visitId: string | null;
  employees: any[];
}

export const MedicalVisitFormDrawer = ({
  open,
  onOpenChange,
  visitId,
  employees,
}: MedicalVisitFormDrawerProps) => {
  const [activeTab, setActiveTab] = useState("info");
  const [confidentialNotes, setConfidentialNotes] = useState({
    observations: "",
    examens_realises: "",
    contre_indications: "",
    propositions_amenagement: "",
  });

  const queryClient = useQueryClient();

  const form = useForm<VisitFormData>({
    resolver: zodResolver(visitSchema),
    defaultValues: {
      employe_id: "",
      type_visite: "PERIODIQUE",
      date_planifiee: "",
      statut_visite: "PLANIFIEE",
      resultat_aptitude: "EN_ATTENTE",
      sms_flags: [],
    },
  });

  const { data: visit } = useQuery({
    queryKey: ["medical-visit", visitId],
    queryFn: () => fetchMedicalVisitById(visitId!),
    enabled: !!visitId && open,
  });

  const { data: documents } = useQuery({
    queryKey: ["visit-documents", visitId],
    queryFn: () => fetchVisitDocuments(visitId!),
    enabled: !!visitId && open,
  });

  const { data: confidentialNote } = useQuery({
    queryKey: ["confidential-note", visitId],
    queryFn: () => fetchConfidentialNote(visitId!),
    enabled: !!visitId && open,
  });

  useEffect(() => {
    if (visit) {
      form.reset({
        employe_id: visit.employe_id,
        type_visite: visit.type_visite as any,
        date_planifiee: visit.date_planifiee.split('T')[0],
        motif: visit.motif || "",
        statut_visite: visit.statut_visite as any,
        date_realisee: visit.date_realisee?.split('T')[0] || "",
        resultat_aptitude: (visit.resultat_aptitude as any) || "EN_ATTENTE",
        restrictions: visit.restrictions || "",
        validite_jusqua: visit.validite_jusqua || "",
        prochaine_echeance: visit.prochaine_echeance || "",
        medecin_nom: visit.medecin_nom || "",
        medecin_organisme: visit.medecin_organisme || "",
        sms_flags: Array.isArray(visit.sms_flags) ? visit.sms_flags : [],
      });
    }
  }, [visit, form]);

  useEffect(() => {
    if (confidentialNote) {
      setConfidentialNotes({
        observations: confidentialNote.observations || "",
        examens_realises: confidentialNote.examens_realises || "",
        contre_indications: confidentialNote.contre_indications || "",
        propositions_amenagement: confidentialNote.propositions_amenagement || "",
      });
    }
  }, [confidentialNote]);

  const createMutation = useMutation({
    mutationFn: createMedicalVisit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medical-visits"] });
      queryClient.invalidateQueries({ queryKey: ["medical-visits-stats"] });
      toast({ title: "Visite créée avec succès" });
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de créer la visite",
        variant: "destructive",
      });
      console.error(error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateMedicalVisit(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medical-visits"] });
      queryClient.invalidateQueries({ queryKey: ["medical-visits-stats"] });
      queryClient.invalidateQueries({ queryKey: ["medical-visit", visitId] });
      toast({ title: "Visite mise à jour avec succès" });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la visite",
        variant: "destructive",
      });
      console.error(error);
    },
  });

  const saveConfidentialNotesMutation = useMutation({
    mutationFn: upsertConfidentialNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["confidential-note", visitId] });
      toast({ title: "Notes confidentielles enregistrées" });
    },
  });

  const onSubmit = async (data: VisitFormData) => {
    // Get client_id from the selected employee
    const selectedEmployee = employees.find(e => e.id === data.employe_id);
    if (!selectedEmployee) {
      toast({
        title: "Erreur",
        description: "Employé non trouvé",
        variant: "destructive",
      });
      return;
    }

    const submitData = {
      employe_id: data.employe_id,
      client_id: selectedEmployee.client_id,
      site_id: selectedEmployee.site_id || null,
      type_visite: data.type_visite,
      date_planifiee: data.date_planifiee,
      motif: data.motif || null,
      statut_visite: data.statut_visite,
      date_realisee: data.date_realisee || null,
      resultat_aptitude: data.resultat_aptitude || 'EN_ATTENTE',
      restrictions: data.restrictions || null,
      validite_jusqua: data.validite_jusqua || null,
      prochaine_echeance: data.prochaine_echeance || null,
      medecin_nom: data.medecin_nom || null,
      medecin_organisme: data.medecin_organisme || null,
      sms_flags: data.sms_flags || [],
    };

    if (visitId) {
      updateMutation.mutate({ id: visitId, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleSaveConfidentialNotes = () => {
    if (!visitId) return;
    
    saveConfidentialNotesMutation.mutate({
      visite_id: visitId,
      ...confidentialNotes,
    });
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {visitId ? "Modifier la visite médicale" : "Nouvelle visite médicale"}
          </SheetTitle>
          <SheetDescription>
            Remplissez les informations de la visite médicale
          </SheetDescription>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="info">Info</TabsTrigger>
            <TabsTrigger value="sms">SMS</TabsTrigger>
            <TabsTrigger value="resultat">Résultat</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
              <TabsContent value="info" className="space-y-4">
                <FormField
                  control={form.control}
                  name="employe_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employé *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un employé" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {employees.map((emp) => (
                            <SelectItem key={emp.id} value={emp.id}>
                              {emp.matricule} - {emp.nom} {emp.prenom}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type_visite"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type de visite *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="EMBAUCHE">Embauche</SelectItem>
                          <SelectItem value="PERIODIQUE">Périodique</SelectItem>
                          <SelectItem value="REPRISE">Reprise</SelectItem>
                          <SelectItem value="CHANGEMENT_POSTE">Changement de poste</SelectItem>
                          <SelectItem value="SMS">Surveillance médicale spéciale</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date_planifiee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date planifiée *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="motif"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Motif</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="medecin_nom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Médecin</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="medecin_organisme"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organisme</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="sms" className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Sélectionnez les risques faisant l'objet d'une surveillance médicale spéciale
                </p>
                {/* SMS flags implementation here */}
              </TabsContent>

              <TabsContent value="resultat" className="space-y-4">
                <FormField
                  control={form.control}
                  name="statut_visite"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Statut *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PLANIFIEE">Planifiée</SelectItem>
                          <SelectItem value="REALISEE">Réalisée</SelectItem>
                          <SelectItem value="REPORTEE">Reportée</SelectItem>
                          <SelectItem value="ANNULEE">Annulée</SelectItem>
                          <SelectItem value="NO_SHOW">Absent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date_realisee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date réalisée</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="resultat_aptitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Résultat</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="EN_ATTENTE">En attente</SelectItem>
                          <SelectItem value="APTE">Apte</SelectItem>
                          <SelectItem value="APTE_RESTRICTIONS">Apte avec restrictions</SelectItem>
                          <SelectItem value="INAPTE_TEMP">Inapte temporaire</SelectItem>
                          <SelectItem value="INAPTE_DEFINITIVE">Inapte définitive</SelectItem>
                          <SelectItem value="AVIS_RESERVE">Avis réservé</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="restrictions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Restrictions / Préconisations</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="validite_jusqua"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Validité jusqu'au</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="prochaine_echeance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prochaine échéance</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="documents" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">Documents</h3>
                  <Button type="button" variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Ajouter un document
                  </Button>
                </div>
                {documents && documents.length > 0 ? (
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm">{doc.file_name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{doc.type_doc}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucun document
                  </p>
                )}
              </TabsContent>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer
                </Button>
              </div>
            </form>
          </Form>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};
