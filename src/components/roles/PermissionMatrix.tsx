import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ChevronDown, ChevronRight } from "lucide-react";
import { MODULES, ACTIONS, MODULE_LABELS, ACTION_LABELS } from "@/types/roles";
import type { PermissionDecision, PermissionScope } from "@/types/roles";
import { cn } from "@/lib/utils";

interface Permission {
  module: string;
  action: string;
  decision: PermissionDecision;
}

interface PermissionMatrixProps {
  permissions: Permission[];
  scope: PermissionScope;
  onPermissionsChange: (permissions: Permission[]) => void;
  onScopeChange: (scope: PermissionScope) => void;
  roleType: 'team' | 'client';
}

export function PermissionMatrix({
  permissions,
  scope,
  onPermissionsChange,
  onScopeChange,
  roleType,
}: PermissionMatrixProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedModules, setCollapsedModules] = useState<Set<string>>(new Set());

  const filteredModules = useMemo(() => {
    return MODULES.filter(module =>
      MODULE_LABELS[module].toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const getPermission = (module: string, action: string): PermissionDecision => {
    const perm = permissions.find(p => p.module === module && p.action === action);
    return perm?.decision || 'inherit';
  };

  const setPermission = (module: string, action: string, decision: PermissionDecision) => {
    const newPermissions = permissions.filter(
      p => !(p.module === module && p.action === action)
    );

    if (decision !== 'inherit') {
      newPermissions.push({ module, action, decision });
    }

    onPermissionsChange(newPermissions);
  };

  const toggleModule = (module: string) => {
    const newCollapsed = new Set(collapsedModules);
    if (newCollapsed.has(module)) {
      newCollapsed.delete(module);
    } else {
      newCollapsed.add(module);
    }
    setCollapsedModules(newCollapsed);
  };

  const toggleModuleActions = (module: string, allow: boolean) => {
    const newPermissions = permissions.filter(p => p.module !== module);
    
    if (allow) {
      ACTIONS.forEach(action => {
        newPermissions.push({ module, action, decision: 'allow' });
      });
    }

    onPermissionsChange(newPermissions);
  };

  const applyPreset = (preset: 'all' | 'none' | 'read_only') => {
    if (preset === 'none') {
      onPermissionsChange([]);
      return;
    }

    if (preset === 'all') {
      const allPermissions: Permission[] = [];
      MODULES.forEach(module => {
        ACTIONS.forEach(action => {
          allPermissions.push({ module, action, decision: 'allow' });
        });
      });
      onPermissionsChange(allPermissions);
      return;
    }

    if (preset === 'read_only') {
      const readPermissions: Permission[] = [];
      MODULES.forEach(module => {
        readPermissions.push({ module, action: 'view', decision: 'allow' });
        readPermissions.push({ module, action: 'export', decision: 'allow' });
      });
      onPermissionsChange(readPermissions);
    }
  };

  const getDecisionColor = (decision: PermissionDecision) => {
    switch (decision) {
      case 'allow':
        return 'bg-success/10 text-success border-success/20';
      case 'deny':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'inherit':
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getDecisionLabel = (decision: PermissionDecision) => {
    switch (decision) {
      case 'allow':
        return 'Autorisé';
      case 'deny':
        return 'Interdit';
      case 'inherit':
      default:
        return 'Hérité';
    }
  };

  const cycleDecision = (current: PermissionDecision): PermissionDecision => {
    switch (current) {
      case 'inherit':
        return 'allow';
      case 'allow':
        return 'deny';
      case 'deny':
        return 'inherit';
      default:
        return 'inherit';
    }
  };

  return (
    <div className="space-y-4">
      {/* Scope Selector */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <Label>Portée par défaut:</Label>
          <Select value={scope} onValueChange={(v) => onScopeChange(v as PermissionScope)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roleType === 'team' && (
                <SelectItem value="global">Global (Tous les tenants)</SelectItem>
              )}
              <SelectItem value="tenant">Tenant (Tout le client)</SelectItem>
              <SelectItem value="site">Site (Sites spécifiques)</SelectItem>
            </SelectContent>
          </Select>

          <div className="ml-auto flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => applyPreset('all')}
            >
              Tout autoriser
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => applyPreset('read_only')}
            >
              Lecture seule
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => applyPreset('none')}
            >
              Tout réinitialiser
            </Button>
          </div>
        </div>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un module..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Permission Matrix */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium sticky left-0 bg-muted/50 z-10 min-w-[200px]">
                  Module
                </th>
                {ACTIONS.map(action => (
                  <th key={action} className="text-center p-3 font-medium min-w-[100px]">
                    {ACTION_LABELS[action]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredModules.map(module => {
                const isCollapsed = collapsedModules.has(module);
                const modulePerms = permissions.filter(p => p.module === module);
                const hasAnyAllow = modulePerms.some(p => p.decision === 'allow');

                return (
                  <tr key={module} className="border-b hover:bg-muted/30">
                    <td className="sticky left-0 bg-background z-10 p-3">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => toggleModule(module)}
                        >
                          {isCollapsed ? (
                            <ChevronRight className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                        <span className="font-medium">{MODULE_LABELS[module]}</span>
                        <Switch
                          checked={hasAnyAllow}
                          onCheckedChange={(checked) => toggleModuleActions(module, checked)}
                          className="ml-2"
                        />
                      </div>
                    </td>
                    {!isCollapsed && ACTIONS.map(action => {
                      const decision = getPermission(module, action);
                      return (
                        <td key={action} className="text-center p-3">
                          <button
                            type="button"
                            onClick={() => setPermission(module, action, cycleDecision(decision))}
                            className={cn(
                              "px-3 py-1 rounded-md text-xs font-medium border transition-colors",
                              getDecisionColor(decision)
                            )}
                          >
                            {getDecisionLabel(decision)}
                          </button>
                        </td>
                      );
                    })}
                    {isCollapsed && (
                      <td colSpan={ACTIONS.length} className="text-center text-muted-foreground text-sm p-3">
                        <Badge variant="outline">
                          {modulePerms.length} permission(s) configurée(s)
                        </Badge>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="text-sm text-muted-foreground">
        Cliquez sur une cellule pour alterner entre: Hérité → Autorisé → Interdit
      </p>
    </div>
  );
}
