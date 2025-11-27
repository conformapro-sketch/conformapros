import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Search, FileText, Eye, BookOpen, Home } from "lucide-react";
import { PaginationControls } from "@/components/shared/PaginationControls";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { clientBibliothequeQueries } from "@/lib/client-bibliotheque-queries";
import { Skeleton } from "@/components/ui/skeleton";
import { useSiteContext } from "@/hooks/useSiteContext";

const TYPE_LABELS: Record<string, string> = {
  loi: "Loi",
  decret: "Décret",
  arrete: "Arrêté",
  circulaire: "Circulaire"
};

export default function ClientBibliotheque() {
  const navigate = useNavigate();
  const { currentSite, isLoading: isSiteLoading } = useSiteContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [domaineFilter, setDomaineFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const currentSiteId = currentSite?.id;

  // Fetch authorized domains for the current site
  const { data: authorizedDomains = [], isLoading: domainesLoading } = useQuery({
    queryKey: ["authorized-domaines", currentSiteId],
    queryFn: () => clientBibliothequeQueries.getAuthorizedDomains(currentSiteId!),
    enabled: !!currentSiteId,
  });

  // Fetch textes filtered by site's authorized domains
  const { data: result, isLoading: textesLoading, error } = useQuery({
    queryKey: ["client-bibliotheque", currentSiteId, searchTerm, domaineFilter, page, pageSize],
    queryFn: () =>
      clientBibliothequeQueries.getTextesBySite({
        siteId: currentSiteId!,
        searchTerm,
        domaineFilter: domaineFilter !== "all" ? domaineFilter : undefined,
        page,
        pageSize,
      }),
    enabled: !!currentSiteId,
  });

  const textes = result?.data || [];
  const totalCount = result?.count || 0;
  const totalPages = result?.totalPages || 1;

  const isLoading = textesLoading || domainesLoading || isSiteLoading;

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
                Aucun site sélectionné. Veuillez sélectionner un site pour accéder à la bibliothèque réglementaire.
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
            <BreadcrumbPage>Bibliothèque réglementaire</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Bibliothèque réglementaire
          </h1>
          <p className="text-muted-foreground mt-2">
            Textes réglementaires applicables à votre site
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate("/client/codes-juridiques")} variant="outline">
            <BookOpen className="h-4 w-4 mr-2" />
            Codes juridiques
          </Button>
          <Button onClick={() => navigate("/client/recherche-avancee")} variant="outline">
            <Search className="h-4 w-4 mr-2" />
            Recherche avancée
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="shadow-soft">
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Search */}
            <div className="space-y-2">
              <Label>Recherche</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par référence ou titre..."
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
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Textes réglementaires
          </CardTitle>
          <CardDescription>
            {isLoading ? (
              <Skeleton className="h-4 w-32" />
            ) : (
              `${totalCount} texte(s) applicable(s)`
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
          ) : error ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-destructive mx-auto mb-4 opacity-50" />
              <p className="text-destructive font-medium mb-2">
                Erreur lors du chargement
              </p>
              <p className="text-sm text-muted-foreground">
                {(error as any)?.message || "Une erreur s'est produite"}
              </p>
            </div>
          ) : textes.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-32">Type</TableHead>
                      <TableHead>Référence</TableHead>
                      <TableHead>Titre</TableHead>
                      <TableHead className="w-40">Date publication</TableHead>
                      <TableHead>Domaines</TableHead>
                      <TableHead className="w-24 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {textes.map((texte) => (
                      <TableRow key={texte.id}>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {TYPE_LABELS[texte.type] || texte.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {texte.reference}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-md line-clamp-2">
                            {texte.titre}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {texte.date_publication
                            ? new Date(texte.date_publication).toLocaleDateString("fr-FR")
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {texte.domaines && texte.domaines.length > 0 ? (
                              texte.domaines.map((domaine) => (
                                <Badge
                                  key={domaine.id}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {domaine.code}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => navigate(`/client/bibliotheque/textes/${texte.id}`)}
                            title="Voir le détail"
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
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground mb-1">
                Aucun texte réglementaire trouvé
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
    </div>
  );
}
