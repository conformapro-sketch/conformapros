import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchStockDechets, fetchEnlevements } from "@/lib/environnement-queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Plus, Search, FileDown, Upload, Clock } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { STATUT_STOCK_COLORS } from "@/types/environnement";

export default function EnvironnementDechets() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: stocks, isLoading: loadingStocks } = useQuery({
    queryKey: ["env-stocks"],
    queryFn: () => fetchStockDechets(),
  });

  const { data: enlevements, isLoading: loadingEnlevements } = useQuery({
    queryKey: ["env-enlevements"],
    queryFn: () => fetchEnlevements(),
  });

  const getStatutStock = (stock: any): keyof typeof STATUT_STOCK_COLORS => {
    if (!stock.env_zones_stockage?.capacite_max) return "ok";
    const taux = (stock.quantite_actuelle / stock.env_zones_stockage.capacite_max) * 100;
    if (taux >= 80) return "critique";
    if (taux >= 60) return "attention";
    return "ok";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gestion des déchets</h1>
          <p className="text-muted-foreground">
            Flux, stockage, enlèvements et bordereaux
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau flux
        </Button>
      </div>

      <Tabs defaultValue="stock" className="space-y-6">
        <TabsList>
          <TabsTrigger value="stock">Flux & Stockage</TabsTrigger>
          <TabsTrigger value="enlevements">Enlèvements & Bordereaux</TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Stock actuel de déchets</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un flux..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingStocks ? (
                <div className="text-center py-8 text-muted-foreground">
                  Chargement...
                </div>
              ) : !stocks || stocks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Aucun stock de déchets enregistré</p>
                  <p className="text-sm mt-2">Commencez par créer des flux de déchets</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Flux (Code CED)</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead>Zone de stockage</TableHead>
                      <TableHead className="text-right">Quantité</TableHead>
                      <TableHead className="text-right">Capacité max</TableHead>
                      <TableHead className="text-center">Jours en stock</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stocks.map((stock) => {
                      const statut = getStatutStock(stock);
                      return (
                        <TableRow key={stock.id}>
                          <TableCell className="font-medium">
                            <div>
                              <div className="font-semibold">
                                {stock.env_flux_dechets?.libelle}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {stock.env_flux_dechets?.code_ced}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span>{stock.env_flux_dechets?.categorie}</span>
                              {stock.env_flux_dechets?.dangereux && (
                                <Badge variant="destructive" className="text-xs">
                                  Dangereux
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {stock.env_zones_stockage?.nom}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {stock.env_zones_stockage?.type_zone}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {stock.quantite_actuelle} {stock.env_flux_dechets?.unite}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {stock.env_zones_stockage?.capacite_max}{" "}
                            {stock.env_zones_stockage?.unite}
                          </TableCell>
                          <TableCell className="text-center">
                            {stock.jours_en_stock || 0} j
                          </TableCell>
                          <TableCell>
                            <Badge className={STATUT_STOCK_COLORS[statut]}>
                              {statut === "critique" && "Critique"}
                              {statut === "attention" && "À évacuer"}
                              {statut === "ok" && "OK"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="enlevements" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Enlèvements & Bordereaux</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Téléverser bordereau
                  </Button>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvel enlèvement
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingEnlevements ? (
                <div className="text-center py-8 text-muted-foreground">
                  Chargement...
                </div>
              ) : !enlevements || enlevements.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Aucun enlèvement enregistré</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Flux</TableHead>
                      <TableHead>Prestataire</TableHead>
                      <TableHead className="text-right">Quantité</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead>N° Bordereau</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enlevements.map((enlevement) => (
                      <TableRow key={enlevement.id}>
                        <TableCell>
                          {format(new Date(enlevement.date_enlevement), "dd MMM yyyy", {
                            locale: fr,
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {enlevement.env_flux_dechets?.libelle}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {enlevement.env_flux_dechets?.code_ced}
                          </div>
                        </TableCell>
                        <TableCell>
                          {enlevement.prestataire_nom ||
                            enlevement.env_prestataires?.raison_sociale ||
                            "-"}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {enlevement.quantite} {enlevement.unite}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{enlevement.destination}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {enlevement.numero_bordereau || "-"}
                        </TableCell>
                        <TableCell>
                          {enlevement.bordereau_complet ? (
                            <Badge variant="outline" className="bg-green-50">
                              Complet
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-amber-50">
                              <Clock className="h-3 w-3 mr-1" />
                              En attente
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {enlevement.bordereau_url ? (
                            <Button variant="ghost" size="sm" asChild>
                              <a
                                href={enlevement.bordereau_url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <FileDown className="h-4 w-4" />
                              </a>
                            </Button>
                          ) : (
                            <Button variant="ghost" size="sm" disabled>
                              <FileDown className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
