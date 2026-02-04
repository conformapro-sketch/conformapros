
# Access Control and User Management System - Complete Audit & Verification

## Current System Analysis

After thorough review, ConformaPro already has a sophisticated access control architecture in place. This document provides a complete overview and identifies areas that need verification or improvement.

---

## 1. Architecture Overview

### User Type Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                    ConformaPro Staff Users                       │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Tables: staff_users, staff_roles, staff_role_permissions    ││
│  │ Auth: user_roles.roles.type = 'team'                        ││
│  │ Detection: is_staff_user() RPC function                     ││
│  └─────────────────────────────────────────────────────────────┘│
│                           │                                      │
│  Roles: Super Admin, Admin Global, Regulatory Manager, etc.     │
│  Permissions: manage_textes, manage_articles, manage_clients... │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Client Organizations                          │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Table: clients (id, nom, secteur, actif...)                 ││
│  └─────────────────────────────────────────────────────────────┘│
│                           │                                      │
│                           ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Sites: sites (id, client_id, nom, code_site...)             ││
│  │ Each client has multiple sites (physical locations)         ││
│  └─────────────────────────────────────────────────────────────┘│
│                           │                                      │
│                           ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Client Users: client_users (id, client_id, is_client_admin) ││
│  │ Site Access: access_scopes (user_id, site_id, read_only)    ││
│  │ Permissions: user_permissions (user_id, site_id, module...) ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Database Tables Summary

### Staff User Management

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `staff_users` | ConformaPro employees | id, nom, prenom, email, role_id, actif |
| `staff_roles` | Staff role definitions | id, nom_role, description |
| `staff_role_permissions` | Granular staff permissions | role_id, permission_key, autorise |

### Client User Management

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `client_users` | Client organization users | id, email, client_id, is_client_admin, actif |
| `access_scopes` | User-site assignments | user_id, site_id, read_only |
| `user_permissions` | Per-site module permissions | user_id, site_id, module, action, decision |
| `user_domain_scopes` | Domain restrictions per user | user_id, domaine_id |

### Site Configuration

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `sites` | Physical locations | id, client_id, nom, code_site |
| `site_modules` | Enabled modules per site | site_id, module_id, actif |
| `site_veille_domaines` | Authorized domains per site | site_id, domaine_id, enabled |

---

## 3. Staff Roles and Privileges

### Currently Implemented

Staff roles are stored in `staff_roles` with granular permissions in `staff_role_permissions`:

| Permission Key | Description |
|---------------|-------------|
| `manage_textes` | Create/edit/delete regulatory texts |
| `manage_articles` | Create/edit/delete articles |
| `manage_versions` | Create/edit/delete article versions |
| `manage_clients` | Create/edit clients and sites |
| `manage_modules` | Enable/disable modules per site |
| `view_all_sites` | Access to all sites globally |
| `edit_domains` | Manage regulatory domains |

### Role Examples

| Role | Description | Key Permissions |
|------|-------------|-----------------|
| Super Admin | Full system access | All permissions enabled |
| Admin Global | Administrative access | Most permissions except system config |
| Regulatory Manager | Content management | manage_textes, manage_articles, manage_versions |
| Support | View-only support | view_all_sites only |

---

## 4. Client User Roles per Site

### Permission Levels (Simplified 3-Level Model)

The `SimplePermissionSelector` component implements a simplified permission model:

| Level | Actions Granted |
|-------|-----------------|
| **Aucun accès** | No permissions |
| **Lecture seule** | view, export |
| **Accès complet** | view, create, edit, delete, export, assign, bulk_edit, upload_proof |

### Implementation Flow

1. **Site Assignment** - Users are assigned to sites via `access_scopes`
2. **Module Filtering** - Only modules enabled in `site_modules` are shown
3. **Permission Setting** - Per-site permissions saved to `user_permissions`
4. **Domain Filtering** - Content filtered by `site_veille_domaines` + `user_domain_scopes`

---

## 5. Module Access and Domain Restrictions

### Module Access Matrix

```
User → access_scopes → Site → site_modules → Module
         │                        │
         │                        ▼
         │              user_permissions
         │              (module + action + decision)
         │
         ▼
    site_veille_domaines
    (which domains site can access)
         │
         ▼
    user_domain_scopes
    (further restrict to specific domains)
```

### Content Filtering Logic

