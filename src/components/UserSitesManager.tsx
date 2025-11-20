import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { userSitesQueries } from "@/lib/user-sites-queries";
import { Loader2, Building2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface UserSitesManagerProps {
  userId: string;
  userEmail: string;
  clientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserSitesManager({
  userId,
  userEmail,
  clientId,
  open,
  onOpenChange,
}: UserSitesManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSites, setSelectedSites] = useState<string[]>([]);

  // Fetch available sites for the client
  const { data: availableSites, isLoading: loadingSites } = useQuery({
    queryKey: ["client-sites", clientId],
    queryFn: () => userSitesQueries.getClientSites(clientId),
    enabled: open && !!clientId,
  });

  // Fetch user's current site assignments
  const { data: userSites, isLoading: loadingUserSites } = useQuery({
    queryKey: ["user-sites", userId],
    queryFn: () => userSitesQueries.getUserSites(userId),
    enabled: open && !!userId,
  });

  // Reset selected sites when user changes
  useEffect(() => {
    if (userSites && Array.isArray(userSites)) {
      const assigned = userSites.map((us: any) => us.site_id) || [];
      setSelectedSites(assigned);
    }
  }, [userSites, userId]);

  // Update user sites mutation
  const updateMutation = useMutation({
    mutationFn: (siteIds: string[]) =>
      userSitesQueries.updateUserSites(userId, siteIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-sites", userId] });
      queryClient.invalidateQueries({ queryKey: ["client-users"] });
      toast({
        title: "Sites mis à jour",
        description: "L'accès aux sites a été mis à jour avec succès.",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour les sites.",
        variant: "destructive",
      });
    },
  });

  const handleToggleSite = (siteId: string) => {
    setSelectedSites((prev) =>
      prev.includes(siteId)
        ? prev.filter((id) => id !== siteId)
        : [...prev, siteId]
    );
  };

  const handleSave = () => {
    updateMutation.mutate(selectedSites);
  };

  const isLoading = loadingSites || loadingUserSites;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Gérer l'accès aux sites
          </SheetTitle>
          <SheetDescription>
            Sélectionnez les sites auxquels <strong>{userEmail}</strong> peut accéder
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : availableSites && availableSites.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Aucun site disponible pour ce client.</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
                {availableSites?.map((site) => (
                  <div
                    key={site.id}
                    className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                  >
                    <Checkbox
                      id={site.id}
                      checked={selectedSites.includes(site.id)}
                      onCheckedChange={() => handleToggleSite(site.id)}
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={site.id}
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        {site.nom}
                      </Label>
                      {site.code_site && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Code: {site.code_site}
                        </p>
                      )}
                    </div>
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
