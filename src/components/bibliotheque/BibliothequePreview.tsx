import * as HoverCardPrimitive from "@radix-ui/react-hover-card";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Building2, FileText, Eye } from "lucide-react";

const TYPE_LABELS = {
  loi: "Loi",
  arrete: "Arrêté",
  decret: "Décret",
  circulaire: "Circulaire",
};

interface BibliothequePreviewProps {
  texte: any;
  children: React.ReactNode;
  getStatutBadge: (statut: string) => { label: string; className: string; icon: string };
}

export function BibliothequePreview({ texte, children, getStatutBadge }: BibliothequePreviewProps) {
  const statutInfo = getStatutBadge(texte.statut_vigueur);
  const articleCount = texte.articles?.[0]?.count || 0;

  return (
    <HoverCard openDelay={300}>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardPrimitive.Portal>
        <HoverCardContent 
          className="w-80 md:w-96 max-w-[calc(100vw-2rem)]" 
          side="right" 
          align="start"
          sideOffset={8}
          alignOffset={-4}
          collisionPadding={16}
          avoidCollisions={true}
        >
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <Badge variant="outline" className="text-xs">
                {TYPE_LABELS[texte.type_acte as keyof typeof TYPE_LABELS]}
              </Badge>
              <Badge className={statutInfo.className}>
                <span className="mr-1">{statutInfo.icon}</span>
                {statutInfo.label}
              </Badge>
            </div>

            <div>
              <h4 className="font-bold text-sm text-primary mb-1">
                {texte.reference_officielle}
              </h4>
              <p className="font-semibold text-foreground text-sm leading-tight">
                {texte.intitule}
              </p>
            </div>

            {texte.resume && (
              <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                {texte.resume}
              </p>
            )}

            <div className="space-y-2 pt-2 border-t">
              {texte.autorite_emettrice && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5" />
                  <span>{texte.autorite_emettrice}</span>
                </div>
              )}
              {texte.date_publication && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{new Date(texte.date_publication).toLocaleDateString("fr-FR")}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs">
                <FileText className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium text-primary">
                  {articleCount} article{articleCount > 1 ? 's' : ''}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2 border-t">
              <Eye className="h-3 w-3" />
              <span>Survolez pour voir les détails</span>
            </div>
          </div>
        </HoverCardContent>
      </HoverCardPrimitive.Portal>
    </HoverCard>
  );
}