For client users viewing regulatory content:
1. Get user's assigned sites from `access_scopes`
2. Get enabled modules for current site from `site_modules`
3. Get authorized domains for site from `site_veille_domaines`
4. Optionally filter by user's domain scopes from `user_domain_scopes`
5. Filter articles/texts by these domains

---

## 6. Current Implementation Status

### Working Components

| Component | Status | Notes |
|-----------|--------|-------|
| AuthContext | Complete | Handles staff/client detection, permission loading |
| useUserType hook | Complete | Returns 'staff', 'client', 'unknown', 'loading' |
| StaffRouteGuard | Complete | Protects /staff/* and /settings/* routes |
| ClientRouteGuard | Complete | Prevents staff from accessing client routes |
| SiteContext | Complete | Manages current site selection for client users |
| PermissionMatrixV2 | Complete | Per-site permission assignment interface |
| SimplePermissionSelector | Complete | 3-level permission UI |

### Edge Functions

| Function | Purpose | Status |
|----------|---------|--------|
| `staff-user-management` | Staff manages client users | Complete |
| `client-user-management` | Client admins manage their users | Complete |
| `invite-client-user` | Create new client users | Complete |
| `delete-user` | Remove users | Complete |

### RPC Functions

| Function | Purpose |
|----------|---------|
| `is_staff_user(user_id)` | Check if user is staff |
| `get_staff_role(user_id)` | Get staff role ID |
| `has_role(user_id, role_name)` | Check role assignment |
| `has_site_access(user_id, site_id)` | Check site access |
| `get_site_enabled_modules(site_id)` | Get modules for site |
| `get_site_permissions(user_id, site_id)` | Get user permissions |
| `save_site_permissions(...)` | Save user permissions |
| `check_staff_permission(user_id, permission_key)` | Validate staff permission |

---

## 7. Issues Identified

### Issue 1: Missing `site_domaines_autorises` Table

The memory references a `site_domaines_autorises` table, but the database uses `site_veille_domaines`. This is a naming inconsistency in documentation/memory, not an actual missing table.

**Resolution**: Update documentation to use correct table name `site_veille_domaines`.

### Issue 2: Inconsistent Role Name Casing in Policies

Some RLS policies check for `'super_admin'` (snake_case) while the actual role name is `'Super Admin'` (with space and capitals).

**Affected Policies**:
- `Roles: super_admin can manage all` - uses `'super_admin'`
- `UserRoles: super_admin manage` - uses `'super_admin'`

**Resolution**: The `has_role()` function already handles this by comparing both raw names and slugified versions. No immediate fix needed, but consistency would improve maintainability.

### Issue 3: Linter Warnings

The database linter shows:
- 4 SECURITY DEFINER views (intentional for RLS bypass)
- Multiple functions with mutable search_path (should be fixed for security)

### Issue 4: Client Route Guard Inconsistency

The `ClientRouteGuard` shows a message but also triggers a Navigate - this causes a flash before redirect.

---

## 8. Security Best Practices (Already Implemented)

| Practice | Implementation |
|----------|---------------|
| Roles in separate table | `roles`, `staff_roles` tables |
| RLS on all user data | Policies on `client_users`, `staff_users`, etc. |
| Server-side validation | Edge functions validate permissions |
| Security definer functions | `has_role()`, `is_staff_user()` prevent recursion |
| Audit logging | `user_management_audit` table with `log_user_management_action()` |
| Multi-tenant isolation | Site validation in edge functions |

---

## 9. Recommended Improvements

### Priority 1: Fix Function Search Paths (Security)

Update functions with `SET search_path TO 'public'`:

Functions to fix:
- `prevent_domain_deletion_with_articles()`
- `sync_site_nom()`
- `update_annee_from_date_publication()`
- `validate_version_contenu()`
- `prevent_last_version_deletion()`
- `prevent_article_deletion_with_versions()`

### Priority 2: Add Missing RLS Policies

Tables with fewer than 2 policies that may need review:
- `user_roles` (2 policies - needs INSERT for role assignment)
- `access_scopes` (2 policies - working correctly)

### Priority 3: Create Comprehensive Audit Dashboard

Current audit logs exist but need a proper UI in `/settings/logs` for:
- User creation/modification history
- Permission change tracking
- Site assignment history

---

## 10. Visual Diagrams

### Staff-Client Permission Flow

```
                    ┌──────────────────┐
                    │   Login Request   │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │  AuthContext     │
                    │  Fetch user_roles│
                    └────────┬─────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
     ┌────────▼────────┐          ┌─────────▼─────────┐
     │ roles.type=team │          │client_users exists│
     │   (Staff User)  │          │   (Client User)   │
     └────────┬────────┘          └─────────┬─────────┘
              │                             │
     ┌────────▼────────┐          ┌─────────▼─────────┐
     │ Load staff_role │          │Load access_scopes │
     │  permissions    │          │ + user_permissions│
     └────────┬────────┘          └─────────┬─────────┘
              │                             │
     ┌────────▼────────┐          ┌─────────▼─────────┐
     │/staff/dashboard │          │ /dashboard        │
     │ Full module     │          │ Filtered by site, │
     │ visibility      │          │ module, domain    │
     └─────────────────┘          └───────────────────┘
```

### Client User Permission Resolution

```
┌─────────────────────────────────────────────────────────┐
│                   Client User Login                      │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│ 1. Get user's sites from access_scopes                  │
│    SELECT site_id FROM access_scopes WHERE user_id = ?  │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│ 2. SiteContext loads available sites                    │
│    User selects/auto-selects a site                     │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│ 3. useUserModules fetches enabled modules for site      │
│    - From site_modules WHERE site_id = current_site     │
│    - Filtered by user_permissions with decision='allow' │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│ 4. Sidebar shows only accessible modules                │
│ 5. Content filtered by site's authorized domains        │
└─────────────────────────────────────────────────────────┘
```

---

## 11. Verification Checklist

### Staff User Management

- [x] Staff roles stored in `staff_roles` table
- [x] Granular permissions in `staff_role_permissions`
- [x] RLS policies protect staff data (Super Admin/Admin Global only)
- [x] `is_staff_user()` RPC for type detection
- [x] `check_staff_permission()` RPC for authorization
- [x] Staff route guard (`StaffRouteGuard`)

### Client User Management

- [x] Client users in separate `client_users` table
- [x] Site assignments via `access_scopes`
- [x] Per-site permissions in `user_permissions`
- [x] Domain scopes in `user_domain_scopes`
- [x] `client-user-management` edge function
- [x] Client admin can only manage users in their client

### Multi-Site Support

- [x] Sites belong to clients (`sites.client_id`)
- [x] Users can access multiple sites
- [x] Different permissions per site
- [x] Site switcher in navigation
- [x] Query invalidation on site change

### Module & Domain Filtering

- [x] Modules enabled per site (`site_modules`)
- [x] Domains authorized per site (`site_veille_domaines`)
- [x] Content filtered by these settings
- [x] Only enabled modules shown in permission UI

### Audit Trail

- [x] `user_management_audit` table exists
- [x] `log_user_management_action()` RPC
- [x] Edge functions log create/update/delete/site_assignment
- [ ] Needs: Dedicated audit log viewer in settings

---

## 12. Implementation Summary

The access control system is largely complete. The main actions needed are:

1. **Security Hardening**: Fix 6 functions with mutable search_path
2. **UI Enhancement**: Build audit log viewer in `/settings/logs`
3. **Documentation**: Update memory to use correct table name `site_veille_domaines`
4. **Testing**: End-to-end verification of all permission flows

### Files Involved

| Category | Files |
|----------|-------|
| Auth | `src/contexts/AuthContext.tsx` |
| Hooks | `useUserType.ts`, `useSitePermissions.ts`, `useUserModules.ts`, `useSiteContext.ts` |
| Guards | `StaffRouteGuard.tsx`, `ClientRouteGuard.tsx`, `ProtectedRoute.tsx` |
| Queries | `staff-users-queries.ts`, `staff-roles-queries.ts`, `access-scopes-queries.ts` |
| Edge Functions | `staff-user-management`, `client-user-management` |
| UI | `PermissionMatrixV2.tsx`, `SimplePermissionSelector.tsx` |
| Settings | All files in `src/pages/settings/` |

---

## 13. Conclusion

ConformaPro's access control system implements a robust multi-tenant architecture with:

- **Complete separation** between staff and client users
- **Hierarchical access control**: Staff > Client Admin > Client User
- **Site-specific permissions** with module and domain filtering
- **Audit logging** for compliance and traceability
- **Scalable design** supporting new modules and clients

The system follows security best practices with RLS, dedicated RPC functions, and server-side validation. Minor improvements (function search paths, audit UI) would enhance security and usability further.
