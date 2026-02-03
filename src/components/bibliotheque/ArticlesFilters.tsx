import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

interface Domaine {
  id: string;
  libelle: string;
  code?: string;
}

interface SousDomaine {
  id: string;
  libelle: string;
  domaine_id: string;
}

interface ArticlesFiltersProps {
  typeFilter: string;
  setTypeFilter: (value: string) => void;
  domaineFilter: string;
  setDomaineFilter: (value: string) => void;
  sousDomaineFilter: string;
  setSousDomaineFilter: (value: string) => void;
  anneeFilter: string;
  setAnneeFilter: (value: string) => void;
  statutVersionFilter: string;
  setStatutVersionFilter: (value: string) => void;
  exigenceOnly: boolean;
  setExigenceOnly: (value: boolean) => void;
  introductifOnly: boolean;
  setIntroductifOnly: (value: boolean) => void;
  domaines: Domaine[];
  sousDomaines: SousDomaine[];
  years: number[];
  onReset: () => void;
}

export function ArticlesFilters({
  typeFilter,
  setTypeFilter,
  domaineFilter,
  setDomaineFilter,
  sousDomaineFilter,
  setSousDomaineFilter,
  anneeFilter,
  setAnneeFilter,
  statutVersionFilter,
  setStatutVersionFilter,
  exigenceOnly,
  setExigenceOnly,
  introductifOnly,
  setIntroductifOnly,
  domaines,
  sousDomaines,
  years,
  onReset,
}: ArticlesFiltersProps) {
  const typeOptions = [
    { value: "all", label: "Tous les types" },
    { value: "loi", label: "Loi" },
    { value: "decret", label: "Décret" },
    { value: "arrete", label: "Arrêté" },
    { value: "circulaire", label: "Circulaire" },
  ];

  const statutOptions = [
    { value: "all", label: "Tous les statuts" },
    { value: "en_vigueur", label: "En vigueur" },
    { value: "remplacee", label: "Remplacé" },
    { value: "abrogee", label: "Abrogé" },
  ];

  // Filter sous-domaines based on selected domaine
  const filteredSousDomaines = domaineFilter && domaineFilter !== "all"
    ? sousDomaines.filter(sd => sd.domaine_id === domaineFilter)
    : sousDomaines;

  const hasActiveFilters = 
    typeFilter !== "all" ||
    domaineFilter !== "all" ||
    sousDomaineFilter !== "all" ||
    anneeFilter !== "all" ||
    statutVersionFilter !== "all" ||
    exigenceOnly ||
    introductifOnly;

  return (
    <div className="space-y-4">
      {/* Main filters row */}
      <div className="flex flex-wrap gap-3 items-end">
        {/* Type texte */}
        <div className="flex flex-col gap-1.5 min-w-[150px]">
          <Label className="text-xs text-muted-foreground">Type de texte</Label>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {typeOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Domaine */}
        <div className="flex flex-col gap-1.5 min-w-[180px]">
          <Label className="text-xs text-muted-foreground">Domaine</Label>
          <Select value={domaineFilter} onValueChange={(value) => {
            setDomaineFilter(value);
            // Reset sous-domaine when domaine changes
            if (sousDomaineFilter !== "all") {
              setSousDomaineFilter("all");
            }
          }}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Domaine" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les domaines</SelectItem>
              {domaines.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.libelle}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sous-domaine */}
        <div className="flex flex-col gap-1.5 min-w-[200px]">
          <Label className="text-xs text-muted-foreground">Sous-domaine</Label>
          <Select value={sousDomaineFilter} onValueChange={setSousDomaineFilter}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Sous-domaine" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les sous-domaines</SelectItem>
              {filteredSousDomaines.map((sd) => (
                <SelectItem key={sd.id} value={sd.id}>
                  {sd.libelle}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Année */}
        <div className="flex flex-col gap-1.5 min-w-[120px]">
          <Label className="text-xs text-muted-foreground">Année</Label>
          <Select value={anneeFilter} onValueChange={setAnneeFilter}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Année" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              {years.map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Statut version */}
        <div className="flex flex-col gap-1.5 min-w-[150px]">
          <Label className="text-xs text-muted-foreground">Statut version</Label>
          <Select value={statutVersionFilter} onValueChange={setStatutVersionFilter}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              {statutOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Reset button */}
        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onReset}
            className="h-9 px-3"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Réinitialiser
          </Button>
        )}
      </div>

      {/* Checkboxes row */}
      <div className="flex gap-6">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="exigence-only" 
            checked={exigenceOnly}
            onCheckedChange={(checked) => setExigenceOnly(checked === true)}
          />
          <Label 
            htmlFor="exigence-only" 
            className="text-sm cursor-pointer"
          >
            Exigences uniquement
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox 
            id="introductif-only" 
            checked={introductifOnly}
            onCheckedChange={(checked) => setIntroductifOnly(checked === true)}
          />
          <Label 
            htmlFor="introductif-only" 
            className="text-sm cursor-pointer"
          >
            Introductifs uniquement
          </Label>
        </div>
      </div>
    </div>
  );
}
