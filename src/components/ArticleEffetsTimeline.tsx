import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  PlusCircle, 
  Pencil, 
  XCircle, 
  RefreshCw, 
  Hash,
  Calendar,
  FileText,
  FileEdit,
  ChevronDown,
  ChevronUp,
  GitCompare,
  FileDown,
  Eye,
  Clock,
  User,
  Tag,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  RotateCcw
} from "lucide-react";
import { format, formatDistance } from "date-fns";
import { fr } from "date-fns/locale";
import type { TypeEffet, PorteeEffet } from "@/types/actes";
import { useState } from "react";

interface ArticleEffet {
  id: string;
  type_effet: TypeEffet;
  date_effet: string;
  date_fin_effet?: string;
  reference_citation?: string;
  notes?: string;
  portee?: PorteeEffet;
  portee_detail?: string;
  raison_modification?: string;
  tags?: string[];
  impact_estime?: "low" | "medium" | "high";
  valide_par?: {
    nom?: string;
    prenom?: string;
  };
  valide_le?: string;
  commentaires_validation?: string;
  contenu?: string;
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
  onCompare?: (effetId: string) => void;
  onExport?: (effetId: string) => void;
  onViewSource?: (effetId: string) => void;
}

const getEffetIcon = (type: TypeEffet | string) => {
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
    case "restauration":
      return <RotateCcw className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

const getEffetColor = (type: TypeEffet | string) => {
  switch (type) {
    case "AJOUTE":
      return "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950";
    case "MODIFIE":
      return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950";
    case "ABROGE":
      return "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950";
    case "REMPLACE":
      return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950";
    case "RENUMEROTE":
      return "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950";
    case "COMPLETE":
      return "text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950";
    case "restauration":
      return "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950";
    default:
      return "text-muted-foreground bg-muted";
  }
};

const getEffetBadgeVariant = (type: TypeEffet | string): "default" | "secondary" | "destructive" | "outline" => {
  switch (type) {
    case "ABROGE":
      return "destructive";
    case "MODIFIE":
    case "REMPLACE":
      return "default";
    case "restauration":
      return "outline";
    default:
      return "secondary";
  }
};

const getImpactIcon = (impact?: string) => {
  switch (impact) {
    case "high":
      return <TrendingUp className="h-3 w-3 text-destructive" />;
    case "medium":
      return <Minus className="h-3 w-3 text-warning" />;
    case "low":
      return <TrendingDown className="h-3 w-3 text-success" />;
    default:
      return null;
  }
};

const getImpactLabel = (impact?: string) => {
  switch (impact) {
    case "high":
      return "Impact élevé";
    case "medium":
      return "Impact moyen";
    case "low":
      return "Impact faible";
    default:
      return "";
  }
};

const calculateChangeStats = (oldContent: string, newContent: string) => {
  const oldLength = oldContent?.length || 0;
  const newLength = newContent?.length || 0;
  const diff = newLength - oldLength;
  const percentChange = oldLength > 0 ? Math.round((diff / oldLength) * 100) : 0;
  
  return {
    charDiff: diff,
    percentChange,
    isIncrease: diff > 0
  };
};

export function ArticleEffetsTimeline({ 
  effets, 
  isLoading,
  onCompare,
  onExport,
  onViewSource
}: ArticleEffetsTimelineProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set([effets[0]?.id]));

  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

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

  const sortedEffets = [...effets].sort(
    (a, b) => new Date(b.date_effet).getTime() - new Date(a.date_effet).getTime()
  );

  const isVersionActive = (effet: ArticleEffet) => {
    const today = new Date();
    const effectiveFrom = new Date(effet.date_effet);
    const effectiveTo = effet.date_fin_effet ? new Date(effet.date_fin_effet) : null;
    
    return effectiveFrom <= today && (!effectiveTo || effectiveTo > today);
  };

  return (
    <div className="relative space-y-4">
      {/* Timeline line */}
      <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-border" />

      {sortedEffets.map((effet, index) => {
        const isActive = isVersionActive(effet);
        const isExpanded = expandedIds.has(effet.id);
        const durationDays = effet.date_fin_effet
          ? Math.floor(
              (new Date(effet.date_fin_effet).getTime() - new Date(effet.date_effet).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : null;

        return (
          <div key={effet.id} className="relative flex gap-4">
            {/* Timeline dot with icon */}
            <div
              className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 border-background shadow-sm ${getEffetColor(
                effet.type_effet
              )}`}
            >
              {getEffetIcon(effet.type_effet)}
            </div>

            {/* Content */}
            <Card className="flex-1 shadow-sm hover:shadow-md transition-shadow">
              <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(effet.id)}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      {/* Header badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={getEffetBadgeVariant(effet.type_effet)} className="gap-1">
                          {getEffetIcon(effet.type_effet)}
                          {effet.type_effet}
                        </Badge>
                        {isActive && (
                          <Badge variant="outline" className="bg-success/10 text-success border-success/30 gap-1">
                            <Clock className="h-3 w-3" />
                            En vigueur
                          </Badge>
                        )}
                        {!isActive && effet.date_fin_effet && (
                          <Badge variant="outline" className="bg-muted text-muted-foreground gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Archivée
                          </Badge>
                        )}
                        {effet.impact_estime && (
                          <Badge variant="outline" className="gap-1">
                            {getImpactIcon(effet.impact_estime)}
                            {getImpactLabel(effet.impact_estime)}
                          </Badge>
                        )}
                      </div>

                      {/* Date et durée */}
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(effet.date_effet), "d MMM yyyy", { locale: fr })}
                        </div>
                        {durationDays !== null && (
                          <>
                            <Separator orientation="vertical" className="h-4" />
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {durationDays} jours
                            </span>
                          </>
                        )}
                        {!effet.date_fin_effet && isActive && (
                          <>
                            <Separator orientation="vertical" className="h-4" />
                            <span className="text-success">
                              Depuis {formatDistance(new Date(effet.date_effet), new Date(), { locale: fr })}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Tags */}
                      {effet.tags && effet.tags.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          {effet.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="gap-1 text-xs">
                              <Tag className="h-2 w-2" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Mini preview (collapsed) */}
                      {!isExpanded && effet.contenu && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {effet.contenu.replace(/<[^>]*>/g, '').substring(0, 150)}...
                        </p>
                      )}
                    </div>

                    {/* Actions + Expand */}
                    <div className="flex items-start gap-1">
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm">
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                  </div>
                </CardHeader>

                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-4">
                    {/* Raison de modification */}
                    {effet.raison_modification && (
                      <div className="bg-muted/50 rounded-md p-3">
                        <p className="text-xs font-semibold text-foreground mb-1.5">
                          💬 Raison de la modification
                        </p>
                        <p className="text-sm text-muted-foreground">{effet.raison_modification}</p>
                      </div>
                    )}

                    {/* Texte source */}
                    {effet.texte_source && (
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-muted-foreground">📄 Source</p>
                        <div className="bg-muted/30 rounded-md p-2">
                          <p className="text-sm font-medium">{effet.texte_source.reference_officielle}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {effet.texte_source.intitule}
                          </p>
                          {effet.article_source && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Article {effet.article_source.numero_article}
                              {effet.article_source.titre_court && ` - ${effet.article_source.titre_court}`}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Validateur */}
                    {effet.valide_par && (
                      <div className="flex items-center gap-2 text-sm">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {effet.valide_par.prenom?.[0]}{effet.valide_par.nom?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground">
                            Validé par <span className="font-medium text-foreground">
                              {effet.valide_par.prenom} {effet.valide_par.nom}
                            </span>
                          </p>
                          {effet.valide_le && (
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(effet.valide_le), "d MMM yyyy 'à' HH:mm", { locale: fr })}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Commentaires validation */}
                    {effet.commentaires_validation && (
                      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                        <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-1">
                          ✅ Commentaire du validateur
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          {effet.commentaires_validation}
                        </p>
                      </div>
                    )}

                    {/* Portée */}
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
                      <div className="text-sm">
                        <p className="text-xs font-semibold text-muted-foreground mb-1">📝 Notes</p>
                        <p className="text-muted-foreground">{effet.notes}</p>
                      </div>
                    )}

                    {/* Action buttons */}
                    <Separator />
                    <div className="flex items-center gap-2 flex-wrap">
                      {onCompare && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onCompare(effet.id)}
                          className="gap-1"
                        >
                          <GitCompare className="h-3 w-3" />
                          Comparer
                        </Button>
                      )}
                      {onViewSource && effet.texte_source && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewSource(effet.texte_source!.id)}
                          className="gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          Voir source
                        </Button>
                      )}
                      {onExport && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onExport(effet.id)}
                          className="gap-1"
                        >
                          <FileDown className="h-3 w-3" />
                          Exporter PDF
                        </Button>
                      )}
                    </div>

                    {/* End date */}
                    {effet.date_fin_effet && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                        <Separator className="flex-1" />
                        <span className="flex items-center gap-1">
                          Fin d'effet: {format(new Date(effet.date_fin_effet), "d MMMM yyyy", { locale: fr })}
                        </span>
                        <Separator className="flex-1" />
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          </div>
        );
      })}

      {/* Original version marker */}
      <div className="relative flex gap-4">
        <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 border-background bg-muted shadow-sm">
          <FileText className="h-4 w-4 text-muted-foreground" />
        </div>
        <Card className="flex-1 p-4 bg-muted/30">
          <p className="text-sm font-medium">Version originale</p>
          <p className="text-xs text-muted-foreground">Article créé dans le texte initial</p>
        </Card>
      </div>
    </div>
  );
}