import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabaseAny as supabase } from "@/lib/supabase-any";
import { fetchSites } from "@/lib/multi-tenant-queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import {
  Target,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  ClipboardCheck,
  TrendingUp,
  ArrowRight,
  Activity,
} from "lucide-react";

interface SiteStats {
  siteId: string;
  siteName: string;
  totalArticles: number;
  applicable: number;
  nonApplicable: number;
  evaluated: number;
  nonEvaluated: number;
  conforme: number;
  partiel: number;
  nonConforme: number;
  enCours: number;
  actionsTotal: number;
  actionsTerminees: number;
  actionsEnCours: number;
  actionsEnRetard: number;
  evaluationProgress: number;
  conformiteRate: number;
}

const COLORS = {
  conforme: "hsl(var(--success))",
  nonConforme: "hsl(var(--destructive))",
  partiel: "hsl(var(--warning))",
  enCours: "hsl(var(--muted-foreground))",
};

export default function VeilleDashboard() {
  const navigate = useNavigate();
  const [selectedSite, setSelectedSite] = useState<string>("all");

  // Fetch sites
  const { data: sites = [] } = useQuery({
    queryKey: ["sites"],
    queryFn: fetchSites,
  });

  // Fetch dashboard stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ["veille-dashboard-stats", selectedSite],
    queryFn: async () => {
      // Fetch all site_article_status records
      let statusQuery = supabase
        .from("site_article_status")
        .select(`
          id,
          site_id,
          article_id,
          applicabilite,
          etat_conformite,
          sites (id, nom_site),
          site_article_actions:actions_correctives (
            id,
            statut,
            date_echeance
          )
        `);

      if (selectedSite !== "all") {
        statusQuery = statusQuery.eq("site_id", selectedSite);
      }

      const { data: statusRecords, error } = await statusQuery;
      if (error) throw error;

      // Group by site
      const siteStatsMap: Record<string, SiteStats> = {};

      statusRecords?.forEach((record) => {
        const siteId = record.site_id;
        const siteName = (record.sites as any)?.nom_site || "Site inconnu";

        if (!siteStatsMap[siteId]) {
          siteStatsMap[siteId] = {
            siteId,
            siteName,
            totalArticles: 0,
            applicable: 0,
            nonApplicable: 0,
            evaluated: 0,
            nonEvaluated: 0,
            conforme: 0,
            partiel: 0,
            nonConforme: 0,
            enCours: 0,
            actionsTotal: 0,
            actionsTerminees: 0,
            actionsEnCours: 0,
            actionsEnRetard: 0,
            evaluationProgress: 0,
            conformiteRate: 0,
          };
        }

        const stats = siteStatsMap[siteId];
        stats.totalArticles++;

        if (record.applicabilite === "obligatoire") {
          stats.applicable++;
          
          if (record.etat_conformite && record.etat_conformite !== "en_attente") {
            stats.evaluated++;

            switch (record.etat_conformite) {
              case "conforme":
                stats.conforme++;
                break;
              case "non_conforme":
                stats.nonConforme++;
                break;
              case "partiel":
                stats.partiel++;
                break;
              case "en_cours":
                stats.enCours++;
                break;
            }
          } else {
            stats.nonEvaluated++;
          }
        } else {
          stats.nonApplicable++;
        }

        // Count actions
        const actions = record.site_article_actions || [];
        stats.actionsTotal += actions.length;
        actions.forEach((action: any) => {
          if (action.statut === "Terminee") {
            stats.actionsTerminees++;
          } else if (action.statut === "En_cours") {
            stats.actionsEnCours++;
          } else if (action.date_echeance && new Date(action.date_echeance) < new Date()) {
            stats.actionsEnRetard++;
          }
        });
      });

      // Calculate percentages
      Object.values(siteStatsMap).forEach((stats) => {
        if (stats.applicable > 0) {
          stats.evaluationProgress = (stats.evaluated / stats.applicable) * 100;
        }
        if (stats.evaluated > 0) {
          stats.conformiteRate = (stats.conforme / stats.evaluated) * 100;
        }
      });

      return Object.values(siteStatsMap);
    },
  });

  // Aggregate stats for all sites
  const aggregateStats = stats?.reduce(
    (acc, site) => ({
      totalArticles: acc.totalArticles + site.totalArticles,
      applicable: acc.applicable + site.applicable,
      nonApplicable: acc.nonApplicable + site.nonApplicable,
      evaluated: acc.evaluated + site.evaluated,
      conforme: acc.conforme + site.conforme,
      nonConforme: acc.nonConforme + site.nonConforme,
      partiel: acc.partiel + site.partiel,
      actionsTotal: acc.actionsTotal + site.actionsTotal,
      actionsTerminees: acc.actionsTerminees + site.actionsTerminees,
      actionsEnRetard: acc.actionsEnRetard + site.actionsEnRetard,
    }),
    {
      totalArticles: 0,
      applicable: 0,
      nonApplicable: 0,
      evaluated: 0,
      conforme: 0,
      nonConforme: 0,
      partiel: 0,
      actionsTotal: 0,
      actionsTerminees: 0,
      actionsEnRetard: 0,
    }
  );

  const globalConformiteRate =
    aggregateStats && aggregateStats.evaluated > 0
      ? (aggregateStats.conforme / aggregateStats.evaluated) * 100
      : 0;

  const pieData = aggregateStats
    ? [
        { name: "Conforme", value: aggregateStats.conforme, color: COLORS.conforme },
        { name: "Non conforme", value: aggregateStats.nonConforme, color: COLORS.nonConforme },
        { name: "Partiel", value: aggregateStats.partiel, color: COLORS.partiel },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tableau de bord Veille Réglementaire</h1>
          <p className="text-muted-foreground mt-2">
            Vue d'ensemble de la conformité réglementaire par site
          </p>
        </div>
        <Select value={selectedSite} onValueChange={setSelectedSite}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Sélectionner un site" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les sites</SelectItem>
            {sites.map((site) => (
              <SelectItem key={site.id} value={site.id}>
                {site.nom_site}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Global KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taux de conformité global
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-primary">
                {globalConformiteRate.toFixed(1)}%
              </div>
              <Target className="h-8 w-8 text-primary/50" />
            </div>
            <Progress value={globalConformiteRate} className="mt-3" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-success">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Articles conformes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-success">
                {aggregateStats?.conforme || 0}
              </div>
              <CheckCircle2 className="h-8 w-8 text-success/50" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              sur {aggregateStats?.evaluated || 0} évalués
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-destructive">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Articles non conformes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-destructive">
                {aggregateStats?.nonConforme || 0}
              </div>
              <XCircle className="h-8 w-8 text-destructive/50" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {aggregateStats?.actionsTotal || 0} actions créées
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-warning">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Actions en retard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-warning">
                {aggregateStats?.actionsEnRetard || 0}
              </div>
              <AlertTriangle className="h-8 w-8 text-warning/50" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Nécessitent une attention immédiate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Répartition de la conformité</CardTitle>
            <CardDescription>État des articles évalués</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Progression par site</CardTitle>
            <CardDescription>Avancement de l'évaluation</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats?.slice(0, 5)}>
                <XAxis dataKey="siteName" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="evaluationProgress" name="% Évaluation" fill="hsl(var(--primary))" />
                <Bar dataKey="conformiteRate" name="% Conformité" fill="hsl(var(--success))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
          <CardDescription>Accéder aux différentes étapes du workflow</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button
              variant="outline"
              className="h-auto flex-col items-start p-4 space-y-2"
              onClick={() => navigate("/veille/applicabilite")}
            >
              <div className="flex items-center gap-2 w-full">
                <FileText className="h-5 w-5 text-primary" />
                <span className="font-semibold">Applicabilité</span>
              </div>
              <p className="text-sm text-muted-foreground text-left">
                Définir les articles applicables pour chaque site
              </p>
              <ArrowRight className="h-4 w-4 ml-auto text-primary" />
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col items-start p-4 space-y-2"
              onClick={() => navigate("/veille/evaluation")}
            >
              <div className="flex items-center gap-2 w-full">
                <ClipboardCheck className="h-5 w-5 text-primary" />
                <span className="font-semibold">Évaluation</span>
              </div>
              <p className="text-sm text-muted-foreground text-left">
                Évaluer la conformité et ajouter des preuves
              </p>
              <ArrowRight className="h-4 w-4 ml-auto text-primary" />
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col items-start p-4 space-y-2"
              onClick={() => navigate("/veille/actions")}
            >
              <div className="flex items-center gap-2 w-full">
                <Activity className="h-5 w-5 text-primary" />
                <span className="font-semibold">Plan d'action</span>
              </div>
              <p className="text-sm text-muted-foreground text-left">
                Gérer les actions correctives et leur suivi
              </p>
              <ArrowRight className="h-4 w-4 ml-auto text-primary" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sites Overview Table */}
      <Card>
        <CardHeader>
          <CardTitle>Vue par site</CardTitle>
          <CardDescription>Détail de la conformité pour chaque site client</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : stats && stats.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Site</TableHead>
                    <TableHead className="text-right">Articles</TableHead>
                    <TableHead className="text-right">Applicables</TableHead>
                    <TableHead className="text-right">Évalués</TableHead>
                    <TableHead className="text-right">Conformes</TableHead>
                    <TableHead className="text-right">Non conformes</TableHead>
                    <TableHead className="text-right">Taux conformité</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.map((site) => (
                    <TableRow
                      key={site.siteId}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        setSelectedSite(site.siteId);
                        navigate(`/veille/evaluation?siteId=${site.siteId}`);
                      }}
                    >
                      <TableCell className="font-medium">{site.siteName}</TableCell>
                      <TableCell className="text-right">{site.totalArticles}</TableCell>
                      <TableCell className="text-right">{site.applicable}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {site.evaluated}
                          <Badge variant="outline" className="text-xs">
                            {site.evaluationProgress.toFixed(0)}%
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge className="bg-success text-success-foreground">
                          {site.conforme}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge className="bg-destructive text-destructive-foreground">
                          {site.nonConforme}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="font-semibold">
                            {site.conformiteRate.toFixed(1)}%
                          </span>
                          {site.conformiteRate >= 90 ? (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          ) : site.conformiteRate >= 70 ? (
                            <Clock className="h-4 w-4 text-warning" />
                          ) : (
                            <XCircle className="h-4 w-4 text-destructive" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {site.actionsTotal > 0 && (
                          <Badge variant="outline">
                            {site.actionsTerminees}/{site.actionsTotal}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Aucune donnée disponible. Commencez par définir l'applicabilité des articles.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
