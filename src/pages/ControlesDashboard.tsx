import { useQuery } from "@tanstack/react-query";
import { AlertCircle, CheckCircle, Clock, FileText, TrendingUp, Calendar as CalendarIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { fetchEquipementStats, fetchUpcomingControls } from "@/lib/controles-queries";
import { useNavigate } from "react-router-dom";

const STATUT_CONFORMITE_LABELS = {
  conforme: { label: "Conforme", color: "bg-green-500", icon: CheckCircle },
  non_conforme: { label: "Non conforme", color: "bg-red-500", icon: AlertCircle },
  a_controler: { label: "À contrôler", color: "bg-yellow-500", icon: Clock },
};

export default function ControlesDashboard() {
  const navigate = useNavigate();

  const { data: stats } = useQuery({
    queryKey: ["equipement_stats"],
    queryFn: fetchEquipementStats,
  });

  const { data: upcomingControls } = useQuery({
    queryKey: ["upcoming_controls"],
    queryFn: () => fetchUpcomingControls(10),
  });

  const getUrgencyBadge = (prochaine_echeance: string | null) => {
    if (!prochaine_echeance) return null;
    const daysUntil = differenceInDays(new Date(prochaine_echeance), new Date());
    if (daysUntil < 0) return <Badge variant="destructive">Retard: {Math.abs(daysUntil)}j</Badge>;
    if (daysUntil <= 30) return <Badge className="bg-orange-500 text-white">Dans {daysUntil}j</Badge>;
    return null;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tableau de bord - Contrôles Techniques</h1>
          <p className="text-muted-foreground">Vue d'ensemble des contrôles réglementaires</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Équipements</CardDescription>
            <CardTitle className="text-3xl">{stats?.total || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="pb-2">
            <CardDescription>Conformes</CardDescription>
            <CardTitle className="text-3xl text-green-600 flex items-center gap-2">
              <CheckCircle className="h-6 w-6" />
              {stats?.conforme || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader className="pb-2">
            <CardDescription>Non Conformes</CardDescription>
            <CardTitle className="text-3xl text-red-600 flex items-center gap-2">
              <AlertCircle className="h-6 w-6" />
              {stats?.nonConforme || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader className="pb-2">
            <CardDescription>En Retard</CardDescription>
            <CardTitle className="text-3xl text-orange-600">{stats?.enRetard || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardHeader className="pb-2">
            <CardDescription>Proche Échéance</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">{stats?.procheEcheance || 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/controles/equipements")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Équipements
            </CardTitle>
            <CardDescription>Gérer les équipements soumis à contrôle</CardDescription>
          </CardHeader>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/controles/planning")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Planning
            </CardTitle>
            <CardDescription>Visualiser le calendrier des contrôles</CardDescription>
          </CardHeader>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/controles/historique")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Historique
            </CardTitle>
            <CardDescription>Consulter l'historique complet</CardDescription>
          </CardHeader>
        </Card>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Analyses
            </CardTitle>
            <CardDescription>Statistiques et tendances</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Upcoming Controls */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Contrôles à venir</CardTitle>
              <CardDescription>Prochaines échéances de contrôle</CardDescription>
            </div>
            <Button variant="outline" onClick={() => navigate("/controles/planning")}>
              Voir le planning complet
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {upcomingControls && upcomingControls.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Prochaine Échéance</TableHead>
                  <TableHead>Urgence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingControls.map((eq: any) => (
                  <TableRow key={eq.id}>
                    <TableCell className="font-medium">{eq.code_identification}</TableCell>
                    <TableCell>{eq.type_equipement?.libelle}</TableCell>
                    <TableCell>{eq.site?.nom_site}</TableCell>
                    <TableCell>
                      {eq.prochaine_echeance
                        ? format(new Date(eq.prochaine_echeance), "dd/MM/yyyy", { locale: fr })
                        : "-"}
                    </TableCell>
                    <TableCell>{getUrgencyBadge(eq.prochaine_echeance)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Aucun contrôle à venir dans les 30 prochains jours
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
