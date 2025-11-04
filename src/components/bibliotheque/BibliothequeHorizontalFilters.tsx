import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Filter, ChevronDown, ChevronUp, RotateCcw, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface BibliothequeHorizontalFiltersProps {
  // États des filtres
  typeFilter: string;
  setTypeFilter: (value: string) => void;
  statutFilter: string;
  setStatutFilter: (value: string) => void;
  domaineFilter: string;
  setDomaineFilter: (value: string) => void;
  sousDomaineFilter: string;
  setSousDomaineFilter: (value: string) => void;
  anneeFilter: string;
  setAnneeFilter: (value: string) => void;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  
  // Données pour les selects
  domaines: Array<{ id: string; nom: string }>;
  sousDomaines: Array<{ id: string; nom: string }>;
  
  // Actions
  onApply: () => void;
  onReset: () => void;
  
  // État open/closed
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  
  // Compteur de filtres actifs
  activeFiltersCount: number;
}

const TYPE_OPTIONS = [
  { value: "all", label: "Tous les types" },
  { value: "LOI", label: "Loi" },
  { value: "DECRET", label: "Décret" },
  { value: "ARRETE", label: "Arrêté" },
  { value: "CIRCULAIRE", label: "Circulaire" },
];

const STATUT_OPTIONS = [
  { value: "all", label: "Tous les statuts" },
  { value: "en_vigueur", label: "En vigueur" },
  { value: "modifie", label: "Modifié" },
  { value: "abroge", label: "Abrogé" },
];

export function BibliothequeHorizontalFilters({
  typeFilter,
  setTypeFilter,
  statutFilter,
  setStatutFilter,
  domaineFilter,
  setDomaineFilter,
  sousDomaineFilter,
  setSousDomaineFilter,
  anneeFilter,
  setAnneeFilter,
  searchTerm,
  setSearchTerm,
  domaines,
  sousDomaines,
  onApply,
  onReset,
  isOpen,
  setIsOpen,
  activeFiltersCount,
}: BibliothequeHorizontalFiltersProps) {
  return (
    <div className="space-y-3">
      {/* Search Bar - Always Visible */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par titre, référence..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 h-10"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchTerm("")}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Advanced Filters - Collapsible */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center justify-between">
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filtres avancés
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                  {activeFiltersCount}
                </Badge>
              )}
              {isOpen ? (
                <ChevronUp className="h-4 w-4 ml-1" />
              ) : (
                <ChevronDown className="h-4 w-4 ml-1" />
              )}
            </Button>
          </CollapsibleTrigger>

          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-4 w-4" />
              Réinitialiser
            </Button>
          )}
        </div>

        <CollapsibleContent className={cn("space-y-3 pt-3", isOpen && "animate-accordion-down")}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="type-filter" className="text-xs">Type de texte</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger id="type-filter" className="h-9">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="statut-filter" className="text-xs">Statut</Label>
              <Select value={statutFilter} onValueChange={setStatutFilter}>
                <SelectTrigger id="statut-filter" className="h-9">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  {STATUT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="domaine-filter" className="text-xs">Domaine</Label>
              <Select value={domaineFilter} onValueChange={setDomaineFilter}>
                <SelectTrigger id="domaine-filter" className="h-9">
                  <SelectValue placeholder="Domaine" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les domaines</SelectItem>
                  {domaines.map((domaine) => (
                    <SelectItem key={domaine.id} value={domaine.id}>
                      {domaine.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sousdomaine-filter" className="text-xs">Sous-domaine</Label>
              <Select
                value={sousDomaineFilter}
                onValueChange={setSousDomaineFilter}
                disabled={domaineFilter === "all"}
              >
                <SelectTrigger id="sousdomaine-filter" className="h-9">
                  <SelectValue placeholder="Sous-domaine" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {sousDomaines.map((sousDomaine) => (
                    <SelectItem key={sousDomaine.id} value={sousDomaine.id}>
                      {sousDomaine.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="annee-filter" className="text-xs">Année</Label>
              <Input
                id="annee-filter"
                type="number"
                placeholder="Ex: 2024"
                value={anneeFilter === "all" ? "" : anneeFilter}
                onChange={(e) => setAnneeFilter(e.target.value || "all")}
                min="1900"
                max="2100"
                className="h-9"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={onApply} size="sm">
              Appliquer
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
