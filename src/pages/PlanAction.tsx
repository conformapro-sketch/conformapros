import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabaseAny as supabase } from "@/lib/supabase-any";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Download, Plus, CheckCircle2, Clock, AlertCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

const PlanAction = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statutFilter, setStatutFilter] = useState<string>("all");
  const [prioriteFilter, setPrioriteFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Fetch actions correctives
  const { data: actions, isLoading } = useQuery({
    queryKey: ["actions-correctives", searchTerm, statutFilter, prioriteFilter, page],
    queryFn: async () => {
      let query = supabase
        .from("actions_correctives")
        .select(`
          *,
          conformite:conformite_id (
            id,
            etat,
            applicabilite:applicabilite_id (
              id,
              actes_reglementaires:texte_id (
                reference,
                titre
              ),
              articles:article_id (
                numero,
                titre_court
              ),
              clients:client_id (
                nom_legal
              ),
              sites:site_id (
                nom_site
              )
            )
          ),
          responsable_profile:responsable (
            nom,
            prenom
          )
        `)
        .order("created_at", { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (statutFilter !== "all") {
        query = query.eq("statut", statutFilter as any);
      }

      if (prioriteFilter !== "all") {
        query = query.eq("priorite", prioriteFilter as any);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      let filteredData = data || [];

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredData = filteredData.filter((item: any) => {
          const texte = item.conformite?.applicabilite?.actes_reglementaires;
          const client = item.conformite?.applicabilite?.clients;
          return (
            item.action?.toLowerCase().includes(term) ||
            item.manquement?.toLowerCase().includes(term) ||
            texte?.reference?.toLowerCase().includes(term) ||
            client?.nom_legal?.toLowerCase().includes(term)
          );
        });
      }

      return { data: filteredData, count: filteredData.length };
    },
  });

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "Terminee":
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Terminée</Badge>;
      case "En_cours":
        return <Badge className="bg-blue-500"><Clock className="h-3 w-3 mr-1" />En cours</Badge>;
      case "En_retard":
        return <Badge className="bg-red-500"><XCircle className="h-3 w-3 mr-1" />En retard</Badge>;
      default:
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />À faire</Badge>;
    }
  };

  const getPrioriteBadge = (priorite: string) => {
    switch (priorite) {
      case "Critique":
        return <Badge variant="destructive">Critique</Badge>;
      case "Haute":
        return <Badge className="bg-orange-500">Haute</Badge>;
      case "Moyenne":
        return <Badge className="bg-yellow-500">Moyenne</Badge>;
      case "Basse":
        return <Badge variant="outline">Basse</Badge>;
      default:
        return <Badge variant="outline">{priorite}</Badge>;
    }
  };

  const handleExport = () => {
    toast.info("Fonctionnalité d'export en cours de développement");
  };

  const handleNewAction = () => {
    toast.info("Fonctionnalité de création en cours de développement");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Plan d'action</h1>
          <p className="text-muted-foreground">
            Gérez les actions correctives pour améliorer votre conformité
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button onClick={handleNewAction}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle action
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtres de recherche</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une action..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={statutFilter} onValueChange={setStatutFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="A_faire">À faire</SelectItem>
                <SelectItem value="En_cours">En cours</SelectItem>
                <SelectItem value="En_retard">En retard</SelectItem>
                <SelectItem value="Terminee">Terminée</SelectItem>
              </SelectContent>
            </Select>

            <Select value={prioriteFilter} onValueChange={setPrioriteFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Toutes les priorités" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les priorités</SelectItem>
                <SelectItem value="Critique">Critique</SelectItem>
                <SelectItem value="Haute">Haute</SelectItem>
                <SelectItem value="Moyenne">Moyenne</SelectItem>
                <SelectItem value="Basse">Basse</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("");
                setStatutFilter("all");
                setPrioriteFilter("all");
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <p className="text-muted-foreground">Chargement...</p>
            </div>
          ) : actions?.data.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune action trouvée</h3>
              <p className="text-muted-foreground mb-4">
                Aucune action corrective ne correspond à vos critères de recherche
              </p>
              <Button onClick={handleNewAction}>
                <Plus className="h-4 w-4 mr-2" />
                Créer une action
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Manquement</TableHead>
                  <TableHead>Action corrective</TableHead>
                  <TableHead>Référence texte</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead>Échéance</TableHead>
                  <TableHead>Priorité</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Coût estimé</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {actions?.data.map((action: any) => (
                  <TableRow key={action.id}>
                    <TableCell className="font-medium">
                      {action.conformite?.applicabilite?.clients?.nom_legal || "-"}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {action.manquement}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="line-clamp-2">{action.action}</div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-sm">
                          {action.conformite?.applicabilite?.actes_reglementaires?.reference}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Art. {action.conformite?.applicabilite?.articles?.numero || "-"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {action.responsable_profile
                        ? `${action.responsable_profile.prenom} ${action.responsable_profile.nom}`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {action.echeance
                        ? new Date(action.echeance).toLocaleDateString("fr-FR")
                        : "-"}
                    </TableCell>
                    <TableCell>{getPrioriteBadge(action.priorite)}</TableCell>
                    <TableCell>{getStatutBadge(action.statut)}</TableCell>
                    <TableCell>
                      {action.cout_estime
                        ? `${action.cout_estime.toLocaleString("fr-FR")} DT`
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {actions && actions.count > pageSize && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {actions.count} action(s) trouvée(s)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={actions.data.length < pageSize}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanAction;
