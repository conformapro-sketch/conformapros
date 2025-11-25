import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { 
  ChevronDown, 
  ChevronRight, 
  FileText,
  Calendar,
  Hash,
  Trash2,
  GitCompare
} from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import ReactDiffViewer from "react-diff-viewer-continued";
import { sanitizeHtml, stripHtml } from "@/lib/sanitize-html";

interface Version {
  id: string;
  numero_version: number;
  date_effet: string;
  contenu: string;
  statut: "en_vigueur" | "abrogee" | "remplacee";
  source_texte_id?: string;
  notes_modifications?: string;
  created_at: string;
  created_by?: string;
}

interface ArticleVersionsTimelineProps {
  versions: Version[];
  onCompare?: (v1: Version, v2: Version) => void;
  onRestore?: (version: Version) => void;
  onDelete?: (versionId: string) => void;
}

function getStatutBadgeVariant(statut: Version["statut"]): "default" | "secondary" | "destructive" {
  switch (statut) {
    case "en_vigueur":
      return "default";
    case "remplacee":
      return "secondary";
    case "abrogee":
      return "destructive";
    default:
      return "secondary";
  }
}

function getStatutLabel(statut: Version["statut"]): string {
  switch (statut) {
    case "en_vigueur":
      return "En vigueur";
    case "remplacee":
      return "Remplacée";
    case "abrogee":
      return "Abrogée";
    default:
      return statut;
  }
}

function calculateChangeStats(oldContent: string, newContent: string): { diff: number; percentChange: number } {
  const oldLength = oldContent.length;
  const newLength = newContent.length;
  const diff = newLength - oldLength;
  const percentChange = oldLength > 0 ? Math.round((diff / oldLength) * 100) : 0;
  return { diff, percentChange };
}

export function ArticleVersionsTimeline({ 
  versions, 
  onCompare, 
  onRestore, 
  onDelete 
}: ArticleVersionsTimelineProps) {
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set());
  const [diffMode, setDiffMode] = useState<Map<string, boolean>>(new Map());

  if (!versions || versions.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Aucune version disponible pour cet article.
          </p>
        </CardContent>
      </Card>
    );
  }

  const sortedVersions = [...versions].sort((a, b) => b.numero_version - a.numero_version);

  const toggleExpanded = (versionId: string) => {
    setExpandedVersions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(versionId)) {
        newSet.delete(versionId);
      } else {
        newSet.add(versionId);
      }
      return newSet;
    });
  };

  const toggleDiffMode = (versionId: string) => {
    setDiffMode(prev => {
      const newMap = new Map(prev);
      newMap.set(versionId, !newMap.get(versionId));
      return newMap;
    });
  };

  return (
    <div className="space-y-4">
      {sortedVersions.map((version, index) => {
        const isExpanded = expandedVersions.has(version.id);
        const isDiffMode = diffMode.get(version.id) || false;
        const previousVersion = sortedVersions[index + 1];
        const changeStats = previousVersion 
          ? calculateChangeStats(previousVersion.contenu, version.contenu)
          : null;

        return (
          <Card key={version.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpanded(version.id)}
                    className="h-8 w-8 p-0"
                  >
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                  
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-lg">
                      Version {version.numero_version}
                    </CardTitle>
                  </div>

                  <Badge variant={getStatutBadgeVariant(version.statut)}>
                    {getStatutLabel(version.statut)}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  {previousVersion && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleDiffMode(version.id)}
                    >
                      <GitCompare className="h-4 w-4 mr-2" />
                      {isDiffMode ? "Afficher contenu" : "Comparer"}
                    </Button>
                  )}
                  
                  {onDelete && version.statut !== "en_vigueur" && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer la version</AlertDialogTitle>
                          <AlertDialogDescription>
                            Êtes-vous sûr de vouloir supprimer la <strong>version {version.numero_version}</strong> ?
                            Cette action est irréversible.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDelete(version.id)} className="bg-destructive text-destructive-foreground">
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>

              {/* Version Info */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Date d'effet: {format(new Date(version.date_effet), "dd MMMM yyyy", { locale: fr })}
                </div>
                {changeStats && (
                  <div className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {changeStats.diff > 0 ? "+" : ""}{changeStats.diff} caractères
                    {changeStats.percentChange !== 0 && ` (${changeStats.percentChange > 0 ? "+" : ""}${changeStats.percentChange}%)`}
                  </div>
                )}
              </div>

              {version.notes_modifications && (
                <div className="mt-2 text-sm text-muted-foreground">
                  <strong>Notes:</strong> {version.notes_modifications}
                </div>
              )}
            </CardHeader>

            <Collapsible open={isExpanded}>
              <CollapsibleContent>
                <Separator />
                <CardContent className="pt-4">
                  {isDiffMode && previousVersion ? (
                    <div className="border rounded-md overflow-hidden">
                      <ReactDiffViewer
                        oldValue={stripHtml(previousVersion.contenu)}
                        newValue={stripHtml(version.contenu)}
                        splitView={true}
                        leftTitle={`Version ${previousVersion.numero_version}`}
                        rightTitle={`Version ${version.numero_version}`}
                        showDiffOnly={false}
                      />
                    </div>
                  ) : (
                    <div 
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(version.contenu) }}
                    />
                  )}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        );
      })}
    </div>
  );
}
