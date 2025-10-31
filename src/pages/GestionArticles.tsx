import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { supabaseAny as supabase } from "@/lib/supabase-any";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, ArrowLeft, FileText } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const articleSchema = z.object({
  acte_id: z.string().uuid(),
  numero: z.string().trim().min(1, "Le numéro est requis").max(50, "50 caractères maximum"),
  reference_article: z.string().trim().max(100, "100 caractères maximum").nullable(),
  titre_court: z.string().trim().max(255, "255 caractères maximum").nullable(),
  ordre: z.number().int().min(0),
  contenu_fr: z.string().trim().nullable(),
  contenu_ar: z.string().trim().nullable(),
  notes: z.string().trim().nullable(),
});

type ArticleFormData = z.infer<typeof articleSchema>;

const GestionArticles = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<any>(null);

  const [form, setForm] = useState<ArticleFormData>({
    acte_id: id || "",
    numero: "",
    reference_article: "",
    titre_court: "",
    ordre: 0,
    contenu_fr: "",
    contenu_ar: "",
    notes: "",
  });

  // Fetch texte info
  const { data: texte } = useQuery({
    queryKey: ["acte", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("actes_reglementaires")
        .select("reference, titre")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch articles
  const { data: articles, isLoading } = useQuery({
    queryKey: ["articles", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("acte_id", id!)
        .is("deleted_at", null)
        .order("ordre");
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  // Create article
  const createArticle = useMutation({
    mutationFn: async (data: ArticleFormData) => {
      const validated = articleSchema.parse(data);
      const { error } = await supabase.from("articles").insert([validated as any]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles", id] });
      toast.success("Article créé avec succès");
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Update article
  const updateArticle = useMutation({
    mutationFn: async ({ articleId, data }: { articleId: string; data: ArticleFormData }) => {
      const validated = articleSchema.parse(data);
      const { error } = await supabase
        .from("articles")
        .update(validated)
        .eq("id", articleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles", id] });
      toast.success("Article modifié avec succès");
      setDialogOpen(false);
      setEditingArticle(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  // Soft delete article
  const deleteArticle = useMutation({
    mutationFn: async (articleId: string) => {
      const { error } = await supabase
        .from("articles")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", articleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles", id] });
      toast.success("Article supprimé avec succès");
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const resetForm = () => {
    setForm({
      acte_id: id || "",
      numero: "",
      reference_article: "",
      titre_court: "",
      ordre: 0,
      contenu_fr: "",
      contenu_ar: "",
      notes: "",
    });
    setEditingArticle(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingArticle) {
      updateArticle.mutate({ articleId: editingArticle.id, data: form });
    } else {
      createArticle.mutate(form);
    }
  };

  const handleEdit = (article: any) => {
    setEditingArticle(article);
    setForm({
      acte_id: article.acte_id,
      numero: article.numero,
      reference_article: article.reference_article || "",
      titre_court: article.titre_court || "",
      ordre: article.ordre || 0,
      contenu_fr: article.contenu_fr || "",
      contenu_ar: article.contenu_ar || "",
      notes: article.notes || "",
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Articles du texte</h1>
            {texte && (
              <p className="text-muted-foreground">
                {texte.reference} - {texte.titre}
              </p>
            )}
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvel article
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingArticle ? "Modifier l'article" : "Créer un article"}
              </DialogTitle>
              <DialogDescription>
                {editingArticle
                  ? "Modifiez les informations de l'article"
                  : "Ajoutez un nouvel article au texte réglementaire"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="numero">Numéro d'article *</Label>
                  <Input
                    id="numero"
                    value={form.numero}
                    onChange={(e) => setForm({ ...form, numero: e.target.value })}
                    placeholder="Ex: Article 1"
                    maxLength={50}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="ordre">Ordre d'affichage</Label>
                  <Input
                    id="ordre"
                    type="number"
                    min="0"
                    value={form.ordre}
                    onChange={(e) =>
                      setForm({ ...form, ordre: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="reference">Référence article</Label>
                <Input
                  id="reference"
                  value={form.reference_article || ""}
                  onChange={(e) => setForm({ ...form, reference_article: e.target.value })}
                  placeholder="Ex: Art. 1"
                  maxLength={100}
                />
              </div>

              <div>
                <Label htmlFor="titre">Titre court</Label>
                <Input
                  id="titre"
                  value={form.titre_court || ""}
                  onChange={(e) => setForm({ ...form, titre_court: e.target.value })}
                  placeholder="Titre descriptif de l'article"
                  maxLength={255}
                />
              </div>

              <div>
                <Label htmlFor="contenu-fr">Contenu (Français)</Label>
                <Textarea
                  id="contenu-fr"
                  value={form.contenu_fr || ""}
                  onChange={(e) => setForm({ ...form, contenu_fr: e.target.value })}
                  placeholder="Contenu complet de l'article en français..."
                  rows={6}
                />
              </div>

              <div>
                <Label htmlFor="contenu-ar">Contenu (Arabe)</Label>
                <Textarea
                  id="contenu-ar"
                  value={form.contenu_ar || ""}
                  onChange={(e) => setForm({ ...form, contenu_ar: e.target.value })}
                  placeholder="المحتوى الكامل للمقال بالعربية..."
                  rows={6}
                  dir="rtl"
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={form.notes || ""}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Notes internes sur cet article..."
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    resetForm();
                  }}
                >
                  Annuler
                </Button>
                <Button type="submit">{editingArticle ? "Modifier" : "Créer"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Liste des articles ({articles?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-center py-8">Chargement...</p>
          ) : articles && articles.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ordre</TableHead>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Référence</TableHead>
                  <TableHead>Titre court</TableHead>
                  <TableHead>Contenu</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {articles.map((article: any) => (
                  <TableRow key={article.id}>
                    <TableCell>{article.ordre}</TableCell>
                    <TableCell className="font-medium">{article.numero}</TableCell>
                    <TableCell>{article.reference_article || "-"}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {article.titre_court || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {article.contenu_fr && <Badge variant="outline">FR</Badge>}
                        {article.contenu_ar && <Badge variant="outline">AR</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(article)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm("Confirmer la suppression de cet article ?")) {
                            deleteArticle.mutate(article.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">Aucun article pour ce texte</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Créer le premier article
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GestionArticles;
