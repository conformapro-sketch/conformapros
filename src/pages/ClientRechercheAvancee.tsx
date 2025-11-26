import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { rechercheReglementaireAvancee, type SearchFilters, type SearchResult } from "@/lib/recherche-reglementaire-api";
import { domainesQueries, sousDomainesQueries } from "@/lib/textes-queries";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Search, Home, FileText, AlertCircle, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useDebounce } from "@/hooks/useDebounce";

const TEXT_TYPES = [
  { value: "loi", label: "Loi" },
  { value: "decret", label: "Décret" },
  { value: "arrete", label: "Arrêté" },
  { value: "circulaire", label: "Circulaire" },
];

export default function ClientRechercheAvancee() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedDomaineId, setSelectedDomaineId] = useState<string>("");
  const [selectedSousDomaineIds, setSelectedSousDomaineIds] = useState<string[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const debouncedKeyword = useDebounce(keyword, 500);

  // Fetch domains
  const { data: domaines, isLoading: domainesLoading } = useQuery({
    queryKey: ["domaines-actifs"],
    queryFn: () => domainesQueries.getActive(),
  });

  // Fetch sub-domains for selected domain
  const { data: sousDomaines, isLoading: sousDomainesLoading } = useQuery({
    queryKey: ["sous-domaines", selectedDomaineId],
    queryFn: () => sousDomainesQueries.getActive(selectedDomaineId),
    enabled: !!selectedDomaineId,
  });

  // Build search filters
  const filters: SearchFilters = {
    article_keywords: debouncedKeyword || undefined,
    texte_types: selectedTypes.length > 0 ? selectedTypes : undefined,
    domaine_ids: selectedDomaineId ? [selectedDomaineId] : undefined,
    sous_domaine_ids: selectedSousDomaineIds.length > 0 ? selectedSousDomaineIds : undefined,
    page: 1,
    page_size: 50,
  };

  // Perform search
  const { data: searchResults, isLoading: searchLoading, error: searchError } = useQuery({
    queryKey: ["recherche-reglementaire", filters],
    queryFn: () => rechercheReglementaireAvancee(filters),
    enabled: hasSearched,
  });

  const handleSearch = () => {
    setHasSearched(true);
  };

  const handleReset = () => {
    setKeyword("");
    setSelectedTypes([]);
    setSelectedDomaineId("");
    setSelectedSousDomaineIds([]);
    setHasSearched(false);
  };

  const handleTypeToggle = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleSousDomaineToggle = (sdId: string) => {
    setSelectedSousDomaineIds((prev) =>
      prev.includes(sdId) ? prev.filter((id) => id !== sdId) : [...prev, sdId]
    );
  };

  const truncateText = (text: string, maxLength: number = 200): string => {
    if (!text || text.length <= maxLength) return text || "";
    return text.substring(0, maxLength) + "...";
  };

  const highlightKeyword = (text: string, keyword: string): string => {
    if (!keyword || !text) return text;
    const regex = new RegExp(`(${keyword})`, "gi");
    return text.replace(regex, "<mark>$1</mark>");
  };

  return (
    <div className="p-8 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">
              <Home className="h-4 w-4" />
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Recherche avancée</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Recherche avancée</h1>
          <p className="text-muted-foreground mt-1">
            Recherchez des articles réglementaires par mots-clés, type de texte et domaine
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters sidebar */}
        <Card className="p-6 h-fit space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Filtres de recherche</h2>
          </div>

          {/* Keyword search */}
          <div className="space-y-2">
            <Label htmlFor="keyword">Mot-clé</Label>
            <Input
              id="keyword"
              placeholder="Rechercher dans le contenu..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
            />
          </div>

          <Separator />

          {/* Text types */}
          <div className="space-y-3">
            <Label>Type de texte</Label>
            {TEXT_TYPES.map((type) => (
              <div key={type.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`type-${type.value}`}
                  checked={selectedTypes.includes(type.value)}
                  onCheckedChange={() => handleTypeToggle(type.value)}
                />
                <label
                  htmlFor={`type-${type.value}`}
                  className="text-sm cursor-pointer"
                >
                  {type.label}
                </label>
              </div>
            ))}
          </div>

          <Separator />

          {/* Domain filter */}
          <div className="space-y-2">
            <Label htmlFor="domaine">Domaine</Label>
            {domainesLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select value={selectedDomaineId} onValueChange={setSelectedDomaineId}>
                <SelectTrigger id="domaine">
                  <SelectValue placeholder="Tous les domaines" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous les domaines</SelectItem>
                  {domaines?.map((domaine) => (
                    <SelectItem key={domaine.id} value={domaine.id}>
                      {domaine.libelle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Sub-domain filter */}
          {selectedDomaineId && (
            <div className="space-y-3">
              <Label>Sous-domaines</Label>
              {sousDomainesLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {sousDomaines?.map((sd) => (
                    <div key={sd.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`sd-${sd.id}`}
                        checked={selectedSousDomaineIds.includes(sd.id)}
                        onCheckedChange={() => handleSousDomaineToggle(sd.id)}
                      />
                      <label
                        htmlFor={`sd-${sd.id}`}
                        className="text-sm cursor-pointer"
                      >
                        {sd.libelle}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <Separator />

          <div className="flex gap-2">
            <Button onClick={handleSearch} className="flex-1">
              <Search className="h-4 w-4 mr-2" />
              Rechercher
            </Button>
            <Button onClick={handleReset} variant="outline">
              Réinitialiser
            </Button>
          </div>
        </Card>

        {/* Results */}
        <div className="lg:col-span-3 space-y-4">
          {!hasSearched && (
            <Card className="p-12 text-center">
              <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Effectuez une recherche</h3>
              <p className="text-sm text-muted-foreground">
                Utilisez les filtres et cliquez sur "Rechercher" pour trouver des articles
                réglementaires
              </p>
            </Card>
          )}

          {hasSearched && searchLoading && (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="p-6">
                  <Skeleton className="h-6 w-3/4 mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </Card>
              ))}
            </div>
          )}

          {hasSearched && searchError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Erreur lors de la recherche: {searchError.message}
              </AlertDescription>
            </Alert>
          )}

          {hasSearched && !searchLoading && searchResults && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {searchResults.total} résultat{searchResults.total > 1 ? "s" : ""} trouvé
                  {searchResults.total > 1 ? "s" : ""}
                </p>
              </div>

              {searchResults.total === 0 && (
                <Card className="p-12 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Aucun résultat</h3>
                  <p className="text-sm text-muted-foreground">
                    Essayez de modifier vos critères de recherche
                  </p>
                </Card>
              )}

              <div className="space-y-4">
                {searchResults.results.map((result: SearchResult) => (
                  <Card
                    key={result.article_id}
                    className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => navigate(`/client/bibliotheque/textes/${result.texte_id}`)}
                  >
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">
                              {result.texte_type.toUpperCase()}
                            </Badge>
                            <span className="font-medium text-sm">
                              {result.texte_reference}
                            </span>
                          </div>
                          <h3 className="font-semibold text-lg">
                            {result.texte_titre}
                          </h3>
                        </div>
                        <div className="flex gap-2">
                          {result.article_porte_exigence && (
                            <Badge variant="destructive">
                              Exigence réglementaire
                            </Badge>
                          )}
                          {!result.article_porte_exigence &&
                            result.article_est_introductif && (
                              <Badge variant="secondary">Introductif</Badge>
                            )}
                        </div>
                      </div>

                      {/* Article info */}
                      <div className="border-l-2 border-primary pl-4">
                        <div className="font-medium text-sm mb-1">
                          Article {result.article_numero}: {result.article_titre}
                        </div>
                        {result.article_resume && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {result.article_resume}
                          </p>
                        )}
                        <div
                          className="text-sm text-muted-foreground"
                          dangerouslySetInnerHTML={{
                            __html: highlightKeyword(
                              truncateText(result.version_contenu, 300),
                              debouncedKeyword
                            ),
                          }}
                        />
                      </div>

                      {/* Metadata footer */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                        <div>
                          Version {result.version_numero} • En vigueur depuis le{" "}
                          {new Date(result.version_date_effet).toLocaleDateString("fr-FR")}
                        </div>
                        {result.domaines.length > 0 && (
                          <div className="flex gap-1">
                            {result.domaines.map((d) => (
                              <Badge key={d.id} variant="outline" className="text-xs">
                                {d.libelle}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
