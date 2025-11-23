import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, X, Minus, Shield } from "lucide-react";

interface PermissionMatrixV2Props {
  userId: string;
  clientId: string;
  siteId: string;
  onUpdate: () => void;
}

interface Permission {
  module: string;
  action: string;
  decision: "allow" | "deny" | "inherit";
  scope: "global" | "tenant" | "site";
}

export function PermissionMatrixV2({
  userId,
  clientId,
  siteId,
  onUpdate,
}: PermissionMatrixV2Props) {
  const [permissions, setPermissions] = useState<Permission[]>([]);

  // Fetch enabled modules for site
  const { data: modules, isLoading: loadingModules } = useQuery({
    queryKey: ["site-modules", siteId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_site_enabled_modules", {
        _site_id: siteId,
      });
      if (error) throw error;
      return data;
    },
  });

  // Fetch current permissions
  const { data: currentPerms, isLoading: loadingPerms } = useQuery({
    queryKey: ["site-permissions", userId, siteId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_site_permissions", {
        p_user_id: userId,
        p_site_id: siteId,
      });
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (currentPerms) {
      setPermissions(currentPerms);
    }
  }, [currentPerms]);

  const saveMutation = useMutation({
    mutationFn: async (perms: Permission[]) => {
      console.log('💾 Calling save_site_permissions RPC:', {
        p_user_id: userId,
        p_site_id: siteId,
        p_client_id: clientId,
        p_permissions: perms,
        permissionCount: perms.length
      });

      const { data, error } = await supabase.rpc('save_site_permissions', {
        p_user_id: userId,
        p_site_id: siteId,
        p_client_id: clientId,
        p_permissions: perms as any,
      });

      if (error) {
        console.error('❌ Error saving permissions:', {
          error,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log('✅ Permissions saved successfully:', data);
      return data;
    },
    onSuccess: () => {
      toast.success("Permissions saved successfully");
      onUpdate();
    },
    onError: (error: any) => {
      console.error('❌ Save mutation error:', error);
      toast.error(`Failed to save permissions: ${error.message || error.details || 'Unknown error'}`);
    },
  });

  const actions = ["view", "create", "edit", "delete", "export"];

  const getPermission = (module: string, action: string): "allow" | "deny" | "inherit" => {
    const perm = permissions.find(
      (p) => p.module.toLowerCase() === module.toLowerCase() && p.action === action
    );
    return perm?.decision || "inherit";
  };

  const setPermission = (
    module: string,
    action: string,
    decision: "allow" | "deny" | "inherit"
  ) => {
    setPermissions((prev) => {
      const filtered = prev.filter(
        (p) => !(p.module.toLowerCase() === module.toLowerCase() && p.action === action)
      );
      if (decision !== "inherit") {
        return [
          ...filtered,
          { module, action, decision, scope: "site" as const },
        ];
      }
      return filtered;
    });
  };

  const getDecisionIcon = (decision: "allow" | "deny" | "inherit") => {
    switch (decision) {
      case "allow":
        return <Check className="h-4 w-4 text-green-600" />;
      case "deny":
        return <X className="h-4 w-4 text-red-600" />;
      case "inherit":
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getDecisionClass = (decision: "allow" | "deny" | "inherit") => {
    switch (decision) {
      case "allow":
        return "bg-green-50 hover:bg-green-100 border-green-200";
      case "deny":
        return "bg-red-50 hover:bg-red-100 border-red-200";
      case "inherit":
        return "bg-gray-50 hover:bg-gray-100 border-gray-200";
    }
  };

  const cyclePermission = (module: string, action: string) => {
    const current = getPermission(module, action);
    const next =
      current === "inherit" ? "allow" : current === "allow" ? "deny" : "inherit";
    setPermission(module, action, next);
  };

  const setAllForModule = (module: string, decision: "allow" | "deny" | "inherit") => {
    actions.forEach((action) => {
      setPermission(module, action, decision);
    });
  };

  const handleSave = () => {
    console.log('🔐 Saving permissions from PermissionMatrixV2:', {
      userId,
      siteId,
      clientId,
      permissions,
      permissionCount: permissions.length,
      nonInheritCount: permissions.filter(p => p.decision !== 'inherit').length,
      timestamp: new Date().toISOString()
    });
    saveMutation.mutate(permissions);
  };

  if (loadingModules || loadingPerms) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (!modules || modules.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No modules enabled for this site</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Permission Legend</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-600" />
            <span>Allow</span>
          </div>
          <div className="flex items-center gap-2">
            <X className="h-4 w-4 text-red-600" />
            <span>Deny</span>
          </div>
          <div className="flex items-center gap-2">
            <Minus className="h-4 w-4 text-gray-400" />
            <span>Inherit</span>
          </div>
        </CardContent>
      </Card>

      {/* Permission Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Module Permissions</CardTitle>
          <CardDescription>
            Click on a cell to cycle through Allow → Deny → Inherit
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {modules.map((module: any) => (
            <div key={module.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{module.code}</Badge>
                  <span className="font-medium">{module.libelle}</span>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setAllForModule(module.code, "allow")}
                  >
                    Allow All
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setAllForModule(module.code, "deny")}
                  >
                    Deny All
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setAllForModule(module.code, "inherit")}
                  >
                    Reset
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {actions.map((action) => {
                  const decision = getPermission(module.code, action);
                  return (
                    <button
                      key={action}
                      onClick={() => cyclePermission(module.code, action)}
                      className={`p-3 rounded border transition-colors ${getDecisionClass(
                        decision
                      )}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium capitalize">
                          {action}
                        </span>
                        {getDecisionIcon(decision)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "Saving..." : "Save Permissions"}
        </Button>
      </div>
    </div>
  );
}
