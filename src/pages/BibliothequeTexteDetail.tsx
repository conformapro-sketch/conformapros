import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  FileText, 
  Calendar, 
  ExternalLink,
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  History,
  ChevronDown,
  ChevronRight,
  GitCompare,
  Check,
  Star,
  XCircle,
  RefreshCw,
  PlusCircle,
  Hash,
  FileEdit,
  RotateCcw
} from "lucide-react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EffetsCreesTab } from "@/components/EffetsCreesTab";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  textesQueries, 
  articlesQueries, 
  versionsQueries,
  changelogQueries 
} from "@/lib/bibliotheque-unified-queries";
import { supabaseAny as supabase } from "@/lib/supabase-any";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { ArticleFormModal } from "@/components/ArticleFormModal";
import { ArticleVersionComparison } from "@/components/ArticleVersionComparison";
import { ArticleVersionWizard } from "@/components/ArticleVersionWizard";
import { ArticleVersionsTimeline } from "@/components/bibliotheque/ArticleVersionsTimeline";
import { VersionBeforeAfterView } from "@/components/bibliotheque/VersionBeforeAfterView";
import { TimelineChangelog } from "@/components/TimelineChangelog";
import { TexteCodesDisplay } from "@/components/TexteCodesDisplay";
import { sanitizeHtml, stripHtml } from "@/lib/sanitize-html";
import { PDFViewerModal } from "@/components/PDFViewerModal";
import { BibliothequeSearchBar } from "@/components/bibliotheque/BibliothequeSearchBar";
import { useAuth } from "@/contexts/AuthContext";

