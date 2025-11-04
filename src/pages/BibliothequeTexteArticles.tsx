import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft,
  FileText,
  History
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { actesQueries, articlesQueries } from "@/lib/actes-queries";
import { textesArticlesQueries } from "@/lib/textes-queries";
import { sanitizeHtml } from "@/lib/sanitize-html";

export default function BibliothequeTexteArticles() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: texte, isLoading: texteLoading } = useQuery({
    queryKey: ["bibliotheque-texte", id],
    queryFn: () => actesQueries.getById(id!),
    enabled: !!id,
  });

  const { data: articles, isLoading: articlesLoading } = useQuery({
    queryKey: ["bibliotheque-articles", id],
    queryFn: () => textesArticlesQueries.getByTexteId(id!),
    enabled: !!id,
  });

  if (texteLoading || articlesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (!texte) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <FileText className="h-16 w-16 text-muted-foreground" />
        <p className="text-muted-foreground">Texte non trouvé</p>
        <Button onClick={() => navigate("/bibliotheque")}>
          Retour à la bibliothèque
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <Button
        variant="ghost"
        onClick={() => navigate(`/bibliotheque/textes/${id}`)}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour au texte
      </Button>

      {/* En-tête */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Articles - {texte.numero_officiel}
        </h1>
        <p className="text-muted-foreground mt-2">{texte.intitule}</p>
      </div>

      {/* Liste des articles */}
      {articles && articles.length > 0 ? (
        <div className="space-y-4">
          {articles.map((article) => (
            <Card key={article.id} className="shadow-soft hover:shadow-medium transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      Article {article.numero}
                      {article.titre_court && ` - ${article.titre_court}`}
                    </CardTitle>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/bibliotheque/articles/${article.id}/versions`)}
                  >
                    <History className="h-4 w-4 mr-2" />
                    Versions
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Sous-domaines */}
                {(article as any).sous_domaines && (article as any).sous_domaines.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {(article as any).sous_domaines.map((sd: any) => (
                      <Badge key={sd.sous_domaine?.id} variant="secondary">
                        {sd.sous_domaine?.libelle}
                      </Badge>
                    ))}
                  </div>
                )}

                {article.contenu_fr && (
                  <div className="prose prose-sm max-w-none">
                    <div 
                      className="text-sm"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.contenu_fr) }}
                    />
                  </div>
                )}
                {article.contenu_ar && (
                  <div className="mt-4 prose prose-sm max-w-none" dir="rtl">
                    <div 
                      className="text-sm"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.contenu_ar) }}
                    />
                  </div>
                )}
                {article.notes && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <div className="text-sm font-medium text-muted-foreground mb-1">Notes</div>
                    <div className="text-sm">{article.notes}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="shadow-soft">
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Aucun article disponible pour ce texte</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
