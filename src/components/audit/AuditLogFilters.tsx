import { Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ACTION_TYPE_CONFIG } from "./AuditLogStats";

interface AuditLogFiltersProps {
  actionFilter: string;
  onActionFilterChange: (value: string) => void;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
}

export function AuditLogFilters({
  actionFilter,
  onActionFilterChange,
  searchTerm,
  onSearchTermChange,
}: AuditLogFiltersProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Filtrer par:</span>
      </div>
      <Select value={actionFilter} onValueChange={onActionFilterChange}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Type d'action" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toutes les actions</SelectItem>
          {Object.entries(ACTION_TYPE_CONFIG).map(([type, config]) => (
            <SelectItem key={type} value={type}>
              {config.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        placeholder="Rechercher..."
        value={searchTerm}
        onChange={(e) => onSearchTermChange(e.target.value)}
        className="max-w-xs"
      />
    </div>
  );
}
