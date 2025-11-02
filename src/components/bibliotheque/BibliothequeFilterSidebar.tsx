import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Filter } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface FilterOption {
  id: string;
  label: string;
}

interface BibliothequeFilterSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  typeFilter: string;
  statutFilter: string;
  domaineFilter: string;
  sousDomaineFilter: string;
  anneeFilter: string;
  onTypeChange: (value: string) => void;
  onStatutChange: (value: string) => void;
  onDomaineChange: (value: string) => void;
  onSousDomaineChange: (value: string) => void;
  onAnneeChange: (value: string) => void;
  domaines?: FilterOption[];
  sousDomaines?: FilterOption[];
  years?: number[];
  onClearAll: () => void;
}

const TYPE_LABELS = {
  loi: "Loi",
  arrete: "Arrêté",
  decret: "Décret",
  circulaire: "Circulaire",
};

export function BibliothequeFilterSidebar({
  open,
  onOpenChange,
  typeFilter,
  statutFilter,
  domaineFilter,
  sousDomaineFilter,
  anneeFilter,
  onTypeChange,
  onStatutChange,
  onDomaineChange,
  onSousDomaineChange,
  onAnneeChange,
  domaines = [],
  sousDomaines = [],
  years = [],
  onClearAll,
}: BibliothequeFilterSidebarProps) {
  const activeFiltersCount = [typeFilter, statutFilter, domaineFilter, sousDomaineFilter, anneeFilter]
    .filter((f) => f !== "all").length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-80 sm:w-96">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              <SheetTitle>Filtres avancés</SheetTitle>
            </div>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">
                {activeFiltersCount}
              </Badge>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-8rem)] pr-4">
          <div className="space-y-6 py-6">
            {/* Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Type de texte</label>
              <Select value={typeFilter} onValueChange={onTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  {Object.entries(TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Statut Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Statut</label>
              <Select value={statutFilter} onValueChange={onStatutChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="en_vigueur">✓ En vigueur</SelectItem>
                  <SelectItem value="modifie">⚠ Modifié</SelectItem>
                  <SelectItem value="abroge">✕ Abrogé</SelectItem>
                  <SelectItem value="suspendu">⏸ Suspendu</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Domaine Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Domaine</label>
              <Select 
                value={domaineFilter} 
                onValueChange={(val) => {
                  onDomaineChange(val);
                  onSousDomaineChange("all");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les domaines" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les domaines</SelectItem>
                  {domaines.map((domaine) => (
                    <SelectItem key={domaine.id} value={domaine.id}>
                      {domaine.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sous-domaine Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Sous-domaine</label>
              <Select 
                value={sousDomaineFilter} 
                onValueChange={onSousDomaineChange}
                disabled={domaineFilter === "all"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {sousDomaines.map((sd) => (
                    <SelectItem key={sd.id} value={sd.id}>
                      {sd.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Année Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Année</label>
              <Select value={anneeFilter} onValueChange={onAnneeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les années</SelectItem>
                  {years.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </ScrollArea>

        {/* Actions */}
        {activeFiltersCount > 0 && (
          <div className="absolute bottom-6 left-6 right-6">
            <Button
              variant="outline"
              className="w-full"
              onClick={onClearAll}
            >
              <X className="h-4 w-4 mr-2" />
              Réinitialiser tous les filtres
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
