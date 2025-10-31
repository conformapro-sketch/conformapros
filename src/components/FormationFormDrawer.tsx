import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createFormation, updateFormation } from "@/lib/formations-queries";
import { fetchSitesByClient } from "@/lib/multi-tenant-queries";
import { DOMAINES_FORMATION, TYPES_FORMATION } from "@/types/formations";

const formationSchema = z.object({
  intitule: z.string().min(1, "L'intitulé est requis"),
  domaine: z.string().min(1, "Le domaine est requis"),
  type_formation: z.string().min(1, "Le type est requis"),
  objectif: z.string().optional(),
  formateur_nom: z.string().optional(),
  formateur_contact: z.string().optional(),
  formateur_email: z.string().email("Email invalide").optional().or(z.literal("")),
  organisme_formation: z.string().optional(),
  site_id: z.string().min(1, "Le site est requis"),
  lieu: z.string().optional(),
  date_prevue: z.string().optional(),
  duree_heures: z.coerce.number().positive("La durée doit être positive").optional(),
  validite_mois: z.coerce.number().int().positive("La validité doit être positive").optional(),
});

type FormationFormData = z.infer<typeof formationSchema>;

interface FormationFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formation?: any;
}

export function FormationFormDrawer({ open, onOpenChange, formation }: FormationFormDrawerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sites = [] } = useQuery({
    queryKey: ["sites-all"],
    queryFn: () => fetchSitesByClient("all"),
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormationFormData>({
    resolver: zodResolver(formationSchema),
    defaultValues: formation
      ? {
          intitule: formation.intitule,
          domaine: formation.domaine,
          type_formation: formation.type_formation,
          objectif: formation.objectif || "",
          formateur_nom: formation.formateur_nom || "",
          formateur_contact: formation.formateur_contact || "",
          formateur_email: formation.formateur_email || "",
          organisme_formation: formation.organisme_formation || "",
          site_id: formation.site_id,
          lieu: formation.lieu || "",
          date_prevue: formation.date_prevue || "",
          duree_heures: formation.duree_heures || undefined,
          validite_mois: formation.validite_mois || undefined,
        }
      : {},
  });

  useEffect(() => {
    if (formation) {
      reset({
        intitule: formation.intitule,
        domaine: formation.domaine,
        type_formation: formation.type_formation,
        objectif: formation.objectif || "",
        formateur_nom: formation.formateur_nom || "",
        formateur_contact: formation.formateur_contact || "",
        formateur_email: formation.formateur_email || "",
        organisme_formation: formation.organisme_formation || "",
        site_id: formation.site_id,
        lieu: formation.lieu || "",
        date_prevue: formation.date_prevue || "",
        duree_heures: formation.duree_heures || undefined,
        validite_mois: formation.validite_mois || undefined,
      });
    } else {
      reset({});
    }
  }, [formation, reset]);

  const saveMutation = useMutation({
    mutationFn: async (data: FormationFormData) => {
      if (formation?.id) {
        return updateFormation(formation.id, data);
      }
      return createFormation(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["formations"] });
      queryClient.invalidateQueries({ queryKey: ["formations-stats"] });
      toast({
        title: "Succès",
        description: formation ? "Formation mise à jour" : "Formation créée avec succès",
      });
      onOpenChange(false);
      reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de sauvegarder la formation",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormationFormData) => {
    saveMutation.mutate(data);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh] overflow-y-auto">
        <DrawerHeader>
          <DrawerTitle>
            {formation ? "Modifier la formation" : "Nouvelle formation"}
          </DrawerTitle>
          <DrawerDescription>
            Renseignez les informations de la formation HSE
          </DrawerDescription>
        </DrawerHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="px-4 space-y-6">
          {/* Informations générales */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Informations générales</h3>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="intitule">Intitulé *</Label>
                <Input id="intitule" {...register("intitule")} />
                {errors.intitule && (
                  <p className="text-sm text-destructive mt-1">{errors.intitule.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="domaine">Domaine *</Label>
                <Controller
                  name="domaine"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                        {DOMAINES_FORMATION.map((domaine) => (
                          <SelectItem key={domaine} value={domaine}>
                            {domaine}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.domaine && (
                  <p className="text-sm text-destructive mt-1">{errors.domaine.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="type_formation">Type *</Label>
                <Controller
                  name="type_formation"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="obligatoire">Obligatoire</SelectItem>
                        <SelectItem value="interne">Interne</SelectItem>
                        <SelectItem value="recyclage">Recyclage</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.type_formation && (
                  <p className="text-sm text-destructive mt-1">{errors.type_formation.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="site_id">Site *</Label>
                <Controller
                  name="site_id"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                        {sites.map((site: any) => (
                          <SelectItem key={site.id} value={site.id}>
                            {site.nom_site}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.site_id && (
                  <p className="text-sm text-destructive mt-1">{errors.site_id.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="objectif">Objectif</Label>
              <Textarea id="objectif" {...register("objectif")} rows={3} />
            </div>
          </div>

          {/* Formateur/Organisme */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Formateur / Organisme</h3>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="formateur_nom">Nom du formateur</Label>
                <Input id="formateur_nom" {...register("formateur_nom")} />
              </div>

              <div>
                <Label htmlFor="organisme_formation">Organisme</Label>
                <Input id="organisme_formation" {...register("organisme_formation")} />
              </div>

              <div>
                <Label htmlFor="formateur_contact">Contact</Label>
                <Input id="formateur_contact" {...register("formateur_contact")} />
              </div>

              <div>
                <Label htmlFor="formateur_email">Email</Label>
                <Input id="formateur_email" type="email" {...register("formateur_email")} />
                {errors.formateur_email && (
                  <p className="text-sm text-destructive mt-1">{errors.formateur_email.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Planification */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Planification</h3>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="date_prevue">Date prévue</Label>
                <Input id="date_prevue" type="date" {...register("date_prevue")} />
              </div>

              <div>
                <Label htmlFor="duree_heures">Durée (heures)</Label>
                <Input
                  id="duree_heures"
                  type="number"
                  step="0.5"
                  {...register("duree_heures")}
                />
                {errors.duree_heures && (
                  <p className="text-sm text-destructive mt-1">{errors.duree_heures.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="validite_mois">Validité (mois)</Label>
                <Input
                  id="validite_mois"
                  type="number"
                  {...register("validite_mois")}
                  placeholder="Ex: 24 pour 2 ans"
                />
                {errors.validite_mois && (
                  <p className="text-sm text-destructive mt-1">{errors.validite_mois.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="lieu">Lieu</Label>
              <Input id="lieu" {...register("lieu")} placeholder="Salle, site, en ligne..." />
            </div>
          </div>

          <DrawerFooter className="px-0">
            <div className="flex gap-2 justify-end">
              <DrawerClose asChild>
                <Button variant="outline" type="button">
                  Annuler
                </Button>
              </DrawerClose>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending
                  ? "Enregistrement..."
                  : formation
                  ? "Mettre à jour"
                  : "Créer la formation"}
              </Button>
            </div>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
