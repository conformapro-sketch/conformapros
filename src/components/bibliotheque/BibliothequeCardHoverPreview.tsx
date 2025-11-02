import { useState, useEffect } from "react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, Pencil, Eye, Calendar, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface BibliothequeCardHoverPreviewProps {
  children: React.ReactNode;
  texte: any;
  getStatutBadge: (statut: string) => {
    label: string;
    className: string;
    icon: string;
  };
  onView?: () => void;
  onEdit?: () => void;
  onViewPdf?: () => void;
}

export function BibliothequeCardHoverPreview({
  children,
  texte,
  getStatutBadge,
  onView,
  onEdit,
  onViewPdf,
}: BibliothequeCardHoverPreviewProps) {
  const [showPreview, setShowPreview] = useState(false);
  const statutInfo = getStatutBadge(texte.statut_vigueur);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (showPreview) {
      timeout = setTimeout(() => {
        // Preview shown after 500ms hover
      }, 500);
    }
    return () => clearTimeout(timeout);
  }, [showPreview]);

  return (
    <HoverCard openDelay={500} closeDelay={200}>
      <HoverCardTrigger asChild>
        <div onMouseEnter={() => setShowPreview(true)} onMouseLeave={() => setShowPreview(false)}>
          {children}
        </div>
      </HoverCardTrigger>
      <HoverCardContent
        side="right"
        className="w-96 p-0 overflow-hidden animate-in fade-in-0 zoom-in-95"
        sideOffset={10}
      >
        {/* Header */}
        <div className="p-4 bg-gradient-primary">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="text-xs font-medium text-primary-foreground/80 mb-1">
                {texte.reference_officielle}
              </div>
              <h4 className="font-semibold text-primary-foreground line-clamp-2">
                {texte.intitule}
              </h4>
            </div>
            <Badge className={cn("shrink-0", statutInfo.className)}>
              {statutInfo.icon} {statutInfo.label}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {texte.resume && (
            <>
              <div>
                <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Résumé
                </h5>
                <p className="text-sm line-clamp-3">{texte.resume}</p>
              </div>
              <Separator />
            </>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            {texte.autorite_emettrice && (
              <div className="flex items-start gap-2">
                <User className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <div className="text-muted-foreground">Autorité</div>
                  <div className="font-medium">{texte.autorite_emettrice}</div>
                </div>
              </div>
            )}
            {texte.date_publication && (
              <div className="flex items-start gap-2">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <div className="text-muted-foreground">Publication</div>
                  <div className="font-medium">
                    {new Date(texte.date_publication).toLocaleDateString("fr-FR")}
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Quick Actions */}
          <div className="flex gap-2">
            {onView && (
              <Button
                variant="outline"
                size="sm"
                onClick={onView}
                className="flex-1 text-xs"
              >
                <Eye className="h-3.5 w-3.5 mr-1" />
                Voir
              </Button>
            )}
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                className="flex-1 text-xs"
              >
                <Pencil className="h-3.5 w-3.5 mr-1" />
                Modifier
              </Button>
            )}
            {texte.pdf_url && onViewPdf && (
              <Button
                variant="outline"
                size="sm"
                onClick={onViewPdf}
                className="flex-1 text-xs"
              >
                <FileText className="h-3.5 w-3.5 mr-1" />
                PDF
              </Button>
            )}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
