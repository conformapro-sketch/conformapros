import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit, Trash2, GitBranch, Save, X, GitCompare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { articlesQueries, articleVersionsQueries } from "@/lib/actes-queries";
import { supabase } from "@/integrations/supabase/client";
import type { Article } from "@/types/actes";
import { ArticleVersionComparison } from "./ArticleVersionComparison";

interface ArticlesTabProps {
  acteId: string;
  articles: Article[];
}

interface ArticleFormData {
  numero: string;
  titre_court: string;
  ordre: number;
  sous_domaine_ids: string[];
}

export function ArticlesTab({ acteId, articles }: ArticlesTabProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [comparisonArticleId, setComparisonArticleId] = useState<string | null>(null);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [formData, setFormData] = useState<ArticleFormData>({
    numero: "",
    titre_court: "",
    ordre: 0,
    sous_domaine_ids: [],
  });

  // Fetch sous-domaines
  const { data: sousDomainesData } = useQuery({
    queryKey: ["sous-domaines-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sous_domaines_application")
        .select("*, domaines_application(libelle)")
        .eq("actif", true)
        .is("deleted_at", null)
        .order("ordre", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Fetch article-sous_domaines relationships
  const { data: articlesSousDomainesData } = useQuery({
    queryKey: ["articles-sous-domaines", acteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles_sous_domaines")
        .select("article_id, sous_domaine_id, sous_domaines_application(libelle)");
      if (error) throw error;
      return data;
    },
  });

  // Fetch versions for comparison article
  const { data: articleVersions } = useQuery({
    queryKey: ["article-versions", comparisonArticleId],
    queryFn: () => articleVersionsQueries.getByArticleId(comparisonArticleId!),
    enabled: !!comparisonArticleId && comparisonOpen,
  });

  const createMutation = useMutation({
    mutationFn: async (data: ArticleFormData) => {
      const article = await articlesQueries.create({
        acte_id: acteId,
        numero: data.numero,
        titre_court: data.titre_court,
        ordre: data.ordre,
      });

      // Insert sous-domaines relationships
      if (data.sous_domaine_ids.length > 0) {
        const relations = data.sous_domaine_ids.map((sdId) => ({
          article_id: article.id,
          sous_domaine_id: sdId,
        }));
        const { error } = await supabase.from("articles_sous_domaines").insert(relations);
        if (error) throw error;
      }

      return article;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles", acteId] });
      queryClient.invalidateQueries({ queryKey: ["articles-sous-domaines", acteId] });
      toast({ title: "Article ajouté", description: "L'article a été créé avec succès" });
      resetForm();
      setDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer l'article",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ArticleFormData }) => {
      await articlesQueries.update(id, {
        numero: data.numero,
        titre_court: data.titre_court,
        ordre: data.ordre,
      });

      // Update sous-domaines relationships
      await supabase.from("articles_sous_domaines").delete().eq("article_id", id);
      if (data.sous_domaine_ids.length > 0) {
        const relations = data.sous_domaine_ids.map((sdId) => ({
          article_id: id,
          sous_domaine_id: sdId,
        }));
        const { error } = await supabase.from("articles_sous_domaines").insert(relations);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles", acteId] });
      queryClient.invalidateQueries({ queryKey: ["articles-sous-domaines", acteId] });
      toast({ title: "Article modifié", description: "L'article a été mis à jour avec succès" });
      resetForm();
      setDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de modifier l'article",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => articlesQueries.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles", acteId] });
      queryClient.invalidateQueries({ queryKey: ["articles-sous-domaines", acteId] });
      toast({ title: "Article supprimé", description: "L'article a été supprimé avec succès" });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer l'article",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      numero: "",
      titre_court: "",
      ordre: 0,
      sous_domaine_ids: [],
    });
    setEditingId(null);
  };

  const handleEdit = (article: Article) => {
    const articleSousDomaines =
      articlesSousDomainesData?.filter((asd) => asd.article_id === article.id).map((asd) => asd.sous_domaine_id) || [];

    setFormData({
      numero: article.numero,
      titre_court: article.titre_court || "",
      ordre: article.ordre || 0,
      sous_domaine_ids: articleSousDomaines,
    });
    setEditingId(article.id);
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.numero) {
      toast({ title: "Erreur", description: "La référence article est requise", variant: "destructive" });
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet article ?")) {
      deleteMutation.mutate(id);
    }
  };

  const getArticleSousDomaines = (articleId: string) => {
    return (
      articlesSousDomainesData
        ?.filter((asd) => asd.article_id === articleId)
        .map((asd) => (asd.sous_domaines_application as any)?.libelle)
        .filter(Boolean) || []
    );
  };

  const toggleSousDomaine = (sdId: string) => {
    setFormData((prev) => ({
      ...prev,
      sous_domaine_ids: prev.sous_domaine_ids.includes(sdId)
        ? prev.sous_domaine_ids.filter((id) => id !== sdId)
        : [...prev.sous_domaine_ids, sdId],
    }));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Articles ({articles.length})</CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un article
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? "Modifier l'article" : "Ajouter un article"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="numero">Référence article *</Label>
                    <Input
                      id="numero"
                      placeholder="Ex: Art. 1"
                      value={formData.numero}
                      onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="ordre">Ordre</Label>
                    <Input
                      id="ordre"
                      type="number"
                      placeholder="0"
                      value={formData.ordre}
                      onChange={(e) => setFormData({ ...formData, ordre: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="titre_court">Titre court</Label>
                  <Input
                    id="titre_court"
                    placeholder="Ex: Champ d'application"
                    value={formData.titre_court}
                    onChange={(e) => setFormData({ ...formData, titre_court: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Sous-domaines</Label>
                  <div className="border rounded-md p-4 max-h-60 overflow-y-auto space-y-2">
                    {sousDomainesData && sousDomainesData.length > 0 ? (
                      sousDomainesData.map((sd) => (
                        <div key={sd.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`sd-${sd.id}`}
                            checked={formData.sous_domaine_ids.includes(sd.id)}
                            onCheckedChange={() => toggleSousDomaine(sd.id)}
                          />
                          <label htmlFor={`sd-${sd.id}`} className="text-sm cursor-pointer flex-1">
                            {sd.libelle}
                            <span className="text-muted-foreground ml-2">
                              ({sd.domaines_application?.libelle})
                            </span>
                          </label>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">Aucun sous-domaine disponible</p>
                    )}
                  </div>
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
        </div>
      </CardHeader>
      <CardContent>
        {articles.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">Référence</TableHead>
                  <TableHead>Titre court</TableHead>
                  <TableHead>Sous-domaines</TableHead>
                  <TableHead className="w-20 text-center">Ordre</TableHead>
                  <TableHead className="w-48 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {articles
                  .sort((a, b) => (a.ordre || 0) - (b.ordre || 0))
                  .map((article) => {
                    const sousDomaines = getArticleSousDomaines(article.id);
                    return (
                      <TableRow key={article.id}>
                        <TableCell className="font-medium">{article.numero}</TableCell>
                        <TableCell className="text-sm">
                          {article.titre_court || <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {sousDomaines.length > 0 ? (
                              sousDomaines.map((sd, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {sd}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{article.ordre || 0}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(article)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(article.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/actes/${acteId}/articles/${article.id}/versions`)}
                              title="Voir les versions"
                            >
                              <GitBranch className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setComparisonArticleId(article.id);
                                setComparisonOpen(true);
                              }}
                              title="Comparer les versions"
                            >
                              <GitCompare className="h-4 w-4 text-primary" />
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
            Aucun article. Cliquez sur "Ajouter un article" pour commencer.
          </div>
        )}
      </CardContent>

      {/* Version Comparison Modal */}
      {comparisonArticleId && (
        <ArticleVersionComparison
          open={comparisonOpen}
          onOpenChange={setComparisonOpen}
          versions={articleVersions || []}
          currentVersion={articles.find(a => a.id === comparisonArticleId)}
        />
      )}
    </Card>
  );
}
