import { useQuery } from "@tanstack/react-query";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Stethoscope, AlertCircle, Calendar, CheckCircle2, TrendingUp, Users } from "lucide-react";
import { useState } from "react";
import { MedicalVisitFormDrawer } from "@/components/MedicalVisitFormDrawer";
import { fetchMedicalVisitsStats, fetchUpcomingVisits } from "@/lib/medical-queries";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const STATUT_COLORS = {
  PLANIFIEE: "#3b82f6",
  REALISEE: "#22c55e",
  REPORTEE: "#64748b",
  ANNULEE: "#ef4444",
  NO_SHOW: "#ef4444",
};

const APTITUDE_COLORS = {
  APTE: "#22c55e",
  APTE_RESTRICTIONS: "#f59e0b",
  INAPTE_TEMP: "#ef4444",
  INAPTE_DEFINITIVE: "#ef4444",
  EN_ATTENTE: "#64748b",
};

const STATUT_LABELS = {
  PLANIFIEE: "Planifiée",
  REALISEE: "Réalisée",
  REPORTEE: "Reportée",
  ANNULEE: "Annulée",
  NO_SHOW: "Absent",
};

const TYPE_LABELS = {
  EMBAUCHE: "Embauche",
  PERIODIQUE: "Périodique",
  REPRISE: "Reprise",
  CHANGEMENT_POSTE: "Changement de poste",
  SMS: "SMS",
};

export default function VisitesMedicalesDashboard() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const navigate = useNavigate();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["medical-visits-stats"],
    queryFn: fetchMedicalVisitsStats,
    staleTime: 5 * 60 * 1000,
  });

  const { data: upcomingVisits, isLoading: upcomingLoading } = useQuery({
    queryKey: ["medical-upcoming-visits"],
    queryFn: () => fetchUpcomingVisits(10),
    staleTime: 5 * 60 * 1000,
  });

  const { data: employees } = useQuery({
    queryKey: ["employees-list"],
    queryFn: async () => {
      const { data } = await supabase
        .from("employes")
        .select("*, clients(nom), sites(nom)")
        .eq("statut_emploi", "actif")
        .order("nom");
      return data || [];
    },
  });

  const { data: dashboardStats } = useQuery({
    queryKey: ["medical-dashboard-stats"],
    queryFn: async () => {
      const { data: visits } = await supabase
        .from("med_visites")
        .select("*");

      if (!visits) return null;

      const statsByStatus = visits.reduce((acc, v) => {
        acc[v.statut_visite] = (acc[v.statut_visite] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const statsByType = visits.reduce((acc, v) => {
        acc[v.type_visite] = (acc[v.type_visite] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const statsByAptitude = visits.reduce((acc, v) => {
        const apt = v.resultat_aptitude || "EN_ATTENTE";
        acc[apt] = (acc[apt] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const statsByMedecin = visits
        .filter((v) => v.medecin_nom)
        .reduce((acc, v) => {
          acc[v.medecin_nom!] = (acc[v.medecin_nom!] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

      return {
        statsByStatus,
        statsByType,
        statsByAptitude,
        statsByMedecin,
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  const statusChartData = dashboardStats?.statsByStatus
    ? Object.entries(dashboardStats.statsByStatus).map(([key, value]) => ({
        name: STATUT_LABELS[key as keyof typeof STATUT_LABELS] || key,
        value,
        color: STATUT_COLORS[key as keyof typeof STATUT_COLORS],
      }))
    : [];

  const aptitudeChartData = dashboardStats?.statsByAptitude
    ? Object.entries(dashboardStats.statsByAptitude).map(([key, value]) => ({
        name: key.replace(/_/g, " "),
        value,
        color: APTITUDE_COLORS[key as keyof typeof APTITUDE_COLORS],
      }))
    : [];

  const typeChartData = dashboardStats?.statsByType
    ? Object.entries(dashboardStats.statsByType).map(([key, value]) => ({
        name: TYPE_LABELS[key as keyof typeof TYPE_LABELS] || key,
        value,
      }))
    : [];

  const medecinData = dashboardStats?.statsByMedecin
    ? Object.entries(dashboardStats.statsByMedecin)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
    : [];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="text-muted-foreground">Visites médicales</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Stethoscope className="mr-2 h-4 w-4" />
          Nouvelle visite
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total visites"
          value={stats?.total || 0}
          icon={Stethoscope}
          variant="default"
        />
        <StatCard
          title="En retard"
          value={stats?.enRetard || 0}
          icon={AlertCircle}
          variant="destructive"
        />
        <StatCard
          title="À venir (30j)"
          value={stats?.procheEcheance || 0}
          icon={Calendar}
          variant="warning"
        />
        <StatCard
          title="Visites réalisées"
          value={stats?.realisees || 0}
          icon={CheckCircle2}
          variant="success"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Répartition par statut
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Aptitude Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Résultats d'aptitude
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={aptitudeChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8">
                  {aptitudeChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Visit Types */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Types de visites
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={typeChartData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={120} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Doctor Workload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Charge par médecin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {medecinData.length > 0 ? (
                medecinData.map(([medecin, count]) => (
                  <div
                    key={medecin}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm">{medecin}</span>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Aucune donnée disponible
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Visits */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Prochaines visites planifiées</CardTitle>
          <Button variant="outline" onClick={() => navigate("/visites-medicales")}>
            Voir tout
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employé</TableHead>
                <TableHead>Type de visite</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Médecin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upcomingVisits && upcomingVisits.length > 0 ? (
                upcomingVisits.map((visit) => (
                  <TableRow key={visit.id}>
                    <TableCell>
                      {visit.employes
                        ? `${visit.employes.prenom} ${visit.employes.nom}`
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {TYPE_LABELS[visit.type_visite as keyof typeof TYPE_LABELS] ||
                          visit.type_visite}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {visit.date_prevue
                        ? format(new Date(visit.date_prevue), "dd MMM yyyy", {
                            locale: fr,
                          })
                        : "N/A"}
                    </TableCell>
                    <TableCell>{visit.medecin_nom || "Non assigné"}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Aucune visite planifiée
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <MedicalVisitFormDrawer
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        visitId={null}
        employees={employees || []}
      />
    </div>
  );
}
