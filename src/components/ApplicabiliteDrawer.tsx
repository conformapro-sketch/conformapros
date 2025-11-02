import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, FileText, TrendingUp, ExternalLink } from "lucide-react";
import { applicableActesQueries } from "@/lib/bibliotheque-queries";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

interface ApplicabiliteDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteId: string;
  siteName: string;
}

export function ApplicabiliteDrawer({ open, onOpenChange, siteId, siteName }: ApplicabiliteDrawerProps) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statutFilter, setStatutFilter] = useState<string>("all");

  const { data: applicableActes, isLoading } = useQuery({
    queryKey: ["applicable-actes", siteId],
    queryFn: () => applicableActesQueries.getApplicableActesForSite(siteId),
    enabled: open,
  });

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "en_vigueur":
        return { label: "En vigueur", className: "bg-success text-success-foreground" };
      case "modifie":
        return { label: "Modifié", className: "bg-warning text-warning-foreground" };
      case "abroge":
        return { label: "Abrogé", className: "bg-destructive text-destructive-foreground" };
      default:
        return { label: statut, className: "" };
    }
  };

  const getMatchScoreLabel = (score: number) => {
    if (score >= 4) return { label: "Très pertinent", className: "bg-success text-success-foreground" };
    if (score >= 2) return { label: "Pertinent", className: "bg-primary text-primary-foreground" };
    return { label: "Applicable", className: "bg-secondary text-secondary-foreground" };
  };

  // Filter actes
  const filteredActes = applicableActes?.filter((acte: any) => {
    const matchesSearch =
      !searchTerm ||
      acte.intitule.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acte.reference_officielle.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatut = statutFilter === "all" || acte.statut_vigueur === statutFilter;

    return matchesSearch && matchesStatut;
  }) || [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Textes applicables
          </SheetTitle>
          <SheetDescription>
            Textes réglementaires pertinents pour: <strong>{siteName}</strong>
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un texte..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statutFilter} onValueChange={setStatutFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="en_vigueur">En vigueur</SelectItem>
                <SelectItem value="modifie">Modifié</SelectItem>
                <SelectItem value="abroge">Abrogé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results */}
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : filteredActes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Aucun texte applicable trouvé</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground mb-2">
                {filteredActes.length} texte(s) trouvé(s)
              </div>
              {filteredActes
                .sort((a: any, b: any) => b.match_score - a.match_score)
                .map((acte: any) => {
                  const statutInfo = getStatutBadge(acte.statut_vigueur);
                  const scoreInfo = getMatchScoreLabel(acte.match_score);

                  return (
                    <Card key={acte.acte_id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={scoreInfo.className}>
                                <TrendingUp className="h-3 w-3 mr-1" />
                                {scoreInfo.label}
                              </Badge>
                              <Badge className={statutInfo.className}>
                                {statutInfo.label}
                              </Badge>
                            </div>

                            <h4 className="font-medium text-foreground mb-1 line-clamp-2">
                              {acte.intitule}
                            </h4>

                            <p className="text-sm text-muted-foreground">
                              {acte.reference_officielle}
                            </p>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              navigate(`/bibliotheque/textes/${acte.acte_id}`);
                              onOpenChange(false);
                            }}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
