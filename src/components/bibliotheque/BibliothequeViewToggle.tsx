import { Button } from "@/components/ui/button";
import { LayoutGrid, Table } from "lucide-react";

interface BibliothequeViewToggleProps {
  view: "table" | "grid";
  onViewChange: (view: "table" | "grid") => void;
}

export function BibliothequeViewToggle({ view, onViewChange }: BibliothequeViewToggleProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
      <Button
        variant={view === "table" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => onViewChange("table")}
        className={view === "table" ? "shadow-sm" : ""}
      >
        <Table className="h-4 w-4 mr-1.5" />
        Tableau
      </Button>
      <Button
        variant={view === "grid" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => onViewChange("grid")}
        className={view === "grid" ? "shadow-sm" : ""}
      >
        <LayoutGrid className="h-4 w-4 mr-1.5" />
        Grille
      </Button>
    </div>
  );
}
