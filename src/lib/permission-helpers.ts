import { modulesQueries } from "@/lib/modules-queries";
import type { RolePermission } from "@/types/roles";

/**
 * Helper functions to convert between FK-based permissions and code-based UI format
 * This maintains backward compatibility with existing form components
 */

export interface PermissionWithCodes {
  module: string; // module code (lowercase)
  action: string; // action code
  decision: 'allow' | 'deny' | 'inherit';
  scope?: 'global' | 'tenant' | 'site';
}

export interface PermissionWithIds {
  module_id: string;
  feature_id?: string;
  action_id: string;
  decision: 'allow' | 'deny' | 'inherit';
  scope: 'global' | 'tenant' | 'site';
}

/**
 * Convert FK-based permissions from DB to code-based format for UI
 */
export async function convertPermissionsToUi(
  permissions: RolePermission[]
): Promise<PermissionWithCodes[]> {
  if (!permissions || permissions.length === 0) return [];

  // Load all modules and actions once
  const [modules, actions] = await Promise.all([
    modulesQueries.getAll(),
    modulesQueries.getActions(),
  ]);

  const modulesMap = new Map(modules.map(m => [m.id, m.code.toLowerCase()]));
  const actionsMap = new Map(actions.map(a => [a.id, a.code]));

  return permissions.map(p => ({
    module: modulesMap.get(p.module_id) || '',
    action: actionsMap.get(p.action_id) || '',
    decision: p.decision,
    scope: p.scope,
  })).filter(p => p.module && p.action); // Filter out invalid mappings
}

/**
 * Convert code-based permissions from UI to FK-based format for DB
 */
export async function convertPermissionsToDb(
  permissions: PermissionWithCodes[],
  defaultScope: 'global' | 'tenant' | 'site' = 'tenant'
): Promise<PermissionWithIds[]> {
  if (!permissions || permissions.length === 0) return [];

  // Load all modules and actions once
  const [modules, actions] = await Promise.all([
    modulesQueries.getAll(),
    modulesQueries.getActions(),
  ]);

  const modulesMap = new Map(modules.map(m => [m.code.toLowerCase(), m.id]));
  const actionsMap = new Map(actions.map(a => [a.code, a.id]));

  return permissions.map(p => {
    const module_id = modulesMap.get(p.module.toLowerCase());
    const action_id = actionsMap.get(p.action);

    if (!module_id || !action_id) {
      console.warn(`Invalid permission: module=${p.module}, action=${p.action}`);
      return null;
    }

    return {
      module_id,
      action_id,
      decision: p.decision,
      scope: p.scope || defaultScope,
    };
  }).filter((p): p is PermissionWithIds => p !== null);
}

/**
 * Get module code from module_id
 */
export async function getModuleCode(moduleId: string): Promise<string | null> {
  try {
    const module = await modulesQueries.getById(moduleId);
    return module.code.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Get action code from action_id
 */
export async function getActionCode(actionId: string): Promise<string | null> {
  try {
    const action = await modulesQueries.getActionById(actionId);
    return action.code;
  } catch {
    return null;
  }
}

/**
 * Get module_id from code
 */
export async function getModuleId(moduleCode: string): Promise<string | null> {
  try {
    const module = await modulesQueries.getByCode(moduleCode.toUpperCase());
    return module.id;
  } catch {
    return null;
  }
}

/**
 * Get action_id from code
 */
export async function getActionId(actionCode: string): Promise<string | null> {
  try {
    const action = await modulesQueries.getActionByCode(actionCode);
    return action.id;
  } catch {
    return null;
  }
}

/**
 * Check if user can access client management functionality
 * This centralizes the permission check for CLIENTS module
 */
export function canAccessClientManagement(
  hasPermission: (module: string, action: string) => boolean,
  isSuperAdmin: () => boolean
): boolean {
  return isSuperAdmin() || hasPermission('CLIENTS', 'view');
}
