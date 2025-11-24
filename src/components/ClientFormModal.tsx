import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { createClient, updateClient } from "@/lib/multi-tenant-queries";
import type { Database } from "@/types/db";
import { useEffect } from "react";

type ClientRow = Database["public"]["Tables"]["clients"]["Row"];

const clientSchema = z.object({
  nom_legal: z.string().min(1, "Le nom légal est requis"),
  siret: z.string().optional(),
  telephone: z.string().optional(),
  email: z.string().email("Format email invalide").optional().or(z.literal("")),
  adresse: z.string().optional(),
  code_postal: z.string().optional(),
  pays: z.string().optional(),
  logo_url: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: ClientRow;
}

export function ClientFormModal({ open, onOpenChange, client }: ClientFormModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: client || { pays: "Tunisie" },
  });

  useEffect(() => {
    if (open && client) {
      reset({
        nom_legal: client.nom_legal || "",
        siret: client.siret || "",
        telephone: client.telephone || "",
        email: client.email || "",
        adresse: client.adresse || "",
        code_postal: client.code_postal || "",
        pays: client.pays || "Tunisie",
        logo_url: client.logo_url || "",
      });
    } else if (open && !client) {
      reset({ pays: "Tunisie" });
    }
  }, [open, client, reset]);

  const createMutation = useMutation({
    mutationFn: createClient,
    onMutate: async (newClient) => {
      // Optimistic update: add client to cache immediately
      await queryClient.cancelQueries({ queryKey: ["clients"] });
      const previousClients = queryClient.getQueryData(["clients"]);
      
      queryClient.setQueryData(["clients"], (old: any) => {
        const optimisticClient = {
          id: `temp-${Date.now()}`,
          ...newClient,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        return [...(old || []), optimisticClient];
      });
      
      return { previousClients };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({
        title: "✓ Client créé",
        description: "Le client a été créé avec succès.",
      });
      reset();
      onOpenChange(false);
    },
    onError: (error: any, _, context) => {
      // Rollback on error
      if (context?.previousClients) {
        queryClient.setQueryData(["clients"], context.previousClients);
      }
      
      const errorMessage = error?.message || "Impossible de créer le client.";
      const actionHint = error?.code === '23505' 
        ? "Un client avec ce SIRET existe déjà. Vérifiez le numéro." 
        : "Vérifiez les informations saisies et réessayez.";
      
      toast({
        title: "Erreur de création",
        description: `${errorMessage} ${actionHint}`,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ clientId, updates }: { clientId: string; updates: any }) => 
      updateClient(clientId, updates),
    onMutate: async ({ clientId, updates }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["clients"] });
      const previousClients = queryClient.getQueryData(["clients"]);
      
      queryClient.setQueryData(["clients"], (old: any) => {
        return old?.map((c: any) => 
          c.id === clientId ? { ...c, ...updates, updated_at: new Date().toISOString() } : c
        );
      });
      
      return { previousClients };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({
        title: "✓ Client modifié",
        description: "Les modifications ont été enregistrées.",
      });
      onOpenChange(false);
    },
    onError: (error: any, _, context) => {
      // Rollback on error
      if (context?.previousClients) {
        queryClient.setQueryData(["clients"], context.previousClients);
      }
      
      const errorMessage = error?.message || "Impossible de modifier le client.";
      const actionHint = "Vérifiez votre connexion et réessayez.";
      
      toast({
        title: "Erreur de modification",
        description: `${errorMessage} ${actionHint}`,
        variant: "destructive",
      });
      console.error(error);
    },
  });

  const onSubmit = async (data: ClientFormData) => {
    if (client) {
      updateMutation.mutate({ clientId: client.id, updates: data as any });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{client ? "Modifier le client" : "Nouveau client"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="nom_legal">Nom légal *</Label>
              <Input 
                id="nom_legal" 
                {...register("nom_legal")} 
                placeholder="Ex: ACME Corporation SARL"
              />
              {errors.nom_legal && (
                <p className="text-sm text-destructive mt-1">{errors.nom_legal.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="siret">
                SIRET / Matricule fiscal <span className="text-muted-foreground text-xs ml-1">(optionnel)</span>
              </Label>
              <Input 
                id="siret" 
                {...register("siret")} 
                placeholder="Ex: 1234567A"
              />
            </div>

            <div>
              <Label htmlFor="telephone">
                Téléphone <span className="text-muted-foreground text-xs ml-1">(optionnel)</span>
              </Label>
              <Input 
                id="telephone" 
                {...register("telephone")} 
                placeholder="+216 xx xxx xxx"
              />
            </div>

            <div>
              <Label htmlFor="email">
                Email <span className="text-muted-foreground text-xs ml-1">(optionnel)</span>
              </Label>
              <Input 
                id="email" 
                type="email"
                {...register("email")} 
                placeholder="contact@entreprise.tn"
              />
              {errors.email && (
                <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
              )}
            </div>

            <div className="col-span-2">
              <Label htmlFor="adresse">
                Adresse <span className="text-muted-foreground text-xs ml-1">(optionnel)</span>
              </Label>
              <Textarea 
                id="adresse" 
                {...register("adresse")} 
                placeholder="Adresse complète"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="code_postal">
                Code postal <span className="text-muted-foreground text-xs ml-1">(optionnel)</span>
              </Label>
              <Input 
                id="code_postal" 
                {...register("code_postal")} 
                placeholder="Ex: 1000"
              />
            </div>

            <div>
              <Label htmlFor="pays">
                Pays <span className="text-muted-foreground text-xs ml-1">(optionnel)</span>
              </Label>
              <Input 
                id="pays" 
                {...register("pays")} 
                placeholder="Tunisie"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button 
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {client ? "Enregistrer" : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
