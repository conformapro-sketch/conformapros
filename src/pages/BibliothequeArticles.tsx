import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { BibliothequeHeader } from "@/components/bibliotheque/BibliothequeHeader";
import { ArticlesStatsCards } from "@/components/bibliotheque/ArticlesStatsCards";
import { ArticlesFilters } from "@/components/bibliotheque/ArticlesFilters";
import { ArticlesDataGrid } from "@/components/bibliotheque/ArticlesDataGrid";
import { ArticleQuickViewModal } from "@/components/bibliotheque/ArticleQuickViewModal";
import { PaginationControls } from "@/components/shared/PaginationControls";
import { ExportButton } from "@/components/shared/ExportButton";
import { articlesListQueries, type ArticleWithDetails } from "@/lib/articles-queries";
import { domainesQueries, sousDomainesQueries } from "@/lib/textes-queries";
import { useDebounce } from "@/hooks/useDebounce";

export default function BibliothequeArticles() {
  // State for filters
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [domaineFilter, setDomaineFilter] = useState("all");
  const [sousDomaineFilter, setSousDomaineFilter] = useState("all");
  const [anneeFilter, setAnneeFilter] = useState("all");
  const [statutVersionFilter, setStatutVersionFilter] = useState("all");
  const [exigenceOnly, setExigenceOnly] = useState(false);
  
  // State for article quick view
  const [selectedArticle, setSelectedArticle] = useState<ArticleWithDetails | null>(null);
  const [introductifOnly, setIntroductifOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Fetch domaines for filter
  const { data: domaines = [] } = useQuery({
    queryKey: ["domaines-active"],
    queryFn: domainesQueries.getActive,
  });

  // Fetch sous-domaines for filter
  const { data: sousDomaines = [] } = useQuery({
    queryKey: ["sous-domaines-active", domaineFilter],
    queryFn: () => sousDomainesQueries.getActive(domaineFilter !== "all" ? domaineFilter : undefined),
  });

  // Fetch available years
  const { data: years = [] } = useQuery({
    queryKey: ["articles-years"],
    queryFn: articlesListQueries.getAvailableYears,
  });

  // Fetch stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["articles-stats"],
    queryFn: articlesListQueries.getStats,
  });

  // Fetch articles with filters
  const { data: articlesResult, isLoading: articlesLoading } = useQuery({
    queryKey: [
      "articles-list",
      debouncedSearchTerm,
      typeFilter,
      domaineFilter,
      sousDomaineFilter,
      anneeFilter,
      statutVersionFilter,
      exigenceOnly,
      introductifOnly,
      page,
      pageSize,
    ],
    queryFn: () =>
      articlesListQueries.getAll({
        searchTerm: debouncedSearchTerm,
        typeTexteFilter: typeFilter,
        domaineFilter,
        sousDomaineFilter,
        anneeFilter,
        statutVersionFilter,
        exigenceOnly,
        introductifOnly,
        page,
        pageSize,
      }),
  });

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm("");
    setTypeFilter("all");
    setDomaineFilter("all");
    setSousDomaineFilter("all");
    setAnneeFilter("all");
    setStatutVersionFilter("all");
    setExigenceOnly(false);
    setIntroductifOnly(false);
    setPage(1);
  };

  // Export data
  const exportData = useMemo(() => {
    return (articlesResult?.data || []).map((article) => ({
      numero: article.numero,
      titre: article.titre,
      resume: article.resume || "",
      texte_reference: article.texte?.reference || "",
      type_texte: article.texte?.type || "",
      porte_exigence: article.porte_exigence ? "Oui" : "Non",
      est_introductif: article.est_introductif ? "Oui" : "Non",
      statut: article.version_active?.statut || "",
    }));
  }, [articlesResult?.data]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <BibliothequeHeader
        title="Articles réglementaires"
        breadcrumbs={[{ label: "Articles" }]}
      />

      {/* Stats Cards */}
      <ArticlesStatsCards stats={stats} isLoading={statsLoading} />

      {/* Search and Export */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par numéro, titre, contenu..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="pl-10"
          />
        </div>

        <ExportButton
          data={exportData}
          fileName="articles-reglementaires"
        />
      </div>

      {/* Filters */}
      <ArticlesFilters
        typeFilter={typeFilter}
        setTypeFilter={(v) => { setTypeFilter(v); setPage(1); }}
        domaineFilter={domaineFilter}
        setDomaineFilter={(v) => { setDomaineFilter(v); setPage(1); }}
        sousDomaineFilter={sousDomaineFilter}
        setSousDomaineFilter={(v) => { setSousDomaineFilter(v); setPage(1); }}
        anneeFilter={anneeFilter}
        setAnneeFilter={(v) => { setAnneeFilter(v); setPage(1); }}
        statutVersionFilter={statutVersionFilter}
        setStatutVersionFilter={(v) => { setStatutVersionFilter(v); setPage(1); }}
        exigenceOnly={exigenceOnly}
        setExigenceOnly={(v) => { setExigenceOnly(v); setPage(1); }}
        introductifOnly={introductifOnly}
        setIntroductifOnly={(v) => { setIntroductifOnly(v); setPage(1); }}
        domaines={domaines}
        sousDomaines={sousDomaines}
        years={years}
        onReset={handleResetFilters}
      />

      {/* Data Grid */}
      <ArticlesDataGrid
        articles={articlesResult?.data || []}
        isLoading={articlesLoading}
        onViewArticle={(article) => setSelectedArticle(article)}
      />

      {/* Article Quick View Modal */}
      <ArticleQuickViewModal
        open={!!selectedArticle}
        onOpenChange={(open) => !open && setSelectedArticle(null)}
        article={selectedArticle}
      />

      {/* Pagination */}
      <PaginationControls
        currentPage={page}
        totalPages={articlesResult?.totalPages || 1}
        totalItems={articlesResult?.count || 0}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
        hasNextPage={page < (articlesResult?.totalPages || 1)}
        hasPrevPage={page > 1}
      />
    </div>
  );
}
