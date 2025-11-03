import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  PlusCircle, 
  Pencil, 
  XCircle, 
  RefreshCw, 
  Hash,
  Calendar,
  FileText,
  FileEdit
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { TypeEffet, PorteeEffet } from "@/types/actes";

interface ArticleEffet {
  id: string;
  type_effet: TypeEffet;
  date_effet: string;
  date_fin_effet?: string;
  reference_citation?: string;
  notes?: string;
  portee?: PorteeEffet;
  portee_detail?: string;
  texte_source?: {
    id: string;
    reference_officielle: string;
    intitule: string;
    type_acte?: string;
  };
  article_source?: {
    id: string;
    numero_article: string;
    titre_court?: string;
    texte: {
      reference_officielle: string;
      intitule: string;
    };
  };
}

interface ArticleEffetsTimelineProps {
  effets: ArticleEffet[];
  isLoading?: boolean;
}

const getEffetIcon = (type: TypeEffet) => {
  switch (type) {
    case "AJOUTE":
      return <PlusCircle className="h-4 w-4" />;
    case "MODIFIE":
      return <Pencil className="h-4 w-4" />;
    case "ABROGE":
      return <XCircle className="h-4 w-4" />;
    case "REMPLACE":
      return <RefreshCw className="h-4 w-4" />;
    case "RENUMEROTE":
      return <Hash className="h-4 w-4" />;
    case "COMPLETE":
      return <FileEdit className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

const getEffetColor = (type: TypeEffet) => {
  switch (type) {
    case "AJOUTE":
      return "text-green-600 dark:text-green-400";
    case "MODIFIE":
      return "text-yellow-600 dark:text-yellow-400";
    case "ABROGE":
      return "text-red-600 dark:text-red-400";
    case "REMPLACE":
      return "text-blue-600 dark:text-blue-400";
    case "RENUMEROTE":
      return "text-purple-600 dark:text-purple-400";
    case "COMPLETE":
      return "text-cyan-600 dark:text-cyan-400";
    default:
      return "text-muted-foreground";
  }
};

const getEffetBadgeVariant = (type: TypeEffet): "default" | "secondary" | "destructive" | "outline" => {
  switch (type) {
    case "ABROGE":
      return "destructive";
    case "MODIFIE":
    case "REMPLACE":
      return "default";
    default:
      return "secondary";
  }
};

export function ArticleEffetsTimeline({ effets, isLoading }: ArticleEffetsTimelineProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-4 animate-pulse">
            <div className="w-2 bg-muted rounded" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!effets || effets.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground text-center">
          Aucun historique de version enregistré
        </p>
      </Card>
    );
  }

  // Sort by date (most recent first)
  const sortedEffets = [...effets].sort(
    (a, b) => new Date(b.date_effet).getTime() - new Date(a.date_effet).getTime()
  );

  return (
    <div className="relative space-y-6">
      {/* Timeline line */}
      <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-border" />

      {sortedEffets.map((effet, index) => (
        <div key={effet.id} className="relative flex gap-4">
          {/* Timeline dot */}
          <div
            className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-background bg-background ${getEffetColor(
              effet.type_effet
            )}`}
          >
            {getEffetIcon(effet.type_effet)}
          </div>

          {/* Content */}
          <Card className="flex-1 p-4">
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={getEffetBadgeVariant(effet.type_effet)}>
                      {effet.type_effet}
                    </Badge>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(effet.date_effet), "d MMMM yyyy", { locale: fr })}
                    </span>
                  </div>

                  {effet.texte_source ? (
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">
                        {effet.texte_source.reference_officielle}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {effet.texte_source.intitule}
                      </p>
                      {effet.article_source && (
                        <p className="text-xs text-muted-foreground">
                          Article {effet.article_source.numero_article}
                          {effet.article_source.titre_court && ` - ${effet.article_source.titre_court}`}
                        </p>
                      )}
                    </div>
                  ) : effet.article_source?.texte ? (
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">
                        {effet.article_source.texte.reference_officielle}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {effet.article_source.texte.intitule}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Article {effet.article_source.numero_article}
                        {effet.article_source.titre_court && ` - ${effet.article_source.titre_court}`}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Source non spécifiée</p>
                  )}
                </div>
              </div>

              {/* Reference citation */}
              {effet.reference_citation && (
                <div className="bg-muted/50 rounded-md p-2">
                  <p className="text-xs text-muted-foreground italic">
                    "{effet.reference_citation}"
                  </p>
                </div>
              )}

              {/* Portée de la modification */}
              {effet.portee && effet.portee !== 'article' && (
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant="outline" className="font-normal">
                    Portée: {effet.portee === 'alinea' ? 'Alinéa' : 'Point'}
                    {effet.portee_detail && ` - ${effet.portee_detail}`}
                  </Badge>
                </div>
              )}

              {/* Notes */}
              {effet.notes && (
                <p className="text-sm text-muted-foreground">{effet.notes}</p>
              )}

              {/* End date */}
              {effet.date_fin_effet && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Separator className="flex-1" />
                  <span className="flex items-center gap-1">
                    Fin d'effet: {format(new Date(effet.date_fin_effet), "d MMMM yyyy", { locale: fr })}
                  </span>
                  <Separator className="flex-1" />
                </div>
              )}
            </div>
          </Card>
        </div>
      ))}

      {/* Original version marker */}
      <div className="relative flex gap-4">
        <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-background bg-background text-muted-foreground">
          <FileText className="h-4 w-4" />
        </div>
        <Card className="flex-1 p-4 bg-muted/30">
          <p className="text-sm font-medium">Version originale</p>
          <p className="text-xs text-muted-foreground">Article créé dans le texte initial</p>
        </Card>
      </div>
    </div>
  );
}
