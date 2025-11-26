import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

interface TexteDomainesManagerProps {
  texteId: string;
}

export function TexteDomainesManager({ texteId }: TexteDomainesManagerProps) {
  const queryClient = useQueryClient();
  const [selectedDomaines, setSelectedDomaines] = useState<string[]>([]);

  // Charger tous les domaines disponibles
  const { data: domaines = [], isLoading: domainesLoading } = useQuery({
    queryKey: ["domaines-reglementaires"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("domaines_reglementaires")
        .select("*")
        .eq("actif", true)
        .order("libelle");
      
      if (error) throw error;
      return data || [];
    },
  });

  // Charger les domaines assignés au texte
  const { data: texteDomaines = [], isLoading: textesDomainesLoading } = useQuery({
    queryKey: ["textes-domaines", texteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("textes_domaines")
        .select("domaine_id")
        .eq("texte_id", texteId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!texteId,
  });

  // Synchroniser les domaines sélectionnés quand les données sont chargées
  useEffect(() => {
    if (texteDomaines.length > 0) {
      setSelectedDomaines(texteDomaines.map(td => td.domaine_id));
    }
  }, [texteDomaines]);

  const saveMutation = useMutation({
    mutationFn: async (domaineIds: string[]) => {
      // Supprimer les anciennes assignations
      const { error: deleteError } = await supabase
        .from("textes_domaines")
        .delete()
        .eq("texte_id", texteId);
      
      if (deleteError) throw deleteError;

      // Insérer les nouvelles assignations
      if (domaineIds.length > 0) {
        const { error: insertError } = await supabase
          .from("textes_domaines")
          .insert(
            domaineIds.map(domaineId => ({
              texte_id: texteId,
              domaine_id: domaineId,
            }))
          );
        
        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["textes-domaines", texteId] });
      queryClient.invalidateQueries({ queryKey: ["texte-reglementaire-detail", texteId] });
      toast.success("Domaines mis à jour avec succès");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de la mise à jour");
    },
  });

  const handleToggleDomaine = (domaineId: string) => {
    setSelectedDomaines(prev => 
      prev.includes(domaineId)
        ? prev.filter(id => id !== domaineId)
        : [...prev, domaineId]
    );
  };

  const handleSave = () => {
    saveMutation.mutate(selectedDomaines);
  };

  const hasChanges = JSON.stringify(selectedDomaines.sort()) !== 
    JSON.stringify(texteDomaines.map(td => td.domaine_id).sort());

  if (domainesLoading || textesDomainesLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Domaines réglementaires</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">Domaines réglementaires</CardTitle>
            <CardDescription>
              Sélectionnez les domaines auxquels ce texte appartient
            </CardDescription>
          </div>
          {hasChanges && (
            <Button 
              onClick={handleSave}
              disabled={saveMutation.isPending}
              size="sm"
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Enregistrer
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {domaines.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-4">
            Aucun domaine disponible
          </div>
        ) : (
          <div className="space-y-3">
            {domaines.map((domaine) => (
              <div
                key={domaine.id}
                className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
              >
                <Checkbox
                  id={`domaine-${domaine.id}`}
                  checked={selectedDomaines.includes(domaine.id)}
                  onCheckedChange={() => handleToggleDomaine(domaine.id)}
                />
                <div className="flex-1">
                  <label
                    htmlFor={`domaine-${domaine.id}`}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Badge 
                      variant="outline"
                      style={{ 
                        borderColor: domaine.couleur || undefined,
                        color: domaine.couleur || undefined 
                      }}
                    >
                      {domaine.code}
                    </Badge>
                    <span className="font-medium">{domaine.libelle}</span>
                  </label>
                  {domaine.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {domaine.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedDomaines.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {selectedDomaines.length} domaine{selectedDomaines.length > 1 ? "s" : ""} sélectionné{selectedDomaines.length > 1 ? "s" : ""}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
