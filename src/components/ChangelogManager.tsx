import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Calendar, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { changelogQueries } from "@/lib/actes-queries";
import type { ChangelogEntry } from "@/types/actes";

interface ChangelogManagerProps {
  acteId: string;
}

export function ChangelogManager({ acteId }: ChangelogManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState<Partial<ChangelogEntry>>({
    type_changement: "modification",
    description: "",
    date_changement: new Date().toISOString().split("T")[0],
  });

  const { data: changelog } = useQuery({
    queryKey: ["changelog", acteId],
    queryFn: () => changelogQueries.getByActeId(acteId),
  });

  const createMutation = useMutation({
    mutationFn: (entry: Partial<ChangelogEntry>) =>
      changelogQueries.create({ ...entry, acte_id: acteId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["changelog", acteId] });
      toast({
        title: "Entrée ajoutée",
        description: "L'entrée d'historique a été ajoutée avec succès",
      });
      setShowForm(false);
      setFormData({
        type_changement: "modification",
        description: "",
        date_changement: new Date().toISOString().split("T")[0],
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'ajouter l'entrée",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => changelogQueries.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["changelog", acteId] });
      toast({
        title: "Entrée supprimée",
        description: "L'entrée d'historique a été supprimée avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer l'entrée",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.date_changement) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs requis",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(formData);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "ajout":
        return { label: "Ajout", color: "bg-success text-success-foreground" };
      case "modification":
        return { label: "Modification", color: "bg-warning text-warning-foreground" };
      case "abrogation":
        return { label: "Abrogation", color: "bg-destructive text-destructive-foreground" };
      default:
        return { label: type, color: "" };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Historique des modifications</h3>
        <Button
          variant={showForm ? "secondary" : "outline"}
          size="sm"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Annuler" : "Ajouter une entrée"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Nouvelle entrée d'historique</CardTitle>
            <CardDescription>
              Documentez les changements apportés à cet acte réglementaire
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="type_changement">Type de changement *</Label>
                  <Select
                    value={formData.type_changement}
                    onValueChange={(value) =>
                      setFormData({ ...formData, type_changement: value as any })
                    }
                  >
                    <SelectTrigger id="type_changement">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ajout">Ajout</SelectItem>
                      <SelectItem value="modification">Modification</SelectItem>
                      <SelectItem value="abrogation">Abrogation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="date_changement">Date du changement *</Label>
                  <Input
                    id="date_changement"
                    type="date"
                    value={formData.date_changement}
                    onChange={(e) =>
                      setFormData({ ...formData, date_changement: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Résumé du changement *</Label>
                <Textarea
                  id="description"
                  placeholder="Décrivez brièvement le changement apporté..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="bg-gradient-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                {createMutation.isPending ? "Ajout..." : "Ajouter l'entrée"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Changelog Timeline */}
      {changelog && changelog.length > 0 ? (
        <div className="space-y-4">
          {changelog.map((entry) => {
            const typeInfo = getTypeLabel(entry.type_changement);
            return (
              <Card key={entry.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge className={typeInfo.color}>{typeInfo.label}</Badge>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(entry.date_changement).toLocaleDateString("fr-FR", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </div>
                      </div>
                      <p className="text-foreground">{entry.description}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (window.confirm("Supprimer cette entrée ?")) {
                          deleteMutation.mutate(entry.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground">
              Aucune entrée d'historique pour le moment
            </p>
            {!showForm && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setShowForm(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter la première entrée
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
