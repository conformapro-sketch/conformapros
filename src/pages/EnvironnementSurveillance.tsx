import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMesures, fetchPointsMesure } from "@/lib/environnement-queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Upload, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CONFORMITE_COLORS } from "@/types/environnement";

export default function EnvironnementSurveillance() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPoint, setSelectedPoint] = useState<string>("all");

  const { data: points } = useQuery({
    queryKey: ["env-points-mesure"],
    queryFn: () => fetchPointsMesure(),
  });

  const { data: mesures, isLoading } = useQuery({
    queryKey: ["env-mesures", selectedPoint !== "all" ? selectedPoint : undefined],
    queryFn: () => fetchMesures(selectedPoint !== "all" ? selectedPoint : undefined),
  });

  const filteredMesures = mesures?.filter((m) =>
    m.env_points_mesure?.libelle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.env_parametres_limites?.parametre.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Surveillance environnementale</h1>
          <p className="text-muted-foreground">
            Mesures eaux, air, bruit et rejets
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Importer résultats labo
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle mesure
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher point ou paramètre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={selectedPoint} onValueChange={setSelectedPoint}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue placeholder="Point de mesure" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les points</SelectItem>
                {points?.map((point) => (
                  <SelectItem key={point.id} value={point.id}>
                    {point.code} - {point.libelle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Chargement...
            </div>
          ) : filteredMesures.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Aucune mesure enregistrée</p>
              <p className="text-sm mt-2">
                Commencez par créer des points de mesure et saisir vos données
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Point de mesure</TableHead>
                  <TableHead>Paramètre</TableHead>
                  <TableHead className="text-right">Valeur</TableHead>
                  <TableHead className="text-right">Limite</TableHead>
                  <TableHead>Laboratoire</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMesures.map((mesure) => (
                  <TableRow key={mesure.id}>
                    <TableCell>
                      {format(new Date(mesure.date_mesure), "dd MMM yyyy", {
                        locale: fr,
                      })}
                      {mesure.heure_mesure && (
                        <div className="text-sm text-muted-foreground">
                          {mesure.heure_mesure}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {mesure.env_points_mesure?.libelle}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {mesure.env_points_mesure?.code} •{" "}
                          {mesure.env_points_mesure?.type_point}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {mesure.env_parametres_limites?.parametre}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {mesure.valeur} {mesure.unite}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {mesure.env_parametres_limites?.limite_min && (
                        <span>≥ {mesure.env_parametres_limites.limite_min} </span>
                      )}
                      {mesure.env_parametres_limites?.limite_max && (
                        <span>≤ {mesure.env_parametres_limites.limite_max} </span>
                      )}
                      {mesure.unite}
                    </TableCell>
                    <TableCell className="text-sm">
                      {mesure.laboratoire_nom || "-"}
                    </TableCell>
                    <TableCell>
                      {mesure.conforme !== null && mesure.conforme !== undefined ? (
                        <Badge
                          className={
                            mesure.conforme
                              ? CONFORMITE_COLORS.conforme
                              : CONFORMITE_COLORS.non_conforme
                          }
                        >
                          {mesure.conforme ? "Conforme" : "Non conforme"}
                        </Badge>
                      ) : (
                        <Badge className={CONFORMITE_COLORS.a_verifier}>
                          À vérifier
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <TrendingUp className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
