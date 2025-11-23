/**
 * Phase 5: Permission Templates
 * 
 * Pre-defined permission templates for common roles
 * Makes it easy to quickly assign appropriate permissions
 */

export interface PermissionTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  permissions: Array<{
    module: string;
    action: string;
    decision: "allow" | "deny";
    scope: "global" | "tenant" | "site";
  }>;
}

export const permissionTemplates: PermissionTemplate[] = [
  {
    id: "admin",
    name: "Administrator",
    description: "Full access to all modules and actions",
    icon: "ShieldCheck",
    permissions: [
      // Full access to all core modules
      { module: "INCIDENTS", action: "view", decision: "allow", scope: "site" },
      { module: "INCIDENTS", action: "create", decision: "allow", scope: "site" },
      { module: "INCIDENTS", action: "edit", decision: "allow", scope: "site" },
      { module: "INCIDENTS", action: "delete", decision: "allow", scope: "site" },
      { module: "INCIDENTS", action: "export", decision: "allow", scope: "site" },
      
      { module: "EQUIPEMENTS", action: "view", decision: "allow", scope: "site" },
      { module: "EQUIPEMENTS", action: "create", decision: "allow", scope: "site" },
      { module: "EQUIPEMENTS", action: "edit", decision: "allow", scope: "site" },
      { module: "EQUIPEMENTS", action: "delete", decision: "allow", scope: "site" },
      
      { module: "FORMATIONS", action: "view", decision: "allow", scope: "site" },
      { module: "FORMATIONS", action: "create", decision: "allow", scope: "site" },
      { module: "FORMATIONS", action: "edit", decision: "allow", scope: "site" },
      { module: "FORMATIONS", action: "delete", decision: "allow", scope: "site" },
      
      { module: "EPI", action: "view", decision: "allow", scope: "site" },
      { module: "EPI", action: "create", decision: "allow", scope: "site" },
      { module: "EPI", action: "edit", decision: "allow", scope: "site" },
      { module: "EPI", action: "delete", decision: "allow", scope: "site" },
      
      { module: "ENVIRONNEMENT", action: "view", decision: "allow", scope: "site" },
      { module: "ENVIRONNEMENT", action: "create", decision: "allow", scope: "site" },
      { module: "ENVIRONNEMENT", action: "edit", decision: "allow", scope: "site" },
    ],
  },
  {
    id: "manager",
    name: "Manager",
    description: "Can view and manage most modules, limited delete access",
    icon: "UserCog",
    permissions: [
      { module: "INCIDENTS", action: "view", decision: "allow", scope: "site" },
      { module: "INCIDENTS", action: "create", decision: "allow", scope: "site" },
      { module: "INCIDENTS", action: "edit", decision: "allow", scope: "site" },
      { module: "INCIDENTS", action: "export", decision: "allow", scope: "site" },
      
      { module: "EQUIPEMENTS", action: "view", decision: "allow", scope: "site" },
      { module: "EQUIPEMENTS", action: "create", decision: "allow", scope: "site" },
      { module: "EQUIPEMENTS", action: "edit", decision: "allow", scope: "site" },
      
      { module: "FORMATIONS", action: "view", decision: "allow", scope: "site" },
      { module: "FORMATIONS", action: "create", decision: "allow", scope: "site" },
      { module: "FORMATIONS", action: "edit", decision: "allow", scope: "site" },
      
      { module: "EPI", action: "view", decision: "allow", scope: "site" },
      { module: "EPI", action: "create", decision: "allow", scope: "site" },
      { module: "EPI", action: "edit", decision: "allow", scope: "site" },
      
      { module: "ENVIRONNEMENT", action: "view", decision: "allow", scope: "site" },
      { module: "ENVIRONNEMENT", action: "create", decision: "allow", scope: "site" },
    ],
  },
  {
    id: "viewer",
    name: "Viewer",
    description: "Read-only access to all modules",
    icon: "Eye",
    permissions: [
      { module: "INCIDENTS", action: "view", decision: "allow", scope: "site" },
      { module: "EQUIPEMENTS", action: "view", decision: "allow", scope: "site" },
      { module: "FORMATIONS", action: "view", decision: "allow", scope: "site" },
      { module: "EPI", action: "view", decision: "allow", scope: "site" },
      { module: "ENVIRONNEMENT", action: "view", decision: "allow", scope: "site" },
      { module: "VISITES_MEDICALES", action: "view", decision: "allow", scope: "site" },
      { module: "CONTROLES", action: "view", decision: "allow", scope: "site" },
    ],
  },
  {
    id: "safety_officer",
    name: "Safety Officer",
    description: "Full access to safety modules (Incidents, EPI, Formations)",
    icon: "Shield",
    permissions: [
      // Incidents - full access
      { module: "INCIDENTS", action: "view", decision: "allow", scope: "site" },
      { module: "INCIDENTS", action: "create", decision: "allow", scope: "site" },
      { module: "INCIDENTS", action: "edit", decision: "allow", scope: "site" },
      { module: "INCIDENTS", action: "delete", decision: "allow", scope: "site" },
      { module: "INCIDENTS", action: "export", decision: "allow", scope: "site" },
      
      // EPI - full access
      { module: "EPI", action: "view", decision: "allow", scope: "site" },
      { module: "EPI", action: "create", decision: "allow", scope: "site" },
      { module: "EPI", action: "edit", decision: "allow", scope: "site" },
      { module: "EPI", action: "delete", decision: "allow", scope: "site" },
      
      // Formations - full access
      { module: "FORMATIONS", action: "view", decision: "allow", scope: "site" },
      { module: "FORMATIONS", action: "create", decision: "allow", scope: "site" },
      { module: "FORMATIONS", action: "edit", decision: "allow", scope: "site" },
      { module: "FORMATIONS", action: "delete", decision: "allow", scope: "site" },
      
      // Medical visits - full access
      { module: "VISITES_MEDICALES", action: "view", decision: "allow", scope: "site" },
      { module: "VISITES_MEDICALES", action: "create", decision: "allow", scope: "site" },
      { module: "VISITES_MEDICALES", action: "edit", decision: "allow", scope: "site" },
      
      // Read-only for other modules
      { module: "EQUIPEMENTS", action: "view", decision: "allow", scope: "site" },
      { module: "ENVIRONNEMENT", action: "view", decision: "allow", scope: "site" },
    ],
  },
  {
    id: "maintenance_tech",
    name: "Maintenance Technician",
    description: "Full access to equipment and controls modules",
    icon: "Wrench",
    permissions: [
      // Equipments - full access
      { module: "EQUIPEMENTS", action: "view", decision: "allow", scope: "site" },
      { module: "EQUIPEMENTS", action: "create", decision: "allow", scope: "site" },
      { module: "EQUIPEMENTS", action: "edit", decision: "allow", scope: "site" },
      { module: "EQUIPEMENTS", action: "delete", decision: "allow", scope: "site" },
      
      // Controls - full access
      { module: "CONTROLES", action: "view", decision: "allow", scope: "site" },
      { module: "CONTROLES", action: "create", decision: "allow", scope: "site" },
      { module: "CONTROLES", action: "edit", decision: "allow", scope: "site" },
      
      // Read-only for related modules
      { module: "INCIDENTS", action: "view", decision: "allow", scope: "site" },
      { module: "INCIDENTS", action: "create", decision: "allow", scope: "site" },
    ],
  },
  {
    id: "environmental_officer",
    name: "Environmental Officer",
    description: "Full access to environmental management",
    icon: "Leaf",
    permissions: [
      { module: "ENVIRONNEMENT", action: "view", decision: "allow", scope: "site" },
      { module: "ENVIRONNEMENT", action: "create", decision: "allow", scope: "site" },
      { module: "ENVIRONNEMENT", action: "edit", decision: "allow", scope: "site" },
      { module: "ENVIRONNEMENT", action: "delete", decision: "allow", scope: "site" },
      { module: "ENVIRONNEMENT", action: "export", decision: "allow", scope: "site" },
      
      // Read-only for related modules
      { module: "EQUIPEMENTS", action: "view", decision: "allow", scope: "site" },
      { module: "INCIDENTS", action: "view", decision: "allow", scope: "site" },
    ],
  },
  {
    id: "hr_manager",
    name: "HR Manager",
    description: "Access to personnel-related modules",
    icon: "Users",
    permissions: [
      { module: "FORMATIONS", action: "view", decision: "allow", scope: "site" },
      { module: "FORMATIONS", action: "create", decision: "allow", scope: "site" },
      { module: "FORMATIONS", action: "edit", decision: "allow", scope: "site" },
      { module: "FORMATIONS", action: "delete", decision: "allow", scope: "site" },
      
      { module: "VISITES_MEDICALES", action: "view", decision: "allow", scope: "site" },
      { module: "VISITES_MEDICALES", action: "create", decision: "allow", scope: "site" },
      { module: "VISITES_MEDICALES", action: "edit", decision: "allow", scope: "site" },
      
      { module: "EPI", action: "view", decision: "allow", scope: "site" },
      { module: "EPI", action: "create", decision: "allow", scope: "site" },
      
      // Read-only for safety overview
      { module: "INCIDENTS", action: "view", decision: "allow", scope: "site" },
    ],
  },
];

