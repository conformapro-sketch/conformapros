import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchPointsMesure } from "@/lib/environnement-queries";
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
import { Plus, Search, MapPin, Activity } from "lucide-react";
import { TYPES_POINTS_MESURE } from "@/types/environnement";

export default function EnvironnementPointsLimites() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");

  const { data: points, isLoading } = useQuery({
    queryKey: ["env-points-mesure"],
    queryFn: () => fetchPointsMesure(),
  });

  const filteredPoints = points?.filter((p) => {
    const matchesSearch =
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.libelle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "all" || p.type_point === selectedType;
    return matchesSearch && matchesType;
  }) || [];

  const getTypeColor = (type: string) => {
    switch (type) {
      case "eau":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "air":
        return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300";
      case "bruit":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "sol":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300";
      case "rejets":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Points de mesure & Limites</h1>
          <p className="text-muted-foreground">
            Cartographie de conformité environnementale
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau point de mesure
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un point..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Type de point" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {TYPES_POINTS_MESURE.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
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
          ) : filteredPoints.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun point de mesure enregistré</p>
              <p className="text-sm mt-2">
                Créez vos premiers points de surveillance environnementale
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Localisation</TableHead>
                  <TableHead>Fréquence</TableHead>
                  <TableHead className="text-center">Paramètres</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPoints.map((point) => (
                  <TableRow key={point.id}>
                    <TableCell className="font-mono font-semibold">
                      {point.code}
                    </TableCell>
                    <TableCell className="font-medium">{point.libelle}</TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(point.type_point)}>
                        {point.type_point}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {point.sites?.nom_site}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {point.localisation || "-"}
                    </TableCell>
                    <TableCell>
                      {point.frequence_controle ? (
                        <Badge variant="outline">{point.frequence_controle}</Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="sm">
                        <Activity className="h-4 w-4 mr-1" />
                        Voir limites
                      </Button>
                    </TableCell>
                    <TableCell>
                      {point.actif ? (
                        <Badge variant="outline" className="bg-green-50">
                          Actif
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-50">
                          Inactif
                        </Badge>
                      )}
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
