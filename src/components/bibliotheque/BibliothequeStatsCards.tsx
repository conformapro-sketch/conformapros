import { Card, CardContent } from "@/components/ui/card";
import { FileText, CheckCircle2, AlertTriangle, XCircle, TrendingUp } from "lucide-react";

interface BibliothequeStatsCardsProps {
  stats: {
    total: number;
    enVigueur: number;
    modifies: number;
    abroges: number;
    parType: {
      loi: number;
      decret: number;
      arrete: number;
      circulaire: number;
    };
  };
}

export function BibliothequeStatsCards({ stats }: BibliothequeStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <Card className="border-2 hover:shadow-medium transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Total</p>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 hover:shadow-medium transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">En vigueur</p>
              <p className="text-2xl font-bold text-success">{stats.enVigueur}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 hover:shadow-medium transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <AlertTriangle className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Modifiés</p>
              <p className="text-2xl font-bold text-warning">{stats.modifies}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 hover:shadow-medium transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10">
              <XCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Abrogés</p>
              <p className="text-2xl font-bold text-destructive">{stats.abroges}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 hover:shadow-medium transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10">
              <TrendingUp className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">Répartition</p>
              <div className="flex gap-1 mt-1">
                <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">
                  L:{stats.parType.loi}
                </span>
                <span className="text-xs bg-accent/10 text-accent px-1.5 py-0.5 rounded font-medium">
                  D:{stats.parType.decret}
                </span>
                <span className="text-xs bg-secondary/10 text-secondary-foreground px-1.5 py-0.5 rounded font-medium">
                  A:{stats.parType.arrete}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
