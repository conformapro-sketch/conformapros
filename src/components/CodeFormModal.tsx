import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { codesQueries } from "@/lib/codes-queries";
import { supabase } from "@/integrations/supabase/client";
import type { CodeJuridique } from "@/types/codes";

const codeSchema = z.object({
  nom_officiel: z.string().min(1, "Le nom officiel est requis"),
  abreviation: z.string().min(1, "L'abréviation est requise"),
  reference_jort: z.string().optional(),
  description: z.string().optional(),
});

type CodeFormValues = z.infer<typeof codeSchema>;

interface CodeFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  code?: CodeJuridique;
}

export function CodeFormModal({ open, onOpenChange, code }: CodeFormModalProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDomaines, setSelectedDomaines] = useState<string[]>([]);

  const form = useForm<CodeFormValues>({
    resolver: zodResolver(codeSchema),
    defaultValues: {
      nom_officiel: "",
      abreviation: "",
      reference_jort: "",
      description: "",
    },
  });

  // Récupérer les domaines réglementaires
  const { data: domaines, isLoading } = useQuery({
    queryKey: ["domaines-reglementaires"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("domaines_reglementaires")
        .select("id, libelle, code")
        .is("deleted_at", null)
        .eq("actif", true)
        .order("libelle");

      if (error) throw error;
      return data;
    },
  });

  // Charger les données du code en mode édition
  useEffect(() => {
    if (open) {
      if (code) {
        form.reset({
          nom_officiel: code.nom_officiel,
          abreviation: code.abreviation,
          reference_jort: code.reference_jort || "",
          description: code.description || "",
        });
        
        // Charger les domaines sélectionnés
        if (code.codes_domaines) {
          const domaineIds = code.codes_domaines.map(cd => cd.domaine_id);
          setSelectedDomaines(domaineIds);
        } else {
          setSelectedDomaines([]);
        }
      } else {
        form.reset({
          nom_officiel: "",
          abreviation: "",
          reference_jort: "",
          description: "",
        });
        setSelectedDomaines([]);
      }
    }
  }, [code, form, open]);

  const handleDomaineToggle = (domaineId: string) => {
    setSelectedDomaines(prev =>
      prev.includes(domaineId)
        ? prev.filter(id => id !== domaineId)
        : [...prev, domaineId]
    );
  };

  const createMutation = useMutation({
    mutationFn: ({ values, domaineIds }: { values: CodeFormValues; domaineIds: string[] }) => 
      codesQueries.create(values, domaineIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["codes-juridiques"] });
      toast.success("Code juridique créé avec succès");
      onOpenChange(false);
      form.reset();
      setSelectedDomaines([]);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de la création du code");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ values, domaineIds }: { values: CodeFormValues; domaineIds: string[] }) => 
      codesQueries.update(code!.id, values, domaineIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["codes-juridiques"] });
      queryClient.invalidateQueries({ queryKey: ["code", code?.id] });
      toast.success("Code juridique modifié avec succès");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de la modification du code");
    },
  });

  const onSubmit = async (values: CodeFormValues) => {
    setIsSubmitting(true);
    try {
      if (code) {
        await updateMutation.mutateAsync({ values, domaineIds: selectedDomaines });
      } else {
        await createMutation.mutateAsync({ values, domaineIds: selectedDomaines });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {code ? "Modifier le code juridique" : "Nouveau code juridique"}
          </DialogTitle>
          <DialogDescription>
            {code
              ? "Modifiez les informations du code juridique"
              : "Créez un nouveau code juridique pour structurer votre base réglementaire"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nom_officiel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom officiel *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ex: Code du travail"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="abreviation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Abréviation *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ex: COT"
                      className="uppercase"
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <Label>Domaines réglementaires</Label>
              <p className="text-sm text-muted-foreground">
                Sélectionnez un ou plusieurs domaines
              </p>
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Chargement...</p>
              ) : (
                <ScrollArea className="h-[200px] border rounded-md p-4">
                  <div className="space-y-3">
                    {domaines?.map((domaine) => (
                      <div key={domaine.id} className="flex items-start space-x-2">
                        <Checkbox
                          id={`domaine-${domaine.id}`}
                          checked={selectedDomaines.includes(domaine.id)}
                          onCheckedChange={() => handleDomaineToggle(domaine.id)}
                        />
                        <Label
                          htmlFor={`domaine-${domaine.id}`}
                          className="text-sm font-normal cursor-pointer flex-1"
                        >
                          {domaine.libelle}
                          {domaine.code && (
                            <span className="text-muted-foreground ml-2">({domaine.code})</span>
                          )}
                        </Label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
              {selectedDomaines.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {selectedDomaines.length} domaine(s) sélectionné(s)
                </p>
              )}
            </div>

            <FormField
              control={form.control}
              name="reference_jort"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Référence JORT</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ex: JORT n° 2018-042"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description / Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Description du code juridique..."
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Enregistrement..." : code ? "Modifier" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
