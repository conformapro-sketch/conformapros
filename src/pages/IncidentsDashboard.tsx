import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { useQuery } from "@tanstack/react-query";
import { fetchIncidents, fetchIncidentStats } from "@/lib/incidents-queries";
import { AlertTriangle, TrendingUp, Clock, AlertOctagon, RotateCcw, CheckCircle } from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Badge } from "@/components/ui/badge";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { GRAVITE_INCIDENT_LABELS, STATUT_INCIDENT_LABELS, TYPE_INCIDENT_LABELS } from "@/types/incidents";

export default function IncidentsDashboard() {
  const currentMonthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const currentMonthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");

  const { data: stats } = useQuery({
    queryKey: ["incident-stats", currentMonthStart, currentMonthEnd],
    queryFn: () => fetchIncidentStats(undefined, currentMonthStart, currentMonthEnd),
  });

  const { data: allIncidents = [] } = useQuery({
    queryKey: ["incidents"],
    queryFn: () => fetchIncidents(),
  });

  const { data: currentMonthIncidents = [] } = useQuery({
    queryKey: ["incidents-current-month"],
    queryFn: async () => {
      const incidents = await fetchIncidents();
      return incidents.filter(i => {
        const incidentDate = new Date(i.date_incident);
        return incidentDate >= startOfMonth(new Date()) && incidentDate <= endOfMonth(new Date());
      });
    },
  });

  // KPIs
  const totalCurrentMonth = currentMonthIncidents.length;
  const majeurCount = currentMonthIncidents.filter(i => i.gravite === "majeure").length;
  const closedCount = currentMonthIncidents.filter(i => i.statut === "cloture").length;
  const closureRate = totalCurrentMonth > 0 ? Math.round((closedCount / totalCurrentMonth) * 100) : 0;
  const avgResolutionDays = Math.round(stats?.avgResolutionDays || 0);
  const overdueCount = allIncidents.filter(i => {
    if (i.statut === "cloture") return false;
    const daysSince = Math.floor((new Date().getTime() - new Date(i.date_incident).getTime()) / (1000 * 60 * 60 * 24));
    return daysSince > 30;
  }).length;

  // Données pour graphiques
  const last12Months = eachMonthOfInterval({
    start: subMonths(new Date(), 11),
    end: new Date(),
  });

  const monthlyTrend = last12Months.map(month => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const count = allIncidents.filter(i => {
      const date = new Date(i.date_incident);
      return date >= monthStart && date <= monthEnd;
    }).length;
    return {
      month: format(month, "MMM yy", { locale: fr }),
      incidents: count,
    };
  });

  const typeDistribution = Object.entries(TYPE_INCIDENT_LABELS).map(([key, label]) => ({
    name: label,
    value: allIncidents.filter(i => i.type_incident === key).length,
  })).filter(item => item.value > 0);

  const gravityDistribution = Object.entries(GRAVITE_INCIDENT_LABELS).map(([key, label]) => ({
    name: label,
    value: allIncidents.filter(i => i.gravite === key).length,
  }));

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  const majorIncidents = allIncidents.filter(i => i.gravite === "majeure").slice(0, 5);
  const overdueIncidents = allIncidents.filter(i => {
    if (i.statut === "cloture") return false;
    const daysSince = Math.floor((new Date().getTime() - new Date(i.date_incident).getTime()) / (1000 * 60 * 60 * 24));
    return daysSince > 30;
  }).slice(0, 5);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tableau de bord Incidents HSE</h1>
        <p className="text-muted-foreground mt-1">
          Vue d'ensemble et statistiques des incidents
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Incidents ce mois"
          value={totalCurrentMonth.toString()}
          icon={AlertTriangle}
        />
        <StatCard
          title="Incidents majeurs"
          value={majeurCount.toString()}
          icon={AlertOctagon}
        />
        <StatCard
          title="Taux de clôture"
          value={`${closureRate}%`}
          icon={CheckCircle}
        />
        <StatCard
          title="Délai moyen"
          value={`${avgResolutionDays}j`}
          icon={Clock}
        />
        <StatCard
          title="En retard"
          value={overdueCount.toString()}
          icon={TrendingUp}
        />
        <StatCard
          title="Récurrents"
          value={(stats?.recurrents || 0).toString()}
          icon={RotateCcw}
        />
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendance mensuelle */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Tendance sur 12 mois</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="incidents" stroke="hsl(var(--primary))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Répartition par type */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Répartition par type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={typeDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="hsl(var(--primary))"
                dataKey="value"
              >
                {typeDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Répartition par gravité */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Répartition par gravité</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={gravityDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Alertes */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Alertes prioritaires</h3>
          <div className="space-y-4">
            {majorIncidents.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Incidents majeurs récents</h4>
                <div className="space-y-2">
                  {majorIncidents.map(incident => (
                    <div key={incident.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <div className="flex items-center gap-2">
                        <AlertOctagon className="h-4 w-4 text-destructive" />
                        <span className="text-sm">{incident.numero_incident}</span>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(incident.date_incident), "dd/MM/yyyy", { locale: fr })}
                        </span>
                      </div>
                      <Badge variant="destructive">Majeur</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {overdueIncidents.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Incidents en retard ({">"} 30j)</h4>
                <div className="space-y-2">
                  {overdueIncidents.map(incident => (
                    <div key={incident.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-warning" />
                        <span className="text-sm">{incident.numero_incident}</span>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(incident.date_incident), "dd/MM/yyyy", { locale: fr })}
                        </span>
                      </div>
                      <Badge variant="outline">En retard</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {majorIncidents.length === 0 && overdueIncidents.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Aucune alerte en cours
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
