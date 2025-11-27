import { useSiteContext } from "@/hooks/useSiteContext";
import { useUserModules } from "@/hooks/useUserModules";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileText, ClipboardCheck, AlertTriangle, TrendingUp, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ClientDashboard() {
  const navigate = useNavigate();
  const { currentSite, isLoading: siteLoading } = useSiteContext();
  const { data: modules, isLoading: modulesLoading } = useUserModules(currentSite?.id);
  
  const conformityScore = 87;

  if (siteLoading || modulesLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Chargement de votre tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (!currentSite) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="p-8 max-w-md">
          <CardHeader>
            <CardTitle>Aucun site sélectionné</CardTitle>
            <CardDescription>
              Veuillez sélectionner un site dans le menu pour accéder à votre tableau de bord
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
            Tableau de bord - {currentSite.nom}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Vue d'ensemble de la conformité HSE pour ce site
          </p>
        </div>
        <Button className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90">
          Générer rapport
        </Button>
      </div>

      {/* Conformity Score */}
      <Card className="border-l-4 border-l-primary bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Score de conformité - {currentSite.nom}
          </CardTitle>
          <CardDescription>État de conformité actuel pour ce site</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-5xl font-bold text-primary">{conformityScore}%</span>
            </div>
            <Progress value={conformityScore} className="h-3" />
            <p className="text-sm text-muted-foreground">
              +5% par rapport au mois dernier
            </p>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-3">
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
          title="Actions en cours"
          value="12"
          icon={AlertTriangle}
          trend="À clôturer"
          variant="default"
        />
      </div>

      {/* Active Modules */}
      <Card>
        <CardHeader>
          <CardTitle>Modules actifs pour {currentSite.nom}</CardTitle>
          <CardDescription>
            Les modules accessibles pour ce site
          </CardDescription>
        </CardHeader>
        <CardContent>
          {modules && modules.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {modules.map((module) => (
                <Card 
                  key={module.id}
                  className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => {
                    // Navigate based on module code
                    const routeMap: Record<string, string> = {
                      'BIBLIOTHEQUE': '/client-bibliotheque',
                      'VEILLE': '/veille/dashboard',
                      'CONTROLES': '/controles/dashboard',
                      'INCIDENTS': '/incidents/dashboard',
                      'EPI': '/epi/dashboard',
                      'EQUIPEMENTS': '/equipements/dashboard',
                      'FORMATIONS': '/formations/dashboard',
                      'ENVIRONNEMENT': '/environnement/dashboard',
                      'VISITES': '/visites-medicales/dashboard',
                    };
                    const route = routeMap[module.code] || '/';
                    navigate(route);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="h-10 w-10 rounded-lg flex items-center justify-center bg-primary/10"
                    >
                      <span className="text-xl">📋</span>
                    </div>
                    <div>
                      <p className="font-medium">{module.libelle}</p>
                      {module.description && (
                        <p className="text-xs text-muted-foreground">{module.description}</p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Aucun module actif pour ce site. Contactez votre administrateur.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
