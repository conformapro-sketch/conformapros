import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabaseAny as supabase } from "@/lib/supabase-any";
import { fetchSites } from "@/lib/multi-tenant-queries";
import { fetchDomaines } from "@/lib/domaines-queries";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
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
  LayoutGrid,
  Lightbulb,
} from "lucide-react";
import { ArticleApplicabilityCard } from "@/components/ArticleApplicabilityCard";
import { Separator } from "@/components/ui/separator";

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
  const { isTeamUser, getClientId } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedClient, setSelectedClient] = useState<string>(
    isTeamUser() ? "" : (getClientId() || "")
  );
  const [selectedSite, setSelectedSite] = useState<string>(searchParams.get("siteId") || "");
  const [filters, setFilters] = useState({
    domaine: searchParams.get("domaine") || "all",
    texte: searchParams.get("texte") || "all",
    applicabilite: searchParams.get("applicabilite") || "all",
  });
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkApplicabilite, setBulkApplicabilite] = useState<string>("");
  const [bulkJustification, setBulkJustification] = useState("");
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  const [quickFilter, setQuickFilter] = useState<'all' | 'to_evaluate' | 'applicable' | 'non_applicable'>('all');
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [currentArticleForComment, setCurrentArticleForComment] = useState<ArticleRow | null>(null);
  const [tempComment, setTempComment] = useState("");

  // Fetch clients (only for team users)
  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, nom, nom_legal")
        .eq("is_active", true)
        .order("nom");
      if (error) throw error;
      return data || [];
    },
    enabled: isTeamUser(),
  });

  // Fetch sites (filtered by client for team users)
  const { data: allSites = [] } = useQuery({
    queryKey: ["sites"],
    queryFn: fetchSites,
  });

  const sites = useMemo(() => {
    if (isTeamUser() && selectedClient) {
      return allSites.filter(site => site.client_id === selectedClient);
    }
    return allSites;
  }, [allSites, isTeamUser, selectedClient]);

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
        .from("actes_reglementaires")
        .select("id, intitule, reference_officielle, type_acte");

      if (filters.domaine && filters.domaine !== "all") {
        const { data: texteIds } = await supabase
          .from("actes_reglementaires_domaines")
          .select("acte_id")
          .eq("domaine_id", filters.domaine);

        if (texteIds && texteIds.length > 0) {
          query = query.in(
            "id",
            texteIds.map((t) => t.acte_id)
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
          actes_reglementaires (
            id,
            reference_officielle,
            intitule,
            type_acte
          )
        `
        )
        .order("numero");

      if (filters.texte && filters.texte !== "all") {
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
          const texte = article.actes_reglementaires as any;

          return {
            id: status?.id || `new_${article.id}`,
            article_id: article.id,
            article_numero: article.numero,
            article_titre: article.titre_court,
            article_contenu: article.contenu,
            texte_id: article.texte_id,
            texte_reference: texte?.reference_officielle,
            texte_titre: texte?.intitule,
            site_id: selectedSite,
            applicabilite: status?.applicabilite || "obligatoire",
            motif_non_applicable: status?.motif_non_applicable,
            commentaire_non_applicable: status?.commentaire_non_applicable,
            isModified: false,
          };
        }) || [];

      // Apply filters
      let filtered = rows;

      if (filters.applicabilite && filters.applicabilite !== "all") {
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

  // Apply quick filter
  const filteredArticles = useMemo(() => {
    if (quickFilter === 'all') return articles;
    if (quickFilter === 'to_evaluate') {
      return articles.filter(a => a.id.startsWith('new_'));
    } else if (quickFilter === 'applicable') {
      return articles.filter(a => a.applicabilite === 'obligatoire' || a.applicabilite === 'recommande');
    } else if (quickFilter === 'non_applicable') {
      return articles.filter(a => a.applicabilite === 'non_applicable');
    }
    return articles;
  }, [articles, quickFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    return {
      toEvaluate: articles.filter(a => a.id.startsWith('new_')).length,
      applicable: articles.filter(a => a.applicabilite === 'obligatoire').length,
      recommande: articles.filter(a => a.applicabilite === 'recommande').length,
      nonApplicable: articles.filter(a => a.applicabilite === 'non_applicable').length,
    };
  }, [articles]);

  // Use filteredArticles instead of articles for display
  const { data: _unused } = useQuery({
    queryKey: ["_unused"],
    queryFn: async () => {
      return null;
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
              {isTeamUser() && (
                <div className="flex-1 space-y-2">
                  <Label>Client</Label>
                  <Select 
                    value={selectedClient} 
                    onValueChange={(value) => {
                      setSelectedClient(value);
                      setSelectedSite("");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.nom || client.nom_legal}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex-1 space-y-2">
                <Label>Site</Label>
                <Select 
                  value={selectedSite} 
                  onValueChange={setSelectedSite}
                  disabled={isTeamUser() && !selectedClient}
                >
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
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-primary">
                  {stats.toEvaluate}
                </div>
                <p className="text-sm text-muted-foreground">À évaluer</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">
                  {stats.applicable}
                </div>
                <p className="text-sm text-muted-foreground">Applicables</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.recommande}
                </div>
                <p className="text-sm text-muted-foreground">Recommandés</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-gray-600">
                  {stats.nonApplicable}
                </div>
                <p className="text-sm text-muted-foreground">Non concernés</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={quickFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setQuickFilter('all')}
                >
                  Tous ({articles.length})
                </Button>
                <Button
                  variant={quickFilter === 'to_evaluate' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setQuickFilter('to_evaluate')}
                >
                  À évaluer ({stats.toEvaluate})
                </Button>
                <Button
                  variant={quickFilter === 'applicable' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setQuickFilter('applicable')}
                >
                  Applicables ({stats.applicable + stats.recommande})
                </Button>
                <Button
                  variant={quickFilter === 'non_applicable' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setQuickFilter('non_applicable')}
                >
                  Non concernés ({stats.nonApplicable})
                </Button>
              </div>
            </CardContent>
          </Card>

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
                    onValueChange={(v) => setFilters({ ...filters, domaine: v, texte: "all" })}
                  >
                    <SelectTrigger className="sm:w-[200px]">
                      <SelectValue placeholder="Domaine" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les domaines</SelectItem>
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
                      <SelectItem value="all">Tous les textes</SelectItem>
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
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="obligatoire">Obligatoire</SelectItem>
                      <SelectItem value="recommande">Recommandé</SelectItem>
                      <SelectItem value="non_applicable">Non applicable</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    onClick={() => setFilters({ domaine: "all", texte: "all", applicabilite: "all" })}
                  >
                    <Undo className="h-4 w-4 mr-2" />
                    Réinitialiser
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Floating Bulk Actions Bar */}
          {selectedRows.length > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4">
              <Card className="shadow-xl border-2 border-primary">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      {selectedRows.length} sélectionné(s)
                    </Badge>
                    
                    <Separator orientation="vertical" className="h-8" />
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          setBulkApplicabilite("obligatoire");
                          handleBulkUpdate();
                        }}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Applicable
                      </Button>
                      
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => {
                          setBulkApplicabilite("recommande");
                          handleBulkUpdate();
                        }}
                      >
                        <Lightbulb className="h-4 w-4 mr-2" />
                        Recommandé
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setBulkApplicabilite("non_applicable");
                          setBulkDialogOpen(true);
                        }}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Non concerné
                      </Button>
                    </div>
                    
                    <Separator orientation="vertical" className="h-8" />
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedRows([])}
                    >
                      Annuler
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Articles View */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Articles réglementaires</CardTitle>
                  <CardDescription>{filteredArticles.length} article(s) trouvé(s)</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {/* View Toggle */}
                  <div className="flex items-center gap-1 border rounded-md p-1">
                    <Button
                      variant={viewMode === 'cards' ? 'default' : 'ghost'}
                      size="sm"
                      className="h-8"
                      onClick={() => setViewMode('cards')}
                    >
                      <LayoutGrid className="h-4 w-4 mr-1" />
                      Cartes
                    </Button>
                    <Button
                      variant={viewMode === 'table' ? 'default' : 'ghost'}
                      size="sm"
                      className="h-8"
                      onClick={() => setViewMode('table')}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Tableau
                    </Button>
                  </div>
                  
                  <Button onClick={handleSave} disabled={saveMutation.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    Enregistrer
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Chargement...</div>
              ) : filteredArticles.length > 0 ? (
                <>
                  {viewMode === 'cards' ? (
                    /* Cards View */
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                      {filteredArticles.map((article, index) => (
                        <ArticleApplicabilityCard
                          key={article.article_id}
                          article={article}
                          index={index + 1}
                          isSelected={selectedRows.includes(article.article_id)}
                          onSelect={(checked) => {
                            if (checked) {
                              setSelectedRows([...selectedRows, article.article_id]);
                            } else {
                              setSelectedRows(selectedRows.filter(id => id !== article.article_id));
                            }
                          }}
                          onUpdate={(applicabilite) => 
                            handleUpdateRow(article.article_id, 'applicabilite', applicabilite)
                          }
                          onAddComment={() => {
                            setCurrentArticleForComment(article);
                            setTempComment(article.commentaire_non_applicable || "");
                            setCommentDialogOpen(true);
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    /* Table View */
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">
                          <Checkbox
                            checked={selectedRows.length === filteredArticles.length && filteredArticles.length > 0}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedRows(filteredArticles.map((a) => a.article_id));
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
                      {filteredArticles.map((article) => (
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
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun article trouvé. Ajustez les filtres ou sélectionnez un autre site.
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Comment Dialog */}
      <Dialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Justification de non-applicabilité</DialogTitle>
            <DialogDescription>
              Article {currentArticleForComment?.article_numero}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Commentaire</Label>
              <Textarea
                value={tempComment}
                onChange={(e) => setTempComment(e.target.value)}
                placeholder="Expliquez pourquoi cet article ne s'applique pas à votre site..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCommentDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={() => {
              if (currentArticleForComment) {
                handleUpdateRow(
                  currentArticleForComment.article_id,
                  'commentaire_non_applicable',
                  tempComment
                );
              }
              setCommentDialogOpen(false);
              setTempComment("");
            }}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
