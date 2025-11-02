import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createSousDomaine, updateSousDomaine, fetchDomaines } from "@/lib/domaines-queries";
import type { Database } from "@/types/db";

type SousDomaineRow = Database["public"]["Tables"]["sous_domaines_application"]["Row"];

const sousDomaineSchema = z.object({
  domaine_id: z.string().min(1, "Le domaine est requis"),
  code: z.string().min(1, "Le code est requis").max(10, "Maximum 10 caractères"),
  libelle: z.string().min(1, "Le nom est requis"),
  description: z.string().optional(),
  ordre: z.coerce.number().int().min(0).optional(),
  actif: z.boolean(),
});

type SousDomaineFormData = z.infer<typeof sousDomaineSchema>;

interface SousDomaineFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sousDomaine?: SousDomaineRow;
  defaultDomaineId?: string;
}

export function SousDomaineFormModal({ open, onOpenChange, sousDomaine, defaultDomaineId }: SousDomaineFormModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: domaines } = useQuery({
    queryKey: ["domaines"],
    queryFn: fetchDomaines,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<SousDomaineFormData>({
    resolver: zodResolver(sousDomaineSchema),
    defaultValues: {
      domaine_id: "",
      code: "",
      libelle: "",
      description: "",
      ordre: 0,
      actif: true,
    },
  });

  const actif = watch("actif");
  const domaineId = watch("domaine_id");

  // Mettre à jour le formulaire quand le sous-domaine change
  useEffect(() => {
    if (open) {
      if (sousDomaine) {
        reset({
          domaine_id: sousDomaine.domaine_id,
          code: sousDomaine.code,
          libelle: sousDomaine.libelle,
          description: sousDomaine.description || "",
          ordre: sousDomaine.ordre || 0,
          actif: sousDomaine.actif ?? true,
        });
      } else {
        reset({
          domaine_id: defaultDomaineId || "",
          code: "",
          libelle: "",
          description: "",
          ordre: 0,
          actif: true,
        });
      }
    }
  }, [sousDomaine, defaultDomaineId, open, reset]);

  const createMutation = useMutation({
    mutationFn: createSousDomaine,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sous-domaines"] });
      queryClient.invalidateQueries({ queryKey: ["domaines"] });
      toast({ title: "Sous-domaine créé avec succès" });
      reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur lors de la création",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateSousDomaine(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sous-domaines"] });
      queryClient.invalidateQueries({ queryKey: ["domaines"] });
      toast({ title: "Sous-domaine modifié avec succès" });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur lors de la modification",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SousDomaineFormData) => {
    if (sousDomaine) {
      updateMutation.mutate({ id: sousDomaine.id, data });
    } else {
      createMutation.mutate(data as any);
    }
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(newOpen) => {
        if (!newOpen) {
          reset();
        }
        onOpenChange(newOpen);
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{sousDomaine ? "Modifier le sous-domaine" : "Nouveau sous-domaine"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="domaine_id">Domaine parent *</Label>
            <Select 
              value={domaineId} 
              onValueChange={(value) => setValue("domaine_id", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un domaine" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border z-50">
                {domaines?.filter((d) => (d as any).actif ?? true).map((domaine: any) => (
                  <SelectItem key={domaine.id} value={domaine.id}>
                    {domaine.libelle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.domaine_id && (
              <p className="text-sm text-destructive mt-1">{errors.domaine_id.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="code">Code *</Label>
              <Input 
                id="code" 
                {...register("code")} 
                placeholder="Ex: QUA-01"
                className="uppercase"
                maxLength={10}
              />
              {errors.code && (
                <p className="text-sm text-destructive mt-1">{errors.code.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="ordre">Ordre</Label>
              <Input 
                id="ordre" 
                type="number" 
                {...register("ordre")} 
                min="0"
              />
              {errors.ordre && (
                <p className="text-sm text-destructive mt-1">{errors.ordre.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="libelle">Nom *</Label>
            <Input id="libelle" {...register("libelle")} placeholder="Ex: Système de management qualité" />
            {errors.libelle && (
              <p className="text-sm text-destructive mt-1">{errors.libelle.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              {...register("description")} 
              rows={3}
              placeholder="Description du sous-domaine..."
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="actif">Sous-domaine actif</Label>
            <Switch
              id="actif"
              checked={actif}
              onCheckedChange={(checked) => setValue("actif", checked)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {sousDomaine ? "Modifier" : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
