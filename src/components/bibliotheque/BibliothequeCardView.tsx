import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Scale, FileCheck, Scroll, Calendar } from "lucide-react";
import { BibliothequeRowActionsMenu } from "./BibliothequeRowActionsMenu";

interface BibliothequeCardViewProps {
  data: any[];
  onView: (texte: any) => void;
  onEdit: (texte: any) => void;
  onDelete: (texte: any) => void;
  onViewPdf?: (texte: any) => void;
  onToggleFavorite?: (texte: any) => void;
  canEdit?: boolean;
}

const TYPE_ICONS: Record<string, any> = {
  loi: Scale,
  decret: FileText,
  arrete: FileCheck,
  circulaire: Scroll,
  decision: FileCheck,
};

const TYPE_LABELS: Record<string, string> = {
  loi: "Loi",
  decret: "Décret",
  arrete: "Arrêté",
  circulaire: "Circulaire",
  decision: "Décision",
};

function getStatutBadge(statut: string) {
  const statuts: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    en_vigueur: { label: "En vigueur", variant: "default" },
    modifie: { label: "Modifié", variant: "secondary" },
    abroge: { label: "Abrogé", variant: "destructive" },
  };
  return statuts[statut] || { label: statut, variant: "outline" };
}

export function BibliothequeCardView({
  data,
  onView,
  onEdit,
  onDelete,
  onViewPdf,
  onToggleFavorite,
  canEdit = true,
}: BibliothequeCardViewProps) {
  return (
    <div className="grid gap-4">
      {data.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">Aucun résultat trouvé.</p>
          </CardContent>
        </Card>
      ) : (
        data.map((texte) => {
          const Icon = TYPE_ICONS[texte.type_acte] || FileText;
          const statut = getStatutBadge(texte.statut_vigueur);

          return (
            <Card
              key={texte.id}
              className="transition-all hover:shadow-lg cursor-pointer group"
              onClick={() => onView(texte)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="gap-1.5">
                        <Icon className="h-3.5 w-3.5" />
                        {TYPE_LABELS[texte.type_acte] || texte.type_acte}
                      </Badge>
                      <Badge variant={statut.variant}>{statut.label}</Badge>
                    </div>

                    <div>
                      <p className="font-semibold text-primary text-sm mb-1">
                        {texte.reference_officielle}
                      </p>
                      <h3 className="font-medium line-clamp-2 text-sm group-hover:text-primary transition-colors">
                        {texte.intitule}
                      </h3>
                    </div>
                  </div>

                  <BibliothequeRowActionsMenu
                    texte={texte}
                    onView={onView}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onViewPdf={onViewPdf}
                    onToggleFavorite={onToggleFavorite}
                    isFavorite={false}
                    canEdit={canEdit}
                  />
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {texte.date_publication
                      ? new Date(texte.date_publication).toLocaleDateString("fr-FR")
                      : "Date inconnue"}
                  </div>
                  <span>
                    {texte.articles?.[0]?.count || 0} article{(texte.articles?.[0]?.count || 0) > 1 ? "s" : ""}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
