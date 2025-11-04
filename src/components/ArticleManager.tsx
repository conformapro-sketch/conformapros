import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { articlesQueries } from "@/lib/actes-queries";
import type { Article } from "@/types/textes";

interface ArticleManagerProps {
  acteId: string;
  articles: Article[];
}

export function ArticleManager({ acteId, articles }: ArticleManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState("");
  
  const [formData, setFormData] = useState<Partial<Article>>({
    numero: "",
    titre_court: "",
    contenu_ar: "",
    contenu_fr: "",
    notes: "",
  });

  const createMutation = useMutation({
    mutationFn: (article: Partial<Article>) =>
      articlesQueries.create({ ...article, acte_id: acteId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles", acteId] });
      toast({ title: "Article ajouté", description: "L'article a été ajouté avec succès" });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'ajouter l'article",
        variant: "destructive",
      });
    },
  });

  const bulkCreateMutation = useMutation({
    mutationFn: (articles: Partial<Article>[]) => articlesQueries.createBulk(articles),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["articles", acteId] });
      toast({
        title: "Articles ajoutés",
        description: `${data.length} article(s) ajouté(s) avec succès`,
      });
      setBulkMode(false);
      setBulkText("");
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'ajouter les articles",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, article }: { id: string; article: Partial<Article> }) =>
      articlesQueries.update(id, article),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles", acteId] });
      toast({ title: "Article modifié", description: "L'article a été mis à jour avec succès" });
      setEditing(null);
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
      contenu_ar: "",
      contenu_fr: "",
      notes: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.numero) {
      toast({
        title: "Erreur",
        description: "Le numéro d'article est requis",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(formData);
  };

  const handleUpdate = (article: Article) => {
    updateMutation.mutate({ id: article.id, article: formData });
  };

  const handleBulkSubmit = () => {
    if (!bulkText.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir au moins un article",
        variant: "destructive",
      });
      return;
    }

    // Parse bulk text: each line = Article N°X: content
    const lines = bulkText.split("\n").filter((l) => l.trim());
    const parsedArticles: Partial<Article>[] = [];

    lines.forEach((line) => {
      const match = line.match(/^Article\s+(\d+)\s*:?\s*(.+)$/i);
      if (match) {
        parsedArticles.push({
          acte_id: acteId,
          numero: match[1],
          contenu_fr: match[2].trim(),
        });
      }
    });

    if (parsedArticles.length === 0) {
      toast({
        title: "Erreur",
        description: "Format invalide. Utilisez: Article 1: contenu...",
        variant: "destructive",
      });
      return;
    }

    bulkCreateMutation.mutate(parsedArticles);
  };

  return (
    <div className="space-y-6">
      {/* Toggle Bulk Mode */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Gestion des articles</h3>
        <Button
          variant={bulkMode ? "secondary" : "outline"}
          size="sm"
          onClick={() => setBulkMode(!bulkMode)}
        >
          {bulkMode ? "Mode normal" : "Ajout en masse"}
        </Button>
      </div>

      {bulkMode ? (
        <Card>
          <CardHeader>
            <CardTitle>Ajout en masse</CardTitle>
            <CardDescription>
              Format: Article 1: contenu..., Article 2: contenu... (une ligne par article)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Article 1: Premier article...&#10;Article 2: Deuxième article..."
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              rows={8}
              className="font-mono text-sm"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleBulkSubmit}
                disabled={bulkCreateMutation.isPending}
                className="bg-gradient-primary"
              >
                <Save className="h-4 w-4 mr-2" />
                {bulkCreateMutation.isPending ? "Ajout..." : "Ajouter les articles"}
              </Button>
              <Button variant="outline" onClick={() => setBulkMode(false)}>
                <X className="h-4 w-4 mr-2" />
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Ajouter un article</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="numero">Numéro * (ex: 1, 2, 3...)</Label>
                  <Input
                    id="numero"
                    placeholder="1"
                    value={formData.numero}
                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="titre_court">Titre court</Label>
                  <Input
                    id="titre_court"
                    placeholder="Ex: Objet de l'article"
                    value={formData.titre_court}
                    onChange={(e) => setFormData({ ...formData, titre_court: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="contenu_ar">Contenu arabe</Label>
                <Textarea
                  id="contenu_ar"
                  placeholder="النص العربي للمادة"
                  value={formData.contenu_ar}
                  onChange={(e) => setFormData({ ...formData, contenu_ar: e.target.value })}
                  rows={3}
                  dir="rtl"
                />
              </div>

              <div>
                <Label htmlFor="contenu_fr">Contenu français</Label>
                <Textarea
                  id="contenu_fr"
                  placeholder="Texte français de l'article"
                  value={formData.contenu_fr}
                  onChange={(e) => setFormData({ ...formData, contenu_fr: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Notes internes (optionnel)"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                />
              </div>

              <Button type="submit" disabled={createMutation.isPending} className="bg-gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                {createMutation.isPending ? "Ajout..." : "Ajouter l'article"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Articles List */}
      {articles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Articles ({articles.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">N°</TableHead>
                    <TableHead>Titre</TableHead>
                    <TableHead>Contenu</TableHead>
                    <TableHead className="w-32 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {articles.map((article) => (
                    <TableRow key={article.id}>
                      <TableCell className="font-medium">Art. {article.numero}</TableCell>
                      <TableCell className="text-sm">
                        {article.titre_court || <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2 text-sm">
                          {article.contenu_ar && (
                            <div dir="rtl" className="line-clamp-2 text-muted-foreground">
                              {article.contenu_ar}
                            </div>
                          )}
                          {article.contenu_fr && (
                            <div className="line-clamp-2">{article.contenu_fr}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (window.confirm("Supprimer cet article ?")) {
                              deleteMutation.mutate(article.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
