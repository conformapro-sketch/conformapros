import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  FileText, 
  Calendar, 
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  AlertCircle,
  ExternalLink,
  History
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { textesReglementairesQueries, articlesQueries } from "@/lib/textes-reglementaires-queries";
import { toast } from "sonner";
import { useState } from "react";
import { PDFViewerModal } from "@/components/PDFViewerModal";
import { ArticleReglementaireFormModal } from "@/components/ArticleReglementaireFormModal";
import { ArticleVersionManagerModal } from "@/components/ArticleVersionManagerModal";
import { TexteDomainesManager } from "@/components/TexteDomainesManager";
import { TagManager } from "@/components/TagManager";

export default function GestionTexteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<any>(null);
  const [deleteArticleId, setDeleteArticleId] = useState<string | null>(null);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [versionManagerArticle, setVersionManagerArticle] = useState<{ id: string; numero: string } | null>(null);

  const { data: texte, isLoading, error } = useQuery({
    queryKey: ["texte-reglementaire-detail", id],
    queryFn: () => textesReglementairesQueries.getById(id!),
    enabled: !!id,
  });

  const { data: articles = [], isLoading: articlesLoading } = useQuery({
    queryKey: ["texte-articles", id],
    queryFn: () => articlesQueries.getByTexteId(id!),
    enabled: !!id,
  });

  const { data: activeVersions = [] } = useQuery({
    queryKey: ["articles-active-versions", articles.map(a => a.id)],
    queryFn: () => articlesQueries.getActiveVersions(articles.map(a => a.id)),
    enabled: articles.length > 0,
  });

  const deleteArticleMutation = useMutation({
    mutationFn: (articleId: string) => articlesQueries.delete(articleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["texte-articles"] });
      toast.success("Article supprimé avec succès");
      setDeleteArticleId(null);
    },
    onError: () => {
      toast.error("Erreur lors de la suppression");
    },
  });

  const getVersionForArticle = (articleId: string) => {
    return activeVersions.find(v => v.article_id === articleId);
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
        <AlertCircle className="h-16 w-16 text-destructive" />
        <p className="text-destructive font-medium">
          {error ? "Erreur lors du chargement" : "Texte non trouvé"}
        </p>
        <Button variant="outline" onClick={() => navigate("/bibliotheque/gestion-textes")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à la liste
        </Button>
      </div>
    );
  }

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case "loi": return "default";
      case "decret": return "secondary";
      case "arrete": return "outline";
      case "circulaire": return "outline";
      default: return "secondary";
    }
  };

  return (
    <div className="space-y-6 p-6">
      <Button
        variant="ghost"
        onClick={() => navigate("/bibliotheque/gestion-textes")}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour à la liste
      </Button>

      {/* Métadonnées du texte */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={getTypeBadgeVariant(texte.type)}>{texte.type.toUpperCase()}</Badge>
                <Badge variant="outline">{texte.reference}</Badge>
              </div>
              <CardTitle className="text-2xl">{texte.titre}</CardTitle>
              {texte.date_publication && (
                <CardDescription className="mt-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {new Date(texte.date_publication).toLocaleDateString("fr-FR")}
                </CardDescription>
              )}
            </div>
            <div className="flex gap-2">
              {texte.source_url && (
                <Button
                  variant="outline"
                  onClick={() => window.open(texte.source_url, "_blank")}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Source
                </Button>
              )}
              {texte.pdf_url && (
                <Button
                  variant="outline"
                  onClick={() => setPdfViewerOpen(true)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Domaines associés */}
      <TexteDomainesManager texteId={id!} />

      {/* Tags */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Tags</CardTitle>
          <CardDescription>
            Étiquettes pour organiser et catégoriser ce texte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TagManager entityId={id!} entityType="texte" />
        </CardContent>
      </Card>

      {/* Articles */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg">Articles</CardTitle>
              <CardDescription>
                {articles.length} article{articles.length > 1 ? "s" : ""} dans ce texte
              </CardDescription>
            </div>
            <Button onClick={() => setShowArticleModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un article
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {articles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun article pour ce texte
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Titre</TableHead>
                  <TableHead>Classification</TableHead>
                  <TableHead>Version active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {articles.map((article) => {
                  const activeVersion = getVersionForArticle(article.id);
                  return (
                    <TableRow key={article.id}>
                      <TableCell className="font-medium">{article.numero}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{article.titre}</div>
                          {article.resume && (
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {article.resume}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {article.est_introductif && (
                            <Badge variant="secondary" className="text-xs">Introductif</Badge>
                          )}
                          {article.porte_exigence && (
                            <Badge variant="default" className="text-xs">Exigence</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {activeVersion ? (
                          <div className="text-sm">
                            <Badge variant="default" className="text-xs bg-success text-success-foreground">V{activeVersion.numero_version}</Badge>
                            <div className="text-muted-foreground text-xs mt-1">
                              {new Date(activeVersion.date_effet).toLocaleDateString("fr-FR")}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Aucune version</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setVersionManagerArticle({ id: article.id, numero: article.numero })}
                          >
                            <History className="h-4 w-4 mr-1" />
                            Versions
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingArticle(article);
                              setShowArticleModal(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteArticleId(article.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteArticleId} onOpenChange={() => setDeleteArticleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cet article ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteArticleId && deleteArticleMutation.mutate(deleteArticleId)}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* PDF Viewer */}
      {texte.pdf_url && (
        <PDFViewerModal
          open={pdfViewerOpen}
          onOpenChange={setPdfViewerOpen}
          pdfUrl={texte.pdf_url}
          title={texte.titre}
        />
      )}

      {/* Article form modal */}
      <ArticleReglementaireFormModal
        open={showArticleModal}
        onOpenChange={(open) => {
          setShowArticleModal(open);
          if (!open) setEditingArticle(null);
        }}
        texteId={id!}
        article={editingArticle}
        onSuccess={() => {
          setShowArticleModal(false);
          setEditingArticle(null);
        }}
      />

      {/* Version manager modal */}
      {versionManagerArticle && (
        <ArticleVersionManagerModal
          open={!!versionManagerArticle}
          onOpenChange={(open) => !open && setVersionManagerArticle(null)}
          articleId={versionManagerArticle.id}
          articleNumero={versionManagerArticle.numero}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["articles-active-versions"] });
          }}
        />
      )}
    </div>
  );
}
