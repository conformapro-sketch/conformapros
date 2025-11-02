import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createDomaine, updateDomaine } from "@/lib/domaines-queries";
import type { Database } from "@/types/db";

type DomaineRow = Database["public"]["Tables"]["domaines_application"]["Row"];

const domaineSchema = z.object({
  code: z.string().min(1, "Le code est requis").max(10, "Maximum 10 caractères"),
  libelle: z.string().min(1, "Le nom est requis"),
  description: z.string().optional(),
  actif: z.boolean(),
});

type DomaineFormData = z.infer<typeof domaineSchema>;

interface DomaineFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domaine?: DomaineRow;
}

export function DomaineFormModal({ open, onOpenChange, domaine }: DomaineFormModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<DomaineFormData>({
    resolver: zodResolver(domaineSchema),
    defaultValues: {
      code: "",
      libelle: "",
      description: "",
      actif: true,
    },
  });

  const actif = watch("actif");

  // Mettre à jour le formulaire quand le domaine change
  useEffect(() => {
    if (open) {
      if (domaine) {
        reset({
          code: domaine.code,
          libelle: domaine.libelle,
          description: domaine.description || "",
          actif: domaine.actif ?? true,
        });
      } else {
        reset({
          code: "",
          libelle: "",
          description: "",
          actif: true,
        });
      }
    }
  }, [domaine, open, reset]);

  const createMutation = useMutation({
    mutationFn: createDomaine,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["domaines"] });
      toast({ title: "Domaine créé avec succès" });
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
    mutationFn: ({ id, data }: { id: string; data: any }) => updateDomaine(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["domaines"] });
      toast({ title: "Domaine modifié avec succès" });
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

  const onSubmit = (data: DomaineFormData) => {
    if (domaine) {
      updateMutation.mutate({ id: domaine.id, data });
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
          <DialogTitle>{domaine ? "Modifier le domaine" : "Nouveau domaine"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="code">Code *</Label>
            <Input 
              id="code" 
              {...register("code")} 
              placeholder="Ex: QUA"
              className="uppercase"
              maxLength={10}
            />
            {errors.code && (
              <p className="text-sm text-destructive mt-1">{errors.code.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="libelle">Nom *</Label>
            <Input id="libelle" {...register("libelle")} placeholder="Ex: Qualité" />
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
              placeholder="Description du domaine d'application..."
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="actif">Domaine actif</Label>
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
              {domaine ? "Modifier" : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
