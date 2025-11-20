import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { siteModulesQueries } from "@/lib/site-modules-queries";
import { Loader2, Package } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

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

  const isLoading = loadingModules || loadingSiteModules;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Gérer les modules
          </SheetTitle>
          <SheetDescription>
            Sélectionnez les modules à activer pour <strong>{siteName}</strong>
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
                {allModules?.map((module) => (
                  <div
                    key={module.id}
                    className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                  >
                    <Checkbox
                      id={module.id}
                      checked={selectedModules.includes(module.id)}
                      onCheckedChange={() => handleToggleModule(module.id)}
                    />
                    <div className="flex-1 space-y-1">
                      <Label
                        htmlFor={module.id}
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        {module.libelle || module.nom}
                      </Label>
                      {module.description && (
                        <p className="text-xs text-muted-foreground">
                          {module.description}
                        </p>
                      )}
                    </div>
                    {module.icon && (
                      <span className="text-2xl">{module.icon}</span>
                    )}
                  </div>
                ))}
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
