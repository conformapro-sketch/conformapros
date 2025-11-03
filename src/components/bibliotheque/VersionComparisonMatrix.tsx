import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  User,
  Calendar,
  FileText,
  CheckCircle2
} from "lucide-react";

interface Version {
  id: string;
  version_numero: number;
  version_label: string;
  date_version: string;
  modification_type?: string;
  contenu: string;
  is_active?: boolean;
  valide_par?: {
    nom?: string;
    prenom?: string;
  };
  impact_estime?: "low" | "medium" | "high";
}

interface VersionComparisonMatrixProps {
  versions: Version[];
  currentVersion?: Version;
}

const getImpactIcon = (impact?: string) => {
  switch (impact) {
    case "high":
      return <TrendingUp className="h-3 w-3 text-destructive inline" />;
    case "medium":
      return <Minus className="h-3 w-3 text-warning inline" />;
    case "low":
      return <TrendingDown className="h-3 w-3 text-success inline" />;
    default:
      return null;
  }
};

const getModificationTypeLabel = (type?: string) => {
  const labels: Record<string, string> = {
    modifie: "Modification",
    abroge: "Abrogation",
    remplace: "Remplacement",
    renumerote: "Renumérotation",
    complete: "Complément",
    ajoute: "Ajout"
  };
  return labels[type || ""] || type || "N/A";
};

export function VersionComparisonMatrix({ 
  versions, 
  currentVersion 
}: VersionComparisonMatrixProps) {
  // Take last 3 versions plus current
  const displayVersions = [...versions].slice(0, 2);
  if (currentVersion && !displayVersions.find(v => v.id === currentVersion.id)) {
    displayVersions.push(currentVersion);
  }

  const calculateStats = (content: string) => {
    const plainText = content.replace(/<[^>]*>/g, '');
    return {
      length: plainText.length,
      words: plainText.split(/\s+/).filter(w => w.length > 0).length,
      paragraphs: content.split(/<\/p>/gi).length - 1
    };
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Comparaison des versions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">Critère</TableHead>
                {displayVersions.map((version) => (
                  <TableHead key={version.id} className="text-center">
                    <div className="space-y-1">
                      <div className="font-semibold">
                        v{version.version_numero}
                      </div>
                      <div className="text-xs text-muted-foreground font-normal">
                        {format(new Date(version.date_version), 'MMM yyyy', { locale: fr })}
                      </div>
                    </div>
                  </TableHead>
                ))}
                {currentVersion && (
                  <TableHead className="text-center bg-primary/5">
                    <div className="space-y-1">
                      <div className="font-semibold flex items-center justify-center gap-1">
                        Actuelle
                        <CheckCircle2 className="h-3 w-3 text-primary" />
                      </div>
                      <div className="text-xs text-muted-foreground font-normal">
                        {format(new Date(currentVersion.date_version), 'MMM yyyy', { locale: fr })}
                      </div>
                    </div>
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Longueur */}
              <TableRow>
                <TableCell className="font-medium">Longueur</TableCell>
                {displayVersions.map((version) => {
                  const stats = calculateStats(version.contenu);
                  return (
                    <TableCell key={version.id} className="text-center">
                      {stats.length} car.
                    </TableCell>
                  );
                })}
                {currentVersion && (
                  <TableCell className="text-center bg-primary/5">
                    {calculateStats(currentVersion.contenu).length} car.
                  </TableCell>
                )}
              </TableRow>

              {/* Mots */}
              <TableRow>
                <TableCell className="font-medium">Nombre de mots</TableCell>
                {displayVersions.map((version) => {
                  const stats = calculateStats(version.contenu);
                  return (
                    <TableCell key={version.id} className="text-center">
                      {stats.words}
                    </TableCell>
                  );
                })}
                {currentVersion && (
                  <TableCell className="text-center bg-primary/5">
                    {calculateStats(currentVersion.contenu).words}
                  </TableCell>
                )}
              </TableRow>

              {/* Type modification */}
              <TableRow>
                <TableCell className="font-medium">Type</TableCell>
                {displayVersions.map((version) => (
                  <TableCell key={version.id} className="text-center">
                    <div className="inline-block text-xs">
                      {getModificationTypeLabel(version.modification_type)}
                    </div>
                  </TableCell>
                ))}
                {currentVersion && (
                  <TableCell className="text-center bg-primary/5">
                    <div className="inline-block text-xs">
                      {getModificationTypeLabel(currentVersion.modification_type)}
                    </div>
                  </TableCell>
                )}
              </TableRow>

              {/* Impact */}
              <TableRow>
                <TableCell className="font-medium">Impact</TableCell>
                {displayVersions.map((version) => (
                  <TableCell key={version.id} className="text-center">
                    <div className="inline-flex items-center gap-1">
                      {getImpactIcon(version.impact_estime)}
                      <span className="text-xs capitalize">
                        {version.impact_estime || "N/A"}
                      </span>
                    </div>
                  </TableCell>
                ))}
                {currentVersion && (
                  <TableCell className="text-center bg-primary/5">
                    <div className="inline-flex items-center gap-1">
                      {getImpactIcon(currentVersion.impact_estime)}
                      <span className="text-xs capitalize">
                        {currentVersion.impact_estime || "N/A"}
                      </span>
                    </div>
                  </TableCell>
                )}
              </TableRow>

              {/* Validé par */}
              <TableRow>
                <TableCell className="font-medium">Validé par</TableCell>
                {displayVersions.map((version) => (
                  <TableCell key={version.id} className="text-center">
                    {version.valide_par ? (
                      <div className="text-xs">
                        {version.valide_par.prenom?.[0]}. {version.valide_par.nom}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">System</span>
                    )}
                  </TableCell>
                ))}
                {currentVersion && (
                  <TableCell className="text-center bg-primary/5">
                    {currentVersion.valide_par ? (
                      <div className="text-xs">
                        {currentVersion.valide_par.prenom?.[0]}. {currentVersion.valide_par.nom}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">System</span>
                    )}
                  </TableCell>
                )}
              </TableRow>

              {/* Statut */}
              <TableRow>
                <TableCell className="font-medium">Statut</TableCell>
                {displayVersions.map((version) => (
                  <TableCell key={version.id} className="text-center">
                    <Badge 
                      variant={version.is_active ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {version.is_active ? "Active" : "Archivée"}
                    </Badge>
                  </TableCell>
                ))}
                {currentVersion && (
                  <TableCell className="text-center bg-primary/5">
                    <Badge variant="default" className="text-xs">
                      Active
                    </Badge>
                  </TableCell>
                )}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}