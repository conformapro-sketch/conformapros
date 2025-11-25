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
import { textesReglementairesQueries, textesArticlesQueries, textesArticlesVersionsQueries } from "@/lib/textes-queries";
import { changelogQueries } from "@/lib/actes-queries";
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

export default function BibliothequeTexteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
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
    queryFn: () => textesReglementairesQueries.getById(id!),
    enabled: !!id,
  });

  const { data: articles = [], isLoading: articlesLoading } = useQuery({
    queryKey: ["texte-articles", id],
    queryFn: () => textesArticlesQueries.getByTexteId(id!),
    enabled: !!id,
  });

  // Fetch versions for a specific article when expanded
  const { data: articleVersionsMap = {} } = useQuery({
    queryKey: ["article-versions-map", id, expandedArticles],
    queryFn: async () => {
      const map: Record<string, any[]> = {};
      for (const articleId of expandedArticles) {
        const versions = await textesArticlesVersionsQueries.getByArticleId(articleId);
        map[articleId] = versions || [];
      }
      return map;
    },
    enabled: !!id && expandedArticles.length > 0,
  });

  // Fetch changelog for this act
  const { data: changelogEntries = [] } = useQuery({
    queryKey: ["changelog", id],
    queryFn: () => changelogQueries.getByActeId(id!),
    enabled: !!id,
  });


  // Sort and filter articles
  const sortedAndFilteredArticles = useMemo(() => {
    if (!articles) return [];
    
    // 1. Filter by search query
    let filtered = articles;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = articles.filter((article) => {
        return (
          article.numero_article?.toLowerCase().includes(query) ||
          article.titre_court?.toLowerCase().includes(query) ||
          stripHtml(article.resume || "").toLowerCase().includes(query) ||
          stripHtml(article.contenu || "").toLowerCase().includes(query)
        );
      });
    }
    
    // 2. Sort alphabetically by numero_article
    return [...filtered].sort((a, b) => {
      const numA = a.numero_article || "";
      const numB = b.numero_article || "";
      return numA.localeCompare(numB, 'fr', { numeric: true, sensitivity: 'base' });
    });
  }, [articles, searchQuery]);

  // Show error toast if query fails
  if (error) {
    toast.error("Erreur lors du chargement du texte");
  }

  const deleteArticleMutation = useMutation({
    mutationFn: (id: string) => textesArticlesQueries.delete(id),
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
    mutationFn: (id: string) => textesArticlesVersionsQueries.deleteWithRepair(id),
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
      const existingVersions = await textesArticlesVersionsQueries.getByArticleId(articleId);
      const nextVersionNum = Math.max(...existingVersions.map(v => v.numero_version), 0) + 1;
      
      // 2. Créer une nouvelle version (pas écraser l'article)
      await textesArticlesVersionsQueries.create({
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
          .filter(v => v.statut === 'en_vigueur')
          .map(v => textesArticlesVersionsQueries.update(v.id, { 
            statut: 'remplacee'
          }))
      );
      
      // 4. Mettre à jour le contenu actuel de l'article
      await textesArticlesQueries.update(articleId, { contenu: version.contenu });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["texte-articles"] });
      queryClient.invalidateQueries({ queryKey: ["article-versions"] });
      queryClient.invalidateQueries({ queryKey: ["article-versions-map"] });
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
    setEditingArticle(article);
    setShowEditArticleModal(true);
  };

  const handleCreateEffet = (article: any) => {
    setTargetArticleForEffet({
      ...article,
      texte_id: id,
      texte: {
        type: texte?.type || "",
        reference_officielle: texte?.reference_officielle || "",
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

  const statutInfo = getStatutBadge(texte.statut_vigueur);

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
                <Badge variant="outline">{texte.reference_officielle}</Badge>
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
              {texte.resume && (
                <CardDescription className="mt-2">
                  <div 
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(texte.resume) }}
                    className="prose prose-sm max-w-none"
                  />
                </CardDescription>
              )}
            </div>
            {texte.fichier_pdf_url && (
              <Button
                variant="outline"
                onClick={() => setPdfViewerOpen(true)}
              >
                <FileText className="h-4 w-4 mr-2" />
                Voir le PDF
              </Button>
            )}
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
            {texte.autorite && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">Autorité</div>
                <div className="mt-1">{texte.autorite}</div>
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
                <Button onClick={() => {
                  setEditingArticle(null);
                  setShowArticleModal(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un article
                </Button>
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
                                      {article.numero_article}
                                      {article.titre_court && <span className="text-muted-foreground">- {article.titre_court}</span>}
                                      {article.indicatif && (
                                        <Badge variant="secondary" className="text-xs">
                                          Indicatif
                                        </Badge>
                                      )}
                                    </h3>
                                  </div>
                                </Button>
                              </CollapsibleTrigger>
                              {(article.resume || article.contenu) && (
                                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                  {article.resume ? stripHtml(article.resume) : stripHtml(article.contenu)}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
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
                              <FileEdit className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteArticleId(article.id)}
                              title="Supprimer"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>

                        <CollapsibleContent>
                          <Separator className="my-4" />
                          
                          {/* Article Content */}
                          {article.contenu && (
                            <div className="mb-4">
                              <h4 className="text-sm font-medium text-muted-foreground mb-2">Contenu actuel:</h4>
                              <div className="p-3 bg-muted/50 rounded-md prose prose-sm max-w-none">
                                <div 
                                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.contenu) }}
                                  className="text-sm"
                                />
                              </div>
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
              {texte.code && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Code</div>
                  <div className="mt-1">{texte.code.titre}</div>
                  {texte.code.description && (
                    <div className="text-sm text-muted-foreground mt-1">{texte.code.description}</div>
                  )}
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

      {/* Modals */}
      <ArticleFormModal
        open={showArticleModal}
        onOpenChange={setShowArticleModal}
        texteId={id!}
        article={editingArticle}
        onSuccess={() => {
          setEditingArticle(null);
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

      {/* Article Form Modal - For editing existing articles */}
      <ArticleFormModal
        open={showEditArticleModal}
        onOpenChange={setShowEditArticleModal}
        texteId={id!}
        article={editingArticle}
        onSuccess={() => {
          setEditingArticle(null);
          queryClient.invalidateQueries({ queryKey: ["texte-articles", id] });
        }}
      />

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
        pdfUrl={texte?.pdf_url || texte?.fichier_pdf_url || null}
        title={texte?.reference_officielle}
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
