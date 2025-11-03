import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { textesArticlesQueries, textesArticlesVersionsQueries } from "@/lib/textes-queries";
import { Download, Calendar, FileText } from "lucide-react";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ConsolidatedTextViewerProps {
  texteId: string;
}

export function ConsolidatedTextViewer({ texteId }: ConsolidatedTextViewerProps) {
  const [targetDate, setTargetDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data: articles, isLoading: articlesLoading } = useQuery({
    queryKey: ['texte-articles', texteId],
    queryFn: () => textesArticlesQueries.getByTexteId(texteId),
  });

  const { data: consolidatedArticles, isLoading: consolidatedLoading } = useQuery({
    queryKey: ['consolidated-text', texteId, targetDate],
    queryFn: async () => {
      if (!articles) return [];
      
      const consolidated = await Promise.all(
        articles.map(async (article) => {
          const version = await textesArticlesVersionsQueries.getActiveVersionAtDate(
            article.id,
            targetDate
          );
          return { article, version };
        })
      );
      return consolidated;
    },
    enabled: !!articles && articles.length > 0,
  });

  const isLoading = articlesLoading || consolidatedLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Texte consolidé</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Version en vigueur à une date donnée
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="target-date" className="text-sm">Date de consolidation:</Label>
          </div>
          <Input
            id="target-date"
            type="date"
            className="w-40"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
          />
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {consolidatedArticles && consolidatedArticles.length > 0 ? (
            consolidatedArticles.map(({ article, version }) => (
              <Card key={article.id} className="shadow-soft">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Article {article.numero}
                      {article.titre && <span className="text-muted-foreground font-normal">- {article.titre}</span>}
                    </CardTitle>
                    {version ? (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-success/10 text-success-foreground border-success/20">
                          Version applicable
                        </Badge>
                        {version.modification_type && (
                          <Badge variant="secondary">
                            {version.modification_type}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <Badge variant="secondary" className="bg-muted">
                        Non en vigueur
                      </Badge>
                    )}
                  </div>
                  {version?.source_text_reference && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Source: {version.source_text_reference}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  {version ? (
                    <div>
                      <div 
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(version.contenu) }}
                      />
                      {version.effective_from && (
                        <div className="mt-4 pt-4 border-t flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>
                            Applicable depuis le {format(new Date(version.effective_from), 'dd MMMM yyyy', { locale: fr })}
                            {version.effective_to && ` jusqu'au ${format(new Date(version.effective_to), 'dd MMMM yyyy', { locale: fr })}`}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      Cet article n'était pas encore en vigueur à la date sélectionnée.
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="shadow-soft">
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Aucun article trouvé pour ce texte</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div className="mt-6 p-4 bg-muted/50 rounded-lg">
        <p className="text-xs text-muted-foreground">
          <strong>Note:</strong> Cette vue consolidée affiche le texte tel qu'il était en vigueur au {format(new Date(targetDate), 'dd MMMM yyyy', { locale: fr })}, 
          intégrant toutes les modifications applicables à cette date. Les versions sont déterminées automatiquement en fonction 
          des dates d'application (effective_from / effective_to).
        </p>
      </div>
    </div>
  );
}
