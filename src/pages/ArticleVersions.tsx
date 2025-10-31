import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Edit, Trash2, GitCompare, Save, X, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabaseAny as supabase } from "@/lib/supabase-any";

interface ArticleVersion {
  id: string;
  article_id: string;
  version_label: string;
  contenu: string;
  date_effet: string | null;
  statut_vigueur: string;
  remplace_version_id: string | null;
  created_at: string;
}

interface VersionFormData {
  version_label: string;
  contenu: string;
  date_effet: string;
  statut_vigueur: string;
  remplace_version_id: string;
}

export default function ArticleVersions() {
  const { acteId, articleId } = useParams<{ acteId: string; articleId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareVersions, setCompareVersions] = useState<[string | null, string | null]>([null, null]);
  const [formData, setFormData] = useState<VersionFormData>({
    version_label: "",
    contenu: "",
    date_effet: "",
    statut_vigueur: "en_vigueur",
    remplace_version_id: "",
  });

  const { data: article, isLoading: articleLoading } = useQuery({
    queryKey: ["article", articleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("*, actes_reglementaires(numero_officiel, intitule)")
        .eq("id", articleId!)
        .is("deleted_at", null)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!articleId,
  });

  const { data: versions, isLoading: versionsLoading } = useQuery({
    queryKey: ["article-versions", articleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles_versions")
        .select("*")
        .eq("article_id", articleId!)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ArticleVersion[];
    },
    enabled: !!articleId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: VersionFormData) => {
      const { error } = await supabase.from("articles_versions").insert([{
        article_id: articleId!,
        version_label: data.version_label,
        contenu: data.contenu,
        date_effet: data.date_effet || null,
        statut_vigueur: data.statut_vigueur as "en_vigueur" | "modifie" | "abroge" | "suspendu",
        remplace_version_id: data.remplace_version_id || null,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["article-versions", articleId] });
      toast({ title: "Version créée", description: "La version a été créée avec succès" });
      resetForm();
      setDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer la version",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: VersionFormData }) => {
      const { error } = await supabase
        .from("articles_versions")
        .update({
          version_label: data.version_label,
          contenu: data.contenu,
          date_effet: data.date_effet || null,
          statut_vigueur: data.statut_vigueur as "en_vigueur" | "modifie" | "abroge" | "suspendu",
          remplace_version_id: data.remplace_version_id || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["article-versions", articleId] });
      toast({ title: "Version modifiée", description: "La version a été mise à jour avec succès" });
      resetForm();
      setDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de modifier la version",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("articles_versions").update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["article-versions", articleId] });
      toast({ title: "Version supprimée", description: "La version a été supprimée avec succès" });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer la version",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      version_label: "",
      contenu: "",
      date_effet: "",
      statut_vigueur: "en_vigueur",
      remplace_version_id: "",
    });
    setEditingId(null);
  };

  const handleEdit = (version: ArticleVersion) => {
    setFormData({
      version_label: version.version_label,
      contenu: version.contenu,
      date_effet: version.date_effet || "",
      statut_vigueur: version.statut_vigueur,
      remplace_version_id: version.remplace_version_id || "",
    });
    setEditingId(version.id);
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.version_label || !formData.contenu) {
      toast({ title: "Erreur", description: "Version et contenu sont requis", variant: "destructive" });
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette version ?")) {
      deleteMutation.mutate(id);
    }
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "en_vigueur":
        return { label: "En vigueur", className: "bg-success text-success-foreground" };
      case "modifie":
        return { label: "Modifié", className: "bg-warning text-warning-foreground" };
      case "abroge":
        return { label: "Abrogé", className: "bg-destructive text-destructive-foreground" };
      case "suspendu":
        return { label: "Suspendu", className: "bg-muted text-muted-foreground" };
      default:
        return { label: statut, className: "" };
    }
  };

  const getDiff = (text1: string, text2: string) => {
    const words1 = text1.split(/\s+/);
    const words2 = text2.split(/\s+/);
    const maxLen = Math.max(words1.length, words2.length);
    
    const result: { word: string; type: "added" | "removed" | "unchanged" }[] = [];
    
    for (let i = 0; i < maxLen; i++) {
      if (i >= words1.length) {
        result.push({ word: words2[i], type: "added" });
      } else if (i >= words2.length) {
        result.push({ word: words1[i], type: "removed" });
      } else if (words1[i] === words2[i]) {
        result.push({ word: words1[i], type: "unchanged" });
      } else {
        result.push({ word: words1[i], type: "removed" });
        result.push({ word: words2[i], type: "added" });
      }
    }
    
    return result;
  };

  if (articleLoading || versionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">Article non trouvé</p>
        <Button onClick={() => navigate(`/actes/${acteId}`)}>Retour au texte</Button>
      </div>
    );
  }

  const acte = article.actes_reglementaires as any;
  const version1 = versions?.find((v) => v.id === compareVersions[0]);
  const version2 = versions?.find((v) => v.id === compareVersions[1]);

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <Button variant="ghost" onClick={() => navigate(`/actes/${acteId}`)}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour au texte
      </Button>

      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold">Versions - Article {article.numero}</h1>
        <p className="text-muted-foreground mt-2">
          {acte?.numero_officiel} - {acte?.intitule}
        </p>
        {article.titre_court && <p className="text-sm text-muted-foreground mt-1">{article.titre_court}</p>}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une version
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Modifier la version" : "Ajouter une version"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="version_label">Version *</Label>
                  <Input
                    id="version_label"
                    placeholder="Ex: v1.1"
                    value={formData.version_label}
                    onChange={(e) => setFormData({ ...formData, version_label: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="date_effet">Date d'effet</Label>
                  <Input
                    id="date_effet"
                    type="date"
                    value={formData.date_effet}
                    onChange={(e) => setFormData({ ...formData, date_effet: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="statut_vigueur">Statut de vigueur *</Label>
                <Select value={formData.statut_vigueur} onValueChange={(v) => setFormData({ ...formData, statut_vigueur: v })}>
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

              <div>
                <Label htmlFor="remplace_version_id">Remplace version</Label>
                <Select
                  value={formData.remplace_version_id}
                  onValueChange={(v) => setFormData({ ...formData, remplace_version_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une version" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune</SelectItem>
                    {versions?.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.version_label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="contenu">Contenu *</Label>
                <Textarea
                  id="contenu"
                  placeholder="Contenu de la version..."
                  value={formData.contenu}
                  onChange={(e) => setFormData({ ...formData, contenu: e.target.value })}
                  rows={8}
                  required
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  {createMutation.isPending || updateMutation.isPending ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Button variant={compareMode ? "secondary" : "outline"} onClick={() => setCompareMode(!compareMode)}>
          <GitCompare className="h-4 w-4 mr-2" />
          {compareMode ? "Annuler comparaison" : "Comparer"}
        </Button>
      </div>

      {/* Compare Mode */}
      {compareMode && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Comparaison de versions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Version 1</Label>
                <Select value={compareVersions[0] || ""} onValueChange={(v) => setCompareVersions([v, compareVersions[1]])}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {versions?.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.version_label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Version 2</Label>
                <Select value={compareVersions[1] || ""} onValueChange={(v) => setCompareVersions([compareVersions[0], v])}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {versions?.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.version_label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {version1 && version2 && (
              <div className="border rounded-md p-4 bg-muted/20">
                <h4 className="font-semibold mb-2">Différences :</h4>
                <div className="text-sm space-x-1">
                  {getDiff(version1.contenu, version2.contenu).map((item, idx) => (
                    <span
                      key={idx}
                      className={
                        item.type === "added"
                          ? "bg-success/20 text-success-foreground px-1 rounded"
                          : item.type === "removed"
                          ? "bg-destructive/20 text-destructive-foreground px-1 rounded line-through"
                          : ""
                      }
                    >
                      {item.word}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Versions List */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des versions ({versions?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {versions && versions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Version</TableHead>
                    <TableHead>Date d'effet</TableHead>
                    <TableHead>Statut de vigueur</TableHead>
                    <TableHead>Remplace version</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {versions.map((version) => {
                    const statutInfo = getStatutBadge(version.statut_vigueur);
                    const replacedVersion = versions.find((v) => v.id === version.remplace_version_id);
                    return (
                      <TableRow key={version.id}>
                        <TableCell className="font-medium">{version.version_label}</TableCell>
                        <TableCell>
                          {version.date_effet ? (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {new Date(version.date_effet).toLocaleDateString("fr-FR")}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={statutInfo.className}>{statutInfo.label}</Badge>
                        </TableCell>
                        <TableCell>
                          {replacedVersion ? (
                            <Badge variant="outline">{replacedVersion.version_label}</Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setCompareMode(true);
                                setCompareVersions([version.id, null]);
                              }}
                            >
                              <GitCompare className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(version)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(version.id)}
                              disabled={deleteMutation.isPending}
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
            <div className="text-center py-12 text-muted-foreground">
              Aucune version. Cliquez sur "Ajouter une version" pour commencer.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
