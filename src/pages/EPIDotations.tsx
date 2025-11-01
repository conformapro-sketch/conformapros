import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Search, UserCircle } from "lucide-react";
import { format } from "date-fns";

export default function EPIDotations() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: employes = [] } = useQuery({
    queryKey: ["employes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employes")
        .select("*")
        .order("nom");
      if (error) throw error;
      return data;
    },
  });

  const { data: dotations = [] } = useQuery({
    queryKey: ["epi-dotations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("epi_articles")
        .select(`
          *,
          employe:employes(id, nom, prenom, matricule),
          type:epi_types(id, libelle, categorie)
        `)
        .eq("statut", "attribue")
        .order("date_attribution", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Grouper les dotations par employé
  const dotationsParEmploye = employes.map((employe: any) => {
    const episEmploye = dotations.filter((d: any) => d.employe_id === employe.id);
    return {
      ...employe,
      epis: episEmploye,
      nombreEPIs: episEmploye.length,
    };
  });

  const filteredEmployes = dotationsParEmploye.filter((emp: any) =>
    `${emp.nom} ${emp.prenom} ${emp.matricule}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dotations EPI par employé</h1>
          <p className="text-muted-foreground mt-1">
            Suivi des équipements de protection attribués à chaque employé
          </p>
        </div>

        {/* Barre de recherche */}
        <Card>
          <CardHeader>
            <CardTitle>Rechercher un employé</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, prénom ou matricule..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Liste des employés et leurs dotations */}
        <div className="space-y-4">
          {filteredEmployes.map((employe: any) => (
            <Card key={employe.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <UserCircle className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-lg">
                        {employe.nom} {employe.prenom}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Matricule: {employe.matricule} • {employe.poste || "Non défini"}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">{employe.nombreEPIs} EPI(s)</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {employe.epis.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code article</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Catégorie</TableHead>
                        <TableHead>Taille</TableHead>
                        <TableHead>Date attribution</TableHead>
                        <TableHead>Observations</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employe.epis.map((epi: any) => (
                        <TableRow key={epi.id}>
                          <TableCell className="font-medium">{epi.code_article}</TableCell>
                          <TableCell>{epi.type?.libelle}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{epi.type?.categorie}</Badge>
                          </TableCell>
                          <TableCell>{epi.taille || "-"}</TableCell>
                          <TableCell>
                            {epi.date_attribution
                              ? format(new Date(epi.date_attribution), "dd/MM/yyyy")
                              : "-"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {epi.observations || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Aucun EPI attribué à cet employé
                  </p>
                )}
              </CardContent>
            </Card>
          ))}

          {filteredEmployes.length === 0 && (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">
                  Aucun employé trouvé avec ces critères de recherche
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
  );
}
