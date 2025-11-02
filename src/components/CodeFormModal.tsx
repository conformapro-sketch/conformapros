import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { codesQueries } from "@/lib/codes-queries";
import { supabase } from "@/integrations/supabase/client";
import type { CodeJuridique } from "@/types/codes";

const codeSchema = z.object({
  nom_officiel: z.string().min(1, "Le nom officiel est requis"),
  abreviation: z.string().min(1, "L'abréviation est requise"),
  domaine_reglementaire_id: z.string().optional(),
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

  const form = useForm<CodeFormValues>({
    resolver: zodResolver(codeSchema),
    defaultValues: {
      nom_officiel: code?.nom_officiel || "",
      abreviation: code?.abreviation || "",
      domaine_reglementaire_id: code?.domaine_reglementaire_id || "",
      reference_jort: code?.reference_jort || "",
      description: code?.description || "",
    },
  });

  // Récupérer les domaines réglementaires
  const { data: domaines } = useQuery({
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

  const createMutation = useMutation({
    mutationFn: (values: CodeFormValues) => codesQueries.create(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["codes-juridiques"] });
      toast.success("Code juridique créé avec succès");
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de la création du code");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (values: CodeFormValues) => codesQueries.update(code!.id, values),
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
        await updateMutation.mutateAsync(values);
      } else {
        await createMutation.mutateAsync(values);
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

            <FormField
              control={form.control}
              name="domaine_reglementaire_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Domaine réglementaire</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un domaine" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {domaines?.map((domaine) => (
                        <SelectItem key={domaine.id} value={domaine.id}>
                          {domaine.libelle}
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
