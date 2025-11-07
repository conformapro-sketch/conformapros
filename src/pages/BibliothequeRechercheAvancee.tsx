import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  FileText,
  Calendar,
  Filter,
  ChevronRight,
  X,
  Sparkles
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { textesReglementairesQueries, domainesQueries } from "@/lib/textes-queries";
import { fetchSousDomainesByDomaine } from "@/lib/domaines-queries";
import { BibliothequeSearchBar } from "@/components/bibliotheque/BibliothequeSearchBar";
import { stripHtml } from "@/lib/sanitize-html";
import { ArticleViewModal } from "@/components/ArticleViewModal";
import { TexteViewModal } from "@/components/TexteViewModal";

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

export default function BibliothequeRechercheAvancee() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [domaineFilter, setDomaineFilter] = useState<string>("all");
  const [sousDomaineFilter, setSousDomaineFilter] = useState<string>("all");
  const [statutFilter, setStatutFilter] = useState<string>("all");
  const [anneeFilter, setAnneeFilter] = useState<string>("all");
  
  // Modal states
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const [selectedTexte, setSelectedTexte] = useState<string | null>(null);
  const [articleModalOpen, setArticleModalOpen] = useState(false);
  const [texteModalOpen, setTexteModalOpen] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: domainesList } = useQuery({
    queryKey: ["domaines"],
    queryFn: () => domainesQueries.getActive(),
  });

  const { data: sousDomainesList } = useQuery({
    queryKey: ["sous-domaines", domaineFilter],
    queryFn: () => fetchSousDomainesByDomaine(domaineFilter),
    enabled: domaineFilter !== "all",
  });

  // Reset sous-domaine when domaine changes
  useEffect(() => {
    if (domaineFilter === "all") {
      setSousDomaineFilter("all");
    }
  }, [domaineFilter]);

  // Active filters count
  const activeFiltersCount = [
    typeFilter !== "all",
    domaineFilter !== "all",
    sousDomaineFilter !== "all",
    statutFilter !== "all",
    anneeFilter !== "all"
  ].filter(Boolean).length;

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["smart-search", debouncedSearch, typeFilter, domaineFilter, sousDomaineFilter, statutFilter, anneeFilter],
    queryFn: () => textesReglementairesQueries.smartSearch({
      searchTerm: debouncedSearch.length >= 2 ? debouncedSearch : "",
      typeFilter: typeFilter !== "all" ? typeFilter : undefined,
      domaineFilter: domaineFilter !== "all" ? domaineFilter : undefined,
      sousDomaineFilter: sousDomaineFilter !== "all" ? sousDomaineFilter : undefined,
      statutFilter: statutFilter !== "all" ? statutFilter : undefined,
      anneeFilter: anneeFilter !== "all" ? anneeFilter : undefined,
    }),
    enabled: debouncedSearch.length >= 2 || activeFiltersCount > 0,
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

  const clearAllFilters = () => {
    setTypeFilter("all");
    setDomaineFilter("all");
    setSousDomaineFilter("all");
    setStatutFilter("all");
    setAnneeFilter("all");
  };

  const getDomaineLabel = (id: string) => {
    return domainesList?.find(d => d.id === id)?.libelle || id;
  };

  const getSousDomaineLabel = (id: string) => {
    return sousDomainesList?.find(sd => sd.id === id)?.libelle || id;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-primary" />
            Recherche avancée
          </h1>
          <p className="text-muted-foreground mt-2 text-sm md:text-base">
            Recherche multicritères dans les textes et articles réglementaires
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="border-2 shadow-lg">
        <CardContent className="pt-6">
          <BibliothequeSearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            isLoading={isLoading}
            resultCount={debouncedSearch.length >= 2 ? totalCount : undefined}
          />
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="border shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              Filtres de recherche
              {activeFiltersCount > 0 && (
                <Badge variant="default" className="ml-2">
                  {activeFiltersCount}
                </Badge>
              )}
            </CardTitle>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-8 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Effacer tout
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filter selects */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Type de texte" />
              </SelectTrigger>
              <SelectContent className="z-50 bg-popover">
                <SelectItem value="all">Tous les types</SelectItem>
                {Object.entries(TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={domaineFilter} onValueChange={setDomaineFilter}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Domaine" />
              </SelectTrigger>
              <SelectContent className="z-50 bg-popover">
                <SelectItem value="all">Tous les domaines</SelectItem>
                {domainesList?.map((domaine) => (
                  <SelectItem key={domaine.id} value={domaine.id}>
                    {domaine.libelle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={sousDomaineFilter} 
              onValueChange={setSousDomaineFilter}
              disabled={domaineFilter === "all"}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Sous-domaine" />
              </SelectTrigger>
              <SelectContent className="z-50 bg-popover">
                <SelectItem value="all">Tous les sous-domaines</SelectItem>
                {sousDomainesList?.map((sousDomaine) => (
                  <SelectItem key={sousDomaine.id} value={sousDomaine.id}>
                    {sousDomaine.libelle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={anneeFilter} onValueChange={setAnneeFilter}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Année" />
              </SelectTrigger>
              <SelectContent className="z-50 bg-popover">
                <SelectItem value="all">Toutes les années</SelectItem>
                {uniqueYears.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statutFilter} onValueChange={setStatutFilter}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent className="z-50 bg-popover">
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="en_vigueur">En vigueur</SelectItem>
                <SelectItem value="modifie">Modifié</SelectItem>
                <SelectItem value="abroge">Abrogé</SelectItem>
                <SelectItem value="suspendu">Suspendu</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active filters tags */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              {typeFilter !== "all" && (
                <Badge variant="secondary" className="gap-1 pr-1">
                  Type: {TYPE_LABELS[typeFilter]}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => setTypeFilter("all")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {domaineFilter !== "all" && (
                <Badge variant="secondary" className="gap-1 pr-1">
                  Domaine: {getDomaineLabel(domaineFilter)}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => setDomaineFilter("all")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {sousDomaineFilter !== "all" && (
                <Badge variant="secondary" className="gap-1 pr-1">
                  Sous-domaine: {getSousDomaineLabel(sousDomaineFilter)}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => setSousDomaineFilter("all")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {anneeFilter !== "all" && (
                <Badge variant="secondary" className="gap-1 pr-1">
                  Année: {anneeFilter}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => setAnneeFilter("all")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {statutFilter !== "all" && (
                <Badge variant="secondary" className="gap-1 pr-1">
                  Statut: {STATUT_LABELS[statutFilter]?.label}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => setStatutFilter("all")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      <Card className="border shadow-lg">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-5 w-5 text-primary" />
            Résultats de recherche
          </CardTitle>
          <CardDescription className="text-sm">
            {debouncedSearch.length < 2 && activeFiltersCount === 0
              ? "Utilisez la barre de recherche OU les filtres pour trouver des textes et articles"
              : `${totalCount} résultat${totalCount > 1 ? "s" : ""} trouvé${totalCount > 1 ? "s" : ""}`
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {debouncedSearch.length < 2 && activeFiltersCount === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <div className="rounded-full bg-primary/10 p-4">
                <Search className="h-12 w-12 text-primary" />
              </div>
              <div>
                <p className="text-lg font-medium text-foreground">
                  Commencez votre recherche
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Utilisez la barre de recherche OU les filtres pour trouver des textes et articles
                </p>
              </div>
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">Recherche en cours...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <div className="rounded-full bg-muted p-4">
                <FileText className="h-12 w-12 text-muted-foreground" />
              </div>
              <div>
                <p className="text-lg font-medium text-foreground">Aucun résultat trouvé</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Essayez avec d'autres mots-clés ou modifiez les filtres
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((result) => {
                if (result.type === 'texte') {
                  const texte = result.data;
                  const statutInfo = STATUT_LABELS[texte.statut_vigueur] || { label: texte.statut_vigueur, className: "" };
                  const typeLabel = TYPE_LABELS[texte.type_acte] || texte.type_acte;
                  const previewSource = texte.resume || texte.intitule || "";
                  const previewText = stripHtml(previewSource);

                  return (
                    <Card 
                      key={`texte-${result.id}`}
                      className="hover:shadow-md hover:border-primary/50 transition-all cursor-pointer group"
                      onClick={() => {
                        setSelectedTexte(texte.id);
                        setTexteModalOpen(true);
                      }}
                    >
                      <CardContent className="pt-5 pb-4">
                        <div className="space-y-3">
                          {/* Badges */}
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="text-xs font-medium">
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
                            {texte.domaines?.filter((d: any) => d.domaine).map((d: any) => (
                              <Badge key={d.domaine.id} variant="secondary" className="text-xs">
                                {d.domaine.libelle}
                              </Badge>
                            ))}
                          </div>

                          {/* Title and Reference */}
                          <div>
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 space-y-1">
                                <h3 className="font-semibold text-foreground text-base leading-snug group-hover:text-primary transition-colors">
                                  {highlightText(texte.intitule, debouncedSearch)}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {highlightText(texte.reference_officielle, debouncedSearch)}
                                </p>
                              </div>
                              <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 group-hover:text-primary transition-colors" />
                            </div>
                          </div>

                          {/* Preview */}
                          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                            {highlightText(getPreview(previewText, debouncedSearch), debouncedSearch)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                } else {
                  // Article result
                  const article = result.data;
                  const texte = article.texte;
                  
                  // Skip if texte is null
                  if (!texte) return null;
                  
                  const statutInfo = STATUT_LABELS[texte.statut_vigueur] || { label: texte.statut_vigueur, className: "" };
                  const typeLabel = TYPE_LABELS[texte.type_acte] || texte.type_acte;
                  const previewSource = article.contenu || article.titre_court || "";
                  const previewText = stripHtml(previewSource);

                  return (
                    <Card 
                      key={`article-${result.id}`}
                      className="hover:shadow-md hover:border-primary transition-all cursor-pointer border-l-4 border-l-primary/60 group"
                      onClick={() => navigate(`/bibliotheque/textes/${texte.id}`)}
                    >
                      <CardContent className="pt-5 pb-4">
                        <div className="space-y-3">
                          {/* Badges */}
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className="bg-primary text-primary-foreground font-medium">
                              {highlightText(article.numero_article, debouncedSearch)}
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
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 space-y-1">
                                {article.titre_court && (
                                  <h3 className="font-semibold text-foreground text-base leading-snug group-hover:text-primary transition-colors">
                                    {highlightText(article.titre_court, debouncedSearch)}
                                  </h3>
                                )}
                                <p className="text-sm text-muted-foreground">
                                  {highlightText(texte.intitule, debouncedSearch)}
                                  {" • "}
                                  <span className="text-xs">{highlightText(texte.reference_officielle, debouncedSearch)}</span>
                                </p>
                              </div>
                              <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 group-hover:text-primary transition-colors" />
                            </div>
                          </div>

                          {/* Content Preview */}
                          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                            {highlightText(getPreview(previewText, debouncedSearch), debouncedSearch)}
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

      {/* Modals */}
      <ArticleViewModal
        open={articleModalOpen}
        onOpenChange={setArticleModalOpen}
        article={selectedArticle?.article}
        texte={selectedArticle?.texte}
      />

      <TexteViewModal
        open={texteModalOpen}
        onOpenChange={setTexteModalOpen}
        texteId={selectedTexte || ""}
      />
    </div>
  );
}
