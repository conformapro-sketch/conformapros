import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { 
  ChevronDown, 
  ChevronRight, 
  FileEdit, 
  GitCompare, 
  Calendar,
  User,
  FileText,
  RotateCcw,
  PlusCircle,
  XCircle,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Hash,
  Trash2
} from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { format, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import ReactDiffViewer from "react-diff-viewer-continued";
import { sanitizeHtml, stripHtml } from "@/lib/sanitize-html";

interface Version {
  id: string;
  version_numero: number;
  version_label?: string;
  date_version: string;
  contenu: string;
  modification_type?: string;
  raison_modification?: string;
  source_text_reference?: string;
  effective_from?: string;
  effective_to?: string;
  is_active: boolean;
  tags?: string[];
  impact_estime?: string;
  valide_par?: string;
  valide_le?: string;
  commentaires_validation?: string;
}

interface ArticleVersionsTimelineProps {
  versions: Version[];
  currentContent?: string;
  onCompare?: (versionA: Version, versionB: Version) => void;
  onRestore?: (version: Version) => void;
  onDelete?: (version: Version) => void;
}

const getModificationTypeBadge = (type?: string) => {
  switch (type) {
    case "modifie":
      return { 
        label: "Modifié", 
        variant: "default" as const, 
        icon: FileEdit,
        color: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300"
      };
    case "abroge":
      return { 
        label: "Abrogé", 
        variant: "destructive" as const, 
        icon: XCircle,
        color: "bg-destructive/10 text-destructive border-destructive/30"
      };
    case "remplace":
      return { 
        label: "Remplacé", 
        variant: "secondary" as const, 
        icon: RefreshCw,
        color: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300"
      };
    case "complete":
      return { 
        label: "Complété", 
        variant: "outline" as const, 
        icon: PlusCircle,
        color: "bg-green-100 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300"
      };
    case "restauration":
      return { 
        label: "Restauration", 
        variant: "outline" as const, 
        icon: RotateCcw,
        color: "bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300"
      };
    default:
      return { 
        label: type || "Original", 
        variant: "outline" as const, 
        icon: FileText,
        color: "bg-muted text-muted-foreground border-border"
      };
  }
};

const calculateDuration = (from?: string, to?: string) => {
  if (!from) return null;
  const endDate = to ? new Date(to) : new Date();
  const startDate = new Date(from);
  const days = differenceInDays(endDate, startDate);
  
  if (days < 30) return `${days}j`;
  if (days < 365) return `${Math.floor(days / 30)}m`;
  return `${Math.floor(days / 365)}a`;
};

const calculateChangeStats = (oldText: string, newText: string) => {
  const oldLength = stripHtml(oldText).length;
  const newLength = stripHtml(newText).length;
  const diff = newLength - oldLength;
  const percentChange = oldLength > 0 ? Math.round((diff / oldLength) * 100) : 0;
  
  return { diff, percentChange, oldLength, newLength };
};

// Helper function to determine if a version is currently active based on dates
const isVersionCurrentlyActive = (version: Version): boolean => {
  // 1) If is_active is defined and reliable, use it
  if (typeof version.is_active === "boolean") {
    return version.is_active;
  }
  
  // 2) Fallback to effective_from/effective_to date range
  const today = new Date();
  const from = version.effective_from ? new Date(version.effective_from) : null;
  const to = version.effective_to ? new Date(version.effective_to) : null;
  
  return !!(from && from <= today && (!to || to > today));
};

export function ArticleVersionsTimeline({
  versions,
  currentContent,
  onCompare,
  onRestore,
  onDelete,
}: ArticleVersionsTimelineProps) {
  const [expandedVersions, setExpandedVersions] = useState<string[]>([]);
  const [showDiffFor, setShowDiffFor] = useState<string | null>(null);

  const sortedVersions = [...versions].sort((a, b) => b.version_numero - a.version_numero);

  const toggleExpand = (versionId: string) => {
    setExpandedVersions(prev =>
      prev.includes(versionId)
        ? prev.filter(id => id !== versionId)
        : [...prev, versionId]
    );
  };

  const toggleDiff = (versionId: string) => {
    setShowDiffFor(prev => prev === versionId ? null : versionId);
  };

  if (versions.length === 0) {
    return (
      <Card className="shadow-soft">
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Aucune version disponible</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Historique des versions ({versions.length})</h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-block w-3 h-3 bg-success rounded-full"></span>
          <span>Active</span>
          <span className="inline-block w-3 h-3 bg-muted rounded-full ml-3"></span>
          <span>Archivée</span>
        </div>
      </div>

      <div className="relative">
        {/* Timeline vertical line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border"></div>

        <div className="space-y-6">
          {sortedVersions.map((version, index) => {
            const isExpanded = expandedVersions.includes(version.id);
            const showDiff = showDiffFor === version.id;
            const typeInfo = getModificationTypeBadge(version.modification_type);
            const TypeIcon = typeInfo.icon;
            const duration = calculateDuration(version.effective_from, version.effective_to);
            const previousVersion = sortedVersions[index + 1];
            const isActive = isVersionCurrentlyActive(version);
            
            let changeStats = null;
            if (previousVersion) {
              changeStats = calculateChangeStats(previousVersion.contenu, version.contenu);
            }

            return (
              <div key={version.id} className="relative pl-14">
                {/* Timeline dot */}
                <div 
                  className={`absolute left-[18px] top-6 w-4 h-4 rounded-full border-2 z-10 ${
                    isActive 
                      ? 'bg-success border-success' 
                      : 'bg-background border-muted'
                  }`}
                />

                <Card className={`shadow-soft transition-all ${isExpanded ? 'ring-2 ring-primary/20' : ''}`}>
                  <CardHeader className="pb-3">
                    <div className="space-y-3">
                      {/* Header row */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1">
                          <Badge className={typeInfo.color}>
                            <TypeIcon className="h-3 w-3 mr-1" />
                            {typeInfo.label}
                          </Badge>
                          <div className="flex items-center gap-2">
                            <Hash className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold text-foreground">
                              Version {version.version_numero}
                            </span>
                          </div>
                          {isActive && (
                            <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Actuelle
                            </Badge>
                          )}
                          {duration && (
                            <Badge variant="secondary" className="text-xs">
                              <Calendar className="h-3 w-3 mr-1" />
                              {duration}
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpand(version.id)}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      {/* Version label */}
                      {version.version_label && (
                        <p className="text-sm font-medium text-foreground">
                          {version.version_label}
                        </p>
                      )}

                      {/* Metadata row */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {format(new Date(version.date_version), "dd MMM yyyy", { locale: fr })}
                          </span>
                        </div>
                        {version.effective_from && (
                          <div className="flex items-center gap-1">
                            <span className="font-medium">En vigueur:</span>
                            <span>
                              {format(new Date(version.effective_from), "dd/MM/yyyy", { locale: fr })}
                              {version.effective_to && 
                                ` → ${format(new Date(version.effective_to), "dd/MM/yyyy", { locale: fr })}`
                              }
                            </span>
                          </div>
                        )}
                        {version.valide_par && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>Validé par {version.valide_par}</span>
                          </div>
                        )}
                        {changeStats && (
                          <Badge variant="outline" className="text-xs">
                            {changeStats.diff > 0 ? '+' : ''}{changeStats.diff} caractères
                            {changeStats.percentChange !== 0 && 
                              ` (${changeStats.percentChange > 0 ? '+' : ''}${changeStats.percentChange}%)`
                            }
                          </Badge>
                        )}
                      </div>

                      {/* Source reference */}
                      {version.source_text_reference && (
                        <div className="flex items-start gap-2 p-2 bg-muted/50 rounded-md text-xs">
                          <FileText className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">
                            <span className="font-medium">Source:</span> {version.source_text_reference}
                          </span>
                        </div>
                      )}

                      {/* Raison de modification */}
                      {version.raison_modification && (
                        <div className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded-md text-xs border border-blue-200 dark:border-blue-800">
                          <AlertCircle className="h-3 w-3 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                          <span className="text-blue-900 dark:text-blue-100">
                            <span className="font-medium">Raison:</span> {version.raison_modification}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <Collapsible open={isExpanded}>
                    <CollapsibleContent>
                      <CardContent className="pt-0 space-y-4">
                        <Separator />

                        {/* Tags */}
                        {version.tags && version.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {version.tags.map((tag, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Content display toggle */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant={showDiff ? "outline" : "default"}
                            size="sm"
                            onClick={() => setShowDiffFor(null)}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Contenu
                          </Button>
                          {previousVersion && (
                            <Button
                              variant={showDiff ? "default" : "outline"}
                              size="sm"
                              onClick={() => toggleDiff(version.id)}
                            >
                              <GitCompare className="h-4 w-4 mr-2" />
                              Comparer avec V{previousVersion.version_numero}
                            </Button>
                          )}
                        </div>

                        {/* Content or Diff */}
                        {showDiff && previousVersion ? (
                          <div className="border rounded-md overflow-hidden">
                            <ReactDiffViewer
                              oldValue={stripHtml(previousVersion.contenu)}
                              newValue={stripHtml(version.contenu)}
                              splitView={true}
                              leftTitle={`Version ${previousVersion.version_numero}`}
                              rightTitle={`Version ${version.version_numero}`}
                              styles={{
                                variables: {
                                  light: {
                                    diffViewerBackground: '#fafafa',
                                    addedBackground: '#e6ffed',
                                    addedColor: '#24292e',
                                    removedBackground: '#ffeef0',
                                    removedColor: '#24292e',
                                  },
                                },
                              }}
                            />
                          </div>
                        ) : (
                          <div className="bg-muted/30 rounded-lg p-4 border">
                            <div
                              className="prose prose-sm max-w-none dark:prose-invert"
                              dangerouslySetInnerHTML={{ __html: sanitizeHtml(version.contenu) }}
                            />
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-2">
                          {onRestore && !isActive && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onRestore(version)}
                            >
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Restaurer cette version
                            </Button>
                          )}
                          {onCompare && previousVersion && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onCompare(previousVersion, version)}
                            >
                              <GitCompare className="h-4 w-4 mr-2" />
                              Comparer en détail
                            </Button>
                          )}
                          {onDelete && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Supprimer{isActive ? " (version actuelle)" : ""}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Êtes-vous sûr de vouloir supprimer la <strong>version {version.version_numero}</strong> ?
                                    {isActive && (
                                      <div className="mt-3 p-3 bg-warning/10 border border-warning/30 rounded-md">
                                        <p className="text-sm font-medium text-warning">
                                          ⚠️ Cette version est actuellement en vigueur.
                                        </p>
                                        <p className="text-sm mt-1">
                                          La version précédente sera automatiquement réactivée si elle existe.
                                        </p>
                                      </div>
                                    )}
                                    <div className="mt-2">
                                      <span className="text-destructive font-medium">Cette action est irréversible.</span>
                                    </div>
                                    {version.version_label && (
                                      <div className="mt-2 text-sm">
                                        Label : {version.version_label}
                                      </div>
                                    )}
                                    {version.raison_modification && (
                                      <div className="mt-2 p-2 bg-muted rounded text-xs">
                                        <strong>Raison :</strong> {version.raison_modification}
                                      </div>
                                    )}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => onDelete(version)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Supprimer définitivement
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
