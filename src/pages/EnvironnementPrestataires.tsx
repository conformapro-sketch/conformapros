import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchPrestataires } from "@/lib/environnement-queries";
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
import { Plus, Search, Building2, FileCheck, AlertTriangle } from "lucide-react";
import { TYPES_PRESTATAIRES } from "@/types/environnement";
import { format, isBefore, addMonths } from "date-fns";
import { fr } from "date-fns/locale";

export default function EnvironnementPrestataires() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");

  const { data: prestataires, isLoading } = useQuery({
    queryKey: ["env-prestataires", selectedType !== "all" ? selectedType : undefined],
    queryFn: () => fetchPrestataires(selectedType !== "all" ? selectedType : undefined),
  });

  const filteredPrestataires = prestataires?.filter((p) =>
    p.raison_sociale.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.siret?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getStatutDocument = (dateValidite?: string) => {
    if (!dateValidite) return null;
    
    const validite = new Date(dateValidite);
    const today = new Date();
    const alertDate = addMonths(today, 2); // Alerte 2 mois avant expiration
    
    if (isBefore(validite, today)) {
      return { label: "Expiré", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300", icon: AlertTriangle };
    } else if (isBefore(validite, alertDate)) {
      return { label: "Expire bientôt", color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300", icon: AlertTriangle };
    }
    return { label: "Valide", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300", icon: FileCheck };
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "collecteur":
        return "Collecteur de déchets";
      case "laboratoire":
        return "Laboratoire d'analyse";
      case "transporteur":
        return "Transporteur";
      default:
        return type;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Prestataires & Laboratoires</h1>
          <p className="text-muted-foreground">
            Collecteurs de déchets et laboratoires d'analyse
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau prestataire
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un prestataire..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {TYPES_PRESTATAIRES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {getTypeLabel(type)}
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
          ) : filteredPrestataires.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun prestataire enregistré</p>
              <p className="text-sm mt-2">
                Ajoutez vos collecteurs de déchets et laboratoires d'analyse
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Raison sociale</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Agrément</TableHead>
                  <TableHead>Validité</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPrestataires.map((prestataire) => {
                  const statutDoc = getStatutDocument(prestataire.agrement_date_validite);
                  const Icon = statutDoc?.icon;
                  
                  return (
                    <TableRow key={prestataire.id}>
                      <TableCell>
                        <div>
                          <div className="font-semibold">{prestataire.raison_sociale}</div>
                          {prestataire.siret && (
                            <div className="text-sm text-muted-foreground font-mono">
                              SIRET: {prestataire.siret}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{getTypeLabel(prestataire.type_prestataire)}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {prestataire.contact_principal && (
                            <div className="font-medium">{prestataire.contact_principal}</div>
                          )}
                          {prestataire.telephone && (
                            <div className="text-muted-foreground">{prestataire.telephone}</div>
                          )}
                          {prestataire.email && (
                            <div className="text-muted-foreground">{prestataire.email}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {prestataire.agrement_numero || "-"}
                      </TableCell>
                      <TableCell>
                        {prestataire.agrement_date_validite ? (
                          <div className="text-sm">
                            {format(new Date(prestataire.agrement_date_validite), "dd MMM yyyy", {
                              locale: fr,
                            })}
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {statutDoc ? (
                          <Badge className={statutDoc.color}>
                            {Icon && <Icon className="h-3 w-3 mr-1" />}
                            {statutDoc.label}
                          </Badge>
                        ) : prestataire.actif ? (
                          <Badge variant="outline" className="bg-green-50">Actif</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-50">Inactif</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          Détails
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
