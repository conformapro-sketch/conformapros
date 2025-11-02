import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, BookOpen } from "lucide-react";

interface ArticleViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  article?: {
    numero: string;
    titre_court?: string;
    reference?: string;
    contenu?: string;
  };
  texte?: {
    titre: string;
    reference_officielle?: string;
    type?: string;
    statut_vigueur?: string;
  };
  domaines?: Array<{ id: string; code: string; libelle: string }>;
}

export function ArticleViewModal({
  open,
  onOpenChange,
  article,
  texte,
  domaines,
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
      </DialogContent>
    </Dialog>
  );
}
