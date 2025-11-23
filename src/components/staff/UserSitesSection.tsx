import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Building2, MapPin } from "lucide-react";

interface UserSitesSectionProps {
  user: any;
  onUpdate: () => void;
}

export function UserSitesSection({ user, onUpdate }: UserSitesSectionProps) {
  const [selectedSites, setSelectedSites] = useState<string[]>(
    user.sites?.map((s: any) => s.site.id) || []
  );

  const { data: availableSites } = useQuery({
    queryKey: ["client-sites", user.client_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sites")
        .select("*")
        .eq("client_id", user.client_id)
        .order("nom");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (siteIds: string[]) => {
      const { data, error } = await supabase.functions.invoke('staff-user-management', {
        body: {
          action: 'assign_sites',
          userId: user.id,
          siteIds,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Sites updated successfully");
      onUpdate();
    },
    onError: (error: any) => {
      toast.error(`Failed to update sites: ${error.message}`);
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
    saveMutation.mutate(selectedSites);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Site Access</CardTitle>
        <CardDescription>
          Select which sites this user can access
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {availableSites?.map((site) => (
            <div
              key={site.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <Checkbox
                  checked={selectedSites.includes(site.id)}
                  onCheckedChange={() => handleToggleSite(site.id)}
                />
                <div className="flex-1">
                  <div className="font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    {site.nom}
                  </div>
                  {site.code_site && (
                    <div className="text-sm text-muted-foreground">
                      Code: {site.code_site}
                    </div>
                  )}
                  {(site.gouvernorat || site.delegation) && (
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {[site.gouvernorat, site.delegation].filter(Boolean).join(", ")}
                    </div>
                  )}
                </div>
              </div>
              {selectedSites.includes(site.id) && (
                <Badge variant="default">Selected</Badge>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {selectedSites.length} of {availableSites?.length || 0} sites selected
          </div>
          <Button onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
