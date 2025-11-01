import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, FileText, Download, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { supabaseAny as supabase } from "@/lib/supabase-any";
import { fetchSites } from "@/lib/multi-tenant-queries";
import { fetchTypesEquipement } from "@/lib/controles-queries";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

const RESULTAT_LABELS = {
  conforme: { label: "Conforme", icon: CheckCircle, color: "bg-green-500" },
  non_conforme: { label: "Non conforme", icon: XCircle, color: "bg-red-500" },
  conforme_avec_reserves: { label: "Conforme avec réserves", icon: AlertCircle, color: "bg-orange-500" },
  en_attente: { label: "En attente", icon: AlertCircle, color: "bg-yellow-500" },
};

export default function ControlesHistorique() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSite, setFilterSite] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterResultat, setFilterResultat] = useState<string>("all");

  const { data: historique, isLoading } = useQuery({
    queryKey: ["historique_all_controles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("historique_controles")
        .select(`
          *,
          equipement:equipements_controle(
            code_identification,
            site_id,
            type_equipement_id,
            site:sites(nom_site),
            type_equipement:types_equipement(libelle)
          ),
          organisme:organismes_controle(nom),
          created_by_profile:profiles(nom, prenom)
        `)
        .order("date_controle", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: sites } = useQuery({
    queryKey: ["sites"],
    queryFn: fetchSites,
  });

  const { data: types } = useQuery({
    queryKey: ["types_equipement"],
    queryFn: fetchTypesEquipement,
  });

  const filteredHistorique = historique?.filter((ctrl) => {
    const matchesSearch = ctrl.equipement?.code_identification?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSite = filterSite === "all" || ctrl.equipement?.site_id === filterSite;
    const matchesType = filterType === "all" || ctrl.equipement?.type_equipement_id === filterType;
    const matchesResultat = filterResultat === "all" || ctrl.resultat === filterResultat;
    return matchesSearch && matchesSite && matchesType && matchesResultat;
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Historique des Contrôles</h1>
          <p className="text-muted-foreground">Traçabilité complète des contrôles effectués</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exporter
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Rechercher un équipement..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="pl-10" 
              />
            </div>
            <Select value={filterSite} onValueChange={setFilterSite}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Site" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les sites</SelectItem>
                {sites?.map((site) => (
                  <SelectItem key={site.id} value={site.id}>{site.nom_site}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {types?.map((type) => (
                  <SelectItem key={type.id} value={type.id}>{type.libelle}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterResultat} onValueChange={setFilterResultat}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Résultat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les résultats</SelectItem>
                <SelectItem value="conforme">Conforme</SelectItem>
                <SelectItem value="non_conforme">Non conforme</SelectItem>
                <SelectItem value="conforme_avec_reserves">Avec réserves</SelectItem>
                <SelectItem value="en_attente">En attente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Contrôles</CardDescription>
            <CardTitle className="text-3xl">{filteredHistorique?.length || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="pb-2">
            <CardDescription>Conformes</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {filteredHistorique?.filter(c => c.resultat === "conforme").length || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader className="pb-2">
            <CardDescription>Non Conformes</CardDescription>
            <CardTitle className="text-3xl text-red-600">
              {filteredHistorique?.filter(c => c.resultat === "non_conforme").length || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader className="pb-2">
            <CardDescription>Avec Réserves</CardDescription>
            <CardTitle className="text-3xl text-orange-600">
              {filteredHistorique?.filter(c => c.resultat === "conforme_avec_reserves").length || 0}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Contrôles effectués</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Chargement...</div>
          ) : filteredHistorique && filteredHistorique.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Équipement</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Organisme</TableHead>
                  <TableHead>Résultat</TableHead>
                  <TableHead>Certificat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistorique.map((ctrl: any) => {
                  const resultatInfo = RESULTAT_LABELS[ctrl.resultat as keyof typeof RESULTAT_LABELS];
                  const ResultatIcon = resultatInfo?.icon;
                  return (
                    <TableRow key={ctrl.id}>
                      <TableCell>
                        {format(new Date(ctrl.date_controle), "dd/MM/yyyy", { locale: fr })}
                      </TableCell>
                      <TableCell className="font-medium">
                        {ctrl.equipement?.code_identification || "-"}
                      </TableCell>
                      <TableCell>{ctrl.equipement?.type_equipement?.libelle || "-"}</TableCell>
                      <TableCell>{ctrl.equipement?.site?.nom_site || "-"}</TableCell>
                      <TableCell>{ctrl.organisme?.nom || "-"}</TableCell>
                      <TableCell>
                        <Badge className={`${resultatInfo?.color} text-white gap-1`}>
                          {ResultatIcon && <ResultatIcon className="h-3 w-3" />}
                          {resultatInfo?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {ctrl.certificat_numero ? (
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{ctrl.certificat_numero}</span>
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Aucun contrôle trouvé
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
