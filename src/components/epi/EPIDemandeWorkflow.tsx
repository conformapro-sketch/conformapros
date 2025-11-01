import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Package, Truck } from "lucide-react";

interface EPIDemandeWorkflowProps {
  demande: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STATUT_CONFIG = {
  en_attente: { 
    label: "En attente", 
    icon: Clock, 
    color: "bg-yellow-500",
    nextStates: ["approuvee", "rejetee"] 
  },
  approuvee: { 
    label: "Approuvée", 
    icon: CheckCircle, 
    color: "bg-green-500",
    nextStates: ["en_preparation"] 
  },
  en_preparation: { 
    label: "En préparation", 
    icon: Package, 
    color: "bg-blue-500",
    nextStates: ["livree"] 
  },
  livree: { 
    label: "Livrée", 
    icon: Truck, 
    color: "bg-green-600",
    nextStates: [] 
  },
  rejetee: { 
    label: "Rejetée", 
    icon: XCircle, 
    color: "bg-red-500",
    nextStates: [] 
  },
};

export function EPIDemandeWorkflow({ demande, open, onOpenChange }: EPIDemandeWorkflowProps) {
  const [commentaire, setCommentaire] = useState("");
  const [motifRejet, setMotifRejet] = useState("");
  const queryClient = useQueryClient();

  const updateStatutMutation = useMutation({
    mutationFn: async ({ 
      newStatut, 
      comment 
    }: { 
      newStatut: string; 
      comment?: string 
    }) => {
      const updates: any = {
        statut_workflow: newStatut,
        statut: newStatut, // Sync avec l'ancien champ
      };

      if (newStatut === "approuvee" || newStatut === "rejetee") {
        updates.date_traitement = new Date().toISOString();
        updates.traite_par = (await supabase.auth.getUser()).data.user?.id;
      }

      if (newStatut === "rejetee" && motifRejet) {
        updates.motif_rejet = motifRejet;
      }

      const { error } = await supabase
        .from("epi_demandes")
        .update(updates)
        .eq("id", demande.id);

      if (error) throw error;

      // TODO: Ajouter commentaire dans une table dédiée (future implementation)

      // TODO: Envoyer notification email
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["epi-demandes"] });
      toast.success("Statut mis à jour avec succès");
      onOpenChange(false);
      setCommentaire("");
      setMotifRejet("");
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour");
    },
  });

  const currentStatut = demande.statut_workflow || demande.statut;
  const config = STATUT_CONFIG[currentStatut as keyof typeof STATUT_CONFIG];
  const Icon = config?.icon || Clock;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Gestion de la demande</DialogTitle>
          <DialogDescription>
            Demande de {demande.employe?.prenom} {demande.employe?.nom}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-full ${config?.color}`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-medium">Statut actuel</p>
              <Badge variant="outline">{config?.label}</Badge>
            </div>
          </div>

          <div className="bg-muted p-4 rounded-lg space-y-2">
            <p><span className="font-medium">Type EPI:</span> {demande.type?.libelle}</p>
            <p><span className="font-medium">Quantité:</span> {demande.quantite}</p>
            {demande.taille && <p><span className="font-medium">Taille:</span> {demande.taille}</p>}
            {demande.motif && <p><span className="font-medium">Motif:</span> {demande.motif}</p>}
          </div>

          {config?.nextStates?.length > 0 && (
            <>
              <div className="space-y-2">
                <Label>Commentaire (optionnel)</Label>
                <Textarea
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  placeholder="Ajouter un commentaire..."
                  rows={3}
                />
              </div>

              {config.nextStates.includes("rejetee") && (
                <div className="space-y-2">
                  <Label>Motif de rejet</Label>
                  <Textarea
                    value={motifRejet}
                    onChange={(e) => setMotifRejet(e.target.value)}
                    placeholder="Expliquer pourquoi cette demande est rejetée..."
                    rows={3}
                  />
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          {config?.nextStates?.map((nextState) => {
            const nextConfig = STATUT_CONFIG[nextState as keyof typeof STATUT_CONFIG];
            return (
              <Button
                key={nextState}
                variant={nextState === "rejetee" ? "destructive" : "default"}
                onClick={() => updateStatutMutation.mutate({ 
                  newStatut: nextState, 
                  comment: commentaire 
                })}
                disabled={
                  updateStatutMutation.isPending ||
                  (nextState === "rejetee" && !motifRejet)
                }
              >
                {nextConfig?.label}
              </Button>
            );
          })}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
