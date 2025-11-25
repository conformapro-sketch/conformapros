import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { articleVersionsQueries, articlesQueries } from "@/lib/textes-reglementaires-queries";
import { ArrowLeft, Calendar, FileText, User, Clock, BookOpen } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function ArticleVersions() {
  const { articleId } = useParams<{ articleId: string }>();
  const navigate = useNavigate();

  const { data: article, isLoading: articleLoading } = useQuery({
    queryKey: ["article", articleId],
    queryFn: () => articlesQueries.getById(articleId!),
    enabled: !!articleId,
  });

  const { data: versions = [], isLoading: versionsLoading } = useQuery({
    queryKey: ["article-versions-history", articleId],
    queryFn: () => articleVersionsQueries.getByArticleId(articleId!),
    enabled: !!articleId,
  });

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

  if (articleLoading || versionsLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Article non trouvé</p>
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="mt-4 mx-auto block"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Historique des versions</h1>
          <p className="text-muted-foreground mt-1">
            Traçabilité complète des évolutions légales
          </p>
        </div>
      </div>

      {/* Article Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{article.titre}</CardTitle>
              <CardDescription className="mt-2">
                Article {article.numero}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {article.est_introductif && (
                <Badge variant="outline">Introductif</Badge>
              )}
              {article.porte_exigence && (
                <Badge variant="outline">Exigence réglementaire</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        {article.resume && (
          <CardContent>
            <p className="text-sm text-muted-foreground">{article.resume}</p>
          </CardContent>
        )}
      </Card>

      {/* Versions Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Historique des versions ({versions.length})
          </CardTitle>
          <CardDescription>
            Liste chronologique des versions successives avec détails de traçabilité
          </CardDescription>
        </CardHeader>
        <CardContent>
          {versions.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Aucune version enregistrée pour cet article</p>
            </div>
          ) : (
            <div className="space-y-6">
              {versions.map((version, index) => (
                <div key={version.id}>
                  <div className="flex items-start gap-4">
                    {/* Version Badge */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">
                          V{version.numero_version}
                        </span>
                      </div>
                    </div>

                    {/* Version Details */}
                    <div className="flex-1 space-y-3">
                      {/* Header Row */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">
                            Version {version.numero_version}
                          </h3>
                          {getStatutBadge(version.statut)}
                          {index === 0 && version.statut === "en_vigueur" && (
                            <Badge variant="default" className="bg-primary">
                              Version actuelle
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Metadata Grid */}
                      <div className="grid gap-3 sm:grid-cols-2">
                        {/* Date d'effet */}
                        <div className="flex items-start gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-xs text-muted-foreground">Date d'effet</p>
                            <p className="text-sm font-medium">
                              {format(new Date(version.date_effet), "d MMMM yyyy", { locale: fr })}
                            </p>
                          </div>
                        </div>

                        {/* Texte source */}
                        {version.source_texte && (
                          <div className="flex items-start gap-2">
                            <BookOpen className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-xs text-muted-foreground">Texte source</p>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {version.source_texte.type}
                                </Badge>
                                <p className="text-sm font-medium">
                                  {version.source_texte.reference}
                                </p>
                              </div>
                              {version.source_texte.titre && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {version.source_texte.titre}
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Auteur */}
                        <div className="flex items-start gap-2">
                          <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-xs text-muted-foreground">Créé par</p>
                            <p className="text-sm font-medium">
                              {version.created_by || "Système"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(version.created_at), "d MMM yyyy à HH:mm", { locale: fr })}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Notes de modification */}
                      {version.notes_modifications && (
                        <div className="bg-muted/50 rounded-md p-3 border">
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Note explicative
                          </p>
                          <p className="text-sm">{version.notes_modifications}</p>
                        </div>
                      )}

                      {/* Contenu preview */}
                      <div className="bg-background rounded-md p-4 border">
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          Contenu de la version
                        </p>
                        <div 
                          className="prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: version.contenu }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Separator between versions */}
                  {index < versions.length - 1 && (
                    <div className="relative my-6">
                      <Separator />
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 w-px h-6 bg-border" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
