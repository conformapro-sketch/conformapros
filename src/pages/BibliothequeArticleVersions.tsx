import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft,
  FileText,
  Calendar,
  Plus,
  Pencil,
  Trash2,
  GitCompare,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { textesArticlesQueries, textesArticlesVersionsQueries } from "@/lib/textes-queries";
import { toast } from "sonner";
import { useState } from "react";
import ReactDiffViewer from 'react-diff-viewer-continued';
import { sanitizeHtml } from "@/lib/sanitize-html";
import { ConsolidatedTextViewer } from "@/components/bibliotheque/ConsolidatedTextViewer";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

const MODIFICATION_TYPE_LABELS = {
  ajout: { label: "Ajout", variant: "default" as const, icon: Plus, color: "border-l-success" },
  modification: { label: "Modification", variant: "secondary" as const, icon: Pencil, color: "border-l-primary" },
  abrogation: { label: "Abrogation", variant: "destructive" as const, icon: XCircle, color: "border-l-destructive" },
  remplacement: { label: "Remplacement", variant: "outline" as const, icon: AlertCircle, color: "border-l-warning" },
  insertion: { label: "Insertion", variant: "default" as const, icon: Plus, color: "border-l-success" },
};

export default function BibliothequeArticleVersions() {
  const { articleId } = useParams<{ articleId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteVersionId, setDeleteVersionId] = useState<string | null>(null);
  const [compareVersionId, setCompareVersionId] = useState<string | null>(null);

  const { data: article, isLoading: articleLoading, error: articleError } = useQuery({
    queryKey: ["texte-article", articleId],
    queryFn: () => textesArticlesQueries.getById(articleId!),
    enabled: !!articleId,
  });

  const { data: versions, isLoading: versionsLoading, error: versionsError } = useQuery({
    queryKey: ["texte-article-versions", articleId],
    queryFn: () => textesArticlesVersionsQueries.getByArticleId(articleId!),
    enabled: !!articleId,
  });

  if (articleError) toast.error("Erreur lors du chargement de l'article");
  if (versionsError) toast.error("Erreur lors du chargement des versions");

  const deleteVersionMutation = useMutation({
    mutationFn: (id: string) => textesArticlesVersionsQueries.softDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["texte-article-versions"] });
      toast.success("Version supprimée avec succès");
      setDeleteVersionId(null);
    },
    onError: () => {
      toast.error("Erreur lors de la suppression");
    },
  });

  const isVersionActive = (version: any) => {
    const today = new Date().toISOString().split('T')[0];
    return version.effective_from <= today && (!version.effective_to || version.effective_to > today);
  };

  if (articleLoading || versionsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-muted-foreground">Chargement des versions...</p>
      </div>
    );
  }

  if (articleError || !article) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <FileText className="h-16 w-16 text-destructive" />
        <p className="text-destructive font-medium">
          {articleError ? "Erreur lors du chargement" : "Article non trouvé"}
        </p>
        <Button variant="outline" onClick={() => navigate("/bibliotheque")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à la bibliothèque
        </Button>
      </div>
    );
  }

  const texte = article.textes_reglementaires as any;
  const compareVersion = versions?.find(v => v.id === compareVersionId);

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour
      </Button>

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Versions - Article {article.numero}
        </h1>
        <p className="text-muted-foreground mt-2">
          {texte?.reference_officielle} - {texte?.intitule}
        </p>
        {article.titre && (
          <p className="text-sm text-muted-foreground mt-1">{article.titre}</p>
        )}
      </div>

      <Tabs defaultValue="versions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="versions">
            <FileText className="h-4 w-4 mr-2" />
            Versions historiques
          </TabsTrigger>
          <TabsTrigger value="consolidated">
            <Clock className="h-4 w-4 mr-2" />
            Vue consolidée
          </TabsTrigger>
        </TabsList>

        <TabsContent value="versions" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Historique des versions</h2>
            <div className="text-sm text-muted-foreground">
              Les versions sont créées automatiquement via les effets juridiques
            </div>
          </div>

          <Card className="shadow-medium border-l-4 border-l-primary">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Version actuelle</CardTitle>
                <Badge className="bg-primary text-primary-foreground">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Actuelle
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {article.contenu ? (
                <div className="prose prose-sm max-w-none">
                  <div 
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.contenu) }}
                    className="text-sm"
                  />
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Aucun contenu</p>
              )}
            </CardContent>
          </Card>

          {compareVersion && article.contenu && (
            <Card className="shadow-soft">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    <GitCompare className="h-5 w-5 inline mr-2" />
                    Comparaison de contenu
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setCompareVersionId(null)}>
                    Fermer
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ReactDiffViewer
                  oldValue={compareVersion.contenu}
                  newValue={article.contenu}
                  splitView={true}
                  leftTitle={`${compareVersion.version_label} (v${compareVersion.version_numero})`}
                  rightTitle="Version actuelle"
                  styles={{
                    diffContainer: { fontSize: '0.875rem' },
                  }}
                />
              </CardContent>
            </Card>
          )}

          {versions && versions.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Historique des versions</h3>
              
              {/* Timeline des versions */}
              <div className="relative space-y-4 before:absolute before:left-[23px] before:top-2 before:h-[calc(100%-2rem)] before:w-0.5 before:bg-border">
                {versions.map((version, index) => {
                  const modifType = MODIFICATION_TYPE_LABELS[version.modification_type as keyof typeof MODIFICATION_TYPE_LABELS] || 
                    { label: version.modification_type, variant: "secondary" as const, icon: FileText, color: "" };
                  const Icon = modifType.icon;
                  const active = isVersionActive(version);

                  return (
                    <Card key={version.id} className={cn("shadow-soft border-l-4 relative ml-12", modifType.color)}>
                      {/* Timeline marker */}
                      <div className="absolute -left-[3.25rem] top-6 flex items-center gap-3">
                        <div className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center",
                          active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        )}>
                          <Icon className="h-5 w-5" />
                        </div>
                      </div>

                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <CardTitle className="text-lg">
                                {version.version_label}
                              </CardTitle>
                              <Badge variant="outline" className="text-xs">
                                v{version.version_numero}
                              </Badge>
                              <Badge variant={modifType.variant}>
                                <Icon className="h-3 w-3 mr-1" />
                                {modifType.label}
                              </Badge>
                              {active && (
                                <Badge variant="outline" className="bg-success/10 text-success-foreground border-success/20">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  En vigueur
                                </Badge>
                              )}
                            </div>

                            {/* Période d'application */}
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>
                                Applicable du {format(new Date(version.effective_from), 'dd MMMM yyyy', { locale: fr })}
                                {version.effective_to && ` au ${format(new Date(version.effective_to), 'dd MMMM yyyy', { locale: fr })}`}
                              </span>
                            </div>

                            {/* Texte source */}
                            {version.source_text && (
                              <div className="flex items-start gap-2 text-sm">
                                <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div>
                                  <Button
                                    variant="link"
                                    className="h-auto p-0 text-sm"
                                    onClick={() => navigate(`/bibliotheque/textes/${version.source_text_id}`)}
                                  >
                                    {version.source_text.reference_officielle}
                                  </Button>
                                  {version.source_article_reference && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {version.source_article_reference}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Notes */}
                            {version.notes_modification && (
                              <div className="mt-3 p-3 bg-muted/50 rounded-md">
                                <p className="text-xs font-semibold text-foreground mb-1">Notes:</p>
                                <p className="text-sm text-muted-foreground">{version.notes_modification}</p>
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setCompareVersionId(version.id)}
                              title="Comparer"
                            >
                              <GitCompare className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteVersionId(version.id)}
                              title="Supprimer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="prose prose-sm max-w-none">
                          <div 
                            className="text-sm"
                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(version.contenu) }}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ) : (
            <Card className="shadow-soft">
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Aucune version historique</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Créez une première version pour commencer le suivi des modifications
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="consolidated">
          {texte && <ConsolidatedTextViewer texteId={texte.id} />}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteVersionId} onOpenChange={() => setDeleteVersionId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cette version ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteVersionId(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteVersionId && deleteVersionMutation.mutate(deleteVersionId)}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
