import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabaseAny as supabase } from "@/lib/supabase-any";
import { conformiteQueries } from "@/lib/conformite-queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { FileText, CheckCircle, XCircle, AlertCircle, Upload, History } from "lucide-react";

export default function ConformiteEvaluation() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    domaineId: "",
    sousDomaineId: "",
    typeTexte: "",
    statutTexte: "",
    etatConformite: "",
    siteId: "",
  });

  const [evaluationDialog, setEvaluationDialog] = useState<{
    open: boolean;
    applicabiliteId?: string;
    conformiteId?: string;
    etat: string;
    commentaire: string;
    score: number;
  }>({
    open: false,
    etat: "Non_evalue",
    commentaire: "",
    score: 0,
  });

  const [preuveDialog, setPreuveDialog] = useState<{
    open: boolean;
    conformiteId?: string;
  }>({
    open: false,
  });

  // Fetch domaines for filter
  const { data: domaines } = useQuery({
    queryKey: ["domaines"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("domaines_application")
        .select("*")
        .eq("actif", true)
        .order("libelle");
      if (error) throw error;
      return data;
    },
  });

  // Fetch sous-domaines for filter
  const { data: sousdomaines } = useQuery({
    queryKey: ["sousdomaines", filters.domaineId],
    queryFn: async () => {
      if (!filters.domaineId) return [];
      const { data, error } = await supabase
        .from("sous_domaines_application")
        .select("*")
        .eq("domaine_id", filters.domaineId)
        .eq("actif", true)
        .order("libelle");
      if (error) throw error;
      return data;
    },
    enabled: !!filters.domaineId,
  });

  // Fetch sites for filter
  const { data: sites } = useQuery({
    queryKey: ["sites"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sites")
        .select("id, nom_site, code_site")
        .order("nom_site");
      if (error) throw error;
      return data;
    },
  });

  // Fetch matrice data
  const {
    data: matriceData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["conformite-matrice", filters],
    queryFn: () => conformiteQueries.getMatrice(filters),
  });

  const filteredData = matriceData?.filter((item) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      item.textes_articles?.numero?.toLowerCase().includes(search) ||
      item.textes_articles?.titre_court?.toLowerCase().includes(search) ||
      item.textes_reglementaires?.reference_officielle?.toLowerCase().includes(search)
    );
  });

  const handleEvaluate = async () => {
    try {
      const conformite = await conformiteQueries.upsertConformite({
        applicabilite_id: evaluationDialog.applicabiliteId!,
        etat: evaluationDialog.etat as any,
        commentaire: evaluationDialog.commentaire,
        score: evaluationDialog.score,
      });

      // Auto-create action if non-compliant
      if (evaluationDialog.etat === "Non_conforme") {
        await conformiteQueries.createActionCorrective(
          conformite.id,
          evaluationDialog.applicabiliteId!
        );
        toast({
          title: "Action corrective créée",
          description: "Une action corrective a été automatiquement créée pour cette non-conformité.",
        });
      }

      toast({
        title: "Évaluation enregistrée",
        description: "La conformité a été mise à jour avec succès.",
      });

      setEvaluationDialog({ open: false, etat: "Non_evalue", commentaire: "", score: 0 });
      refetch();
    } catch (error) {
      console.error("Error saving evaluation:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer l'évaluation.",
        variant: "destructive",
      });
    }
  };

  const getEtatBadge = (etat?: string) => {
    switch (etat) {
      case "Conforme":
        return (
          <Badge className="bg-success text-success-foreground">
            <CheckCircle className="w-3 h-3 mr-1" />
            Conforme
          </Badge>
        );
      case "Partiel":
        return (
          <Badge className="bg-warning text-warning-foreground">
            <AlertCircle className="w-3 h-3 mr-1" />
            Partiel
          </Badge>
        );
      case "Non_conforme":
        return (
          <Badge className="bg-destructive text-destructive-foreground">
            <XCircle className="w-3 h-3 mr-1" />
            Non conforme
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <FileText className="w-3 h-3 mr-1" />
            Non évalué
          </Badge>
        );
    }
  };

  const handleExport = () => {
    toast({
      title: "Export en cours",
      description: "La matrice de conformité sera téléchargée dans un instant.",
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Matrice de Conformité</h1>
          <p className="text-muted-foreground mt-1">
            Évaluez et suivez la conformité réglementaire de vos sites
          </p>
        </div>
        <Button onClick={handleExport}>
          <FileText className="w-4 h-4 mr-2" />
          Exporter
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <Label>Site</Label>
              <Select
                value={filters.siteId}
                onValueChange={(value) => setFilters({ ...filters, siteId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les sites" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les sites</SelectItem>
                  {sites?.map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.nom_site}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Domaine</Label>
              <Select
                value={filters.domaineId}
                onValueChange={(value) =>
                  setFilters({ ...filters, domaineId: value, sousDomaineId: "" })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {domaines?.map((domaine) => (
                    <SelectItem key={domaine.id} value={domaine.id}>
                      {domaine.libelle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Sous-domaine</Label>
              <Select
                value={filters.sousDomaineId}
                onValueChange={(value) => setFilters({ ...filters, sousDomaineId: value })}
                disabled={!filters.domaineId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {sousdomaines?.map((sd) => (
                    <SelectItem key={sd.id} value={sd.id}>
                      {sd.libelle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Type de texte</Label>
              <Select
                value={filters.typeTexte}
                onValueChange={(value) => setFilters({ ...filters, typeTexte: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="LOI">Loi</SelectItem>
                  <SelectItem value="DECRET">Décret</SelectItem>
                  <SelectItem value="ARRETE">Arrêté</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Statut</Label>
              <Select
                value={filters.statutTexte}
                onValueChange={(value) => setFilters({ ...filters, statutTexte: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="en_vigueur">En vigueur</SelectItem>
                  <SelectItem value="abroge">Abrogé</SelectItem>
                  <SelectItem value="modifie">Modifié</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>État conformité</Label>
              <Select
                value={filters.etatConformite}
                onValueChange={(value) => setFilters({ ...filters, etatConformite: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="Conforme">Conforme</SelectItem>
                  <SelectItem value="Partiel">Partiel</SelectItem>
                  <SelectItem value="Non_conforme">Non conforme</SelectItem>
                  <SelectItem value="Non_evalue">Non évalué</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4">
            <Label>Recherche</Label>
            <Input
              placeholder="Rechercher par référence, article..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              setFilters({
                domaineId: "",
                sousDomaineId: "",
                typeTexte: "",
                statutTexte: "",
                etatConformite: "",
                siteId: "",
              });
              setSearchTerm("");
            }}
          >
            Réinitialiser les filtres
          </Button>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Site</TableHead>
                  <TableHead>Référence texte</TableHead>
                  <TableHead>Article</TableHead>
                  <TableHead>Activité</TableHead>
                  <TableHead>Applicable</TableHead>
                  <TableHead>État</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Commentaire</TableHead>
                  <TableHead>Preuves</TableHead>
                  <TableHead>Dernière MAJ</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8">
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : filteredData?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8">
                      Aucune donnée trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {(item.sites as any)?.nom_site}
                      </TableCell>
                      <TableCell>
                        {item.textes_reglementaires?.reference_officielle}
                      </TableCell>
                      <TableCell>
                        Art. {item.textes_articles?.numero}
                        {item.textes_articles?.titre_court && (
                          <div className="text-xs text-muted-foreground">
                            {item.textes_articles.titre_court}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{item.activite || "-"}</TableCell>
                      <TableCell>
                        {item.applicable ? (
                          <Badge variant="outline" className="bg-success/10 text-success">
                            Oui
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-muted">
                            Non
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {getEtatBadge(item.conformite?.[0]?.etat)}
                      </TableCell>
                      <TableCell>
                        {item.conformite?.[0]?.score ?? "-"}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {item.conformite?.[0]?.commentaire || "-"}
                      </TableCell>
                      <TableCell>
                        {item.conformite?.[0]?.preuves?.length || 0}
                      </TableCell>
                      <TableCell>
                        {item.conformite?.[0]?.derniere_mise_a_jour
                          ? new Date(
                              item.conformite[0].derniere_mise_a_jour
                            ).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setEvaluationDialog({
                              open: true,
                              applicabiliteId: item.id,
                              conformiteId: item.conformite?.[0]?.id,
                              etat: item.conformite?.[0]?.etat || "Non_evalue",
                              commentaire: item.conformite?.[0]?.commentaire || "",
                              score: item.conformite?.[0]?.score || 0,
                            })
                          }
                        >
                          Évaluer
                        </Button>
                        {item.conformite?.[0]?.id && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setPreuveDialog({
                                  open: true,
                                  conformiteId: item.conformite[0].id,
                                })
                              }
                            >
                              <Upload className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <History className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Evaluation Dialog */}
      <Dialog open={evaluationDialog.open} onOpenChange={(open) => setEvaluationDialog({ ...evaluationDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Évaluer la conformité</DialogTitle>
            <DialogDescription>
              Définissez l'état de conformité et ajoutez des commentaires.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>État de conformité</Label>
              <Select
                value={evaluationDialog.etat}
                onValueChange={(value) =>
                  setEvaluationDialog({ ...evaluationDialog, etat: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Conforme">Conforme</SelectItem>
                  <SelectItem value="Partiel">Partiel</SelectItem>
                  <SelectItem value="Non_conforme">Non conforme</SelectItem>
                  <SelectItem value="Non_evalue">Non évalué</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Score (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={evaluationDialog.score}
                onChange={(e) =>
                  setEvaluationDialog({
                    ...evaluationDialog,
                    score: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div>
              <Label>Commentaire</Label>
              <Textarea
                value={evaluationDialog.commentaire}
                onChange={(e) =>
                  setEvaluationDialog({
                    ...evaluationDialog,
                    commentaire: e.target.value,
                  })
                }
                placeholder="Ajoutez des détails sur l'évaluation..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEvaluationDialog({ ...evaluationDialog, open: false })}
            >
              Annuler
            </Button>
            <Button onClick={handleEvaluate}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
