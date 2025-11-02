import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface Filter {
  id: string;
  label: string;
  value: string;
  onRemove: () => void;
}

interface BibliothequeActiveFiltersProps {
  filters: Filter[];
  resultCount: number;
  onClearAll: () => void;
}

export function BibliothequeActiveFilters({ 
  filters, 
  resultCount, 
  onClearAll 
}: BibliothequeActiveFiltersProps) {
  if (filters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 p-4 bg-muted/30 rounded-lg border animate-fade-in">
      <span className="text-sm font-medium text-muted-foreground">
        Filtres actifs ({filters.length}) :
      </span>
      
      {filters.map((filter) => (
        <Badge
          key={filter.id}
          variant="secondary"
          className="pl-3 pr-1 py-1 hover:bg-secondary/80 transition-colors cursor-pointer group"
          onClick={filter.onRemove}
        >
          <span className="text-xs font-medium mr-1">{filter.label}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0 hover:bg-transparent group-hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              filter.onRemove();
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      ))}

      <Button
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        className="ml-auto text-xs hover:text-destructive"
      >
        <X className="h-3 w-3 mr-1" />
        Tout effacer
      </Button>

      <div className="w-full sm:w-auto ml-auto text-sm">
        <span className="font-semibold text-primary">{resultCount}</span>
        <span className="text-muted-foreground"> résultat{resultCount > 1 ? 's' : ''}</span>
      </div>
    </div>
  );
}
