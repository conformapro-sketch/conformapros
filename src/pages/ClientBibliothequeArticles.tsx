import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { PaginationControls } from "@/components/shared/PaginationControls";
import { Search, BookOpen, Home, Eye } from "lucide-react";
import { useSiteContext } from "@/hooks/useSiteContext";
import { supabaseAny as supabase } from "@/lib/supabase-any";
import { clientBibliothequeQueries } from "@/lib/client-bibliotheque-queries";
import { ArticleQuickViewModal } from "@/components/bibliotheque/ArticleQuickViewModal";
import type { ArticleWithDetails } from "@/lib/articles-queries";

interface ArticleListItem {
  id: string;
  numero: string;
  titre: string;
  resume: string | null;
  porte_exigence: boolean;
  est_introductif: boolean;
  texte_id: string;
  texte_reference?: string;
  texte_titre?: string;
  sous_domaines?: Array<{ id: string; code: string; libelle: string }>;
}

export default function ClientBibliothequeArticles() {
  const { currentSite, isLoading: isSiteLoading } = useSiteContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [domaineFilter, setDomaineFilter] = useState<string>("all");
  const [exigenceFilter, setExigenceFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedArticle, setSelectedArticle] = useState<ArticleListItem | null>(null);

  const currentSiteId = currentSite?.id;

  // Fetch authorized domains for the current site
  const { data: authorizedDomains = [], isLoading: domainesLoading } = useQuery({
    queryKey: ["authorized-domaines", currentSiteId],
    queryFn: () => clientBibliothequeQueries.getAuthorizedDomains(currentSiteId!),
    enabled: !!currentSiteId,
  });

  // Fetch articles filtered by site's authorized domains
  const { data: result, isLoading: articlesLoading } = useQuery({
    queryKey: ["client-articles", currentSiteId, searchTerm, domaineFilter, exigenceFilter, page, pageSize],
    queryFn: async () => {
      if (!currentSiteId || authorizedDomains.length === 0) {
        return { data: [], count: 0, totalPages: 1 };
      }

      const domainIds = domaineFilter !== "all" 
        ? [domaineFilter] 
        : authorizedDomains.map(d => d.id);

      // Build query for articles in authorized domains
      let query = supabase
        .from("articles")
        .select(`
          id,
          numero,
          titre,
          resume,
          porte_exigence,
          est_introductif,
          texte_id,
          textes_reglementaires (
            id,
            reference,
            titre
          ),
          article_sous_domaines (
            sous_domaines_application (
              id,
              code,
              libelle,
              domaine_id
            )
          )
        `, { count: "exact" })
        .order("numero");

      // Filter by search term
      if (searchTerm) {
        query = query.or(`numero.ilike.%${searchTerm}%,titre.ilike.%${searchTerm}%,resume.ilike.%${searchTerm}%`);
      }

      // Filter by exigence
      if (exigenceFilter === "exigence") {
        query = query.eq("porte_exigence", true);
      } else if (exigenceFilter === "introductif") {
        query = query.eq("est_introductif", true);
      }

      // Pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;
      
      if (error) throw error;

      // Filter by domain and transform data
      const filteredData = (data || [])
        .filter((article: any) => {
          const articleDomainIds = article.article_sous_domaines
            ?.map((asd: any) => asd.sous_domaines_application?.domaine_id)
            .filter(Boolean) || [];
          return articleDomainIds.some((id: string) => domainIds.includes(id));
        })
        .map((article: any) => ({
          id: article.id,
          numero: article.numero,
          titre: article.titre,
          resume: article.resume,
          porte_exigence: article.porte_exigence,
          est_introductif: article.est_introductif,
          texte_id: article.texte_id,
          texte_reference: article.textes_reglementaires?.reference,
          texte_titre: article.textes_reglementaires?.titre,
          sous_domaines: article.article_sous_domaines
            ?.map((asd: any) => asd.sous_domaines_application)
            .filter(Boolean) || [],
        }));

      return {
        data: filteredData as ArticleListItem[],
        count: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    },
    enabled: !!currentSiteId && !domainesLoading,
  });

  const articles = result?.data || [];
  const totalCount = result?.count || 0;
  const totalPages = result?.totalPages || 1;
  const isLoading = articlesLoading || domainesLoading || isSiteLoading;

  if (isSiteLoading) {
    return (
      <div className="container mx-auto py-6">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!currentSiteId) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">
                Aucun site sélectionné. Veuillez sélectionner un site pour accéder aux articles.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">
              <Home className="h-4 w-4" />
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          {currentSite && (
            <>
              <BreadcrumbItem>
                <BreadcrumbLink>{currentSite.nom}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </>
          )}
          <BreadcrumbItem>
            <BreadcrumbLink href="/client-bibliotheque">Bibliothèque</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Articles</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header - NO CREATE BUTTON for clients */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Articles réglementaires</h1>
          <p className="text-muted-foreground mt-2">
            Articles applicables à votre site
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="shadow-soft">
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Search */}
            <div className="space-y-2">
              <Label>Recherche</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par numéro ou titre..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Domain Filter */}
            <div className="space-y-2">
              <Label>Domaine réglementaire</Label>
              <Select
                value={domaineFilter}
                onValueChange={(val) => {
                  setDomaineFilter(val);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les domaines" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les domaines autorisés</SelectItem>
                  {authorizedDomains.map((domaine) => (
                    <SelectItem key={domaine.id} value={domaine.id}>
                      {domaine.libelle} ({domaine.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type Filter */}
            <div className="space-y-2">
              <Label>Type d'article</Label>
              <Select
                value={exigenceFilter}
                onValueChange={(val) => {
                  setExigenceFilter(val);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les articles</SelectItem>
                  <SelectItem value="exigence">Exigences réglementaires</SelectItem>
                  <SelectItem value="introductif">Articles introductifs</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Articles
          </CardTitle>
          <CardDescription>
            {isLoading ? (
              <Skeleton className="h-4 w-32" />
            ) : (
              `${totalCount} article(s) trouvé(s)`
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : articles.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-28">Numéro</TableHead>
                      <TableHead>Titre</TableHead>
                      <TableHead className="w-40">Texte source</TableHead>
                      <TableHead className="w-32">Type</TableHead>
                      <TableHead>Domaines</TableHead>
                      <TableHead className="w-24 text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {articles.map((article) => (
                      <TableRow key={article.id}>
                        <TableCell className="font-mono font-medium">
                          {article.numero}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-md line-clamp-2">
                            {article.titre}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {article.texte_reference || "—"}
                        </TableCell>
                        <TableCell>
                          {article.porte_exigence ? (
                            <Badge variant="default" className="text-xs">
                              Exigence
                            </Badge>
                          ) : article.est_introductif ? (
                            <Badge variant="secondary" className="text-xs">
                              Introductif
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              Standard
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {article.sous_domaines && article.sous_domaines.length > 0 ? (
                              article.sous_domaines.slice(0, 2).map((sd) => (
                                <Badge key={sd.id} variant="outline" className="text-xs">
                                  {sd.code}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                            {article.sous_domaines && article.sous_domaines.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{article.sous_domaines.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {/* READ-ONLY: Only view button, no edit/delete */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setSelectedArticle(article)}
                            title="Voir l'article"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              <PaginationControls
                currentPage={page}
                totalPages={totalPages}
                totalItems={totalCount}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize);
                  setPage(1);
                }}
                hasNextPage={page < totalPages}
                hasPrevPage={page > 1}
              />
            </>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground mb-1">
                Aucun article trouvé
              </p>
              <p className="text-sm text-muted-foreground">
                {authorizedDomains.length === 0
                  ? "Aucun domaine réglementaire n'est autorisé pour ce site."
                  : "Essayez de modifier vos critères de recherche ou de filtrage."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick View Modal - READ-ONLY */}
      {selectedArticle && (
        <ArticleQuickViewModal
          article={{
            id: selectedArticle.id,
            numero: selectedArticle.numero,
            titre: selectedArticle.titre,
            resume: selectedArticle.resume || undefined,
            porte_exigence: selectedArticle.porte_exigence,
            est_introductif: selectedArticle.est_introductif,
            texte_id: selectedArticle.texte_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            texte: selectedArticle.texte_reference ? {
              id: selectedArticle.texte_id,
              reference: selectedArticle.texte_reference,
              titre: selectedArticle.texte_titre || "",
              type: "",
            } : undefined,
          }}
          open={!!selectedArticle}
          onOpenChange={(open) => !open && setSelectedArticle(null)}
        />
      )}
    </div>
  );
}
