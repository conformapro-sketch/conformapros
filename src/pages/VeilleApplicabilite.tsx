import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabaseAny as supabase } from "@/lib/supabase-any";
import { fetchSites } from "@/lib/multi-tenant-queries";
import { fetchDomaines } from "@/lib/domaines-queries";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Filter,
  Search,
  Save,
  Undo,
  FileText,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

interface ArticleRow {
  id: string;
  article_id: string;
  article_numero: string;
  article_titre?: string;
  article_contenu?: string;
  texte_id: string;
  texte_reference?: string;
  texte_titre?: string;
  site_id: string;
  applicabilite: "obligatoire" | "recommande" | "non_applicable";
  motif_non_applicable?: string;
  commentaire_non_applicable?: string;
  isModified?: boolean;
}

export default function VeilleApplicabilite() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedSite, setSelectedSite] = useState<string>(searchParams.get("siteId") || "");
  const [filters, setFilters] = useState({
    domaine: searchParams.get("domaine") || "",
    texte: searchParams.get("texte") || "",
    applicabilite: searchParams.get("applicabilite") || "",
  });
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkApplicabilite, setBulkApplicabilite] = useState<string>("");
  const [bulkJustification, setBulkJustification] = useState("");
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);

  // Fetch sites
  const { data: sites = [] } = useQuery({
    queryKey: ["sites"],
    queryFn: fetchSites,
  });

  // Fetch domaines
  const { data: domaines = [] } = useQuery({
    queryKey: ["domaines"],
    queryFn: fetchDomaines,
  });

  // Fetch textes filtered by domain
  const { data: textes = [] } = useQuery({
    queryKey: ["textes-applicabilite", filters.domaine],
    queryFn: async () => {
      let query = supabase
        .from("textes_reglementaires")
        .select("id, titre, reference_officielle, type");

      if (filters.domaine) {
        const { data: texteIds } = await supabase
          .from("textes_reglementaires_domaines")
          .select("texte_id")
          .eq("domaine_id", filters.domaine);

        if (texteIds && texteIds.length > 0) {
          query = query.in(
            "id",
            texteIds.map((t) => t.texte_id)
          );
        }
      }

      const { data, error } = await query.order("reference_officielle");
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedSite,
  });

  // Fetch articles with applicability status
  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["applicabilite-articles", selectedSite, filters, searchTerm],
    queryFn: async () => {
      if (!selectedSite) return [];

      // Get all articles
      let articlesQuery = supabase
        .from("textes_articles")
        .select(
          `
          id,
          numero,
          titre_court,
          contenu,
          texte_id,
          textes_reglementaires (
            id,
            reference_officielle,
            titre,
            type
          )
        `
        )
        .order("numero");

      if (filters.texte) {
        articlesQuery = articlesQuery.eq("texte_id", filters.texte);
      }

      const { data: articlesData, error: articlesError } = await articlesQuery;
      if (articlesError) throw articlesError;

      // Get existing site_article_status records
      const { data: statusData } = await supabase
        .from("site_article_status")
        .select("*")
        .eq("site_id", selectedSite);

      // Combine data
      const rows: ArticleRow[] =
        articlesData?.map((article) => {
          const status = statusData?.find((s) => s.article_id === article.id);
          const texte = article.textes_reglementaires as any;

          return {
            id: status?.id || `new_${article.id}`,
            article_id: article.id,
            article_numero: article.numero,
            article_titre: article.titre_court,
            article_contenu: article.contenu,
            texte_id: article.texte_id,
            texte_reference: texte?.reference_officielle,
            texte_titre: texte?.titre,
            site_id: selectedSite,
            applicabilite: status?.applicabilite || "obligatoire",
            motif_non_applicable: status?.motif_non_applicable,
            commentaire_non_applicable: status?.commentaire_non_applicable,
            isModified: false,
          };
        }) || [];

      // Apply filters
      let filtered = rows;

      if (filters.applicabilite) {
        filtered = filtered.filter((r) => r.applicabilite === filters.applicabilite);
      }

      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        filtered = filtered.filter(
          (r) =>
            r.article_numero?.toLowerCase().includes(search) ||
            r.article_titre?.toLowerCase().includes(search) ||
            r.texte_reference?.toLowerCase().includes(search) ||
            r.texte_titre?.toLowerCase().includes(search)
        );
      }

      return filtered;
    },
    enabled: !!selectedSite,
  });

  // Calculate progress
  const totalArticles = articles.length;
  const articlesWithStatus = articles.filter((a) => !a.id.startsWith("new_")).length;
  const progress = totalArticles > 0 ? (articlesWithStatus / totalArticles) * 100 : 0;

  // Mutation to save applicability
  const saveMutation = useMutation({
    mutationFn: async (rows: ArticleRow[]) => {
      const upsertData = rows.map((row) => ({
        id: row.id.startsWith("new_") ? undefined : row.id,
        site_id: row.site_id,
        article_id: row.article_id,
        applicabilite: row.applicabilite,
        motif_non_applicable: row.motif_non_applicable,
        commentaire_non_applicable: row.commentaire_non_applicable,
        etat_conformite: "en_attente" as const,
      }));

      const { error } = await supabase.from("site_article_status").upsert(upsertData);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applicabilite-articles"] });
      toast({ title: "Succès", description: "Applicabilité enregistrée" });
      setSelectedRows([]);
    },
    onError: (error: Error) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  // Handle single row update
  const handleUpdateRow = (articleId: string, field: string, value: any) => {
    const updatedArticles = articles.map((article) => {
      if (article.article_id === articleId) {
        return { ...article, [field]: value, isModified: true };
      }
      return article;
    });
    queryClient.setQueryData(
      ["applicabilite-articles", selectedSite, filters, searchTerm],
      updatedArticles
    );
  };

  // Handle bulk update
  const handleBulkUpdate = () => {
    if (!bulkApplicabilite || selectedRows.length === 0) return;

    const updatedArticles = articles.map((article) => {
      if (selectedRows.includes(article.article_id)) {
        return {
          ...article,
          applicabilite: bulkApplicabilite as any,
          commentaire_non_applicable:
            bulkApplicabilite === "non_applicable" ? bulkJustification : undefined,
          isModified: true,
        };
      }
      return article;
    });

    queryClient.setQueryData(
      ["applicabilite-articles", selectedSite, filters, searchTerm],
      updatedArticles
    );

    setBulkDialogOpen(false);
    setBulkApplicabilite("");
    setBulkJustification("");
    toast({
      title: "Succès",
      description: `${selectedRows.length} articles mis à jour`,
    });
  };

  // Save modified rows
  const handleSave = () => {
    const modifiedRows = articles.filter((a) => a.isModified);
    if (modifiedRows.length === 0) {
      toast({ title: "Info", description: "Aucune modification à enregistrer" });
      return;
    }
    saveMutation.mutate(modifiedRows);
  };

  // Get applicability badge
  const getApplicabiliteBadge = (applicabilite: string) => {
    switch (applicabilite) {
      case "obligatoire":
        return <Badge className="bg-primary">Obligatoire</Badge>;
      case "recommande":
        return <Badge className="bg-info">Recommandé</Badge>;
      case "non_applicable":
        return <Badge variant="outline">Non applicable</Badge>;
      default:
        return <Badge variant="secondary">Non défini</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Applicabilité des articles</h1>
        <p className="text-muted-foreground mt-2">
          Définir quels articles réglementaires s'appliquent à chaque site
        </p>
      </div>

      {/* Site Selection & Progress */}
      <Card className="border-l-4 border-l-primary">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
              <div className="flex-1 space-y-2">
                <Label>Site</Label>
                <Select value={selectedSite} onValueChange={setSelectedSite}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un site" />
                  </SelectTrigger>
                  <SelectContent>
                    {sites.map((site) => (
                      <SelectItem key={site.id} value={site.id}>
                        {site.nom_site}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedSite && (
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Progression</span>
                    <span className="text-sm text-muted-foreground">
                      {articlesWithStatus} / {totalArticles}
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedSite && (
        <>
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par numéro, titre, référence..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Select
                    value={filters.domaine}
                    onValueChange={(v) => setFilters({ ...filters, domaine: v, texte: "" })}
                  >
                    <SelectTrigger className="sm:w-[200px]">
                      <SelectValue placeholder="Domaine" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tous les domaines</SelectItem>
                      {domaines.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.libelle}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={filters.texte}
                    onValueChange={(v) => setFilters({ ...filters, texte: v })}
                  >
                    <SelectTrigger className="sm:w-[250px]">
                      <SelectValue placeholder="Texte réglementaire" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tous les textes</SelectItem>
                      {textes.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.reference_officielle} - {t.titre?.substring(0, 40)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={filters.applicabilite}
                    onValueChange={(v) => setFilters({ ...filters, applicabilite: v })}
                  >
                    <SelectTrigger className="sm:w-[200px]">
                      <SelectValue placeholder="Applicabilité" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tous</SelectItem>
                      <SelectItem value="obligatoire">Obligatoire</SelectItem>
                      <SelectItem value="recommande">Recommandé</SelectItem>
                      <SelectItem value="non_applicable">Non applicable</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    onClick={() => setFilters({ domaine: "", texte: "", applicabilite: "" })}
                  >
                    <Undo className="h-4 w-4 mr-2" />
                    Réinitialiser
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Actions */}
          {selectedRows.length > 0 && (
            <Card className="border-primary">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {selectedRows.length} article(s) sélectionné(s)
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBulkDialogOpen(true)}
                    >
                      Mise à jour groupée
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedRows([])}
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Articles Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Articles réglementaires</CardTitle>
                  <CardDescription>{articles.length} article(s) trouvé(s)</CardDescription>
                </div>
                <Button onClick={handleSave} disabled={saveMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer les modifications
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Chargement...</div>
              ) : articles.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">
                          <Checkbox
                            checked={selectedRows.length === articles.length}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedRows(articles.map((a) => a.article_id));
                              } else {
                                setSelectedRows([]);
                              }
                            }}
                          />
                        </TableHead>
                        <TableHead>Référence</TableHead>
                        <TableHead>Article</TableHead>
                        <TableHead>Texte</TableHead>
                        <TableHead>Applicabilité</TableHead>
                        <TableHead>Justification</TableHead>
                        <TableHead className="w-[100px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {articles.map((article) => (
                        <>
                          <TableRow
                            key={article.article_id}
                            className={article.isModified ? "bg-primary/5" : ""}
                          >
                            <TableCell>
                              <Checkbox
                                checked={selectedRows.includes(article.article_id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedRows([...selectedRows, article.article_id]);
                                  } else {
                                    setSelectedRows(
                                      selectedRows.filter((id) => id !== article.article_id)
                                    );
                                  }
                                }}
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              {article.article_numero}
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{article.article_titre}</div>
                                {article.article_contenu && (
                                  <div className="text-sm text-muted-foreground line-clamp-2">
                                    {article.article_contenu.substring(0, 100)}...
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div className="font-medium">{article.texte_reference}</div>
                                <div className="text-muted-foreground line-clamp-1">
                                  {article.texte_titre}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={article.applicabilite}
                                onValueChange={(v) =>
                                  handleUpdateRow(article.article_id, "applicabilite", v)
                                }
                              >
                                <SelectTrigger className="w-[150px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="obligatoire">Obligatoire</SelectItem>
                                  <SelectItem value="recommande">Recommandé</SelectItem>
                                  <SelectItem value="non_applicable">Non applicable</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Input
                                placeholder="Justification..."
                                value={article.commentaire_non_applicable || ""}
                                onChange={(e) =>
                                  handleUpdateRow(
                                    article.article_id,
                                    "commentaire_non_applicable",
                                    e.target.value
                                  )
                                }
                                className="w-[200px]"
                              />
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setExpandedArticle(
                                    expandedArticle === article.article_id
                                      ? null
                                      : article.article_id
                                  )
                                }
                              >
                                {expandedArticle === article.article_id ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                          {expandedArticle === article.article_id && (
                            <TableRow>
                              <TableCell colSpan={7}>
                                <div className="p-4 bg-muted/50 rounded-lg">
                                  <h4 className="font-semibold mb-2">Contenu de l'article</h4>
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {article.article_contenu}
                                  </p>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun article trouvé. Ajustez les filtres ou sélectionnez un autre site.
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Bulk Update Dialog */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mise à jour groupée</DialogTitle>
            <DialogDescription>
              Appliquer les mêmes paramètres à {selectedRows.length} article(s)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Applicabilité</Label>
              <Select value={bulkApplicabilite} onValueChange={setBulkApplicabilite}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="obligatoire">Obligatoire</SelectItem>
                  <SelectItem value="recommande">Recommandé</SelectItem>
                  <SelectItem value="non_applicable">Non applicable</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {bulkApplicabilite === "non_applicable" && (
              <div className="space-y-2">
                <Label>Justification</Label>
                <Textarea
                  value={bulkJustification}
                  onChange={(e) => setBulkJustification(e.target.value)}
                  placeholder="Expliquer pourquoi ces articles ne sont pas applicables..."
                  rows={4}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleBulkUpdate} disabled={!bulkApplicabilite}>
              Appliquer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
