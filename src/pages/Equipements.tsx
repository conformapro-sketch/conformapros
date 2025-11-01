import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Search, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import EquipementFormModal from "@/components/EquipementFormModal";

const STATUT_LABELS: Record<string, { label: string; variant: any }> = {
  en_service: { label: "En service", variant: "default" },
  hors_service: { label: "Hors service", variant: "destructive" },
  en_maintenance: { label: "En maintenance", variant: "secondary" },
};

export default function Equipements() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEquipement, setSelectedEquipement] = useState<any>(null);

  const { data: equipements = [] } = useQuery({
    queryKey: ["equipements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipements")
        .select(`
          *,
          site:sites(id, nom_site),
          prestataire:prestataires(id, nom)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Statistiques
  const stats = {
    total: equipements.length,
    enService: equipements.filter((e: any) => e.statut === "en_service").length,
    horsService: equipements.filter((e: any) => e.statut === "hors_service").length,
    enMaintenance: equipements.filter((e: any) => e.statut === "en_maintenance").length,
    aControler: equipements.filter((e: any) => {
      if (!e.prochaine_verification) return false;
      const diff = new Date(e.prochaine_verification).getTime() - new Date().getTime();
      return diff < 30 * 24 * 60 * 60 * 1000; // 30 jours
    }).length,
  };

  const filteredEquipements = equipements.filter((eq: any) =>
    `${eq.nom} ${eq.type_equipement} ${eq.numero_serie}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion des équipements</h1>
          <p className="text-muted-foreground mt-1">
            Inventaire et suivi des équipements réglementaires
          </p>
        </div>
        <Button onClick={() => { setSelectedEquipement(null); setIsModalOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvel équipement
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En service</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.enService}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hors service</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.horsService}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.enMaintenance}</div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">À contrôler</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.aControler}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recherche */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un équipement..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Liste des équipements */}
      <Card>
        <CardHeader>
          <CardTitle>Inventaire des équipements ({filteredEquipements.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>N° Série</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Dernière vérification</TableHead>
                <TableHead>Prochaine vérification</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEquipements.map((eq: any) => {
                const isAControler = eq.prochaine_verification &&
                  new Date(eq.prochaine_verification).getTime() - new Date().getTime() < 30 * 24 * 60 * 60 * 1000;
                
                return (
                  <TableRow key={eq.id}>
                    <TableCell className="font-medium">{eq.nom}</TableCell>
                    <TableCell>{eq.type_equipement}</TableCell>
                    <TableCell>{eq.site?.nom_site}</TableCell>
                    <TableCell>{eq.numero_serie || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={STATUT_LABELS[eq.statut]?.variant}>
                        {STATUT_LABELS[eq.statut]?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {eq.derniere_verification
                        ? format(new Date(eq.derniere_verification), "dd/MM/yyyy")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {eq.prochaine_verification ? (
                        <div className={isAControler ? "text-orange-600 font-semibold" : ""}>
                          {format(new Date(eq.prochaine_verification), "dd/MM/yyyy")}
                          {isAControler && <AlertCircle className="inline h-4 w-4 ml-1" />}
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setSelectedEquipement(eq); setIsModalOpen(true); }}
                      >
                        Modifier
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {filteredEquipements.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun équipement trouvé
            </div>
          )}
        </CardContent>
      </Card>

      <EquipementFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        equipement={selectedEquipement}
      />
    </div>
  );
}
