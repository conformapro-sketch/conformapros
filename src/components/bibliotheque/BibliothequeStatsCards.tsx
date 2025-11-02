import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FileText, CheckCircle2, AlertTriangle, XCircle, TrendingUp, TrendingDown } from "lucide-react";

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
  onFilterByStatus?: (status: string) => void;
}

export function BibliothequeStatsCards({ stats, onFilterByStatus }: BibliothequeStatsCardsProps) {
  // Simulate trends (in real app, compare with previous period)
  const trends = {
    total: 5.2,
    enVigueur: 3.1,
    modifies: -1.5,
    abroges: 2.3,
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="h-3 w-3 text-success" />;
    if (trend < 0) return <TrendingDown className="h-3 w-3 text-destructive" />;
    return null;
  };

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-2 hover:shadow-strong hover:border-primary/50 transition-all cursor-pointer group">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Total</p>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                </div>
              </div>
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center gap-1 text-xs">
                    {getTrendIcon(trends.total)}
                    <span className={trends.total > 0 ? "text-success" : "text-destructive"}>
                      {Math.abs(trends.total)}%
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">vs mois dernier</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="border-2 hover:shadow-strong hover:border-success/50 transition-all cursor-pointer group"
          onClick={() => onFilterByStatus?.("en_vigueur")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10 group-hover:bg-success/20 transition-colors">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">En vigueur</p>
                  <p className="text-2xl font-bold text-success">{stats.enVigueur}</p>
                </div>
              </div>
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center gap-1 text-xs">
                    {getTrendIcon(trends.enVigueur)}
                    <span className={trends.enVigueur > 0 ? "text-success" : "text-destructive"}>
                      {Math.abs(trends.enVigueur)}%
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Cliquer pour filtrer</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="border-2 hover:shadow-strong hover:border-warning/50 transition-all cursor-pointer group"
          onClick={() => onFilterByStatus?.("modifie")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10 group-hover:bg-warning/20 transition-colors">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Modifiés</p>
                  <p className="text-2xl font-bold text-warning">{stats.modifies}</p>
                </div>
              </div>
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center gap-1 text-xs">
                    {getTrendIcon(trends.modifies)}
                    <span className={trends.modifies > 0 ? "text-success" : "text-destructive"}>
                      {Math.abs(trends.modifies)}%
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Cliquer pour filtrer</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="border-2 hover:shadow-strong hover:border-destructive/50 transition-all cursor-pointer group"
          onClick={() => onFilterByStatus?.("abroge")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10 group-hover:bg-destructive/20 transition-colors">
                  <XCircle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Abrogés</p>
                  <p className="text-2xl font-bold text-destructive">{stats.abroges}</p>
                </div>
              </div>
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center gap-1 text-xs">
                    {getTrendIcon(trends.abroges)}
                    <span className={trends.abroges > 0 ? "text-success" : "text-destructive"}>
                      {Math.abs(trends.abroges)}%
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Cliquer pour filtrer</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-strong transition-all group">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
                <TrendingUp className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Répartition</p>
                <Tooltip>
                  <TooltipTrigger>
                    <div className="flex gap-1 mt-1">
                      <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium hover:bg-primary/20 transition-colors">
                        L:{stats.parType.loi}
                      </span>
                      <span className="text-xs bg-accent/10 text-accent px-1.5 py-0.5 rounded font-medium hover:bg-accent/20 transition-colors">
                        D:{stats.parType.decret}
                      </span>
                      <span className="text-xs bg-secondary/10 text-secondary-foreground px-1.5 py-0.5 rounded font-medium hover:bg-secondary/20 transition-colors">
                        A:{stats.parType.arrete}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs space-y-1">
                      <p>Lois: {stats.parType.loi}</p>
                      <p>Décrets: {stats.parType.decret}</p>
                      <p>Arrêtés: {stats.parType.arrete}</p>
                      <p>Circulaires: {stats.parType.circulaire}</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
