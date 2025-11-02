import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle, AlertTriangle, XCircle, FilePlus, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickFilter {
  id: string;
  label: string;
  icon: React.ReactNode;
  value: string;
  count?: number;
}

interface BibliothequeQuickFiltersProps {
  activeFilter: string;
  onFilterChange: (filterId: string, value: string) => void;
  stats?: {
    total: number;
    enVigueur: number;
    modifies: number;
    abroges: number;
    withPdf?: number;
    favorites?: number;
  };
}

export function BibliothequeQuickFilters({ 
  activeFilter, 
  onFilterChange, 
  stats 
}: BibliothequeQuickFiltersProps) {
  const filters: QuickFilter[] = [
    {
      id: "all",
      label: "Tous",
      icon: <FileText className="h-3.5 w-3.5" />,
      value: "all",
      count: stats?.total,
    },
    {
      id: "en_vigueur",
      label: "En vigueur",
      icon: <CheckCircle className="h-3.5 w-3.5" />,
      value: "en_vigueur",
      count: stats?.enVigueur,
    },
    {
      id: "modifie",
      label: "Modifiés",
      icon: <AlertTriangle className="h-3.5 w-3.5" />,
      value: "modifie",
      count: stats?.modifies,
    },
    {
      id: "abroge",
      label: "Abrogés",
      icon: <XCircle className="h-3.5 w-3.5" />,
      value: "abroge",
      count: stats?.abroges,
    },
    {
      id: "with_pdf",
      label: "Avec PDF",
      icon: <FilePlus className="h-3.5 w-3.5" />,
      value: "with_pdf",
      count: stats?.withPdf,
    },
    {
      id: "favorites",
      label: "Favoris",
      icon: <Star className="h-3.5 w-3.5" />,
      value: "favorites",
      count: stats?.favorites,
    },
  ];

  return (
    <div className="flex items-center gap-2 flex-wrap pb-2">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Filtres rapides:
      </span>
      {filters.map((filter) => {
        const isActive = activeFilter === filter.id;
        return (
          <Badge
            key={filter.id}
            variant={isActive ? "default" : "outline"}
            className={cn(
              "cursor-pointer transition-all duration-200 hover:scale-105",
              isActive 
                ? "bg-primary text-primary-foreground shadow-md" 
                : "hover:bg-accent hover:text-accent-foreground"
            )}
            onClick={() => onFilterChange("statut", filter.value)}
          >
            {filter.icon}
            <span className="ml-1.5">{filter.label}</span>
            {filter.count !== undefined && (
              <span className={cn(
                "ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-bold",
                isActive ? "bg-primary-foreground/20" : "bg-muted"
              )}>
                {filter.count}
              </span>
            )}
          </Badge>
        );
      })}
    </div>
  );
}
