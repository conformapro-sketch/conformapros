import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PermissionMatrixV2 } from "@/components/permissions/PermissionMatrixV2";

interface UserPermissionsSectionProps {
  user: any;
  onUpdate: () => void;
}

export function UserPermissionsSection({ user, onUpdate }: UserPermissionsSectionProps) {
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
          <p className="text-sm text-muted-foreground">
            Please assign at least one site to configure permissions.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Site-Specific Permissions</CardTitle>
        <CardDescription>
          Configure permissions for each site individually
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
            clientId={user.client_id}
            siteId={selectedSiteId}
            onUpdate={onUpdate}
          />
        )}
      </CardContent>
    </Card>
  );
}
