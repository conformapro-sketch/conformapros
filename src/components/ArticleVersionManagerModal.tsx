import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { articleVersionsQueries, textesReglementairesQueries } from "@/lib/textes-reglementaires-queries";
import { toast } from "sonner";
import { Loader2, Plus, Calendar, FileText, Trash2, AlertCircle, History } from "lucide-react";
import { TexteAutocomplete } from "@/components/bibliotheque/TexteAutocomplete";

interface ArticleVersionManagerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  articleId: string;
  articleNumero: string;
  onSuccess?: () => void;
}

export function ArticleVersionManagerModal({ 
  open, 
  onOpenChange, 
  articleId,
  articleNumero,
  onSuccess 
}: ArticleVersionManagerModalProps) {
  const queryClient = useQueryClient();
  const [showNewVersionForm, setShowNewVersionForm] = useState(false);
  const [deleteVersionId, setDeleteVersionId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    contenu: "",
    date_effet: "",
    source_texte_id: "",
    notes_modifications: "",
    statut: "en_vigueur" as "en_vigueur" | "remplacee" | "abrogee",
    old_version_status: "remplacee" as "remplacee" | "abrogee",
  });

  const { data: versions = [], isLoading: versionsLoading } = useQuery({
    queryKey: ["article-versions-manager", articleId],
    queryFn: () => articleVersionsQueries.getByArticleId(articleId),
    enabled: !!articleId && open,
  });

  useEffect(() => {
    if (open && !showNewVersionForm) {
      resetForm();
    }
  }, [open, showNewVersionForm]);

  const resetForm = () => {
    setFormData({
      contenu: "",
      date_effet: new Date().toISOString().split('T')[0],
      source_texte_id: "",
      notes_modifications: "",
      statut: "en_vigueur",
      old_version_status: "remplacee",
    });
  };

  const createVersionMutation = useMutation({
    mutationFn: async (data: any) => {
      // Get next version number
      const nextVersionNum = versions.length > 0 
        ? Math.max(...versions.map(v => v.numero_version)) + 1 
        : 1;

      // Create new version
      const newVersion = await articleVersionsQueries.create({
        article_id: articleId,
        contenu: data.contenu,
        date_effet: data.date_effet,
        numero_version: nextVersionNum,
        source_texte_id: data.source_texte_id,
        statut: data.statut,
        notes_modifications: data.notes_modifications || null,
      });

      // Update old versions status if new version is en_vigueur
      if (data.statut === "en_vigueur") {
        await articleVersionsQueries.updateOldVersionsStatus(
          articleId,
          newVersion.id,
          data.old_version_status
        );
      }

      return newVersion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["article-versions-manager"] });
      queryClient.invalidateQueries({ queryKey: ["articles-active-versions"] });
      toast.success("Version créée avec succès");
      setShowNewVersionForm(false);
      resetForm();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de la création de la version");
    },
  });

  const deleteVersionMutation = useMutation({
    mutationFn: (id: string) => articleVersionsQueries.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["article-versions-manager"] });
      queryClient.invalidateQueries({ queryKey: ["articles-active-versions"] });
      toast.success("Version supprimée avec succès");
      setDeleteVersionId(null);
    },
    onError: () => {
      toast.error("Erreur lors de la suppression de la version");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.contenu.trim()) {
      toast.error("Le contenu de la version est requis");
      return;
    }

    if (!formData.date_effet) {
      toast.error("La date d'effet est requise");
      return;
    }

    if (!formData.source_texte_id) {
      toast.error("Le texte source est requis");
      return;
    }

    createVersionMutation.mutate(formData);
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "en_vigueur":
        return <Badge className="bg-success text-success-foreground">En vigueur</Badge>;
      case "remplacee":
        return <Badge variant="secondary">Remplacée</Badge>;
      case "abrogee":
        return <Badge variant="destructive">Abrogée</Badge>;
      default:
        return <Badge variant="outline">{statut}</Badge>;
    }
  };

  const isLoading = createVersionMutation.isPending || deleteVersionMutation.isPending;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Gestion des versions - {articleNumero}
            </DialogTitle>
            <DialogDescription>
              Gérez le cycle de vie de l'article en créant des versions successives selon les modifications réglementaires
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="versions" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="versions">
                Versions existantes ({versions.length})
              </TabsTrigger>
              <TabsTrigger value="new" disabled={showNewVersionForm}>
                Nouvelle version
              </TabsTrigger>
            </TabsList>

            <TabsContent value="versions" className="space-y-4 mt-4">
              {versionsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : versions.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">Aucune version pour cet article</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Créez la première version pour commencer le suivi
                      </p>
                      <Button
                        className="mt-4"
                        onClick={() => {
                          setShowNewVersionForm(true);
                          const tabTrigger = document.querySelector('[value="new"]') as HTMLButtonElement;
                          tabTrigger?.click();
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Créer la première version
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {versions.map((version, index) => (
                    <Card key={version.id} className={version.statut === "en_vigueur" ? "border-primary" : ""}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-base px-3 py-1">
                              Version {version.numero_version}
                            </Badge>
                            {getStatutBadge(version.statut)}
                            {index === 0 && version.statut === "en_vigueur" && (
                              <Badge variant="default" className="bg-primary">Version actuelle</Badge>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteVersionId(version.id)}
                            disabled={version.statut === "en_vigueur"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(version.date_effet).toLocaleDateString("fr-FR")}
                          </div>
                          {version.source_texte && (
                            <div className="flex items-center gap-1">
                              <FileText className="h-4 w-4" />
                              <Badge variant="outline" className="text-xs">
                                {version.source_texte.type}
                              </Badge>
                              {version.source_texte.reference}
                            </div>
                          )}
                        </div>
                        {version.notes_modifications && (
                          <CardDescription className="mt-2">
                            {version.notes_modifications}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div 
                          className="prose prose-sm max-w-none p-4 bg-muted/50 rounded-md border"
                          dangerouslySetInnerHTML={{ __html: version.contenu }}
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="new" className="space-y-4 mt-4">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Date d'effet */}
                  <div className="space-y-2">
                    <Label htmlFor="date_effet">Date d'effet *</Label>
                    <Input
                      id="date_effet"
                      type="date"
                      value={formData.date_effet}
                      onChange={(e) => setFormData({ ...formData, date_effet: e.target.value })}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Date à partir de laquelle cette version entre en vigueur
                    </p>
                  </div>

                  {/* Texte source */}
                  <div className="space-y-2">
                    <Label>Texte source *</Label>
                    <TexteAutocomplete
                      value={formData.source_texte_id}
                      onChange={(texte) => setFormData({ ...formData, source_texte_id: texte?.id || "" })}
                      placeholder="Rechercher un texte réglementaire..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Texte réglementaire ayant créé cette version
                    </p>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  {/* Statut */}
                  <div className="space-y-2">
                    <Label htmlFor="statut">Statut de la nouvelle version *</Label>
                    <Select 
                      value={formData.statut} 
                      onValueChange={(value: any) => setFormData({ ...formData, statut: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en_vigueur">En vigueur</SelectItem>
                        <SelectItem value="remplacee">Remplacée</SelectItem>
                        <SelectItem value="abrogee">Abrogée</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Statut des anciennes versions */}
                  {formData.statut === "en_vigueur" && versions.some(v => v.statut === "en_vigueur") && (
                    <div className="space-y-2">
                      <Label htmlFor="old_version_status">Statut des anciennes versions *</Label>
                      <Select 
                        value={formData.old_version_status} 
                        onValueChange={(value: any) => setFormData({ ...formData, old_version_status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="remplacee">Remplacée</SelectItem>
                          <SelectItem value="abrogee">Abrogée</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Les versions actuellement en vigueur seront mises à ce statut
                      </p>
                    </div>
                  )}
                </div>

                {/* Notes de modification */}
                <div className="space-y-2">
                  <Label htmlFor="notes_modifications">Notes de modification</Label>
                  <Textarea
                    id="notes_modifications"
                    value={formData.notes_modifications}
                    onChange={(e) => setFormData({ ...formData, notes_modifications: e.target.value })}
                    placeholder="Description des changements apportés par cette version..."
                    rows={3}
                  />
                </div>

                <Separator />

                {/* Contenu */}
                <div className="space-y-2">
                  <Label>Contenu de la version *</Label>
                  <RichTextEditor
                    value={formData.contenu}
                    onChange={(value) => setFormData({ ...formData, contenu: value })}
                    placeholder="Saisissez le contenu complet de l'article dans cette version..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Contenu intégral de l'article tel qu'il apparaît dans cette version
                  </p>
                </div>

                {formData.statut === "en_vigueur" && versions.some(v => v.statut === "en_vigueur") && (
                  <div className="flex items-start gap-2 p-4 bg-warning/10 border border-warning/20 rounded-md">
                    <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-warning">Attention</p>
                      <p className="text-muted-foreground mt-1">
                        Cette nouvelle version sera marquée comme "en vigueur" et les versions actuellement en vigueur 
                        seront automatiquement mises à "{formData.old_version_status}".
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowNewVersionForm(false);
                      const tabTrigger = document.querySelector('[value="versions"]') as HTMLButtonElement;
                      tabTrigger?.click();
                    }}
                    disabled={isLoading}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Créer la version
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteVersionId} onOpenChange={() => setDeleteVersionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette version ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La version sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteVersionId && deleteVersionMutation.mutate(deleteVersionId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
