import { Card, CardContent } from "@/components/ui/card";
import { FileText, Scale, BookOpen, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ArticleStats {
  total: number;
  exigences: number;
  introductifs: number;
  enVigueur: number;
}

interface ArticlesStatsCardsProps {
  stats?: ArticleStats;
  isLoading?: boolean;
}

export function ArticlesStatsCards({ stats, isLoading }: ArticlesStatsCardsProps) {
  const statCards = [
    {
      label: "Total articles",
      value: stats?.total || 0,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
    },
    {
      label: "Exigences",
      value: stats?.exigences || 0,
      icon: Scale,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950/30",
    },
    {
      label: "Introductifs",
      value: stats?.introductifs || 0,
      icon: BookOpen,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950/30",
    },
    {
      label: "En vigueur",
      value: stats?.enVigueur || 0,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/30",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-3 sm:p-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-6 sm:h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
      {statCards.map((stat) => (
        <Card key={stat.label} className="hover:shadow-md transition-shadow">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{stat.label}</p>
                <p className="text-xl sm:text-2xl font-bold mt-1">{stat.value.toLocaleString()}</p>
              </div>
              <div className={`p-2 rounded-lg shrink-0 ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
