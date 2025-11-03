import { Card, CardContent } from "@/components/ui/card";
import { Activity, Calendar, TrendingUp } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";

interface Version {
  id: string;
  version_numero: number;
  date_version: string;
  modification_type?: string;
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
    new Date(oldestVersion.date_version)
  );
  
  const averageFrequency = versions.length > 1 
    ? Math.round(daysSinceFirst / versions.length)
    : 0;

  const modificationTypes = versions.reduce((acc, v) => {
    const type = v.modification_type || "autre";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostFrequentType = Object.entries(modificationTypes).sort(
    ([, a], [, b]) => b - a
  )[0];

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
              Depuis {format(new Date(oldestVersion.date_version), 'MMM yyyy', { locale: fr })}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Dernière modification</span>
            </div>
            <div className="text-lg font-semibold">
              {format(new Date(latestVersion.date_version), 'd MMM yyyy', { locale: fr })}
            </div>
            <p className="text-xs text-muted-foreground">
              {latestVersion.modification_type || "Type inconnu"}
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
              Type principal: {mostFrequentType?.[0] || "N/A"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}