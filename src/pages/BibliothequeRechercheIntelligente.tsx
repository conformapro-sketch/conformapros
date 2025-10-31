import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  FileText,
  Calendar,
  Filter,
  ChevronRight
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { textesReglementairesQueries, domainesQueries } from "@/lib/textes-queries";

const TYPE_LABELS: Record<string, string> = {
  LOI: "Loi",
  ARRETE: "Arrêté",
  DECRET: "Décret",
  CIRCULAIRE: "Circulaire"
};

const STATUT_LABELS: Record<string, { label: string; className: string }> = {
  en_vigueur: { label: "En vigueur", className: "bg-success text-success-foreground" },
  modifie: { label: "Modifié", className: "bg-warning text-warning-foreground" },
  abroge: { label: "Abrogé", className: "bg-destructive text-destructive-foreground" },
  suspendu: { label: "Suspendu", className: "bg-secondary text-secondary-foreground" }
};

// Highlight search terms in text
const highlightText = (text: string | undefined | null, searchTerm: string) => {
  if (!text || !searchTerm.trim()) return text || '';
  
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  
  return parts.map((part, i) => 
    regex.test(part) ? 
      <mark key={i} className="bg-primary/20 text-foreground font-medium px-0.5 rounded">{part}</mark> : 
      part
  );
};

// Extract preview text with context around search term
const getPreview = (content: string, searchTerm: string, maxLength: number = 200) => {
  if (!searchTerm.trim()) {
    return content.substring(0, maxLength) + (content.length > maxLength ? "..." : "");
  }
  
  const lowerContent = content.toLowerCase();
  const lowerTerm = searchTerm.toLowerCase();
  const index = lowerContent.indexOf(lowerTerm);
  
  if (index === -1) {
    return content.substring(0, maxLength) + (content.length > maxLength ? "..." : "");
  }
  
  const start = Math.max(0, index - 80);
  const end = Math.min(content.length, index + searchTerm.length + 120);
  
  let preview = content.substring(start, end);
  if (start > 0) preview = "..." + preview;
  if (end < content.length) preview = preview + "...";
  
  return preview;
};

