import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  ArrowRight,
  Calendar,
  FileText,
  Download,
  GitCompare,
  Eye,
  EyeOff
} from "lucide-react";
import { format } from "date-fns";
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
  effective_from?: string;
  effective_to?: string;
}

interface VersionBeforeAfterViewProps {
  versionBefore: Version;
  versionAfter: Version;
  onExport?: () => void;
}

export function VersionBeforeAfterView({
  versionBefore,
  versionAfter,
  onExport,
}: VersionBeforeAfterViewProps) {
  const [showOnlyChanges, setShowOnlyChanges] = useState(false);
  const [viewMode, setViewMode] = useState<"split" | "unified">("split");

  const beforeText = stripHtml(versionBefore.contenu);
  const afterText = stripHtml(versionAfter.contenu);

  // Calculate change statistics
  const calculateStats = () => {
    const beforeLength = beforeText.length;
    const afterLength = afterText.length;
    const diff = afterLength - beforeLength;
    const percentChange = beforeLength > 0 ? Math.round((diff / beforeLength) * 100) : 0;

    // Simple word count for additions/deletions
    const beforeWords = beforeText.split(/\s+/).length;
    const afterWords = afterText.split(/\s+/).length;
    const wordDiff = afterWords - beforeWords;

    return {
      charDiff: diff,
      percentChange,
      wordDiff,
      beforeLength,
      afterLength,
      beforeWords,
      afterWords,
    };
  };

  const stats = calculateStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <GitCompare className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Comparaison de versions</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Visualisation détaillée des modifications entre deux versions
          </p>
        </div>
        {onExport && (
          <Button variant="outline" onClick={onExport}>
            <Download className="h-4 w-4 mr-2" />
            Exporter PDF
          </Button>
        )}
      </div>

      {/* Version headers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Version Before */}
        <Card className="shadow-soft border-l-4 border-l-destructive/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
                Avant
              </Badge>
              <Badge variant="secondary">V{versionBefore.version_numero}</Badge>
            </div>
            <CardTitle className="text-base mt-2">
              {versionBefore.version_label || `Version ${versionBefore.version_numero}`}
            </CardTitle>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
              <Calendar className="h-3 w-3" />
              <span>{format(new Date(versionBefore.date_version), "dd MMMM yyyy", { locale: fr })}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              {stats.beforeWords} mots • {stats.beforeLength} caractères
            </div>
          </CardHeader>
        </Card>

        {/* Version After */}
        <Card className="shadow-soft border-l-4 border-l-success/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                Après
              </Badge>
              <Badge variant="secondary">V{versionAfter.version_numero}</Badge>
            </div>
            <CardTitle className="text-base mt-2">
              {versionAfter.version_label || `Version ${versionAfter.version_numero}`}
            </CardTitle>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
              <Calendar className="h-3 w-3" />
              <span>{format(new Date(versionAfter.date_version), "dd MMMM yyyy", { locale: fr })}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              {stats.afterWords} mots • {stats.afterLength} caractères
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Statistics */}
      <Card className="shadow-soft bg-muted/30">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {stats.wordDiff > 0 ? '+' : ''}{stats.wordDiff}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Mots modifiés</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {stats.charDiff > 0 ? '+' : ''}{stats.charDiff}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Caractères</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {stats.percentChange > 0 ? '+' : ''}{stats.percentChange}%
              </div>
              <div className="text-xs text-muted-foreground mt-1">Variation</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {Math.abs(stats.charDiff)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Total changements</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <Card className="shadow-soft">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-changes"
                  checked={showOnlyChanges}
                  onCheckedChange={setShowOnlyChanges}
                />
                <Label htmlFor="show-changes" className="text-sm cursor-pointer">
                  {showOnlyChanges ? (
                    <span className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Uniquement les modifications
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <EyeOff className="h-4 w-4" />
                      Contenu complet
                    </span>
                  )}
                </Label>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "split" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("split")}
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Côte à côte
              </Button>
              <Button
                variant={viewMode === "unified" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("unified")}
              >
                <FileText className="h-4 w-4 mr-2" />
                Unifié
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Diff Viewer */}
      <Card className="shadow-soft overflow-hidden">
        <CardContent className="p-0">
          <ReactDiffViewer
            oldValue={beforeText}
            newValue={afterText}
            splitView={viewMode === "split"}
            hideLineNumbers={false}
            showDiffOnly={showOnlyChanges}
            leftTitle={`Version ${versionBefore.version_numero} (Avant)`}
            rightTitle={`Version ${versionAfter.version_numero} (Après)`}
            styles={{
              variables: {
                light: {
                  diffViewerBackground: '#ffffff',
                  diffViewerColor: '#212529',
                  addedBackground: '#e6ffed',
                  addedColor: '#24292e',
                  removedBackground: '#ffeef0',
                  removedColor: '#24292e',
                  wordAddedBackground: '#acf2bd',
                  wordRemovedBackground: '#fdb8c0',
                  addedGutterBackground: '#cdffd8',
                  removedGutterBackground: '#ffdce0',
                  gutterBackground: '#f7f7f7',
                  gutterBackgroundDark: '#f3f1f1',
                  highlightBackground: '#fffbdd',
                  highlightGutterBackground: '#fff5b1',
                },
                dark: {
                  diffViewerBackground: '#1a1a1a',
                  diffViewerColor: '#e1e1e1',
                  addedBackground: '#044B53',
                  addedColor: '#e1e1e1',
                  removedBackground: '#632F34',
                  removedColor: '#e1e1e1',
                  wordAddedBackground: '#055d67',
                  wordRemovedBackground: '#7d383f',
                  addedGutterBackground: '#034148',
                  removedGutterBackground: '#632b30',
                  gutterBackground: '#2c2c2c',
                  gutterBackgroundDark: '#262626',
                  highlightBackground: '#4a410d',
                  highlightGutterBackground: '#4d4a2f',
                },
              },
              line: {
                padding: '10px 2px',
                fontSize: '13px',
                lineHeight: '20px',
              },
              gutter: {
                minWidth: '50px',
              },
            }}
          />
        </CardContent>
      </Card>

      {/* Legend */}
      <Card className="shadow-soft bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 rounded"></div>
              <span className="text-muted-foreground">Ajouté</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded"></div>
              <span className="text-muted-foreground">Supprimé</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 rounded"></div>
              <span className="text-muted-foreground">Modifié</span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <span className="text-muted-foreground italic">
              Les modifications au niveau des mots sont surlignées pour une meilleure visibilité
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