/**
 * Get a template by ID
 */
export function getTemplate(id: string): PermissionTemplate | undefined {
  return permissionTemplates.find((t) => t.id === id);
}

/**
 * Apply a template to a set of enabled modules
 * Only includes permissions for modules that are actually enabled
 */
export function applyTemplate(
  templateId: string,
  enabledModuleCodes: string[]
): Array<{
  module: string;
  action: string;
  decision: "allow" | "deny";
  scope: "global" | "tenant" | "site";
}> {
  const template = getTemplate(templateId);
  if (!template) return [];

  const enabledSet = new Set(enabledModuleCodes.map((c) => c.toUpperCase()));
  
  return template.permissions.filter((p) =>
    enabledSet.has(p.module.toUpperCase())
  );
}

/**
 * Merge multiple templates (for complex roles)
 */
export function mergeTemplates(
  templateIds: string[]
): PermissionTemplate["permissions"] {
  const mergedPermissions = new Map<string, any>();

  templateIds.forEach((templateId) => {
    const template = getTemplate(templateId);
    if (!template) return;

    template.permissions.forEach((perm) => {
      const key = `${perm.module}:${perm.action}`;
      // "allow" takes precedence over "deny"
      if (!mergedPermissions.has(key) || perm.decision === "allow") {
        mergedPermissions.set(key, perm);
      }
    });
  });

  return Array.from(mergedPermissions.values());
}