export default function BibliothequeRechercheIntelligente() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [domaineFilter, setDomaineFilter] = useState<string>("all");
  const [statutFilter, setStatutFilter] = useState<string>("all");
  const [anneeFilter, setAnneeFilter] = useState<string>("all");

  // Debounce search
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    const timer = setTimeout(() => {
      setDebouncedSearch(value);
    }, 300);
    return () => clearTimeout(timer);
  };

  const { data: domainesList } = useQuery({
    queryKey: ["domaines"],
    queryFn: () => domainesQueries.getActive(),
  });

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["smart-search", debouncedSearch, typeFilter, domaineFilter, statutFilter, anneeFilter],
    queryFn: () => textesReglementairesQueries.smartSearch({
      searchTerm: debouncedSearch,
      typeFilter: typeFilter !== "all" ? typeFilter : undefined,
      domaineFilter: domaineFilter !== "all" ? domaineFilter : undefined,
      statutFilter: statutFilter !== "all" ? statutFilter : undefined,
      anneeFilter: anneeFilter !== "all" ? anneeFilter : undefined,
    }),
    enabled: debouncedSearch.length >= 2,
  });

  const results = searchResults?.results || [];
  const totalCount = searchResults?.totalCount || 0;

  // Extract unique years from results
  const uniqueYears = Array.from(
    new Set(
      results
        .filter(r => r.type === 'texte')
        .map(r => r.data.annee)
        .filter((y): y is number => y !== null)
    )
  ).sort((a, b) => b - a);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
          Recherche intelligente
        </h1>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">
          Recherche avancée dans les textes et articles réglementaires
        </p>
      </div>

      {/* Search Bar */}
      <Card className="shadow-soft">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher par mot-clé dans titre, référence, ou contenu..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 text-base h-12"
              />
            </div>
            
            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filtres:</span>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Type de texte" />
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

              <Select value={domaineFilter} onValueChange={setDomaineFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Domaine" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les domaines</SelectItem>
                  {domainesList?.map((domaine) => (
                    <SelectItem key={domaine.id} value={domaine.id}>
                      {domaine.libelle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={anneeFilter} onValueChange={setAnneeFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Année" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les années</SelectItem>
                  {uniqueYears.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statutFilter} onValueChange={setStatutFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="en_vigueur">En vigueur</SelectItem>
                  <SelectItem value="modifie">Modifié</SelectItem>
                  <SelectItem value="abroge">Abrogé</SelectItem>
                  <SelectItem value="suspendu">Suspendu</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <FileText className="h-5 w-5 text-primary" />
            Résultats de recherche
          </CardTitle>
          <CardDescription className="text-sm">
            {debouncedSearch.length < 2 
              ? "Entrez au moins 2 caractères pour rechercher"
              : `${totalCount} résultat(s) trouvé(s)`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {debouncedSearch.length < 2 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <Search className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">
                Commencez à taper pour rechercher dans les textes et articles réglementaires
              </p>
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-muted-foreground">Recherche en cours...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground font-medium">Aucun résultat trouvé</p>
              <p className="text-sm text-muted-foreground">
                Essayez avec d'autres mots-clés ou filtres
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((result) => {
                if (result.type === 'texte') {
                  const texte = result.data;
                  const statutInfo = STATUT_LABELS[texte.statut_vigueur] || { label: texte.statut_vigueur, className: "" };
                  const typeLabel = TYPE_LABELS[texte.type] || texte.type;
                  const preview = texte.resume || texte.titre;

                  return (
                    <Card 
                      key={`texte-${result.id}`}
                      className="hover:shadow-soft transition-shadow cursor-pointer"
                      onClick={() => navigate(`/veille/bibliotheque/textes/${texte.id}`)}
                    >
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          {/* Badges */}
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {typeLabel}
                            </Badge>
                            <Badge className={statutInfo.className}>
                              {statutInfo.label}
                            </Badge>
                            {texte.date_publication && (
                              <Badge variant="secondary" className="text-xs">
                                <Calendar className="h-3 w-3 mr-1" />
                                {new Date(texte.date_publication).toLocaleDateString("fr-FR")}
                              </Badge>
                            )}
                            {texte.domaines?.map((d: any) => (
                              <Badge key={d.domaine.id} variant="secondary" className="text-xs">
                                {d.domaine.libelle}
                              </Badge>
                            ))}
                          </div>

                          {/* Title and Reference */}
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <h3 className="font-semibold text-foreground text-base">
                                  {highlightText(texte.titre, debouncedSearch)}
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {highlightText(texte.reference_officielle, debouncedSearch)}
                                </p>
                              </div>
                              <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                            </div>
                          </div>

                          {/* Preview */}
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {highlightText(getPreview(preview, debouncedSearch), debouncedSearch)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                } else {
                  // Article result
                  const article = result.data;
                  const texte = article.texte;
                  const statutInfo = STATUT_LABELS[texte.statut_vigueur] || { label: texte.statut_vigueur, className: "" };
                  const typeLabel = TYPE_LABELS[texte.type] || texte.type;
                  const preview = article.contenu || article.titre_court || "";

                  return (
                    <Card 
                      key={`article-${result.id}`}
                      className="hover:shadow-soft transition-shadow cursor-pointer border-l-4 border-l-primary"
                      onClick={() => navigate(`/veille/bibliotheque/textes/${texte.id}`)}
                    >
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          {/* Badges */}
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className="bg-primary text-primary-foreground">
                              Article {highlightText(article.numero, debouncedSearch)}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {typeLabel}
                            </Badge>
                            <Badge className={statutInfo.className}>
                              {statutInfo.label}
                            </Badge>
                            {texte.date_publication && (
                              <Badge variant="secondary" className="text-xs">
                                <Calendar className="h-3 w-3 mr-1" />
                                {new Date(texte.date_publication).toLocaleDateString("fr-FR")}
                              </Badge>
                            )}
                          </div>

                          {/* Article info */}
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                {article.titre_court && (
                                  <h3 className="font-semibold text-foreground text-base">
                                    {highlightText(article.titre_court, debouncedSearch)}
                                  </h3>
                                )}
                                <p className="text-sm text-muted-foreground mt-1">
                                  {highlightText(texte.titre, debouncedSearch)}
                                  {" • "}
                                  <span className="text-xs">{highlightText(texte.reference_officielle, debouncedSearch)}</span>
                                </p>
                              </div>
                              <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                            </div>
                          </div>

                          {/* Content Preview */}
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {highlightText(getPreview(preview, debouncedSearch), debouncedSearch)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
