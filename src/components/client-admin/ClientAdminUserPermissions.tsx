import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PermissionMatrixV2 } from "@/components/permissions/PermissionMatrixV2";
import { Shield } from "lucide-react";

interface ClientAdminUserPermissionsProps {
  user: any;
  clientId: string;
  onUpdate: () => void;
}

export function ClientAdminUserPermissions({
  user,
  clientId,
  onUpdate,
}: ClientAdminUserPermissionsProps) {
  const [selectedSiteId, setSelectedSiteId] = useState<string>(
    user.sites?.[0]?.site?.id || ""
  );

  const userSites = user.sites || [];

  if (userSites.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Permissions</CardTitle>
          <CardDescription>No sites assigned to this user yet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Please assign at least one site to configure permissions.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Site-Specific Permissions</CardTitle>
        <CardDescription>
          Configure what this user can do on each site
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Site Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Site</label>
          <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a site" />
            </SelectTrigger>
            <SelectContent>
              {userSites.map((us: any) => (
                <SelectItem key={us.site.id} value={us.site.id}>
                  {us.site.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Permission Matrix */}
        {selectedSiteId && (
          <PermissionMatrixV2
            userId={user.id}
            clientId={clientId}
            siteId={selectedSiteId}
            onUpdate={onUpdate}
          />
        )}
      </CardContent>
    </Card>
  );
}
