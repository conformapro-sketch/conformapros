import { StatCard } from "@/components/StatCard";
import { AlertBadge } from "@/components/AlertBadge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileText, ClipboardCheck, AlertTriangle, CheckCircle2, Clock, AlertCircle, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const conformityScore = 87;

  const recentAlerts = [
    { id: 1, type: "Contrôle technique", item: "Extincteurs - Bâtiment A", echeance: "Dans 5 jours", status: "expire-bientot" as const },
    { id: 2, type: "Document", item: "Certificat d'assurance RC", echeance: "Expiré depuis 2 jours", status: "expire" as const },
    { id: 3, type: "Formation", item: "SST - 3 agents", echeance: "Dans 15 jours", status: "expire-bientot" as const },
    { id: 4, type: "Habilitation", item: "Électrique - Agent FOULEN", echeance: "Dans 30 jours", status: "conforme" as const },
  ];

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">Tableau de bord</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">Vue d'ensemble de la conformité HSE</p>
        </div>
        <Button className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90">
          Générer rapport
        </Button>
      </div>

      {/* Score de conformité global */}
      <Card className="border-l-4 border-l-primary bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Score de conformité global
          </CardTitle>
          <CardDescription>Tous sites et domaines confondus</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-5xl font-bold text-primary">{conformityScore}%</span>
              <CheckCircle2 className="h-12 w-12 text-success" />
            </div>
            <Progress value={conformityScore} className="h-3" />
            <p className="text-sm text-muted-foreground">
              +5% par rapport au mois dernier
            </p>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Documents conformes"
          value="124/142"
          icon={FileText}
          trend="+8 ce mois"
          variant="success"
        />
        <StatCard
          title="Contrôles à venir"
          value="17"
          icon={ClipboardCheck}
          trend="Dans 30 jours"
          variant="warning"
        />
        <StatCard
          title="Incidents déclarés"
          value="3"
          icon={AlertTriangle}
          trend="Ce mois"
          variant="destructive"
        />
        <StatCard
          title="Actions en cours"
          value="12"
          icon={Clock}
          trend="À clôturer"
          variant="default"
        />
      </div>

      {/* Alertes récentes */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-warning" />
            Alertes et échéances critiques
          </CardTitle>
          <CardDescription>Actions prioritaires à traiter</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-foreground">{alert.item}</span>
                    <AlertBadge status={alert.status}>{alert.type}</AlertBadge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Échéance : {alert.echeance}
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Traiter
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Conformité par domaine */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Conformité HSE</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Sécurité</span>
                <span className="text-sm text-muted-foreground">92%</span>
              </div>
              <Progress value={92} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Environnement</span>
                <span className="text-sm text-muted-foreground">85%</span>
              </div>
              <Progress value={85} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Hygiène</span>
                <span className="text-sm text-muted-foreground">88%</span>
              </div>
              <Progress value={88} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Conformité Technique</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Équipements</span>
                <span className="text-sm text-muted-foreground">78%</span>
              </div>
              <Progress value={78} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Formations</span>
                <span className="text-sm text-muted-foreground">94%</span>
              </div>
              <Progress value={94} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Documents RH</span>
                <span className="text-sm text-muted-foreground">89%</span>
              </div>
              <Progress value={89} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
