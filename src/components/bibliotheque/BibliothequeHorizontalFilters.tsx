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
import { Filter, ChevronDown, RotateCcw } from "lucide-react";
import { useState } from "react";

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
  { value: "loi", label: "Loi" },
  { value: "decret", label: "Décret" },
  { value: "arrete", label: "Arrêté" },
  { value: "circulaire", label: "Circulaire" },
  { value: "decision", label: "Décision" },
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
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center justify-between mb-4">
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            aria-label="Basculer les filtres"
          >
            <Filter className="h-4 w-4" />
            Filtres
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                {activeFiltersCount}
              </Badge>
            )}
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </Button>
        </CollapsibleTrigger>
      </div>

      <CollapsibleContent className="animate-accordion-down">
        <div className="bg-muted/30 rounded-lg border p-6 mb-4 space-y-6">
          {/* Ligne 1 : Type, Statut, Domaine */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type-filter">Type de texte</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger id="type-filter">
                  <SelectValue placeholder="Sélectionner un type" />
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

            <div className="space-y-2">
              <Label htmlFor="statut-filter">Statut</Label>
              <Select value={statutFilter} onValueChange={setStatutFilter}>
                <SelectTrigger id="statut-filter">
                  <SelectValue placeholder="Sélectionner un statut" />
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

            <div className="space-y-2">
              <Label htmlFor="domaine-filter">Domaine</Label>
              <Select value={domaineFilter} onValueChange={setDomaineFilter}>
                <SelectTrigger id="domaine-filter">
                  <SelectValue placeholder="Tous les domaines" />
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
          </div>

          {/* Ligne 2 : Sous-domaine, Année, Recherche */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sousdomaine-filter">Sous-domaine</Label>
              <Select
                value={sousDomaineFilter}
                onValueChange={setSousDomaineFilter}
                disabled={domaineFilter === "all"}
              >
                <SelectTrigger id="sousdomaine-filter">
                  <SelectValue placeholder="Tous les sous-domaines" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les sous-domaines</SelectItem>
                  {sousDomaines.map((sousDomaine) => (
                    <SelectItem key={sousDomaine.id} value={sousDomaine.id}>
                      {sousDomaine.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="annee-filter">Année</Label>
              <Input
                id="annee-filter"
                type="number"
                placeholder="Ex: 2024"
                value={anneeFilter === "all" ? "" : anneeFilter}
                onChange={(e) => setAnneeFilter(e.target.value || "all")}
                min="1900"
                max="2100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="search-filter">Recherche libre</Label>
              <Input
                id="search-filter"
                type="text"
                placeholder="Rechercher dans les textes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Ligne 3 : Boutons d'action */}
          <div className="flex items-center gap-3 pt-2">
            <Button onClick={onApply} size="sm">
              Appliquer les filtres
            </Button>
            <Button
              onClick={onReset}
              variant="ghost"
              size="sm"
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Réinitialiser
            </Button>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
