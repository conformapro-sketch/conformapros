import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Lock } from "lucide-react";
import type { PermissionDecision, PermissionScope } from "@/types/roles";
import { usePermissionStructure, useClientModules } from "@/hooks/usePermissionStructure";
import { SimplePermissionSelector } from "@/components/permissions/SimplePermissionSelector";

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
  readOnly?: boolean;
  userType?: 'team' | 'client'; // For filtering modules
  siteId?: string; // For site-specific permissions
  modules?: string[]; // Optional list of allowed module codes (lowercase)
}

export function PermissionMatrix({
  permissions,
  scope,
  onPermissionsChange,
  onScopeChange,
  roleType,
  readOnly = false,
  userType,
  siteId,
  modules,
}: PermissionMatrixProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Load permission structure dynamically
  const { modules: allModules, isLoading } = usePermissionStructure();
  const clientModules = useClientModules();

  // Filter modules based on user type and optional allowed modules list
  const availableModulesData = useMemo(() => {
    let baseModules = userType === 'client' ? clientModules : allModules;
    
    // If a specific list of allowed modules is provided, filter to only those
    if (modules && modules.length > 0) {
      baseModules = baseModules.filter(module => 
        modules.includes(module.code.toLowerCase())
      );
    }
    
    // Filter child modules based on parent authorization in current permissions
    const allowedModuleCodes = new Set(baseModules.map(m => m.code.toLowerCase()));
    
    return baseModules.filter(module => {
      // If the module has a parent
      if (module.parent_module_id) {
        // Find the parent module
        const parent = allModules.find(m => m.id === module.parent_module_id);
        if (parent) {
          const parentCode = parent.code.toLowerCase();
          // Check if parent is in base allowed modules
          if (!allowedModuleCodes.has(parentCode)) {
            return false;
          }
          // Check if parent has at least one 'allow' permission in current state
          const hasParentAllow = permissions.some(
            p => p.module === parentCode && p.decision === 'allow'
          );
          if (!hasParentAllow) {
            return false;
          }
        }
      }
      return true;
    });
  }, [userType, modules, allModules, clientModules, permissions]);

  const filteredModules = useMemo(() => {
    return availableModulesData.filter(module =>
      module.libelle.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, availableModulesData]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {readOnly && (
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertDescription>
            Ce rôle système possède automatiquement toutes les permissions avec portée globale.
            Les permissions ne peuvent pas être modifiées.
          </AlertDescription>
        </Alert>
      )}

      {/* Scope Selector */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <Label>Portée par défaut:</Label>
          <Select 
            value={scope} 
            onValueChange={(v) => onScopeChange(v as PermissionScope)}
            disabled={readOnly}
          >
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

      {/* Simplified Permission Selector */}
      <SimplePermissionSelector
        modules={filteredModules.map(m => ({
          code: m.code,
          libelle: m.libelle,
        }))}
        permissions={permissions}
        onPermissionsChange={onPermissionsChange}
        disabled={readOnly}
      />

      {/* Instructions */}
      <Card className="p-4 border-primary/20 bg-primary/5">
        <p className="text-sm text-muted-foreground">
          <strong>Comment ça marche:</strong> Sélectionnez le niveau d'accès pour chaque module.
          <br />
          • <strong>Aucun accès</strong> = Module invisible pour l'utilisateur
          <br />
          • <strong>Lecture seule</strong> = Voir et exporter uniquement
          <br />
          • <strong>Accès complet</strong> = Toutes les permissions (créer, modifier, supprimer, etc.)
        </p>
      </Card>
    </div>
  );
}
