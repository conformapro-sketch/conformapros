import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
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
  AlertCircle,
  Filter,
  Search
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { textesArticlesQueries, textesArticlesVersionsQueries } from "@/lib/textes-queries";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import ReactDiffViewer from 'react-diff-viewer-continued';
import { sanitizeHtml } from "@/lib/sanitize-html";
import { ConsolidatedTextViewer } from "@/components/bibliotheque/ConsolidatedTextViewer";
import { VersionStatsCard } from "@/components/bibliotheque/VersionStatsCard";
import { VersionComparisonMatrix } from "@/components/bibliotheque/VersionComparisonMatrix";
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
  
  // Filtres
  const [filterType, setFilterType] = useState<string>("all");
  const [filterPeriod, setFilterPeriod] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

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

  // Filtrer les versions
  const filteredVersions = useMemo(() => {
    if (!versions) return [];
    
    return versions.filter(version => {
      // Filtre par type
      if (filterType !== "all" && version.modification_type !== filterType) {
        return false;
      }
      
      // Filtre par période
      if (filterPeriod !== "all") {
        const versionDate = new Date(version.date_version);
        const now = new Date();
        const monthsAgo = filterPeriod === "6months" ? 6 : 12;
        const cutoff = new Date(now.getFullYear(), now.getMonth() - monthsAgo, now.getDate());
        
        if (versionDate < cutoff) {
          return false;
        }
      }
      
      // Filtre par recherche textuelle
      if (searchTerm.trim()) {
        const search = searchTerm.toLowerCase();
        return (
          version.raison_modification?.toLowerCase().includes(search) ||
          version.notes_modification?.toLowerCase().includes(search) ||
          version.version_label?.toLowerCase().includes(search)
        );
      }
      
      return true;
    });
  }, [versions, filterType, filterPeriod, searchTerm]);

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

          {/* Statistiques */}
          {versions && versions.length > 0 && (
            <VersionStatsCard versions={versions} />
          )}

          {/* Filtres */}
          {versions && versions.length > 0 && (
            <Card className="p-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold text-sm">Filtres</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">Type de modification</label>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les types</SelectItem>
                        <SelectItem value="modifie">Modification</SelectItem>
                        <SelectItem value="abroge">Abrogation</SelectItem>
                        <SelectItem value="remplace">Remplacement</SelectItem>
                        <SelectItem value="renumerote">Renumérotation</SelectItem>
                        <SelectItem value="complete">Complément</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">Période</label>
                    <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toute la période</SelectItem>
                        <SelectItem value="6months">6 derniers mois</SelectItem>
                        <SelectItem value="12months">12 derniers mois</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground">Recherche</label>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher dans les notes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                </div>
                
                {(filterType !== "all" || filterPeriod !== "all" || searchTerm) && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {filteredVersions.length} version(s) affichée(s)
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFilterType("all");
                        setFilterPeriod("all");
                        setSearchTerm("");
                      }}
                    >
                      Réinitialiser
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Matrice de comparaison */}
          {versions && versions.length > 1 && (
            <VersionComparisonMatrix 
              versions={versions.slice(0, 3)}
              currentVersion={article ? {
                id: article.id!,
                version_numero: 999,
                version_label: "Version actuelle",
                date_version: new Date().toISOString(),
                contenu: article.contenu || "",
                is_active: true
              } : undefined}
            />
          )}

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

          {filteredVersions && filteredVersions.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                Historique des versions {filteredVersions.length !== versions?.length && `(${filteredVersions.length}/${versions?.length})`}
              </h3>
              
              {/* Timeline des versions */}
              <div className="relative space-y-4 before:absolute before:left-[23px] before:top-2 before:h-[calc(100%-2rem)] before:w-0.5 before:bg-border">
                {filteredVersions.map((version, index) => {
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
                            {!active && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteVersionId(version.id)}
                                title="Supprimer"
                                className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
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
      <AlertDialog open={!!deleteVersionId} onOpenChange={() => setDeleteVersionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              {(() => {
                const versionToDelete = filteredVersions.find(v => v.id === deleteVersionId);
                if (!versionToDelete) return "Êtes-vous sûr de vouloir supprimer cette version ?";
                
                return (
                  <>
                    Êtes-vous sûr de vouloir supprimer la <strong>version {versionToDelete.version_numero}</strong> ?<br />
                    <span className="text-destructive font-medium">Cette action est irréversible.</span>
                    <br /><br />
                    {versionToDelete.version_label && (
                      <div className="text-sm">
                        <strong>Label :</strong> {versionToDelete.version_label}
                      </div>
                    )}
                    {versionToDelete.raison_modification && (
                      <div className="mt-2 p-2 bg-muted rounded text-xs">
                        <strong>Raison :</strong> {versionToDelete.raison_modification}
                      </div>
                    )}
                  </>
                );
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteVersionId && deleteVersionMutation.mutate(deleteVersionId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
