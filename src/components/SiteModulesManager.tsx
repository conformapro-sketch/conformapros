import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { siteModulesQueries } from "@/lib/site-modules-queries";
import { Loader2, Package, CheckCircle2, Circle } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

interface SiteModulesManagerProps {
  siteId: string;
  siteName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SiteModulesManager({
  siteId,
  siteName,
  open,
  onOpenChange,
}: SiteModulesManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedModules, setSelectedModules] = useState<string[]>([]);

  // Fetch all available modules
  const { data: allModules, isLoading: loadingModules } = useQuery({
    queryKey: ["modules", "available"],
    queryFn: siteModulesQueries.getAllAvailableModules,
  });

  // Fetch current site modules
  const { data: siteModules, isLoading: loadingSiteModules } = useQuery({
    queryKey: ["site-modules", siteId],
    queryFn: () => siteModulesQueries.getAllModulesForSite(siteId),
    enabled: open && !!siteId,
  });

  // Set initial selected modules when data loads
  useEffect(() => {
    if (siteModules) {
      const enabled = siteModules
        ?.filter((sm: any) => sm.actif)
        .map((sm: any) => sm.module_id) || [];
      setSelectedModules(enabled);
    }
  }, [siteModules]);

  // Update site modules mutation
  const updateMutation = useMutation({
    mutationFn: (moduleIds: string[]) =>
      siteModulesQueries.updateSiteModules(siteId, moduleIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-modules", siteId] });
      queryClient.invalidateQueries({ queryKey: ["sites"] });
      toast({
        title: "Modules mis à jour",
        description: "Les modules du site ont été mis à jour avec succès.",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour les modules.",
        variant: "destructive",
      });
    },
  });

  const handleToggleModule = (moduleId: string) => {
    setSelectedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const handleSave = () => {
    updateMutation.mutate(selectedModules);
  };

  const handleSelectAll = () => {
    if (allModules) {
      setSelectedModules(allModules.map((m) => m.id));
    }
  };

  const handleDeselectAll = () => {
    setSelectedModules([]);
  };

  const isLoading = loadingModules || loadingSiteModules;
  const totalModules = allModules?.length || 0;
  const selectedCount = selectedModules.length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Gérer les modules
          </SheetTitle>
          <SheetDescription>
            Sélectionnez les modules métier à activer pour <strong>{siteName}</strong>
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : totalModules === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Package className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                Aucun module métier disponible
              </p>
            </div>
          ) : (
            <>
              {/* Header with counters and actions */}
              <div className="flex items-center justify-between pb-3 border-b">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-normal">
                    {selectedCount} / {totalModules} sélectionné{selectedCount > 1 ? 's' : ''}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAll}
                    disabled={selectedCount === totalModules}
                  >
                    Tout sélectionner
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleDeselectAll}
                    disabled={selectedCount === 0}
                  >
                    Tout désélectionner
                  </Button>
                </div>
              </div>

              <div className="space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto pr-2">
                {allModules?.map((module) => {
                  const isSelected = selectedModules.includes(module.id);
                  return (
                    <div
                      key={module.id}
                      className={`flex items-start space-x-3 p-3 rounded-lg border transition-all ${
                        isSelected
                          ? "bg-primary/10 border-primary/50"
                          : "hover:bg-accent/30 border-border"
                      }`}
                    >
                      <Checkbox
                        id={module.id}
                        checked={isSelected}
                        onCheckedChange={() => handleToggleModule(module.id)}
                      />
                      <div className="flex-1 space-y-1">
                        <Label
                          htmlFor={module.id}
                          className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2"
                        >
                          {module.libelle || module.nom}
                          {isSelected && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                          )}
                        </Label>
                        {module.description && (
                          <p className="text-xs text-muted-foreground">
                            {module.description}
                          </p>
                        )}
                      </div>
                      {module.icon && (
                        <span className="text-xl opacity-70">{module.icon}</span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={updateMutation.isPending}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Enregistrer
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
