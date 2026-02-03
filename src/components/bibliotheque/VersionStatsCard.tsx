import { Card, CardContent } from "@/components/ui/card";
import { Activity, Calendar, TrendingUp } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";

interface Version {
  id: string;
  numero_version: number;
  date_effet: string;
  statut?: string;
}

interface VersionStatsCardProps {
  versions: Version[];
}

export function VersionStatsCard({ versions }: VersionStatsCardProps) {
  if (!versions || versions.length === 0) {
    return null;
  }

  const latestVersion = versions[0];
  const oldestVersion = versions[versions.length - 1];
  
  const daysSinceFirst = differenceInDays(
    new Date(),
    new Date(oldestVersion.date_effet)
  );
  
  const averageFrequency = versions.length > 1 
    ? Math.round(daysSinceFirst / versions.length)
    : 0;

  const statutTypes = versions.reduce((acc, v) => {
    const type = v.statut || "autre";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostFrequentStatut = Object.entries(statutTypes).sort(
    ([, a], [, b]) => b - a
  )[0];

  // Map statut to display label
  const statutLabels: Record<string, string> = {
    en_vigueur: "En vigueur",
    remplacee: "Remplacée",
    abrogee: "Abrogée",
    autre: "Autre",
  };

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="h-4 w-4" />
              <span>Total des versions</span>
            </div>
            <div className="text-3xl font-bold">{versions.length}</div>
            <p className="text-xs text-muted-foreground">
              Depuis {format(new Date(oldestVersion.date_effet), 'MMM yyyy', { locale: fr })}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Dernière modification</span>
            </div>
            <div className="text-lg font-semibold">
              {format(new Date(latestVersion.date_effet), 'd MMM yyyy', { locale: fr })}
            </div>
            <p className="text-xs text-muted-foreground">
              {statutLabels[latestVersion.statut || "autre"] || latestVersion.statut || "Statut inconnu"}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>Fréquence moyenne</span>
            </div>
            <div className="text-lg font-semibold">
              {averageFrequency > 0 ? `${averageFrequency}j` : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              Statut principal: {statutLabels[mostFrequentStatut?.[0] || "autre"] || mostFrequentStatut?.[0] || "N/A"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
