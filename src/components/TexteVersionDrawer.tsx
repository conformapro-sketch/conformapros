import { useQuery } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Clock, User, GitBranch } from "lucide-react";
import { changelogQueries } from "@/lib/actes-queries";
import { Skeleton } from "@/components/ui/skeleton";

interface TexteVersionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  acteId: string;
  currentVersion: number;
}

export function TexteVersionDrawer({ open, onOpenChange, acteId, currentVersion }: TexteVersionDrawerProps) {
  const { data: changelog, isLoading } = useQuery({
    queryKey: ["changelog", acteId],
    queryFn: () => changelogQueries.getByActeId(acteId),
    enabled: open,
  });

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "creation":
        return "Création";
      case "modification":
        return "Modification";
      case "abrogation":
        return "Abrogation";
      case "version_update":
        return "Nouvelle version";
      default:
        return type;
    }
  };

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case "creation":
        return "bg-success text-success-foreground";
      case "modification":
        return "bg-warning text-warning-foreground";
      case "abrogation":
        return "bg-destructive text-destructive-foreground";
      case "version_update":
        return "bg-primary text-primary-foreground";
      default:
        return "";
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Historique des versions
          </SheetTitle>
          <SheetDescription>
            Version actuelle: <Badge variant="outline">v{currentVersion}</Badge>
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-16 w-full" />
              </div>
            ))
          ) : !changelog || changelog.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <GitBranch className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Aucun historique disponible</p>
            </div>
          ) : (
            <div className="space-y-4">
              {changelog.map((entry, index) => (
                <div key={entry.id}>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      {index < changelog.length - 1 && (
                        <div className="ml-[3px] h-full w-0.5 bg-border mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-8">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getTypeBadgeClass(entry.type_changement)}>
                          {getTypeLabel(entry.type_changement)}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(entry.date_changement).toLocaleDateString("fr-FR", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </div>

                      {entry.description && (
                        <p className="text-sm text-foreground mb-2">{entry.description}</p>
                      )}

                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <User className="h-3 w-3" />
                        {new Date(entry.created_at).toLocaleDateString("fr-FR")} à {new Date(entry.created_at).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
