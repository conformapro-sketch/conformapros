import { useQuery } from "@tanstack/react-query";
import { fetchFormationStats } from "@/lib/formations-queries";
import { StatCard } from "@/components/StatCard";
import { GraduationCap, Calendar, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FormationsDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["formation-stats"],
    queryFn: () => fetchFormationStats(),
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Tableau de bord formations</h1>
            <p className="text-muted-foreground">Vue d'ensemble des formations HSE</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-24 bg-muted" />
              <CardContent className="h-16 bg-muted/50" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Tableau de bord formations</h1>
          <p className="text-muted-foreground">
            Suivi en temps réel des formations obligatoires et internes
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total formations"
          value={stats?.total || 0}
          icon={GraduationCap}
          trend="Toutes les sessions"
          variant="default"
        />
        <StatCard
          title="Planifiées"
          value={stats?.planifiees || 0}
          icon={Calendar}
          trend="À venir"
          variant="warning"
        />
        <StatCard
          title="Réalisées"
          value={stats?.realisees || 0}
          icon={CheckCircle}
          trend="Complétées"
          variant="success"
        />
        <StatCard
          title="Expirées"
          value={stats?.expirees || 0}
          icon={AlertCircle}
          trend="Action requise"
          variant="destructive"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Taux de couverture formation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-2">
              {stats?.realisees && stats?.total
                ? Math.round((stats.realisees / stats.total) * 100)
                : 0}
              %
            </div>
            <p className="text-sm text-muted-foreground">
              Personnel formé aux habilitations obligatoires
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Formations à renouveler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-2 text-amber-600">
              {stats?.expirees || 0}
            </div>
            <p className="text-sm text-muted-foreground">
              Sessions expirées nécessitant un recyclage
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Domaines de formation prioritaires</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Vue détaillée par domaine (sécurité, incendie, hygiène, environnement) disponible prochainement.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
