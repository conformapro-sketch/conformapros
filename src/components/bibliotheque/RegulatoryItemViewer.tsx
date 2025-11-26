import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FileText, 
  Calendar, 
  Tag as TagIcon, 
  AlertCircle,
  BookOpen,
  Scale,
  Layers
} from "lucide-react";
import { textesArticlesQueries } from "@/lib/textes-queries";
import { articleTagsQueries } from "@/lib/tags-queries";

interface RegulatoryItemViewerProps {
  articleId: string;
  showTexteInfo?: boolean;
  showTags?: boolean;
  showSousDomaines?: boolean;
  compact?: boolean;
}

export function RegulatoryItemViewer({ 
  articleId,
  showTexteInfo = true,
  showTags = true,
  showSousDomaines = true,
  compact = false
}: RegulatoryItemViewerProps) {
  // Fetch article with relations
  const { data: article, isLoading: articleLoading, error: articleError } = useQuery({
    queryKey: ["article-detail", articleId],
    queryFn: () => textesArticlesQueries.getById(articleId),
    enabled: !!articleId,
  });

  // Fetch tags for this article
  const { data: articleTags = [] } = useQuery({
    queryKey: ["article-tags", articleId],
    queryFn: () => articleTagsQueries.getByArticleId(articleId),
    enabled: !!articleId && showTags,
  });

  if (articleLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2 mt-2" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  if (articleError || !article) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Impossible de charger l'article réglementaire
        </AlertDescription>
      </Alert>
    );
  }

  const activeVersion = article.versions?.find((v: any) => v.statut === "en_vigueur");
  const texte = article.texte;
  const sousDomaines = article.sous_domaines || [];

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case "loi": return "default";
      case "decret": return "secondary";
      case "arrete": return "outline";
      case "circulaire": return "outline";
      default: return "secondary";
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className={compact ? "pb-3" : undefined}>
        {/* Header: Type, Reference, Title */}
        <div className="flex flex-wrap items-start gap-2 mb-2">
          {texte && (
            <>
              <Badge variant={getTypeBadgeVariant(texte.type)}>
                {texte.type.toUpperCase()}
              </Badge>
              <Badge variant="outline" className="font-mono text-xs">
                {texte.reference}
              </Badge>
            </>
          )}
          {article.porte_exigence && (
            <Badge variant="default" className="bg-orange-500 hover:bg-orange-600">
              <Scale className="h-3 w-3 mr-1" />
              Exigence réglementaire
            </Badge>
          )}
          {article.est_introductif && !article.porte_exigence && (
            <Badge variant="secondary">
              <BookOpen className="h-3 w-3 mr-1" />
              Introductif
            </Badge>
          )}
        </div>

        <CardTitle className={compact ? "text-lg" : "text-xl"}>
          Article {article.numero}
          {article.titre && `: ${article.titre}`}
        </CardTitle>

        {article.resume && (
          <CardDescription className="text-sm">
            {article.resume}
          </CardDescription>
        )}

        {/* Tags */}
        {showTags && articleTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {articleTags.map((at) => (
              <Badge
                key={at.id}
                variant="secondary"
                className="text-xs"
                style={at.reglementaire_tags?.couleur ? { 
                  backgroundColor: at.reglementaire_tags.couleur,
                  color: 'white'
                } : undefined}
              >
                <TagIcon className="h-3 w-3 mr-1" />
                {at.reglementaire_tags?.label}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Texte Info */}
        {showTexteInfo && texte && (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="font-medium">{texte.titre}</span>
              </div>
              {texte.date_publication && (
                <>
                  <Separator orientation="vertical" className="hidden sm:block h-4" />
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(texte.date_publication).toLocaleDateString("fr-FR")}</span>
                  </div>
                </>
              )}
            </div>

            {/* Domaines du texte */}
            {texte.domaines && texte.domaines.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {texte.domaines.map((td: any) => (
                  <Badge
                    key={td.id}
                    variant="outline"
                    className="text-xs"
                    style={td.domaine?.couleur ? {
                      borderColor: td.domaine.couleur,
                      color: td.domaine.couleur
                    } : undefined}
                  >
                    {td.domaine?.libelle}
                  </Badge>
                ))}
              </div>
            )}
          </>
        )}

        {/* Sous-domaines */}
        {showSousDomaines && sousDomaines.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Layers className="h-4 w-4" />
                <span>Classification thématique</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {sousDomaines.map((asd: any) => (
                  <Badge key={asd.id} variant="secondary" className="text-xs">
                    {asd.sous_domaine?.code} - {asd.sous_domaine?.libelle}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Active Version Content */}
        {activeVersion && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="default" className="bg-green-600">
                    Version {activeVersion.numero_version}
                  </Badge>
                  <span>En vigueur depuis le {new Date(activeVersion.date_effet).toLocaleDateString("fr-FR")}</span>
                </div>
              </div>

              {/* Version Content */}
              <div 
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: activeVersion.contenu }}
              />

              {/* Version Notes */}
              {activeVersion.notes_modifications && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    {activeVersion.notes_modifications}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </>
        )}

        {!activeVersion && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Aucune version active pour cet article
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
