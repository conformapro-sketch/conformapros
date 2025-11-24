import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { siteModulesQueries } from "@/lib/site-modules-queries";
import { supabaseAny as supabase } from "@/lib/supabase-any";
import { Loader2, Package, CheckCircle2, AlertTriangle, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface SiteModulesQuickConfigProps {
  siteId: string;
  siteName: string;
  onModulesEnabled?: () => void;
}

export function SiteModulesQuickConfig({ siteId, siteName, onModulesEnabled }: SiteModulesQuickConfigProps) {
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
    enabled: !!siteId,
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

  // Quick enable modules mutation
  const enableMutation = useMutation({
    mutationFn: async (moduleIds: string[]) => {
      // Get module codes from IDs
      const moduleCodes = allModules
        ?.filter(m => moduleIds.includes(m.id))
        .map(m => m.code) || [];

      const { data, error } = await supabase.rpc("quick_enable_site_modules", {
        p_site_id: siteId,
        p_module_codes: moduleCodes,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-modules", siteId] });
      queryClient.invalidateQueries({ queryKey: ["site-enabled-modules", siteId] });
      queryClient.invalidateQueries({ queryKey: ["sites"] });
      toast({
        title: "Modules activés",
        description: "Les modules ont été activés avec succès. Vous pouvez maintenant configurer les permissions.",
      });
      onModulesEnabled?.();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'activer les modules.",
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

  const handleQuickEnable = () => {
    if (selectedModules.length === 0) {
      toast({
        title: "Aucun module sélectionné",
        description: "Veuillez sélectionner au moins un module à activer.",
        variant: "destructive",
      });
      return;
    }
    enableMutation.mutate(selectedModules);
  };

  const isLoading = loadingModules || loadingSiteModules;
  const selectedCount = selectedModules.length;
  const enabledCount = siteModules?.filter((sm: any) => sm.actif)?.length || 0;

  return (
    <Card className="border-l-4 border-l-orange-500">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Configuration des modules requise
            </CardTitle>
            <CardDescription>
              Le site <strong>{siteName}</strong> n'a aucun module activé. Activez des modules pour pouvoir configurer les permissions.
            </CardDescription>
          </div>
          <Badge variant="outline" className="shrink-0">
            {enabledCount} activé{enabledCount > 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {allModules?.map((module) => {
                const isSelected = selectedModules.includes(module.id);
                return (
                  <div
                    key={module.id}
                    className={cn(
                      "flex items-start space-x-3 p-3 rounded-lg border transition-all cursor-pointer",
                      isSelected
                        ? "bg-primary/10 border-primary/50"
                        : "hover:bg-accent/30 border-border"
                    )}
                    onClick={() => handleToggleModule(module.id)}
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
                        {module.icon && <span className="text-lg">{module.icon}</span>}
                        {module.libelle || module.nom}
                        {isSelected && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                        )}
                      </Label>
                      {module.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {module.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {selectedCount} module{selectedCount > 1 ? 's' : ''} sélectionné{selectedCount > 1 ? 's' : ''}
              </p>
              <Button
                onClick={handleQuickEnable}
                disabled={enableMutation.isPending || selectedCount === 0}
                className="gap-2"
              >
                {enableMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Activation...
                  </>
                ) : (
                  <>
                    <Settings className="h-4 w-4" />
                    Activer {selectedCount > 0 ? `${selectedCount} module${selectedCount > 1 ? 's' : ''}` : 'les modules'}
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
