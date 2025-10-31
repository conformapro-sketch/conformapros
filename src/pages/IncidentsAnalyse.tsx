import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { fetchIncidents } from "@/lib/incidents-queries";
import { Calendar, Download, Filter } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TYPE_INCIDENT_LABELS, GRAVITE_INCIDENT_LABELS } from "@/types/incidents";
import { format, getHours, getDay } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

export default function IncidentsAnalyse() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [siteFilter, setSiteFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");

  const { data: allIncidents = [] } = useQuery({
    queryKey: ["incidents"],
    queryFn: () => fetchIncidents(),
  });

  // Filtrage
  const filteredIncidents = allIncidents.filter(incident => {
    if (startDate && new Date(incident.date_incident) < new Date(startDate)) return false;
    if (endDate && new Date(incident.date_incident) > new Date(endDate)) return false;
    if (siteFilter && incident.site_id !== siteFilter) return false;
    if (typeFilter && incident.type_incident !== typeFilter) return false;
    return true;
  });

  // Analyse des causes
  const factorAnalysis = [
    { name: "Facteur humain", value: filteredIncidents.filter(i => i.facteur_humain).length },
    { name: "Facteur matériel", value: filteredIncidents.filter(i => i.facteur_materiel).length },
    { name: "Facteur organisationnel", value: filteredIncidents.filter(i => i.facteur_organisationnel).length },
    { name: "Facteur environnemental", value: filteredIncidents.filter(i => i.facteur_environnemental).length },
  ];

  // Analyse temporelle - Distribution horaire
  const hourlyDistribution = Array.from({ length: 24 }, (_, i) => {
    const count = filteredIncidents.filter(incident => {
      if (!incident.heure_incident) return false;
      const hour = parseInt(incident.heure_incident.split(':')[0]);
      return hour === i;
    }).length;
    return { hour: `${i}h`, count };
  }).filter(item => item.count > 0);

  // Distribution hebdomadaire
  const weekdayLabels = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  const weeklyDistribution = Array.from({ length: 7 }, (_, i) => {
    const count = filteredIncidents.filter(incident => {
      const day = getDay(new Date(incident.date_incident));
      return day === i;
    }).length;
    return { day: weekdayLabels[i], count };
  });

  // Analyse des conséquences
  const arretTravailCount = filteredIncidents.filter(i => i.arret_travail).length;
  const hospitalisationCount = filteredIncidents.filter(i => i.hospitalisation).length;
  const avgJoursArret = filteredIncidents
    .filter(i => i.jours_arret)
    .reduce((sum, i) => sum + (i.jours_arret || 0), 0) / (filteredIncidents.filter(i => i.jours_arret).length || 1);

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

  const handleExportPDF = () => {
    toast.info("Export PDF en cours de développement");
  };

  const handleExportExcel = () => {
    toast.info("Export Excel en cours de développement");
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analyse & Statistiques</h1>
          <p className="text-muted-foreground mt-1">
            Analyses approfondies des incidents HSE
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={handleExportExcel}>
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Filtres avancés */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Filtres avancés</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label>Date début</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <Label>Date fin</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div>
            <Label>Type d'incident</Label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {Object.entries(TYPE_INCIDENT_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button variant="outline" onClick={() => {
              setStartDate("");
              setEndDate("");
              setSiteFilter("");
              setTypeFilter("");
            }}>
              Réinitialiser
            </Button>
          </div>
        </div>
        <div className="mt-4 text-sm text-muted-foreground">
          {filteredIncidents.length} incident(s) trouvé(s)
        </div>
      </Card>

      {/* Analyse des causes racines */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Analyse des causes racines</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={factorAnalysis}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={factorAnalysis}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="hsl(var(--primary))"
                dataKey="value"
              >
                {factorAnalysis.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Analyse temporelle */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Distribution horaire</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hourlyDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--chart-2))" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Distribution hebdomadaire</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--chart-3))" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Analyse des conséquences */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Analyse des conséquences</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-muted/50 rounded-lg">
            <div className="text-3xl font-bold">{arretTravailCount}</div>
            <div className="text-sm text-muted-foreground mt-2">Arrêts de travail</div>
            <div className="text-xs text-muted-foreground mt-1">
              {filteredIncidents.length > 0 ? `${((arretTravailCount / filteredIncidents.length) * 100).toFixed(1)}%` : "0%"}
            </div>
          </div>
          <div className="text-center p-6 bg-muted/50 rounded-lg">
            <div className="text-3xl font-bold">{hospitalisationCount}</div>
            <div className="text-sm text-muted-foreground mt-2">Hospitalisations</div>
            <div className="text-xs text-muted-foreground mt-1">
              {filteredIncidents.length > 0 ? `${((hospitalisationCount / filteredIncidents.length) * 100).toFixed(1)}%` : "0%"}
            </div>
          </div>
          <div className="text-center p-6 bg-muted/50 rounded-lg">
            <div className="text-3xl font-bold">{avgJoursArret.toFixed(1)}</div>
            <div className="text-sm text-muted-foreground mt-2">Jours d'arrêt moyen</div>
            <div className="text-xs text-muted-foreground mt-1">
              Par incident avec arrêt
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
