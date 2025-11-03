import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import { textesArticlesQueries, textesArticlesVersionsQueries } from "@/lib/textes-queries";
import { Download, Calendar, FileText, PlusCircle, Info, Clock } from "lucide-react";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { format, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import Highlighter from "react-highlight-words";

interface ConsolidatedTextViewerProps {
  texteId: string;
}

// Helper to extract changed paragraphs from a version
const extractChangedSections = (content: string, modificationType?: string) => {
  if (!modificationType || modificationType === 'ajoute') return [];
  
  // Simple extraction of paragraphs - could be enhanced with more sophisticated parsing
  const paragraphs = content.split('\n').filter(p => p.trim().length > 0);
  return paragraphs.slice(0, 2); // Return first 2 paragraphs as sample
};

export function ConsolidatedTextViewer({ texteId }: ConsolidatedTextViewerProps) {
  const [targetDate, setTargetDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showAnnotations, setShowAnnotations] = useState(true);

  const { data: articles, isLoading: articlesLoading } = useQuery({
    queryKey: ['texte-articles', texteId],
    queryFn: () => textesArticlesQueries.getByTexteId(texteId),
  });

  // Fetch articles ajoutés via effets juridiques de type "AJOUTE"
  const { data: articlesAjoutes = [], isLoading: articlesAjoutesLoading } = useQuery({
    queryKey: ['articles-ajoutes', texteId, targetDate],
    queryFn: async () => {
      const { articlesEffetsJuridiquesQueries } = await import("@/lib/actes-queries");
      const effets = await articlesEffetsJuridiquesQueries.getByTexteCibleId(texteId);
      
      // Filtrer uniquement les effets de type "AJOUTE" applicables à la date
      const ajouts = effets.filter((effet: any) => {
        const dateEffet = new Date(effet.date_effet);
        const dateTarget = new Date(targetDate);
        const dateFinEffet = effet.date_fin_effet ? new Date(effet.date_fin_effet) : null;
        
        return (
          effet.type_effet === 'AJOUTE' &&
          dateEffet <= dateTarget &&
          (!dateFinEffet || dateFinEffet >= dateTarget)
        );
      });
      
      // Charger les articles sources complets
      const articlesPromises = ajouts.map(async (effet: any) => {
        const article = await textesArticlesQueries.getById(effet.article_source_id);
        return {
          ...article,
          _ajouteParEffet: effet, // Ajouter les infos de l'effet
        };
      });
      
      return Promise.all(articlesPromises);
    },
    enabled: !!texteId,
  });

  const { data: consolidatedArticles, isLoading: consolidatedLoading } = useQuery({
    queryKey: ['consolidated-text', texteId, targetDate],
    queryFn: async () => {
      if (!articles) return [];
      
      // 1. Récupérer les versions des articles originaux avec leurs détails complets
      const articlesOriginaux = await Promise.all(
        articles.map(async (article) => {
          const version = await textesArticlesVersionsQueries.getActiveVersionAtDate(
            article.id,
            targetDate
          );
          
          // Get all versions to track history
          const allVersions = await textesArticlesVersionsQueries.getByArticleId(article.id);
          
          // Check if article is abrogated at target date
          const { articlesEffetsJuridiquesQueries } = await import("@/lib/actes-queries");
          const effetsRecus = await articlesEffetsJuridiquesQueries.getByArticleCibleId(article.id);
          const abrogation = effetsRecus.find((effet: any) => {
            const dateEffet = new Date(effet.date_effet);
            const dateTarget = new Date(targetDate);
            const dateFinEffet = effet.date_fin_effet ? new Date(effet.date_fin_effet) : null;
            
            return (
              effet.type_effet === 'ABROGE' &&
              dateEffet <= dateTarget &&
              (!dateFinEffet || dateFinEffet >= dateTarget)
            );
          });
          
          return { article, version, allVersions, isAjoute: false, abrogation };
        })
      );

      // 2. Ajouter les articles ajoutés par d'autres textes
      const articlesAjoutesFormates = articlesAjoutes.map((article: any) => ({
        article,
        version: null,
        allVersions: [],
        isAjoute: true,
        abrogation: null,
      }));

      // 3. Fusionner et trier par numéro d'article
      const allArticles = [...articlesOriginaux, ...articlesAjoutesFormates];
      return allArticles.sort((a, b) => {
        const numA = a.article.numero_article || "";
        const numB = b.article.numero_article || "";
        return numA.localeCompare(numB, 'fr', { numeric: true, sensitivity: 'base' });
      });
    },
    enabled: !!articles && articles.length > 0,
  });

  const isLoading = articlesLoading || consolidatedLoading || articlesAjoutesLoading;

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
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAnnotations(!showAnnotations)}
          >
            <Info className="h-4 w-4 mr-2" />
            {showAnnotations ? "Masquer" : "Afficher"} annotations
          </Button>
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
            consolidatedArticles.map(({ article, version, allVersions, isAjoute, abrogation }: any) => {
              // Calculate age of current version
              const versionAge = version?.effective_from 
                ? differenceInDays(new Date(targetDate), new Date(version.effective_from))
                : 0;
              
              const hasRecentChanges = allVersions?.some((v: any) => {
                const versionDate = new Date(v.date_version);
                const oneYearAgo = new Date(targetDate);
                oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
                return versionDate > oneYearAgo;
              });

              return (
                <Card 
                  key={article.id} 
                  className={`shadow-soft ${
                    isAjoute ? 'border-l-4 border-l-success' : 
                    abrogation ? 'border-l-4 border-l-destructive bg-muted/30 opacity-70' : 
                    hasRecentChanges && showAnnotations ? 'border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className={`text-lg flex items-center gap-2 ${abrogation ? 'line-through text-muted-foreground' : ''}`}>
                        <FileText className="h-5 w-5 text-primary" />
                        Article {article.numero_article}
                        {article.titre_court && <span className="text-muted-foreground font-normal">- {article.titre_court}</span>}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {abrogation ? (
                          <Badge variant="destructive" className="gap-1">
                            ❌ Abrogé
                          </Badge>
                        ) : isAjoute ? (
                          <Badge variant="outline" className="bg-success/10 text-success-foreground border-success/20">
                            <PlusCircle className="h-3 w-3 mr-1" />
                            Ajouté par {article._ajouteParEffet?.article_source?.texte?.reference_officielle}
                          </Badge>
                        ) : version ? (
                          <>
                            <Badge variant="outline" className="bg-success/10 text-success-foreground border-success/20">
                              Version applicable
                            </Badge>
                            {version.modification_type && (
                              <Badge variant="secondary">
                                {version.modification_type}
                              </Badge>
                            )}
                            {showAnnotations && hasRecentChanges && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300">
                                      <Clock className="h-3 w-3 mr-1" />
                                      Récent
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Cet article a été modifié au cours des 12 derniers mois</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </>
                        ) : (
                          <Badge variant="secondary" className="bg-muted">
                            Non en vigueur
                          </Badge>
                        )}
                      </div>
                    </div>
                    {abrogation && abrogation.article_source && (
                      <div className="mt-2 p-2 bg-destructive/10 rounded-md border border-destructive/20">
                        <p className="text-xs text-destructive-foreground">
                          ⚠️ Abrogé par{' '}
                          <span className="font-medium">
                            {abrogation.article_source.texte?.reference_officielle} - Article {abrogation.article_source.numero_article}
                          </span>
                          {abrogation.date_effet && (
                            <span className="ml-1">
                              le {format(new Date(abrogation.date_effet), 'dd MMMM yyyy', { locale: fr })}
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                    {isAjoute && article._ajouteParEffet?.reference_citation && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Référence: {article._ajouteParEffet.reference_citation}
                      </p>
                    )}
                    {!isAjoute && version?.source_text_reference && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Source: {version.source_text_reference}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    {(isAjoute || version) ? (
                      <div>
                        <div 
                          className={`prose prose-sm max-w-none ${abrogation ? 'opacity-50' : ''}`}
                          dangerouslySetInnerHTML={{ 
                            __html: sanitizeHtml(isAjoute ? article.contenu : version.contenu) 
                          }}
                        />
                        
                        {/* Temporal Annotations */}
                        {showAnnotations && !abrogation && (
                          <div className="mt-4 pt-4 border-t space-y-2">
                            {isAjoute && article._ajouteParEffet?.date_effet && (
                              <div className="flex items-center gap-2 text-xs p-2 bg-green-50 dark:bg-green-950/30 rounded-md border border-green-200 dark:border-green-800">
                                <PlusCircle className="h-3 w-3 text-success flex-shrink-0" />
                                <span className="text-green-900 dark:text-green-100">
                                  <strong>✅ Ajouté</strong> le {format(new Date(article._ajouteParEffet.date_effet), 'dd MMMM yyyy', { locale: fr })}
                                </span>
                              </div>
                            )}
                            {!isAjoute && version?.effective_from && (
                              <div className="flex items-center gap-2 text-xs p-2 bg-blue-50 dark:bg-blue-950/30 rounded-md border border-blue-200 dark:border-blue-800">
                                <Calendar className="h-3 w-3 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                <span className="text-blue-900 dark:text-blue-100">
                                  <strong>📅 En vigueur</strong> depuis le {format(new Date(version.effective_from), 'dd MMMM yyyy', { locale: fr })}
                                  {version.effective_to && ` jusqu'au ${format(new Date(version.effective_to), 'dd MMMM yyyy', { locale: fr })}`}
                                  {versionAge > 0 && ` (${versionAge} jours)`}
                                </span>
                              </div>
                            )}
                            {!isAjoute && version?.raison_modification && (
                              <div className="flex items-start gap-2 text-xs p-2 bg-amber-50 dark:bg-amber-950/30 rounded-md border border-amber-200 dark:border-amber-800">
                                <Info className="h-3 w-3 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                <span className="text-amber-900 dark:text-amber-100">
                                  <strong>💬 Contexte:</strong> {version.raison_modification}
                                </span>
                              </div>
                            )}
                            {!isAjoute && allVersions && allVersions.length > 1 && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {allVersions.length} version{allVersions.length > 1 ? 's' : ''} historique{allVersions.length > 1 ? 's' : ''}
                                </span>
                              </div>
                            )}
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
              );
            })
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
          <br />
          <span className="inline-flex items-center gap-1 mt-1">
            <span className="inline-block w-3 h-3 bg-success rounded"></span> Articles ajoutés par d'autres textes réglementaires
          </span>
          <span className="inline-flex items-center gap-1 ml-3">
            <span className="inline-block w-3 h-3 bg-destructive rounded"></span> Articles abrogés (barrés et grisés)
          </span>
        </p>
      </div>
    </div>
  );
}
