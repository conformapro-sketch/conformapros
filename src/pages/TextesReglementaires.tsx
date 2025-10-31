import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Eye, FileText, Download, Upload, ChevronLeft, ChevronRight, Library } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { actesQueries, domainesQueries, sousDomainesQueries } from "@/lib/actes-queries";
import { ImportCSVDialog } from "@/components/ImportCSVDialog";
import * as XLSX from 'xlsx';

const TYPE_LABELS: Record<string, string> = {
  loi: "Loi",
  decret: "Decret",
  arrete: "Arrete",
  circulaire: "Circulaire"
};

export default function TextesReglementaires() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [domaineFilter, setDomaineFilter] = useState<string>("all");
  const [sousDomaineFilter, setSousDomaineFilter] = useState<string>("all");
  const [statutFilter, setStatutFilter] = useState<string>("all");
  const [anneeFilter, setAnneeFilter] = useState<string>("all");
  const [autoriteFilter, setAutoriteFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("date_publication_jort");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showImportDialog, setShowImportDialog] = useState(false);
  const pageSize = 25;

  const { data: domainesList } = useQuery({
    queryKey: ["domaines"],
    queryFn: () => domainesQueries.getActive(),
  });

  const { data: sousDomainesList } = useQuery({
    queryKey: ["sous-domaines", domaineFilter],
    queryFn: () => domaineFilter !== "all" ? sousDomainesQueries.getActive(domaineFilter) : Promise.resolve([]),
    enabled: domaineFilter !== "all",
  });

  const { data: result, isLoading } = useQuery({
    queryKey: ["actes-reglementaires", searchTerm, typeFilter, domaineFilter, sousDomaineFilter, statutFilter, anneeFilter, autoriteFilter, page, sortBy, sortOrder],
    queryFn: () =>
      actesQueries.getAll({
        searchTerm,
        typeFilter: typeFilter !== "all" ? typeFilter : undefined,
        statutFilter: statutFilter !== "all" ? statutFilter : undefined,
        domaineFilter: domaineFilter !== "all" ? domaineFilter : undefined,
        sousDomaineFilter: sousDomaineFilter !== "all" ? sousDomaineFilter : undefined,
        anneeFilter: anneeFilter !== "all" ? anneeFilter : undefined,
        autoriteFilter: autoriteFilter !== "all" ? autoriteFilter : undefined,
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
        .map((t) => t.date_publication_jort ? new Date(t.date_publication_jort).getFullYear() : null)
        .filter((y): y is number => y !== null)
    )
  ).sort((a, b) => b - a);

  // Get unique authorities for filter
  const uniqueAutorites = Array.from(
    new Set(
      textes
        .map((t) => t.autorite_emettrice)
        .filter((a): a is string => !!a)
    )
  ).sort();

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "en_vigueur":
        return { label: "En vigueur", color: "bg-success text-success-foreground" };
      case "modifie":
        return { label: "Modifié", color: "bg-warning text-warning-foreground" };
      case "abroge":
        return { label: "Abrogé", color: "bg-destructive text-destructive-foreground" };
      case "suspendu":
        return { label: "Suspendu", color: "bg-secondary text-secondary-foreground" };
      default:
        return { label: statut, color: "" };
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

  const handleExportExcel = () => {
    const exportData = textes.map((t: any) => ({
      Type: TYPE_LABELS[t.type_acte] || t.type_acte,
      Référence: t.reference_officielle || t.numero_officiel,
      Titre: t.intitule,
      Autorité: t.autorite_emettrice || '',
      'Date publication': t.date_publication_jort ? new Date(t.date_publication_jort).toLocaleDateString('fr-FR') : '',
      Statut: getStatutBadge(t.statut_vigueur).label,
      '#Articles': t.articles?.[0]?.count || 0
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Textes');
    XLSX.writeFile(wb, `textes_reglementaires_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast({ title: "Export réussi" });
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
            Liste des textes réglementaires
          </h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Gestion et consultation de la base réglementaire tunisienne
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setShowImportDialog(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Importer CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            <Download className="h-4 w-4 mr-2" />
            Exporter Excel
          </Button>
          <Button
            className="bg-gradient-primary shadow-medium"
            size="sm"
            onClick={() => navigate("/actes/nouveau")}
          >
            <Plus className="h-4 w-4 mr-2" />
            Créer un texte
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-soft border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="text-3xl font-bold text-primary">
              {totalCount}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Textes totaux</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-l-4 border-l-success">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-success">
              {textes.filter((t) => t.statut_vigueur === "en_vigueur").length}
            </div>
            <p className="text-sm text-muted-foreground mt-1">En vigueur</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-l-4 border-l-warning">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-warning">
              {textes.filter((t) => t.statut_vigueur === "modifie").length}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Modifiés</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-l-4 border-l-destructive">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-destructive">
              {textes.filter((t) => t.statut_vigueur === "abroge").length}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Abrogés</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
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
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
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
                disabled={domaineFilter === "all"}
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
                  <SelectValue placeholder="Statut de vigueur" />
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
                  {uniqueYears.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={autoriteFilter} onValueChange={(val) => { setAutoriteFilter(val); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Autorité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les autorités</SelectItem>
                  {uniqueAutorites.map((autorite) => (
                    <SelectItem key={autorite} value={autorite}>
                      {autorite}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des textes */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Library className="h-5 w-5 text-primary" />
            Textes réglementaires
          </CardTitle>
          <CardDescription className="text-sm">
            {totalCount} texte(s) trouvé(s) - Page {page} sur {totalPages}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : textes.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("type_acte")}>
                        Type {sortBy === "type_acte" && (sortOrder === "asc" ? "↑" : "↓")}
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("reference_officielle")}>
                        Référence {sortBy === "reference_officielle" && (sortOrder === "asc" ? "↑" : "↓")}
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("intitule")}>
                        Titre {sortBy === "intitule" && (sortOrder === "asc" ? "↑" : "↓")}
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("autorite_emettrice")}>
                        Autorité {sortBy === "autorite_emettrice" && (sortOrder === "asc" ? "↑" : "↓")}
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => handleSort("date_publication_jort")}>
                        Date publication {sortBy === "date_publication_jort" && (sortOrder === "asc" ? "↑" : "↓")}
                      </TableHead>
                      <TableHead>Statut de vigueur</TableHead>
                      <TableHead className="text-center">#Articles</TableHead>
                      <TableHead>Domaines / Sous-domaines</TableHead>
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
                          onClick={() => navigate(`/actes/${texte.id}`)}
                        >
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {TYPE_LABELS[texte.type_acte] || texte.type_acte}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {texte.reference_officielle || texte.numero_officiel || "—"}
                          </TableCell>
                          <TableCell>
                            <div className="max-w-md">
                              <div className="font-medium text-foreground line-clamp-1">
                                {texte.intitule}
                              </div>
                              {texte.resume && (
                                <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                  {texte.resume}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {texte.autorite_emettrice || "—"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {texte.date_publication_jort
                              ? new Date(texte.date_publication_jort).toLocaleDateString("fr-TN")
                              : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge className={statutInfo.color}>
                              {statutInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center text-sm font-medium">
                            {articleCount}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {texte.domaines?.slice(0, 2).map((domaine: string, idx: number) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {domaine}
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
                                navigate(`/actes/${texte.id}`);
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Affichage de {(page - 1) * pageSize + 1} à {Math.min(page * pageSize, totalCount)} sur {totalCount} textes
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Précédent
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={page === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages}
                    >
                      Suivant
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun texte réglementaire trouvé</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Commencez par créer votre premier texte réglementaire
              </p>
              <Button onClick={() => navigate("/actes/nouveau")}>
                <Plus className="h-4 w-4 mr-2" />
                Créer un texte
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Import Dialog */}
      <ImportCSVDialog 
        open={showImportDialog} 
        onOpenChange={setShowImportDialog}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </div>
  );
}

