import { useQuery } from "@tanstack/react-query";
import { fetchEnvironnementStats } from "@/lib/environnement-queries";
import { StatCard } from "@/components/StatCard";
import { Leaf, AlertTriangle, Recycle, TrendingUp, Droplets, Wind } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EnvironnementDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["environnement-stats"],
    queryFn: () => fetchEnvironnementStats(),
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-2" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Tableau de bord Environnement</h1>
          <p className="text-muted-foreground">
            Surveillance environnementale et gestion des déchets
          </p>
        </div>
      </div>

      {/* KPIs principaux */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Conformité environnementale"
          value={`${stats?.conformiteEnvironnementale || 0}%`}
          icon={Leaf}
          trend="Mesures dans les limites"
          variant="success"
        />
        <StatCard
          title="Alertes actives"
          value={stats?.alertes || 0}
          icon={AlertTriangle}
          trend="Dépassements & retards"
          variant="destructive"
        />
        <StatCard
          title="Déchets (mois en cours)"
          value={`${stats?.totalDechets || 0} t`}
          icon={Recycle}
          trend={`dont ${stats?.dechetsDangereux || 0}t dangereux`}
          variant="default"
        />
        <StatCard
          title="Taux de valorisation"
          value={`${stats?.tauxValorisation || 0}%`}
          icon={TrendingUp}
          trend="Recyclage & valorisation"
          variant="success"
        />
      </div>

      {/* Conformité par domaine */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5" />
              Surveillance des eaux
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Points de mesure actifs</span>
                <span className="text-2xl font-bold">-</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Dernières mesures conformes</span>
                <span className="text-lg font-semibold text-green-600">-</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Non-conformités (mois)</span>
                <span className="text-lg font-semibold text-red-600">{stats?.mesuresNonConformes || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wind className="h-5 w-5" />
              Surveillance de l'air
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Points de mesure actifs</span>
                <span className="text-2xl font-bold">-</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Dernières mesures conformes</span>
                <span className="text-lg font-semibold text-green-600">-</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Dépassements (mois)</span>
                <span className="text-lg font-semibold text-red-600">-</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gestion des déchets */}
      <Card>
        <CardHeader>
          <CardTitle>Flux de déchets - Mois en cours</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Total déchets</p>
              <p className="text-3xl font-bold">{stats?.totalDechets || 0} t</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Déchets dangereux</p>
              <p className="text-3xl font-bold text-orange-600">{stats?.dechetsDangereux || 0} t</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Déchets non dangereux</p>
              <p className="text-3xl font-bold text-blue-600">
                {Math.round(((stats?.totalDechets || 0) - (stats?.dechetsDangereux || 0)) * 100) / 100} t
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions requises */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Actions requises
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Les alertes et actions environnementales s'afficheront ici (dépassements de seuils, bordereaux manquants, etc.)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
