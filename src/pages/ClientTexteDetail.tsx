import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileText, Calendar, ExternalLink, Download, Home } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { clientBibliothequeQueries } from "@/lib/client-bibliotheque-queries";
import { useSiteContext } from "@/hooks/useSiteContext";
import { RegulatoryItemViewer } from "@/components/bibliotheque/RegulatoryItemViewer";

export default function ClientTexteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentSite } = useSiteContext();

  // Fetch text details
  const { data: texte, isLoading: isLoadingTexte, error: errorTexte } = useQuery({
    queryKey: ["client-texte-detail", id],
    queryFn: () => clientBibliothequeQueries.getTexteById(id!),
    enabled: !!id,
  });

  // Fetch articles with active versions
  const { data: articles, isLoading: isLoadingArticles, error: errorArticles } = useQuery({
    queryKey: ["client-texte-articles-active", id],
    queryFn: () => clientBibliothequeQueries.getTexteArticlesActiveVersions(id!),
    enabled: !!id,
  });

  const isLoading = isLoadingTexte || isLoadingArticles;
  const error = errorTexte || errorArticles;

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !texte) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>
            {error ? "Erreur lors du chargement du texte." : "Texte introuvable."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const getTypeBadgeVariant = (type: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      loi: "default",
      decret: "secondary",
      arrete: "outline",
      circulaire: "outline",
    };
    return variants[type] || "outline";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">
              <Home className="h-4 w-4" />
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          {currentSite && (
            <>
              <BreadcrumbItem>
                <BreadcrumbLink>{currentSite.nom}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </>
          )}
          <BreadcrumbItem>
            <BreadcrumbLink href="/client-bibliotheque">Bibliothèque réglementaire</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{texte.reference}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/client-bibliotheque")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{texte.titre}</h1>
          <p className="text-muted-foreground">{texte.reference}</p>
        </div>
      </div>

      {/* Text Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Informations du texte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-muted-foreground">Type</span>
              <div className="mt-1">
                <Badge variant={getTypeBadgeVariant(texte.type)}>
                  {texte.type.toUpperCase()}
                </Badge>
              </div>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Référence officielle</span>
              <p className="mt-1 font-medium">{texte.reference}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Date de publication</span>
              <div className="mt-1 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{new Date(texte.date_publication).toLocaleDateString("fr-FR")}</span>
              </div>
            </div>
            <div>
              <span className="text-sm font-medium text-muted-foreground">Domaines réglementaires</span>
              <div className="mt-1 flex flex-wrap gap-2">
                {texte.domaines && texte.domaines.length > 0 ? (
                  texte.domaines.map((domaine: any) => (
                    <Badge key={domaine.id} variant="secondary">
                      {domaine.code} - {domaine.libelle}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">Aucun domaine assigné</span>
                )}
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="flex gap-2 pt-4 border-t">
            {texte.pdf_url && (
              <Button variant="outline" size="sm" asChild>
                <a href={texte.pdf_url} target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger le PDF
                </a>
              </Button>
            )}
            {texte.source_url && (
              <Button variant="outline" size="sm" asChild>
                <a href={texte.source_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Source officielle
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Articles List */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <h2 className="text-2xl font-bold">
            Articles ({articles?.length || 0})
          </h2>
        </div>

        {articles && articles.length > 0 ? (
          <div className="space-y-6">
            {articles.map((article: any) => (
              <RegulatoryItemViewer
                key={article.id}
                articleId={article.id}
                showTexteInfo={false}
                showTags={true}
                showSousDomaines={true}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun article disponible pour ce texte.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
