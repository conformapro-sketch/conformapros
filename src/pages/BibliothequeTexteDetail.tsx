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
  Star
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { textesReglementairesQueries, textesArticlesQueries, textesArticlesVersionsQueries } from "@/lib/textes-queries";
import { changelogQueries } from "@/lib/actes-queries";
import { toast } from "sonner";
import { useState } from "react";
import { ArticleFormModal } from "@/components/ArticleFormModal";
import { ArticleVersionModal } from "@/components/ArticleVersionModal";
import { ArticleVersionComparison } from "@/components/ArticleVersionComparison";
import { TimelineChangelog } from "@/components/TimelineChangelog";
import { TexteCodesDisplay } from "@/components/TexteCodesDisplay";
import { sanitizeHtml, stripHtml } from "@/lib/sanitize-html";
import { PDFViewerModal } from "@/components/PDFViewerModal";

export default function BibliothequeTexteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Article management
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<any>(null);
  const [deleteArticleId, setDeleteArticleId] = useState<string | null>(null);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  
  // Version management
  const [expandedArticles, setExpandedArticles] = useState<string[]>([]);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [currentArticleId, setCurrentArticleId] = useState<string>("");
  const [editingVersion, setEditingVersion] = useState<any>(null);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [comparisonArticle, setComparisonArticle] = useState<any>(null);

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
    mutationFn: (id: string) => textesArticlesVersionsQueries.softDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["article-versions"] });
      toast.success("Version supprimée avec succès");
    },
    onError: () => {
      toast.error("Erreur lors de la suppression");
    },
  });

  const setCurrentVersionMutation = useMutation({
    mutationFn: ({ articleId, version }: { articleId: string; version: any }) =>
      textesArticlesQueries.update(articleId, { contenu: version.contenu }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["texte-articles"] });
      toast.success("Version actuelle mise à jour");
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour");
    },
  });

  const handleEditArticle = (article: any) => {
    setEditingArticle(article);
    setShowArticleModal(true);
  };

  const handleAddVersion = (articleId: string) => {
    setCurrentArticleId(articleId);
    setEditingVersion(null);
    setShowVersionModal(true);
  };

  const handleEditVersion = (version: any, articleId: string) => {
    setCurrentArticleId(articleId);
    setEditingVersion(version);
    setShowVersionModal(true);
  };

  const handleCompareVersions = (article: any) => {
    setComparisonArticle(article);
    setShowComparisonModal(true);
  };

  const handleSetCurrentVersion = (articleId: string, version: any) => {
    if (confirm("Voulez-vous vraiment remplacer le contenu actuel de l'article par cette version ?")) {
      setCurrentVersionMutation.mutate({ articleId, version });
    }
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
          <TabsTrigger value="changelog">Historique ({changelogEntries?.length || 0})</TabsTrigger>
          <TabsTrigger value="info">Informations</TabsTrigger>
        </TabsList>

        <TabsContent value="articles" className="space-y-4">
          <div className="flex justify-between items-center gap-4">
            <h2 className="text-xl font-semibold">Articles réglementaires</h2>
            <Button onClick={() => {
              setEditingArticle(null);
              setShowArticleModal(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un article
            </Button>
          </div>

          {articles && articles.length > 0 ? (
            <div className="space-y-3">
              {articles.map((article, index) => {
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
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAddVersion(article.id)}
                              title="Ajouter une version"
                            >
                              <History className="h-4 w-4 mr-2" />
                              Version
                            </Button>
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
                              title="Modifier"
                            >
                              <Pencil className="h-4 w-4" />
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

                          {/* Versions List */}
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-sm font-medium">Versions ({versionsData.length})</h4>
                            </div>

                            {versionsData.length > 0 ? (
                              <div className="border rounded-md overflow-hidden">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Version</TableHead>
                                      <TableHead>Date d'effet</TableHead>
                                      <TableHead>Statut</TableHead>
                                      <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {versionsData.map((version: any) => {
                                      const versionStatut = getStatutBadge(version.statut_vigueur);
                                      return (
                                        <TableRow key={version.id}>
                                          <TableCell className="font-medium">
                                            {version.version_label}
                                          </TableCell>
                                          <TableCell>
                                            {version.date_effet 
                                              ? new Date(version.date_effet).toLocaleDateString("fr-TN")
                                              : "-"}
                                          </TableCell>
                                          <TableCell>
                                            <Badge
                                              className={
                                                versionStatut.variant === "success"
                                                  ? "bg-success text-success-foreground"
                                                  : versionStatut.variant === "warning"
                                                  ? "bg-warning text-warning-foreground"
                                                  : versionStatut.variant === "destructive"
                                                  ? "bg-destructive text-destructive-foreground"
                                                  : ""
                                              }
                                            >
                                              {versionStatut.label}
                                            </Badge>
                                          </TableCell>
                                          <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleSetCurrentVersion(article.id, version)}
                                                title="Marquer comme version actuelle"
                                              >
                                                <Check className="h-4 w-4" />
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEditVersion(version, article.id)}
                                                title="Modifier"
                                              >
                                                <Pencil className="h-4 w-4" />
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                  if (confirm("Supprimer cette version ?")) {
                                                    deleteVersionMutation.mutate(version.id);
                                                  }
                                                }}
                                                title="Supprimer"
                                              >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                              </Button>
                                            </div>
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })}
                                  </TableBody>
                                </Table>
                              </div>
                            ) : (
                              <div className="text-center py-8 border rounded-md bg-muted/20">
                                <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">Aucune version</p>
                              </div>
                            )}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  </Card>
                );
              })}
            </div>
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

      <ArticleVersionModal
        open={showVersionModal}
        onOpenChange={setShowVersionModal}
        articleId={currentArticleId}
        version={editingVersion}
        onSuccess={() => {
          setEditingVersion(null);
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
    </div>
  );
}
