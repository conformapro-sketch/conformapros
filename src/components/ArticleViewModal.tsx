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
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileText, 
  BookOpen, 
  Lightbulb, 
  CheckCircle2, 
  XCircle, 
  Circle, 
  ChevronLeft, 
  ChevronRight,
  History,
  AlertCircle,
  TrendingUp
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { articlesEffetsJuridiquesQueries } from "@/lib/actes-queries";
import { ArticleEffetsTimeline } from "@/components/ArticleEffetsTimeline";

interface ArticleViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  article?: {
    id?: string;
    numero: string;
    titre_court?: string;
    reference?: string;
    contenu?: string;
    interpretation?: string;
    statut?: string;
  };
  texte?: {
    id?: string;
    titre: string;
    reference_officielle?: string;
    type?: string;
    statut_vigueur?: string;
  };
  domaines?: Array<{ id: string; code: string; libelle: string }>;
  applicabilite?: "obligatoire" | "non_applicable" | "non_concerne";
  onUpdateApplicabilite?: (value: string) => void;
  onNext?: () => void;
  onPrevious?: () => void;
  canNavigate?: { next: boolean; previous: boolean };
}

export function ArticleViewModal({
  open,
  onOpenChange,
  article,
  texte,
  domaines,
  applicabilite,
  onUpdateApplicabilite,
  onNext,
  onPrevious,
  canNavigate,
}: ArticleViewModalProps) {
  // Load legal effects targeting this article
  const { data: effetsRecus, isLoading: loadingEffets } = useQuery({
    queryKey: ["article-effets-cible", article?.id],
    queryFn: () => articlesEffetsJuridiquesQueries.getByArticleCibleId(article!.id!),
    enabled: !!article?.id && open,
  });

  // Determine article status
  const getArticleStatus = () => {
    if (!effetsRecus || effetsRecus.length === 0) {
      return { label: "En vigueur", variant: "default" as const, icon: CheckCircle2 };
    }
    const latestEffect = effetsRecus[0];
    switch (latestEffect.type_effet) {
      case "ABROGE":
        return { label: "Abrogé", variant: "destructive" as const, icon: XCircle };
      case "REMPLACE":
        return { label: "Remplacé", variant: "secondary" as const, icon: AlertCircle };
      case "MODIFIE":
        return { label: "Modifié", variant: "default" as const, icon: TrendingUp };
      default:
        return { label: "En vigueur", variant: "default" as const, icon: CheckCircle2 };
    }
  };

  const status = getArticleStatus();
  const StatusIcon = status.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-primary mt-1" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <DialogTitle className="text-lg">
                  Article {article?.numero}
                </DialogTitle>
                <Badge variant={status.variant} className="gap-1">
                  <StatusIcon className="h-3 w-3" />
                  {status.label}
                </Badge>
              </div>
              <DialogDescription className="space-y-1">
                <div className="font-medium">{texte?.reference_officielle}</div>
                <div>{texte?.titre}</div>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Separator />

        {/* Metadata */}
        <div className="flex flex-wrap gap-2">
          {texte?.type && (
            <Badge variant="outline">
              <BookOpen className="h-3 w-3 mr-1" />
              {texte.type}
            </Badge>
          )}
          {domaines?.map(d => (
            <Badge key={d.id} variant="secondary">
              {d.libelle}
            </Badge>
          ))}
        </div>

        <Tabs defaultValue="content" className="flex-1">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="content" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Contenu
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Historique
              {effetsRecus && effetsRecus.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {effetsRecus.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(90vh-280px)] mt-4">
            <TabsContent value="content" className="space-y-4 m-0">

              {/* Article Content */}
              <div className="space-y-4 pr-4">
                <div>
                  {article?.titre_court && (
                    <p className="text-sm font-medium text-muted-foreground mb-3">
                      {article.titre_court}
                    </p>
                  )}
                </div>

                <div className="bg-muted/30 rounded-lg p-4 border">
                  {article?.contenu ? (
                    <div
                      className="prose prose-sm max-w-none dark:prose-invert"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.contenu) }}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      Contenu de l'article non disponible
                    </p>
                  )}
                </div>

                {/* Applicability Actions */}
                {onUpdateApplicabilite && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h4 className="font-semibold text-base">Applicabilité</h4>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant={applicabilite === "non_concerne" ? "default" : "outline"}
                          className="flex-1"
                          onClick={() => onUpdateApplicabilite("non_concerne")}
                        >
                          <Circle className="h-4 w-4 mr-2" />
                          Non concerné
                        </Button>
                        <Button
                          size="sm"
                          variant={applicabilite === "obligatoire" ? "default" : "outline"}
                          className="flex-1"
                          onClick={() => onUpdateApplicabilite("obligatoire")}
                          disabled={applicabilite === "non_concerne"}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Applicable
                        </Button>
                        <Button
                          size="sm"
                          variant={applicabilite === "non_applicable" ? "default" : "outline"}
                          className="flex-1"
                          onClick={() => onUpdateApplicabilite("non_applicable")}
                          disabled={applicabilite === "non_concerne"}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Non applicable
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-4 m-0">
              <div className="pr-4 space-y-4">
                {loadingEffets ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : effetsRecus && effetsRecus.length > 0 ? (
                  <>
                    <Card className="p-4 bg-muted/30">
                      <p className="text-sm text-muted-foreground">
                        Cet article a subi <strong>{effetsRecus.length}</strong> modification
                        {effetsRecus.length > 1 ? "s" : ""} au fil du temps
                      </p>
                    </Card>
                    <ArticleEffetsTimeline effets={effetsRecus} />
                  </>
                ) : (
                  <Card className="p-6">
                    <div className="text-center space-y-2">
                      <History className="h-12 w-12 mx-auto text-muted-foreground/50" />
                      <p className="text-sm font-medium">Aucune modification</p>
                      <p className="text-sm text-muted-foreground">
                        Cet article n'a pas encore été modifié par d'autres textes
                      </p>
                    </div>
                  </Card>
                )}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {/* Navigation Footer */}
        {(onNext || onPrevious) && (
          <>
            <Separator />
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={onPrevious}
                disabled={!canNavigate?.previous}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onNext}
                disabled={!canNavigate?.next}
              >
                Suivant
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