export default function BibliothequeTexteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isSuperAdmin, hasRole } = useAuth();
  
  // Check if user is staff (can manage articles/versions)
  const isStaff = isSuperAdmin || hasRole('Admin Global');
  
  // Article management
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<any>(null);
  const [deleteArticleId, setDeleteArticleId] = useState<string | null>(null);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Version management
  const [expandedArticles, setExpandedArticles] = useState<string[]>([]);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [comparisonArticle, setComparisonArticle] = useState<any>(null);
  const [showQuickEffetModal, setShowQuickEffetModal] = useState(false);
  const [targetArticleForEffet, setTargetArticleForEffet] = useState<any>(null);
  const [showEditArticleModal, setShowEditArticleModal] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [versionToRestore, setVersionToRestore] = useState<any>(null);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [compareVersions, setCompareVersions] = useState<{ before: any; after: any } | null>(null);

  const { data: texte, isLoading, error } = useQuery({
    queryKey: ["texte-detail", id],
    queryFn: () => textesQueries.getById(id!),
    enabled: !!id,
    placeholderData: (previousData) => previousData,
  });

  const { data: articles = [], isLoading: articlesLoading } = useQuery({
    queryKey: ["texte-articles", id],
    queryFn: () => articlesQueries.getByTexteId(id!),
    enabled: !!id,
    placeholderData: (previousData) => previousData,
  });

  // Fetch active versions for all articles (for display purposes)
  const { data: activeVersionsMap = {} } = useQuery({
    queryKey: ["article-active-versions", id, articles?.map((a: any) => a.id)],
    queryFn: async () => {
      if (!articles || articles.length === 0) return {};
      const map: Record<string, any> = {};
      
      // Fetch active version for each article
      const promises = articles.map(async (article: any) => {
        const { data } = await supabase
          .from("article_versions")
          .select("*")
          .eq("article_id", article.id)
          .eq("statut", "en_vigueur")
          .order("date_effet", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (data) {
          map[article.id] = data;
        }
      });
      
      await Promise.all(promises);
      return map;
    },
    enabled: !!id && articles && articles.length > 0,
  });

  // Fetch all versions for expanded articles (for timeline)
  const { data: articleVersionsMap = {} } = useQuery({
    queryKey: ["article-versions-map", id, expandedArticles],
    queryFn: async () => {
      const map: Record<string, any[]> = {};
      for (const articleId of expandedArticles) {
        const versions = await versionsQueries.getByArticleId(articleId);
        map[articleId] = versions || [];
      }
      return map;
    },
    enabled: !!id && expandedArticles.length > 0,
  });

  // Fetch changelog for this text
  const { data: changelogEntries = [] } = useQuery({
    queryKey: ["changelog", id],
    queryFn: () => changelogQueries.getByTexteId(id!),
    enabled: !!id,
  });


  // Sort and filter articles
  const sortedAndFilteredArticles = useMemo(() => {
    if (!articles) return [];
    
    // 1. Filter by search query
    let filtered = articles;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = articles.filter((article: any) => {
        const numero = article.numero || article.numero_article || '';
        const titre = article.titre || article.titre_court || '';
        const resume = article.resume || '';
        // Get content from active version
        const activeVersion = activeVersionsMap[article.id];
        const contenu = activeVersion?.contenu || '';
        return (
          numero.toLowerCase().includes(query) ||
          titre.toLowerCase().includes(query) ||
          stripHtml(resume).toLowerCase().includes(query) ||
          stripHtml(contenu).toLowerCase().includes(query)
        );
      });
    }
    
    // 2. Sort alphabetically by numero
    return [...filtered].sort((a: any, b: any) => {
      const numA = a.numero || a.numero_article || "";
      const numB = b.numero || b.numero_article || "";
      return numA.localeCompare(numB, 'fr', { numeric: true, sensitivity: 'base' });
    });
  }, [articles, searchQuery, activeVersionsMap]);

  // Show error toast if query fails
  if (error) {
    toast.error("Erreur lors du chargement du texte");
  }

  const deleteArticleMutation = useMutation({
    mutationFn: (id: string) => articlesQueries.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["texte-articles"] });
      toast.success("Article supprimé avec succès");
      setDeleteArticleId(null);
    },
    onError: () => {
      toast.error("Erreur lors de la suppression");
    },
  });

  const deleteVersionMutation = useMutation({
    mutationFn: (id: string) => versionsQueries.deleteWithRepair(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (q) => q.queryKey[0] === "article-versions-map" && q.queryKey[1] === id
      });
      queryClient.invalidateQueries({ queryKey: ["texte-article"] });
      toast.success("Version supprimée avec succès");
    },
    onError: () => {
      toast.error("Erreur lors de la suppression de la version");
    },
  });

  const setCurrentVersionMutation = useMutation({
    mutationFn: async ({ articleId, version }: { articleId: string; version: any }) => {
      // Vérifier s'il existe des effets juridiques postérieurs qui pourraient entrer en conflit
      const { data: futureEffects, error: effectsError } = await supabase
        .from('articles_effets_juridiques')
        .select(`
          id,
          type_effet,
          date_effet,
          article_source_id,
          textes_articles!articles_effets_juridiques_article_source_id_fkey(
            numero_article,
            textes_reglementaires!textes_articles_texte_id_fkey(reference_officielle)
          )
        `)
        .eq('article_cible_id', articleId)
        .gt('date_effet', version.date_version)
        .in('type_effet', ['ABROGE', 'REMPLACE', 'MODIFIE']);

      if (effectsError) throw effectsError;

      // Vérifier si l'article a été abrogé après cette version
      const hasAbrogation = futureEffects?.some(e => e.type_effet === 'ABROGE');
      if (hasAbrogation) {
        const abrogationEffect = futureEffects.find(e => e.type_effet === 'ABROGE');
        throw new Error(
          `Impossible de restaurer cette version : l'article a été abrogé ultérieurement le ${new Date(abrogationEffect.date_effet).toLocaleDateString('fr-FR')}`
        );
      }

      // Avertir s'il y a des modifications postérieures
      if (futureEffects && futureEffects.length > 0) {
        const modificationsCount = futureEffects.filter(e => 
          e.type_effet === 'MODIFIE' || e.type_effet === 'REMPLACE'
        ).length;
        
        if (modificationsCount > 0) {
          toast.warning(
            `Attention : ${modificationsCount} modification(s) juridique(s) postérieure(s) existent`,
            { duration: 5000 }
          );
        }
      }

      // 1. Récupérer le prochain numéro de version
      const existingVersions = await versionsQueries.getByArticleId(articleId);
      const nextVersionNum = Math.max(...existingVersions.map((v: any) => v.numero_version), 0) + 1;
      
      // 2. Créer une nouvelle version (pas écraser l'article)
      await versionsQueries.create({
        article_id: articleId,
        numero_version: nextVersionNum,
        contenu: version.contenu,
        date_effet: new Date().toISOString().split('T')[0],
        statut: 'en_vigueur',
        source_texte_id: version.source_texte_id,
        notes_modifications: `Restauration de la Version ${version.numero_version} datée du ${version.date_effet}`,
      });
      
      // 3. Marquer les versions précédentes comme remplacées
      await Promise.all(
        existingVersions
          .filter((v: any) => v.statut === 'en_vigueur')
          .map((v: any) => versionsQueries.update(v.id, { 
            statut: 'remplacee'
          }))
      );
      // Note: Content is now stored in article_versions, not articles table
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["texte-articles"] });
      queryClient.invalidateQueries({ queryKey: ["article-versions"] });
      queryClient.invalidateQueries({ queryKey: ["article-versions-map"] });
      queryClient.invalidateQueries({ queryKey: ["article-active-versions"] });
      toast.success("✅ Version restaurée avec succès - Nouvelle version créée dans l'historique");
      setShowRestoreConfirm(false);
      setVersionToRestore(null);
    },
    onError: () => {
      toast.error("Erreur lors de la restauration");
      setShowRestoreConfirm(false);
      setVersionToRestore(null);
    },
  });

  const handleEditArticle = (article: any) => {
    // Enrich article with content from its active version
    const activeVersion = activeVersionsMap[article.id];
    setEditingArticle({
      ...article,
      contenu: activeVersion?.contenu || "",
      _activeVersionId: activeVersion?.id,
      _activeVersionNumero: activeVersion?.numero_version,
    });
    setShowEditArticleModal(true);
  };

  const handleCreateEffet = (article: any) => {
    setTargetArticleForEffet({
      ...article,
      numero_article: article.numero, // Map for legacy component
      texte_id: id,
      texte: {
        type: texte?.type || "",
        reference_officielle: texte?.reference || "", // Use correct column
      }
    });
    setShowQuickEffetModal(true);
  };

  const handleCompareVersions = (article: any) => {
    setComparisonArticle(article);
    setShowComparisonModal(true);
  };

  const handleSetCurrentVersion = (articleId: string, version: any) => {
    setVersionToRestore({ articleId, version });
    setShowRestoreConfirm(true);
  };

  const handleConfirmRestore = () => {
    if (versionToRestore) {
      setCurrentVersionMutation.mutate(versionToRestore);
    }
  };

  const handleCompareVersionsDetail = (versionBefore: any, versionAfter: any) => {
    setCompareVersions({ before: versionBefore, after: versionAfter });
    setCompareModalOpen(true);
  };

  const toggleArticleExpand = (articleId: string) => {
    setExpandedArticles(prev =>
      prev.includes(articleId)
        ? prev.filter(id => id !== articleId)
        : [...prev, articleId]
    );
  };

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

  if (isLoading || articlesLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-muted-foreground">Chargement du texte...</p>
      </div>
    );
  }

  if (error || !texte) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <FileText className="h-16 w-16 text-destructive" />
        <p className="text-destructive font-medium">
          {error ? "Erreur lors du chargement" : "Texte non trouvé"}
        </p>
        <Button variant="outline" onClick={() => navigate("/bibliotheque")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à la bibliothèque
        </Button>
      </div>
    );
  }

  // Note: statut_vigueur is now managed at article_versions level, not texte level
  const statutInfo = { label: "Actif", variant: "success" as const };

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        onClick={() => navigate("/bibliotheque")}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour à la bibliothèque
      </Button>

      <Card className="shadow-medium">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">{texte.reference}</Badge>
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
              <CardTitle className="text-2xl">{texte.titre}</CardTitle>
            </div>
            {texte.pdf_url && (
              <Button
                variant="outline"
                onClick={() => setPdfViewerOpen(true)}
              >
                <FileText className="h-4 w-4 mr-2" />
                Voir le PDF
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {texte.date_signature && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">Date de signature</div>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {new Date(texte.date_signature).toLocaleDateString("fr-TN")}
                </div>
              </div>
            )}
            {texte.date_publication && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">Date de publication</div>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {new Date(texte.date_publication).toLocaleDateString("fr-TN")}
                </div>
              </div>
            )}
            {(texte as any).autorite_emettrice && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">Autorité</div>
                <div className="mt-1">{(texte as any).autorite_emettrice}</div>
              </div>
            )}
            {texte.annee && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">Année</div>
                <div className="mt-1">{texte.annee}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="articles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="articles">Articles ({articles?.length || 0})</TabsTrigger>
          <TabsTrigger value="effets-crees">Versions créées</TabsTrigger>
          <TabsTrigger value="changelog">Historique ({changelogEntries?.length || 0})</TabsTrigger>
          <TabsTrigger value="info">Informations</TabsTrigger>
        </TabsList>

        <TabsContent value="articles" className="space-y-4">
          <div className="space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <h2 className="text-xl font-semibold">Articles réglementaires</h2>
              <div className="flex gap-2">
                {isStaff && (
                  <Button onClick={() => {
                    setEditingArticle(null);
                    setShowArticleModal(true);
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un article
                  </Button>
                )}
              </div>
            </div>
            
            {articles && articles.length > 0 && (
              <BibliothequeSearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                resultCount={sortedAndFilteredArticles.length}
                className="max-w-2xl"
              />
            )}
          </div>

          {sortedAndFilteredArticles && sortedAndFilteredArticles.length > 0 ? (
            <div className="space-y-3">
              {sortedAndFilteredArticles.map((article, index) => {
                const isExpanded = expandedArticles.includes(article.id);
                const versionsData = articleVersionsMap[article.id] || [];
                const activeVersion = activeVersionsMap[article.id];
                const displayContent = activeVersion?.contenu || article.resume || null;

                return (
                  <Card key={article.id} className="shadow-soft">
                    <Collapsible 
                      open={isExpanded} 
                      onOpenChange={() => toggleArticleExpand(article.id)}
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            <Badge variant="outline" className="shrink-0 h-8 w-8 rounded-full flex items-center justify-center font-bold">
                              {index + 1}
                            </Badge>
                            <div className="flex-1">
                              <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm" className="p-0 h-auto hover:bg-transparent -ml-2">
                                  <div className="flex items-center gap-2">
                                    {isExpanded ? (
                                      <ChevronDown className="h-4 w-4" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4" />
                                    )}
                                     <h3 className="font-semibold text-lg flex items-center gap-2 flex-wrap">
                                       {article.numero || article.numero_article}
                                       {(article.titre || article.titre_court) && <span className="text-muted-foreground">- {article.titre || article.titre_court}</span>}
                                       {(article.porte_exigence || article.is_exigence) ? (
                                         <Badge variant="default" className="text-xs">
                                           Exigence réglementaire
                                         </Badge>
                                       ) : article.est_introductif ? (
                                         <Badge variant="secondary" className="text-xs">
                                           Introductif
                                         </Badge>
                                       ) : null}
                                     </h3>
                                  </div>
                                </Button>
                              </CollapsibleTrigger>
                              {displayContent && (
                                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                  {stripHtml(displayContent)}
                                </p>
                              )}
                              {!displayContent && !activeVersion && (
                                <p className="text-sm text-muted-foreground/60 mt-2 italic">
                                  Aucune version active - ajoutez du contenu
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                             {isStaff && (
                              <>
                                {versionsData.length > 0 && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleCompareVersions(article)}
                                    title="Comparer les versions"
                                  >
                                    <GitCompare className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditArticle(article)}
                                  title="Éditer l'article (corrections)"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCreateEffet(article)}
                                  title="Créer une version"
                                >
                                  <FileEdit className="h-4 w-4 text-primary" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeleteArticleId(article.id)}
                                  title="Supprimer"
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>

                        <CollapsibleContent>
                          <Separator className="my-4" />
                          
                          {/* Article Content from Active Version */}
                          {activeVersion?.contenu ? (
                            <div className="mb-4">
                              <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                                Contenu actuel (Version {activeVersion.numero_version} - {new Date(activeVersion.date_effet).toLocaleDateString("fr-FR")}):
                                <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/20">
                                  En vigueur
                                </Badge>
                              </h4>
                              <div className="p-3 bg-muted/50 rounded-md prose prose-sm max-w-none">
                                <div 
                                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(activeVersion.contenu) }}
                                  className="text-sm"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="mb-4 p-4 border-2 border-dashed border-muted-foreground/20 rounded-md text-center">
                              <p className="text-muted-foreground mb-2">Aucune version active pour cet article</p>
                              {isStaff && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCreateEffet(article)}
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Ajouter du contenu
                                </Button>
                              )}
                            </div>
                          )}

                          {/* Versions Timeline */}
                          <div className="mt-6">
                            <ArticleVersionsTimeline
                              versions={versionsData}
                              onCompare={handleCompareVersionsDetail}
                              onRestore={(version) => handleSetCurrentVersion(article.id, version)}
                              onDelete={(versionId) => deleteVersionMutation.mutate(versionId)}
                            />
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  </Card>
                );
              })}
            </div>
          ) : searchQuery ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground mb-4">
                Aucun article trouvé pour "{searchQuery}"
              </p>
              <Button 
                variant="outline" 
                onClick={() => setSearchQuery("")}
              >
                Effacer la recherche
              </Button>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">Aucun article pour ce texte</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setEditingArticle(null);
                    setShowArticleModal(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter le premier article
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>


        <TabsContent value="changelog" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique des modifications</CardTitle>
              <CardDescription>
                Suivi chronologique des changements apportés à ce texte réglementaire
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TimelineChangelog entries={changelogEntries} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="effets-crees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Effets juridiques créés</CardTitle>
              <CardDescription>
                Liste des modifications apportées par ce texte à d'autres articles réglementaires
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EffetsCreesTab texteId={id!} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="info">
          <Card>
            <CardContent className="pt-6 space-y-4">
              {texte.source_url && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Source officielle</div>
                  <a 
                    href={texte.source_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1 mt-1"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Voir le document original
                  </a>
                </div>
              )}
              {texte.domaines && Array.isArray(texte.domaines) && texte.domaines.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">Domaines d'application</div>
                  <div className="flex flex-wrap gap-2">
                    {texte.domaines
                      .filter((item: any) => item.domaine)
                      .map((item: any, idx: number) => (
                        <Badge key={item.domaine.id || idx} variant="outline">
                          {item.domaine.libelle}
                        </Badge>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals - Single ArticleFormModal for both create and edit */}
      <ArticleFormModal
        open={showArticleModal || showEditArticleModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowArticleModal(false);
            setShowEditArticleModal(false);
            setEditingArticle(null);
          }
        }}
        texteId={id!}
        article={showEditArticleModal ? editingArticle : null}
        onSuccess={() => {
          setEditingArticle(null);
          setShowArticleModal(false);
          setShowEditArticleModal(false);
          queryClient.invalidateQueries({ queryKey: ["texte-articles", id] });
          queryClient.invalidateQueries({ queryKey: ["article-active-versions", id] });
        }}
      />

      {comparisonArticle && (
        <ArticleVersionComparison
          open={showComparisonModal}
          onOpenChange={setShowComparisonModal}
          versions={articleVersionsMap[comparisonArticle.id] || []}
          currentVersion={comparisonArticle}
        />
      )}

      {/* Article Version Wizard */}
      {targetArticleForEffet && (
        <ArticleVersionWizard
          open={showQuickEffetModal}
          onOpenChange={setShowQuickEffetModal}
          targetArticle={targetArticleForEffet}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["article-versions"] });
            queryClient.invalidateQueries({ queryKey: ["articles-effets"] });
            queryClient.invalidateQueries({ queryKey: ["effets-juridiques-texte", id] });
          }}
        />
      )}

      {/* Delete Article Confirmation */}
      <Dialog open={!!deleteArticleId} onOpenChange={() => setDeleteArticleId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cet article ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteArticleId(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteArticleId && deleteArticleMutation.mutate(deleteArticleId)}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PDF Viewer Modal */}
      <PDFViewerModal
        open={pdfViewerOpen}
        onOpenChange={setPdfViewerOpen}
        pdfUrl={texte?.pdf_url || null}
        title={texte?.reference}
      />

      {/* Restore Version Confirmation Dialog */}
      <AlertDialog open={showRestoreConfirm} onOpenChange={setShowRestoreConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Restaurer cette version ?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <div className="bg-blue-50 dark:bg-blue-950 border-l-4 border-blue-500 p-3 rounded">
                <p className="font-medium text-blue-900 dark:text-blue-100">📌 Action : Création d'une nouvelle version</p>
                <p className="text-sm mt-1 text-blue-700 dark:text-blue-300">
                  Une nouvelle version sera créée avec le contenu de <strong>Version {versionToRestore?.version?.version_numero}</strong>
                </p>
              </div>
              
              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success" />
                  L'historique complet sera préservé
                </p>
                <p className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success" />
                  La version actuelle restera consultable
                </p>
                <p className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success" />
                  La nouvelle version sera marquée comme "Version restaurée"
                </p>
              </div>
              
              <div className="bg-amber-50 dark:bg-amber-950 border-l-4 border-amber-500 p-3 rounded">
                <p className="font-medium text-amber-900 dark:text-amber-100">⚠️ Important</p>
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  Cette action créera une nouvelle entrée dans l'historique des versions
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRestore}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Restaurer cette version
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Version Comparison Modal */}
      <Dialog open={compareModalOpen} onOpenChange={setCompareModalOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitCompare className="h-5 w-5" />
              Comparaison détaillée des versions
            </DialogTitle>
          </DialogHeader>
          {compareVersions && (
            <VersionBeforeAfterView
              versionBefore={compareVersions.before}
              versionAfter={compareVersions.after}
              onExport={() => {
                toast.info("Export PDF en cours de développement");
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
