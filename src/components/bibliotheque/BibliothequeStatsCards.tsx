import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, CheckCircle, AlertTriangle, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface BibliothequeStatsCardsProps {
  stats: {
    total: number;
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
  const [isExpanded, setIsExpanded] = useState(false);

  const statsCards = [
    {
      id: "total",
      label: "Total",
      value: stats.total,
      icon: FileText,
      color: "text-primary",
      bgColor: "bg-primary/10",
      filter: "all",
    },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Statistiques</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-7 px-2"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-1" />
              <span className="text-xs">Masquer</span>
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-1" />
              <span className="text-xs">Afficher</span>
            </>
          )}
        </Button>
      </div>

      <div
        className={cn(
          "transition-all duration-300 overflow-hidden",
          !isExpanded && "max-h-0 opacity-0",
          isExpanded && "max-h-96 opacity-100"
        )}
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {statsCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.id}
                className="hover:shadow-md transition-all cursor-pointer hover:scale-105 hover:border-primary/50"
                onClick={() => onFilterByStatus?.(stat.filter)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                      <p className={cn("text-2xl font-bold mt-1", stat.color)}>{stat.value}</p>
                    </div>
                    <div className={cn("p-2 rounded-full", stat.bgColor)}>
                      <Icon className={cn("h-5 w-5", stat.color)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
