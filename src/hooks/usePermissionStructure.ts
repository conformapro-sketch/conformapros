import { useQuery } from "@tanstack/react-query";
import { modulesQueries } from "@/lib/modules-queries";
import type { ModuleSysteme, ModuleFeature, PermissionAction } from "@/lib/modules-queries";

interface PermissionStructure {
  modules: ModuleSysteme[];
  features: ModuleFeature[];
  actions: PermissionAction[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to load the complete permission structure dynamically from database
 * Replaces hard-coded MODULES, ACTIONS arrays
 */
export function usePermissionStructure(): PermissionStructure {
  // Load modules
  const {
    data: modules = [],
    isLoading: modulesLoading,
    error: modulesError,
  } = useQuery({
    queryKey: ['modules-systeme'],
    queryFn: modulesQueries.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Load actions
  const {
    data: actions = [],
    isLoading: actionsLoading,
    error: actionsError,
  } = useQuery({
    queryKey: ['permission-actions'],
    queryFn: modulesQueries.getActions,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Load all features (optional, for advanced use)
  const {
    data: features = [],
    isLoading: featuresLoading,
    error: featuresError,
  } = useQuery({
    queryKey: ['module-features-all'],
    queryFn: () => modulesQueries.getAllFeatures(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    modules,
    features,
    actions,
    isLoading: modulesLoading || actionsLoading || featuresLoading,
    error: (modulesError || actionsError || featuresError) as Error | null,
  };
}

/**
 * Helper to convert ModuleSysteme to legacy format for backward compatibility
 * This will be removed in Phase 5 when legacy code is fully migrated
 */
export function useModuleCodes() {
  const { modules } = usePermissionStructure();
  return modules.map(m => m.code.toLowerCase());
}

/**
 * Helper to get module label by code
 */
export function useModuleLabels() {
  const { modules } = usePermissionStructure();
  return modules.reduce((acc, m) => {
    acc[m.code.toLowerCase()] = m.libelle;
    return acc;
  }, {} as Record<string, string>);
}

/**
 * Helper to get action label by code
 */
export function useActionLabels() {
  const { actions } = usePermissionStructure();
  return actions.reduce((acc, a) => {
    acc[a.code] = a.label;
    return acc;
  }, {} as Record<string, string>);
}

/**
 * Get client-accessible modules (filter based on module metadata if needed)
 * For now, all modules are accessible to clients unless specified otherwise
 */
export function useClientModules() {
  const { modules } = usePermissionStructure();
  // In the future, we can add a 'client_accessible' flag to modules table
  // For now, return all modules
  return modules;
}

/**
 * Get admin-only modules (for ConformaPro staff)
 * In the future, we can add metadata to distinguish admin vs client modules
 */
export function useAdminModules() {
  const { modules } = usePermissionStructure();
  // Placeholder: filter based on module codes or add 'admin_only' flag
  const adminCodes = ['clients', 'sites', 'factures', 'abonnements', 'utilisateurs', 'roles', 'domaines'];
  return modules.filter(m => adminCodes.includes(m.code.toLowerCase()));
}
