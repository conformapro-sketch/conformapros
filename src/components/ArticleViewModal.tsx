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
import { FileText, BookOpen, Lightbulb, CheckCircle2, XCircle, Circle, ChevronLeft, ChevronRight } from "lucide-react";

interface ArticleViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  article?: {
    numero: string;
    titre_court?: string;
    reference?: string;
    contenu?: string;
    interpretation?: string;
  };
  texte?: {
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-primary mt-1" />
            <div className="flex-1">
              <DialogTitle className="text-lg">
                {texte?.reference_officielle} - Article {article?.numero}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {texte?.titre}
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
          {texte?.statut_vigueur && (
            <Badge
              variant={texte.statut_vigueur === 'en_vigueur' ? 'default' : 'secondary'}
            >
              {texte.statut_vigueur === 'en_vigueur' ? 'En vigueur' : 'Abrogé'}
            </Badge>
          )}
          {domaines?.map(d => (
            <Badge key={d.id} variant="secondary">
              {d.libelle}
            </Badge>
          ))}
        </div>

        <Separator />

        {/* Article Content */}
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-base mb-2 flex items-center gap-2">
              <span className="text-primary">Article {article?.numero}</span>
              {article?.reference && (
                <span className="text-sm font-normal text-muted-foreground">
                  ({article.reference})
                </span>
              )}
            </h4>
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
                dangerouslySetInnerHTML={{ __html: article.contenu }}
              />
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Contenu de l'article non disponible
              </p>
            )}
          </div>
        </div>

        {/* Interpretation Section */}
        {article?.interpretation && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-semibold text-base flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                Interprétation
              </h4>
              <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <div
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: article.interpretation }}
                />
              </div>
            </div>
          </>
        )}

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
