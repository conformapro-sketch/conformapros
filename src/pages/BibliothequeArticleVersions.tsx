import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft,
  FileText,
  Calendar,
  Plus,
  Pencil,
  Trash2
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { textesArticlesQueries, textesArticlesVersionsQueries } from "@/lib/textes-queries";
import { toast } from "sonner";
import { useState } from "react";
import ReactDiffViewer from 'react-diff-viewer-continued';
import { sanitizeHtml } from "@/lib/sanitize-html";

export default function BibliothequeArticleVersions() {
  const { articleId } = useParams<{ articleId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showVersionDialog, setShowVersionDialog] = useState(false);
  const [editingVersion, setEditingVersion] = useState<any>(null);
  const [deleteVersionId, setDeleteVersionId] = useState<string | null>(null);
  const [compareVersionId, setCompareVersionId] = useState<string | null>(null);
  const [versionForm, setVersionForm] = useState({
    version_label: "",
    contenu: "",
    date_effet: "",
    statut_vigueur: "en_vigueur",
  });

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

  // Show error toast if queries fail
  if (articleError) {
    toast.error("Erreur lors du chargement de l'article");
  }
  if (versionsError) {
    toast.error("Erreur lors du chargement des versions");
  }

  const createVersionMutation = useMutation({
    mutationFn: (data: any) => textesArticlesVersionsQueries.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["texte-article-versions"] });
      toast.success("Version créée avec succès");
      resetVersionForm();
    },
    onError: () => {
      toast.error("Erreur lors de la création");
    },
  });

  const updateVersionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      textesArticlesVersionsQueries.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["texte-article-versions"] });
      toast.success("Version modifiée avec succès");
      resetVersionForm();
    },
    onError: () => {
      toast.error("Erreur lors de la modification");
    },
  });

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

  const resetVersionForm = () => {
    setVersionForm({
      version_label: "",
      contenu: "",
      date_effet: "",
      statut_vigueur: "en_vigueur",
    });
    setEditingVersion(null);
    setShowVersionDialog(false);
  };

  const handleEditVersion = (version: any) => {
    setEditingVersion(version);
    setVersionForm({
      version_label: version.version_label,
      contenu: version.contenu,
      date_effet: version.date_effet || "",
      statut_vigueur: version.statut_vigueur,
    });
    setShowVersionDialog(true);
  };

  const handleSubmitVersion = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!versionForm.version_label.trim() || !versionForm.contenu.trim()) {
      toast.error("Le libellé et le contenu sont requis");
      return;
    }

    const data = {
      article_id: articleId!,
      ...versionForm,
    };

    if (editingVersion) {
      updateVersionMutation.mutate({ id: editingVersion.id, data });
    } else {
      createVersionMutation.mutate(data);
    }
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
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour
      </Button>

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Versions - Article {article.numero}
        </h1>
        <p className="text-muted-foreground mt-2">
          {texte?.reference_officielle} - {texte?.titre}
        </p>
        {article.titre_court && (
          <p className="text-sm text-muted-foreground mt-1">{article.titre_court}</p>
        )}
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Versions</h2>
        <Button onClick={() => setShowVersionDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle version
        </Button>
      </div>

      <Card className="shadow-medium border-l-4 border-l-primary">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Version actuelle</CardTitle>
            <Badge className="bg-primary text-primary-foreground">Actuelle</Badge>
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

      {versions && versions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">Versions historiques</h2>
            {versions.length > 1 && (
              <div className="flex items-center gap-2">
                <Label>Comparer avec:</Label>
                <Select value={compareVersionId || undefined} onValueChange={setCompareVersionId}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {versions.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.version_label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {compareVersionId && (
                  <Button variant="ghost" size="sm" onClick={() => setCompareVersionId(null)}>
                    Effacer
                  </Button>
                )}
              </div>
            )}
          </div>

          {compareVersion && article.contenu && (
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-lg">Comparaison de contenu</CardTitle>
              </CardHeader>
              <CardContent>
                <ReactDiffViewer
                  oldValue={compareVersion.contenu}
                  newValue={article.contenu}
                  splitView={true}
                  leftTitle={`${compareVersion.version_label} (Ancienne)`}
                  rightTitle="Version actuelle"
                  styles={{
                    diffContainer: {
                      fontSize: '0.875rem',
                    },
                  }}
                />
              </CardContent>
            </Card>
          )}

          {versions.map((version) => {
            const statutInfo = getStatutBadge(version.statut_vigueur);
            return (
              <Card key={version.id} className="shadow-soft">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">
                          {version.version_label}
                        </CardTitle>
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
                      {version.date_effet && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Calendar className="h-4 w-4" />
                          Date d'effet: {new Date(version.date_effet).toLocaleDateString("fr-TN")}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditVersion(version)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteVersionId(version.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <div className="text-sm whitespace-pre-wrap">{version.contenu}</div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {(!versions || versions.length === 0) && (
        <Card className="shadow-soft">
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Aucune version historique</p>
          </CardContent>
        </Card>
      )}

      {/* Version Dialog */}
      <Dialog open={showVersionDialog} onOpenChange={setShowVersionDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingVersion ? "Modifier la version" : "Nouvelle version"}
            </DialogTitle>
            <DialogDescription>
              Créez une nouvelle version de cet article
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitVersion}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="version_label">Libellé de la version *</Label>
                <Input
                  id="version_label"
                  value={versionForm.version_label}
                  onChange={(e) => setVersionForm({ ...versionForm, version_label: e.target.value })}
                  placeholder="Ex: Version 1.0, Modification 2023..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contenu">Contenu *</Label>
                <Textarea
                  id="contenu"
                  value={versionForm.contenu}
                  onChange={(e) => setVersionForm({ ...versionForm, contenu: e.target.value })}
                  placeholder="Contenu de cette version"
                  rows={8}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date_effet">Date d'effet</Label>
                  <Input
                    id="date_effet"
                    type="date"
                    value={versionForm.date_effet}
                    onChange={(e) => setVersionForm({ ...versionForm, date_effet: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="statut_vigueur">Statut *</Label>
                  <Select
                    value={versionForm.statut_vigueur}
                    onValueChange={(val) => setVersionForm({ ...versionForm, statut_vigueur: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en_vigueur">En vigueur</SelectItem>
                      <SelectItem value="modifie">Modifié</SelectItem>
                      <SelectItem value="abroge">Abrogé</SelectItem>
                      <SelectItem value="suspendu">Suspendu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={resetVersionForm}>
                Annuler
              </Button>
              <Button type="submit">
                {editingVersion ? "Modifier" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
