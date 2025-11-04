import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileText, 
  BookOpen, 
  Calendar,
  ExternalLink,
  List,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { textesReglementairesQueries, domainesQueries, textesArticlesQueries } from "@/lib/textes-queries";
import { useNavigate } from "react-router-dom";

interface TexteViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  texteId: string;
}

const TYPE_LABELS: Record<string, string> = {
  LOI: "Loi",
  ARRETE: "Arrêté",
  DECRET: "Décret",
  CIRCULAIRE: "Circulaire"
};

const STATUT_LABELS: Record<string, { label: string; className: string; icon: any }> = {
  en_vigueur: { label: "En vigueur", className: "bg-success text-success-foreground", icon: CheckCircle2 },
  modifie: { label: "Modifié", className: "bg-warning text-warning-foreground", icon: AlertCircle },
  abroge: { label: "Abrogé", className: "bg-destructive text-destructive-foreground", icon: XCircle },
  suspendu: { label: "Suspendu", className: "bg-secondary text-secondary-foreground", icon: AlertCircle }
};

export function TexteViewModal({
  open,
  onOpenChange,
  texteId,
}: TexteViewModalProps) {
  const navigate = useNavigate();

  // Load texte details
  const { data: texte, isLoading: loadingTexte } = useQuery({
    queryKey: ["texte-detail", texteId],
    queryFn: () => textesReglementairesQueries.getById(texteId),
    enabled: !!texteId && open,
  });

  // Load articles of this texte
  const { data: articles, isLoading: loadingArticles } = useQuery({
    queryKey: ["texte-articles", texteId],
    queryFn: () => textesArticlesQueries.getByTexteId(texteId),
    enabled: !!texteId && open,
  });

  const statutInfo = texte?.statut_vigueur 
    ? STATUT_LABELS[texte.statut_vigueur] || { label: texte.statut_vigueur, className: "", icon: AlertCircle }
    : null;
  const StatusIcon = statutInfo?.icon;
  const typeLabel = texte?.type ? TYPE_LABELS[texte.type] || texte.type : "";

  const handleViewFullPage = () => {
    navigate(`/bibliotheque/textes/${texteId}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        {loadingTexte ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : texte ? (
          <>
            <DialogHeader>
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-primary mt-1" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <DialogTitle className="text-lg">
                      {texte.titre}
                    </DialogTitle>
                    {statutInfo && StatusIcon && (
                      <Badge className={statutInfo.className}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statutInfo.label}
                      </Badge>
                    )}
                  </div>
                  <DialogDescription className="space-y-1">
                    {texte.reference_officielle && (
                      <div className="font-medium">{texte.reference_officielle}</div>
                    )}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <Separator />

            {/* Metadata */}
            <div className="flex flex-wrap gap-2">
              {typeLabel && (
                <Badge variant="outline">
                  <BookOpen className="h-3 w-3 mr-1" />
                  {typeLabel}
                </Badge>
              )}
              {texte.date_publication && (
                <Badge variant="secondary">
                  <Calendar className="h-3 w-3 mr-1" />
                  {new Date(texte.date_publication).toLocaleDateString("fr-FR")}
                </Badge>
              )}
              {texte.domaines?.map((d: any) => (
                <Badge key={d.domaine.id} variant="secondary">
                  {d.domaine.libelle}
                </Badge>
              ))}
            </div>

            <Tabs defaultValue="content" className="flex-1">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="content" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Contenu
                </TabsTrigger>
                <TabsTrigger value="articles" className="flex items-center gap-2">
                  <List className="h-4 w-4" />
                  Articles
                  {articles && articles.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {articles.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="h-[calc(90vh-320px)] mt-4">
                <TabsContent value="content" className="space-y-4 m-0">
                  <div className="space-y-4 pr-4">
                    {texte.resume && (
                      <Card className="bg-muted/30 border">
                        <CardContent className="pt-4">
                          <h4 className="font-semibold text-sm mb-2">Résumé</h4>
                          <p className="text-sm text-muted-foreground">{texte.resume}</p>
                        </CardContent>
                      </Card>
                    )}

                    {texte.contenu && (
                      <div className="bg-background rounded-lg p-4 border">
                        <h4 className="font-semibold text-sm mb-3">Contenu intégral</h4>
                        <div
                          className="prose prose-sm max-w-none dark:prose-invert"
                          dangerouslySetInnerHTML={{ __html: sanitizeHtml(texte.contenu) }}
                        />
                      </div>
                    )}

                    {!texte.contenu && !texte.resume && (
                      <p className="text-sm text-muted-foreground italic text-center py-8">
                        Aucun contenu disponible pour ce texte
                      </p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="articles" className="space-y-3 m-0">
                  <div className="pr-4">
                    {loadingArticles ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                      </div>
                    ) : articles && articles.length > 0 ? (
                      <div className="space-y-2">
                        {articles.map((article: any) => (
                          <Card 
                            key={article.id}
                            className="hover:shadow-md hover:border-primary/50 transition-all"
                          >
                            <CardContent className="pt-4 pb-4">
                              <div className="flex items-start gap-3">
                                <Badge className="bg-primary text-primary-foreground font-medium">
                                  Art. {article.numero}
                                </Badge>
                                <div className="flex-1 min-w-0">
                                  {article.titre_court && (
                                    <p className="text-sm font-medium mb-1">{article.titre_court}</p>
                                  )}
                                  {article.contenu && (
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                      {article.contenu.replace(/<[^>]*>/g, '').substring(0, 150)}...
                                    </p>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <Card className="p-6">
                        <div className="text-center space-y-2">
                          <List className="h-12 w-12 mx-auto text-muted-foreground/50" />
                          <p className="text-sm font-medium">Aucun article</p>
                          <p className="text-sm text-muted-foreground">
                            Ce texte ne contient pas d'articles référencés
                          </p>
                        </div>
                      </Card>
                    )}
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>

            <Separator />

            {/* Footer Actions */}
            <div className="flex items-center justify-end">
              <Button
                variant="default"
                size="sm"
                onClick={handleViewFullPage}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Voir la page complète
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">Texte non trouvé</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
