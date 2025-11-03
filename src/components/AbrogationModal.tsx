import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, XCircle, Loader2 } from "lucide-react";
import { textesReglementairesQueries, textesArticlesQueries } from "@/lib/textes-queries";
import { articlesEffetsJuridiquesQueries } from "@/lib/actes-queries";
import { Separator } from "@/components/ui/separator";

interface AbrogationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  articleSourceId: string;
  texteSourceRef: string;
  onSuccess?: () => void;
}

export function AbrogationModal({
  open,
  onOpenChange,
  articleSourceId,
  texteSourceRef,
  onSuccess,
}: AbrogationModalProps) {
  const queryClient = useQueryClient();
  const [searchType, setSearchType] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTexteId, setSelectedTexteId] = useState("");
  const [selectedArticles, setSelectedArticles] = useState<string[]>([]);
  const [dateEffet, setDateEffet] = useState("");

  // Search for texts
  const { data: textes, isLoading: loadingTextes } = useQuery({
    queryKey: ["textes-search", searchType, searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return [];
      const filters: any = { search: searchTerm };
      if (searchType) filters.type = searchType;
      return textesReglementairesQueries.getAll(filters);
    },
    enabled: searchTerm.length >= 2,
  });

  // Load articles of selected text
  const { data: articles, isLoading: loadingArticles } = useQuery({
    queryKey: ["texte-articles", selectedTexteId],
    queryFn: () => textesArticlesQueries.getByTexteId(selectedTexteId),
    enabled: !!selectedTexteId,
  });

  const createAbrogationsMutation = useMutation({
    mutationFn: async () => {
      if (selectedArticles.length === 0) {
        throw new Error("Veuillez sélectionner au moins un article à abroger");
      }
      if (!dateEffet) {
        throw new Error("Veuillez spécifier la date d'effet");
      }

      // Create multiple abrogation effects
      const promises = selectedArticles.map((articleCibleId) =>
        articlesEffetsJuridiquesQueries.create({
          article_source_id: articleSourceId,
          type_effet: "ABROGE",
          texte_cible_id: selectedTexteId,
          article_cible_id: articleCibleId,
          date_effet: dateEffet,
          reference_citation: `Abrogé par ${texteSourceRef}`,
          notes: "Abrogation automatique",
        })
      );

      await Promise.all(promises);
    },
    onSuccess: () => {
      toast.success(`${selectedArticles.length} article(s) abrogé(s) avec succès`);
      queryClient.invalidateQueries({ queryKey: ["articles-effets"] });
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de l'abrogation");
    },
  });

  const resetForm = () => {
    setSearchType("");
    setSearchTerm("");
    setSelectedTexteId("");
    setSelectedArticles([]);
    setDateEffet("");
  };

  const handleToggleArticle = (articleId: string) => {
    setSelectedArticles((prev) =>
      prev.includes(articleId)
        ? prev.filter((id) => id !== articleId)
        : [...prev, articleId]
    );
  };

  const handleToggleAll = () => {
    if (!articles) return;
    if (selectedArticles.length === articles.length) {
      setSelectedArticles([]);
    } else {
      setSelectedArticles(articles.map((a: any) => a.id));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetForm();
      onOpenChange(open);
    }}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-destructive" />
            Abroger des articles existants
          </DialogTitle>
          <DialogDescription>
            Sélectionnez les articles d'un texte réglementaire qui seront abrogés par cet article
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Search filters */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type de texte</Label>
                <Select value={searchType} onValueChange={setSearchType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tous les types</SelectItem>
                    <SelectItem value="loi">Loi</SelectItem>
                    <SelectItem value="decret">Décret</SelectItem>
                    <SelectItem value="arrete">Arrêté</SelectItem>
                    <SelectItem value="circulaire">Circulaire</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Rechercher un texte</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Numéro, année, ou mots-clés..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            {/* Text results */}
            {loadingTextes && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )}

            {textes && (Array.isArray(textes) ? textes : textes.data)?.length > 0 && (
              <div className="space-y-2">
                <Label>Textes trouvés ({(Array.isArray(textes) ? textes : textes.data).length})</Label>
                <ScrollArea className="h-40 border rounded-md">
                  <div className="p-2 space-y-1">
                    {(Array.isArray(textes) ? textes : textes.data).map((texte: any) => (
                      <Button
                        key={texte.id}
                        variant={selectedTexteId === texte.id ? "secondary" : "ghost"}
                        className="w-full justify-start text-left h-auto py-2"
                        onClick={() => {
                          setSelectedTexteId(texte.id);
                          setSelectedArticles([]);
                        }}
                      >
                        <div className="flex flex-col gap-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="shrink-0">
                              {texte.type_acte}
                            </Badge>
                            <span className="font-medium truncate">
                              {texte.reference_officielle}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground truncate">
                            {texte.intitule}
                          </span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>

          <Separator />

          {/* Articles selection */}
          {selectedTexteId && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Articles à abroger</Label>
                {articles && articles.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleToggleAll}
                  >
                    {selectedArticles.length === articles.length
                      ? "Tout désélectionner"
                      : "Tout sélectionner"}
                  </Button>
                )}
              </div>

              {loadingArticles && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              )}

              {articles && articles.length > 0 && (
                <ScrollArea className="h-60 border rounded-md">
                  <div className="p-4 space-y-2">
                    {articles.map((article: any) => (
                      <div
                        key={article.id}
                        className="flex items-start gap-3 p-3 border rounded-md hover:bg-accent/50 transition-colors"
                      >
                        <Checkbox
                          checked={selectedArticles.includes(article.id)}
                          onCheckedChange={() => handleToggleArticle(article.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">
                            Article {article.numero_article}
                          </div>
                          {article.titre_court && (
                            <div className="text-sm text-muted-foreground truncate">
                              {article.titre_court}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}

              {articles && articles.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Aucun article trouvé dans ce texte
                </p>
              )}
            </div>
          )}

          {/* Date d'effet */}
          {selectedArticles.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="date-effet">
                  Date d'entrée en vigueur de l'abrogation *
                </Label>
                <Input
                  id="date-effet"
                  type="date"
                  value={dateEffet}
                  onChange={(e) => setDateEffet(e.target.value)}
                  required
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              resetForm();
              onOpenChange(false);
            }}
          >
            Annuler
          </Button>
          <Button
            onClick={() => createAbrogationsMutation.mutate()}
            disabled={
              selectedArticles.length === 0 ||
              !dateEffet ||
              createAbrogationsMutation.isPending
            }
          >
            {createAbrogationsMutation.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Abroger {selectedArticles.length > 0 && `(${selectedArticles.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
