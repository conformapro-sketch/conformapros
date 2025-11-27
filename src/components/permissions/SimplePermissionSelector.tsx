import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Ban, Eye, Unlock } from "lucide-react";

export type AccessLevel = "none" | "read" | "full";

interface Permission {
  module: string;
  action: string;
  decision: "allow" | "deny" | "inherit";
  scope?: "global" | "tenant" | "site";
}

interface ModulePermission {
  moduleCode: string;
  moduleName: string;
  accessLevel: AccessLevel;
}

interface SimplePermissionSelectorProps {
  modules: Array<{ code: string; libelle: string }>;
  permissions: Permission[];
  onPermissionsChange: (permissions: Permission[]) => void;
  disabled?: boolean;
}

// Helper to calculate access level from granular permissions
function calculateAccessLevel(
  moduleCode: string,
  permissions: Permission[]
): AccessLevel {
  const modulePerms = permissions.filter(
    (p) => p.module.toLowerCase() === moduleCode.toLowerCase()
  );

  if (modulePerms.length === 0) return "none";

  const hasView = modulePerms.some(
    (p) => p.action === "view" && p.decision === "allow"
  );
  const hasCreate = modulePerms.some(
    (p) => p.action === "create" && p.decision === "allow"
  );
  const hasEdit = modulePerms.some(
    (p) => p.action === "edit" && p.decision === "allow"
  );
  const hasDelete = modulePerms.some(
    (p) => p.action === "delete" && p.decision === "allow"
  );

  if (!hasView) return "none";
  if (hasCreate || hasEdit || hasDelete) return "full";
  return "read";
}

// Helper to convert access level to granular permissions
function accessLevelToPermissions(
  moduleCode: string,
  level: AccessLevel
): Permission[] {
  const scope = "site" as const;

  if (level === "none") {
    return [];
  }

  if (level === "read") {
    return [
      { module: moduleCode, action: "view", decision: "allow", scope },
      { module: moduleCode, action: "export", decision: "allow", scope },
    ];
  }

  if (level === "full") {
    return [
      { module: moduleCode, action: "view", decision: "allow", scope },
      { module: moduleCode, action: "create", decision: "allow", scope },
      { module: moduleCode, action: "edit", decision: "allow", scope },
      { module: moduleCode, action: "delete", decision: "allow", scope },
      { module: moduleCode, action: "export", decision: "allow", scope },
      { module: moduleCode, action: "assign", decision: "allow", scope },
      { module: moduleCode, action: "bulk_edit", decision: "allow", scope },
      { module: moduleCode, action: "upload_proof", decision: "allow", scope },
    ];
  }

  return [];
}

export function SimplePermissionSelector({
  modules,
  permissions,
  onPermissionsChange,
  disabled = false,
}: SimplePermissionSelectorProps) {
  const handleAccessLevelChange = (moduleCode: string, level: AccessLevel) => {
    // Remove all permissions for this module
    const otherPerms = permissions.filter(
      (p) => p.module.toLowerCase() !== moduleCode.toLowerCase()
    );

    // Add new permissions based on access level
    const newPerms = accessLevelToPermissions(moduleCode, level);

    onPermissionsChange([...otherPerms, ...newPerms]);
  };

  const handlePreset = (preset: "none" | "read" | "full") => {
    const newPerms: Permission[] = [];

    modules.forEach((module) => {
      const levelPerms = accessLevelToPermissions(module.code, preset);
      newPerms.push(...levelPerms);
    });

    onPermissionsChange(newPerms);
  };

  return (
    <div className="space-y-4">
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Actions rapides</CardTitle>
          <CardDescription className="text-xs">
            Appliquer un niveau d'accès à tous les modules
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => handlePreset("read")}
            disabled={disabled}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            Tout en lecture seule
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => handlePreset("full")}
            disabled={disabled}
            className="flex items-center gap-2"
          >
            <Unlock className="h-4 w-4" />
            Tout en accès complet
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => handlePreset("none")}
            disabled={disabled}
            className="flex items-center gap-2"
          >
            <Ban className="h-4 w-4" />
            Réinitialiser tout
          </Button>
        </CardContent>
      </Card>

      {/* Module Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Permissions par module</CardTitle>
          <CardDescription>
            Sélectionnez le niveau d'accès pour chaque module
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {modules.map((module) => {
            const accessLevel = calculateAccessLevel(module.code, permissions);

            return (
              <div
                key={module.code}
                className="flex items-center justify-between border rounded-lg p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="font-mono text-xs">
                    {module.code}
                  </Badge>
                  <span className="font-medium">{module.libelle}</span>
                </div>

                <ToggleGroup
                  type="single"
                  value={accessLevel}
                  onValueChange={(value) => {
                    if (value) {
                      handleAccessLevelChange(
                        module.code,
                        value as AccessLevel
                      );
                    }
                  }}
                  disabled={disabled}
                  className="gap-1"
                >
                  <ToggleGroupItem
                    value="none"
                    className="data-[state=on]:bg-muted data-[state=on]:text-muted-foreground"
                  >
                    <Ban className="h-4 w-4 mr-1" />
                    Aucun accès
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="read"
                    className="data-[state=on]:bg-blue-500 data-[state=on]:text-white"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Lecture seule
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="full"
                    className="data-[state=on]:bg-green-600 data-[state=on]:text-white"
                  >
                    <Unlock className="h-4 w-4 mr-1" />
                    Accès complet
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
