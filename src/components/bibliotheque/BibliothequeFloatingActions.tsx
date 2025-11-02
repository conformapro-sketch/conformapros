import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Download, X, CheckSquare } from "lucide-react";

interface BibliothequeFloatingActionsProps {
  selectedCount: number;
  onExport: () => void;
  onDelete: () => void;
  onClear: () => void;
}

export function BibliothequeFloatingActions({ 
  selectedCount, 
  onExport, 
  onDelete,
  onClear 
}: BibliothequeFloatingActionsProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-in-right">
      <div className="bg-gradient-primary rounded-full shadow-strong border-2 border-accent/20 px-6 py-3 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Badge className="bg-accent text-accent-foreground font-bold px-3 py-1">
            <CheckSquare className="h-4 w-4 mr-1" />
            {selectedCount}
          </Badge>
          <span className="text-sm font-medium text-primary-foreground">
            {selectedCount > 1 ? 'textes sélectionnés' : 'texte sélectionné'}
          </span>
        </div>

        <div className="h-6 w-px bg-white/20" />

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={onExport}
            className="bg-white/20 hover:bg-white/30 text-white border-white/30"
          >
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={onDelete}
            className="bg-destructive/80 hover:bg-destructive text-destructive-foreground border-destructive/30"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={onClear}
            className="text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
