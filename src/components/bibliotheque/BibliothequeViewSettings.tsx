import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings2, LayoutGrid, LayoutList, Maximize2, Minimize2 } from "lucide-react";
import { DensityMode } from "@/contexts/BibliothequePreferencesContext";

interface BibliothequeViewSettingsProps {
  density: DensityMode;
  onDensityChange: (density: DensityMode) => void;
}

export function BibliothequeViewSettings({ density, onDensityChange }: BibliothequeViewSettingsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings2 className="h-4 w-4 mr-2" />
          Affichage
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Densité d'affichage</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onDensityChange("compact")}
          className="flex items-center gap-2"
        >
          <Minimize2 className="h-4 w-4" />
          <div className="flex-1">
            <div className="font-medium">Compact</div>
            <div className="text-xs text-muted-foreground">Plus d'éléments visibles</div>
          </div>
          {density === "compact" && (
            <div className="h-2 w-2 rounded-full bg-primary" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onDensityChange("comfortable")}
          className="flex items-center gap-2"
        >
          <LayoutList className="h-4 w-4" />
          <div className="flex-1">
            <div className="font-medium">Confortable</div>
            <div className="text-xs text-muted-foreground">Espacement équilibré</div>
          </div>
          {density === "comfortable" && (
            <div className="h-2 w-2 rounded-full bg-primary" />
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onDensityChange("large")}
          className="flex items-center gap-2"
        >
          <Maximize2 className="h-4 w-4" />
          <div className="flex-1">
            <div className="font-medium">Large</div>
            <div className="text-xs text-muted-foreground">Maximum de détails</div>
          </div>
          {density === "large" && (
            <div className="h-2 w-2 rounded-full bg-primary" />
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
