import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileText, 
  Search, 
  Eye, 
  Calendar,
  Library,
  Plus,
  Upload,
  Download,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { textesReglementairesQueries, domainesQueries, sousDomainesQueries } from "@/lib/textes-queries";
import { TexteFormModal } from "@/components/TexteFormModal";

const TYPE_LABELS: Record<string, string> = {
  LOI: "Loi",
  ARRETE: "Arrêté",
  DECRET: "Décret",
  CIRCULAIRE: "Circulaire"
};

export default function BibliothequeTextes() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [domaineFilter, setDomaineFilter] = useState<string>("all");
  const [sousDomaineFilter, setSousDomaineFilter] = useState<string>("all");
  const [statutFilter, setStatutFilter] = useState<string>("all");
  const [anneeFilter, setAnneeFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("date_publication");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showTexteModal, setShowTexteModal] = useState(false);
  const [editingTexte, setEditingTexte] = useState<any>(null);
  const pageSize = 25;

  const { data: domainesList } = useQuery({
    queryKey: ["domaines"],
    queryFn: () => domainesQueries.getActive(),
  });

  const { data: sousDomainesList } = useQuery({
    queryKey: ["sous-domaines", domaineFilter],
    queryFn: () => domaineFilter !== "all" ? sousDomainesQueries.getActive(domaineFilter) : sousDomainesQueries.getActive(),
    enabled: domaineFilter !== "all",
  });

  const { data: result, isLoading } = useQuery({
    queryKey: ["textes-reglementaires", searchTerm, typeFilter, domaineFilter, sousDomaineFilter, statutFilter, anneeFilter, page, sortBy, sortOrder],
    queryFn: () =>
      textesReglementairesQueries.getAll({
        searchTerm,
        typeFilter: typeFilter !== "all" ? typeFilter : undefined,
        statutFilter: statutFilter !== "all" ? statutFilter : undefined,
        domaineFilter: domaineFilter !== "all" ? domaineFilter : undefined,
        sousDomaineFilter: sousDomaineFilter !== "all" ? sousDomaineFilter : undefined,
        anneeFilter: anneeFilter !== "all" ? anneeFilter : undefined,
        page,
        pageSize,
        sortBy,
        sortOrder,
      }),
  });

  const textes = result?.data || [];
  const totalCount = result?.count || 0;
  const totalPages = result?.totalPages || 1;

  // Get unique years for filter
  const uniqueYears = Array.from(
    new Set(
      textes
        .map((t: any) => t.annee)
        .filter((y): y is number => y !== null && y !== undefined)
    )
  ).sort((a, b) => (b as number) - (a as number));

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "en_vigueur":
        return { label: "En vigueur", variant: "success" as const };
      case "modifie":
        return { label: "Modifié", variant: "warning" as const };
      case "abroge":
        return { label: "Abrogé", variant: "destructive" as const };
      case "suspendu":
        return { label: "Suspendu", variant: "secondary" as const };
      default:
        return { label: statut, variant: "secondary" as const };
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
            Bibliothèque réglementaire
          </h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Consultation et navigation dans les textes réglementaires HSE
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Importer CSV
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button size="sm" onClick={() => {
            setEditingTexte(null);
            setShowTexteModal(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Créer un texte
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="shadow-soft">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par titre, référence officielle, autorité, résumé..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Select value={typeFilter} onValueChange={(val) => { setTypeFilter(val); setPage(1); }}>
                <SelectTrigger>
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

              <Select value={domaineFilter} onValueChange={(val) => { 
                setDomaineFilter(val); 
                setSousDomaineFilter("all");
                setPage(1); 
              }}>
                <SelectTrigger>
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

              <Select 
                value={sousDomaineFilter} 
                onValueChange={(val) => { setSousDomaineFilter(val); setPage(1); }}
                disabled={!sousDomainesList || sousDomainesList.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sous-domaine" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les sous-domaines</SelectItem>
                  {sousDomainesList?.map((sd) => (
                    <SelectItem key={sd.id} value={sd.id}>
                      {sd.libelle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statutFilter} onValueChange={(val) => { setStatutFilter(val); setPage(1); }}>
                <SelectTrigger>
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

              <Select value={anneeFilter} onValueChange={(val) => { setAnneeFilter(val); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Année" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les années</SelectItem>
                  {uniqueYears.map((year: any) => (
                    <SelectItem key={year} value={String(year)}>
                      {year as number}
                    </SelectItem>
                  ))}
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
            <Library className="h-5 w-5 text-primary" />
            Textes réglementaires
          </CardTitle>
          <CardDescription className="text-sm">
            {totalCount} texte(s) trouvé(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : textes.length > 0 ? (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("type")}>
                        Type {sortBy === "type" && (sortOrder === "asc" ? "↑" : "↓")}
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("reference_officielle")}>
                        Référence {sortBy === "reference_officielle" && (sortOrder === "asc" ? "↑" : "↓")}
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("titre")}>
                        Titre {sortBy === "titre" && (sortOrder === "asc" ? "↑" : "↓")}
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("autorite")}>
                        Autorité {sortBy === "autorite" && (sortOrder === "asc" ? "↑" : "↓")}
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("date_publication")}>
                        Date publication {sortBy === "date_publication" && (sortOrder === "asc" ? "↑" : "↓")}
                      </TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-center">#Articles</TableHead>
                      <TableHead>Domaines</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {textes.map((texte: any) => {
                      const statutInfo = getStatutBadge(texte.statut_vigueur);
                      const articleCount = texte.articles?.[0]?.count || 0;
                      
                      return (
                        <TableRow
                          key={texte.id}
                          className="hover:bg-muted/50 cursor-pointer"
                          onClick={() => navigate(`/bibliotheque/textes/${texte.id}`)}
                        >
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {TYPE_LABELS[texte.type] || texte.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {texte.reference_officielle || "—"}
                          </TableCell>
                          <TableCell>
                            <div className="max-w-md">
                              <div className="font-medium text-foreground line-clamp-1">
                                {texte.titre}
                              </div>
                              {texte.resume && (
                                <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                  {texte.resume}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {texte.autorite || "—"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {texte.date_publication
                              ? new Date(texte.date_publication).toLocaleDateString("fr-TN")
                              : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                statutInfo.variant === "success"
                                  ? "bg-success text-success-foreground"
                                  : statutInfo.variant === "warning"
                                  ? "bg-warning text-warning-foreground"
                                  : statutInfo.variant === "destructive"
                                  ? "bg-destructive text-destructive-foreground"
                                  : ""
                              }
                            >
                              {statutInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center text-sm font-medium">
                            {articleCount}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {texte.domaines?.slice(0, 2).map((d: any, idx: number) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {d.domaine?.libelle}
                                </Badge>
                              ))}
                              {texte.domaines && texte.domaines.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{texte.domaines.length - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/bibliotheque/textes/${texte.id}`);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="block lg:hidden space-y-4">
                {textes.map((texte: any) => {
                  const statutInfo = getStatutBadge(texte.statut_vigueur);
                  const articleCount = texte.articles?.[0]?.count || 0;
                  
                  return (
                    <div
                      key={texte.id}
                      className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/bibliotheque/textes/${texte.id}`)}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <Badge variant="outline" className="text-xs">
                            {TYPE_LABELS[texte.type] || texte.type}
                          </Badge>
                          <Badge
                            className={
                              statutInfo.variant === "success"
                                ? "bg-success text-success-foreground"
                                : statutInfo.variant === "warning"
                                ? "bg-warning text-warning-foreground"
                                : statutInfo.variant === "destructive"
                                ? "bg-destructive text-destructive-foreground"
                                : ""
                            }
                          >
                            {statutInfo.label}
                          </Badge>
                        </div>
                        
                        <div>
                          <div className="font-semibold text-foreground mb-1">
                            {texte.reference_officielle} - {texte.titre}
                          </div>
                          {texte.resume && (
                            <div className="text-sm text-muted-foreground line-clamp-2">
                              {texte.resume}
                            </div>
                          )}
                        </div>

                        {texte.autorite && (
                          <div className="text-xs text-muted-foreground">
                            Autorité: {texte.autorite}
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2">
                          {texte.domaines?.slice(0, 2).map((d: any, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {d.domaine?.libelle}
                            </Badge>
                          ))}
                          <Badge variant="secondary" className="text-xs">
                            {articleCount} article(s)
                          </Badge>
                        </div>

                        {texte.date_publication && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(texte.date_publication).toLocaleDateString("fr-TN")}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Page {page} sur {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <Library className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun texte trouvé</h3>
              <p className="text-muted-foreground mb-4">
                Commencez par créer votre premier texte réglementaire
              </p>
              <Button onClick={() => {
                setEditingTexte(null);
                setShowTexteModal(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Créer un texte
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <TexteFormModal 
        open={showTexteModal}
        onOpenChange={setShowTexteModal}
        texte={editingTexte}
        onSuccess={() => {
          setEditingTexte(null);
          setShowTexteModal(false);
        }}
      />
    </div>
  );
}
