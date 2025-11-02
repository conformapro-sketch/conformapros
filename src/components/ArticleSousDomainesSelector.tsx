import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery } from "@tanstack/react-query";
import { sousDomainesQueries, domainesQueries } from "@/lib/textes-queries";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";

interface ArticleSousDomainesSelectorProps {
  selectedSousDomaines: string[];
  onSousDomainesChange: (sousDomaineIds: string[]) => void;
  texteDomaineIds?: string[]; // Optional: filter by parent text domains
}

export function ArticleSousDomainesSelector({
  selectedSousDomaines,
  onSousDomainesChange,
  texteDomaineIds,
}: ArticleSousDomainesSelectorProps) {
  const [expandedDomaines, setExpandedDomaines] = useState<string[]>([]);

  const { data: domaines } = useQuery({
    queryKey: ["domaines"],
    queryFn: () => domainesQueries.getActive(),
  });

  const { data: allSousDomaines } = useQuery({
    queryKey: ["sous-domaines"],
    queryFn: () => sousDomainesQueries.getActive(),
  });

  // Filter domains and sub-domains if texteDomaineIds is provided
  const filteredDomaines = texteDomaineIds && texteDomaineIds.length > 0
    ? domaines?.filter((d) => texteDomaineIds.includes(d.id))
    : domaines;

  // Group sous-domaines by domaine
  const sousDomainesByDomaine = allSousDomaines?.reduce((acc, sd) => {
    if (!acc[sd.domaine_id]) {
      acc[sd.domaine_id] = [];
    }
    acc[sd.domaine_id].push(sd);
    return acc;
  }, {} as Record<string, typeof allSousDomaines>);

  const toggleDomaine = (domaineId: string) => {
    setExpandedDomaines((prev) =>
      prev.includes(domaineId)
        ? prev.filter((id) => id !== domaineId)
        : [...prev, domaineId]
    );
  };

  const handleSousDomaineToggle = (sousDomaineId: string, checked: boolean) => {
    if (checked) {
      onSousDomainesChange([...selectedSousDomaines, sousDomaineId]);
    } else {
      onSousDomainesChange(selectedSousDomaines.filter((id) => id !== sousDomaineId));
    }
  };

  if (!filteredDomaines || filteredDomaines.length === 0) {
    return (
      <div className="space-y-2">
        <Label>Sous-domaines d'application</Label>
        <div className="text-sm text-muted-foreground p-3 border rounded-lg">
          Aucun domaine disponible. Veuillez d'abord sélectionner des domaines pour le texte.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>Sous-domaines d'application</Label>
      <div className="border rounded-lg p-3 max-h-60 overflow-y-auto space-y-1">
        {filteredDomaines.map((domaine) => {
          const sousDomaines = sousDomainesByDomaine?.[domaine.id] || [];
          const isExpanded = expandedDomaines.includes(domaine.id);

          return (
            <div key={domaine.id} className="space-y-1">
              <button
                type="button"
                onClick={() => toggleDomaine(domaine.id)}
                className="flex items-center w-full text-left py-1.5 px-2 hover:bg-accent rounded-md transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 mr-2 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 mr-2 text-muted-foreground" />
                )}
                <span className="font-medium text-sm">{domaine.libelle}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  ({sousDomaines.length})
                </span>
              </button>

              {isExpanded && sousDomaines.length > 0 && (
                <div className="ml-6 space-y-2 py-1">
                  {sousDomaines.map((sousDomaine) => (
                    <div key={sousDomaine.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`sd-${sousDomaine.id}`}
                        checked={selectedSousDomaines.includes(sousDomaine.id)}
                        onCheckedChange={(checked) =>
                          handleSousDomaineToggle(sousDomaine.id, checked as boolean)
                        }
                      />
                      <label
                        htmlFor={`sd-${sousDomaine.id}`}
                        className="text-sm cursor-pointer"
                      >
                        {sousDomaine.libelle}
                      </label>
                    </div>
                  ))}
                </div>
              )}

              {isExpanded && sousDomaines.length === 0 && (
                <div className="ml-6 text-xs text-muted-foreground py-1">
                  Aucun sous-domaine disponible
                </div>
              )}
            </div>
          );
        })}
      </div>
      {selectedSousDomaines.length > 0 && (
        <div className="text-xs text-muted-foreground">
          {selectedSousDomaines.length} sous-domaine(s) sélectionné(s)
        </div>
      )}
    </div>
  );
}
