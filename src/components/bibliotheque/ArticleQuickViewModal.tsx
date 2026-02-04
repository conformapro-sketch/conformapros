import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FileText, ExternalLink, Calendar, History, Copy, CheckCircle2, AlertCircle, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { ArticleWithDetails } from "@/lib/articles-queries";

interface ArticleQuickViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  article: ArticleWithDetails | null;
}

const STATUT_LABELS: Record<string, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  en_vigueur: { label: "En vigueur", className: "bg-success/10 text-success border-success/20", icon: CheckCircle2 },
  remplacee: { label: "Remplacée", className: "bg-warning/10 text-warning border-warning/20", icon: AlertCircle },
  abrogee: { label: "Abrogée", className: "bg-destructive/10 text-destructive border-destructive/20", icon: AlertCircle },
};

export function ArticleQuickViewModal({ 
  open, 
  onOpenChange, 
  article,
}: ArticleQuickViewModalProps) {
  const navigate = useNavigate();

  if (!article) return null;

  const statutInfo = STATUT_LABELS[article.version_active?.statut || "en_vigueur"] || STATUT_LABELS.en_vigueur;
  const StatusIcon = statutInfo.icon;

  const handleCopyNumero = () => {
    navigator.clipboard.writeText(article.numero);
    toast.success("Numéro d'article copié");
  };

  // Extract domain names
  const domaines = article.sous_domaines?.map(sd => sd.sous_domaine?.domaine?.libelle).filter(Boolean) || [];
  const sousDomaines = article.sous_domaines?.map(sd => sd.sous_domaine?.libelle).filter(Boolean) || [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg md:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-start justify-between gap-3 sm:gap-4 mb-2">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                {article.porte_exigence && (
                  <Badge variant="default" className="bg-primary text-primary-foreground text-xs">
                    Exigence
                  </Badge>
                )}
                {article.est_introductif && (
                  <Badge variant="outline" className="text-xs">
                    Introductif
                  </Badge>
                )}
                <Badge className={`${statutInfo.className} text-xs`}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statutInfo.label}
                </Badge>
              </div>
              <SheetTitle className="text-xl sm:text-2xl">Article {article.numero}</SheetTitle>
              <SheetDescription className="flex items-start gap-2 text-sm">
                <span className="font-semibold text-primary line-clamp-2">{article.titre}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 shrink-0"
                  onClick={handleCopyNumero}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
          {/* Quick Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {article.texte && (
              <div className="space-y-1 col-span-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                  <FileText className="h-4 w-4" />
                  <span>Texte parent</span>
                </div>
                <Button
                  variant="link"
                  className="h-auto p-0 text-sm text-left justify-start"
                  onClick={() => {
                    navigate(`/bibliotheque/textes/${article.texte_id}`);
                    onOpenChange(false);
                  }}
                >
                  {article.texte.reference} - {article.texte.titre}
                </Button>
              </div>
            )}
            
            {article.version_active?.date_effet && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                  <Calendar className="h-4 w-4" />
                  <span>Date d'effet</span>
                </div>
                <p className="text-sm font-medium">
                  {format(new Date(article.version_active.date_effet), 'dd MMMM yyyy', { locale: fr })}
                </p>
              </div>
            )}

            {article.texte?.type && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                  <BookOpen className="h-4 w-4" />
                  <span>Type de texte</span>
                </div>
                <p className="text-sm font-medium capitalize">{article.texte.type}</p>
              </div>
            )}
          </div>

          {/* Domaines */}
          {(domaines.length > 0 || sousDomaines.length > 0) && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">Domaines d'application</h4>
                <div className="flex flex-wrap gap-2">
                  {[...new Set(domaines)].map((domaine, i) => (
                    <Badge key={i} variant="secondary">{domaine}</Badge>
                  ))}
                  {sousDomaines.map((sd, i) => (
                    <Badge key={`sd-${i}`} variant="outline">{sd}</Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Resume */}
          {article.resume && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">Résumé</h4>
                <p className="text-sm text-muted-foreground">{article.resume}</p>
              </div>
            </>
          )}

          {/* Content from active version */}
          {article.version_active?.contenu && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">Contenu (version en vigueur)</h4>
                <div 
                  className="prose prose-sm max-w-none text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.version_active.contenu) }}
                />
              </div>
            </>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => {
                navigate(`/bibliotheque/textes/${article.texte_id}`);
                onOpenChange(false);
              }}
              className="w-full justify-start"
              size="lg"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Voir le texte complet
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                navigate(`/bibliotheque/articles/${article.id}/versions`);
                onOpenChange(false);
              }}
              className="w-full justify-start"
            >
              <History className="h-4 w-4 mr-2" />
              Historique des versions
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
