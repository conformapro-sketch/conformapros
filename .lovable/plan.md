
# Access Control System - Complete Verification & Testing Readiness Plan

## Current System Analysis

The ConformaPro access control system is already comprehensively implemented with:

### Architecture Summary

```text
┌─────────────────────────────────────────────────────────────────┐
│                    STAFF USERS (ConformaPro Team)               │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Detection: roles.type = 'team' in user_roles                ││
│  │ Roles: Super Admin, Admin Global, Manager HSE, etc.         ││
│  │ Access: Full CRUD on /bibliotheque/*, /settings/*           ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENT USERS                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Detection: client_users table                               ││
│  │ Site Access: access_scopes table                            ││
│  │ Permissions: user_permissions per site/module               ││
│  │ Domain Access: site_veille_domaines                         ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  READ-ONLY ACCESS to Bibliothèque Réglementaire                 │
│  Routes: /client-bibliotheque/* (dashboard, textes, articles)   │
│  No Create/Edit/Delete buttons visible                          │
└─────────────────────────────────────────────────────────────────┘
```

### Current Database State

| Entity | Count |
|--------|-------|
| Clients | 7 |
| Sites | 10 |
| Client Users | 4 active |
| Staff Users | 1 (Super Admin) |
| Sites with modules enabled | 8 |
| Sites with domains configured | 3 |

---

## Issues Identified for Testing Readiness

### Issue 1: Incomplete Domain Configuration

Only 3 out of 10 sites have domain authorizations configured. Client users accessing sites without domains will see empty content.

**Affected Sites:**
- FEP sidi daoued: 0 modules, 0 domains
- Entrepôt Bizerte: 0 modules, 0 domains
- Usine Sfax: 0 modules, 0 domains
- sousse: 2 modules, 0 domains
- Agence Nabeul: 3 modules, 0 domains
- Bureau Principal CUN: 4 modules, 0 domains
- Siège Social Tunis: 0 modules, 0 domains

**Impact:** Client users will see "Aucun texte réglementaire disponible" even if content exists.

### Issue 2: Permission Inconsistency in Database

User `ahmed@serviceplus.com` has `create`, `edit`, `delete` permissions for the `bibliotheque` module in the database:
```
action:create decision:allow module:bibliotheque
action:edit decision:allow module:bibliotheque  
action:delete decision:allow module:bibliotheque
```

However, the frontend correctly hides CRUD buttons for client users. This is a **database inconsistency** that should be cleaned up - client users should never have create/edit/delete for bibliotheque module.

### Issue 3: Route Protection Gap for /bibliotheque/*

The `/bibliotheque/*` routes are protected by `ProtectedRoute` but NOT by `StaffRouteGuard`. This means:
- A client user could potentially navigate directly to `/bibliotheque/textes` via URL
- The page would render (though CRUD buttons are hidden via `useUserType`)

**Current protection flow:**
```
/bibliotheque/textes
  → ProtectedRoute (just checks if logged in)
  → Renders BibliothequeReglementaire
  → useAuth() checks role for CRUD visibility
```

**Should be:**
```
/bibliotheque/textes  
  → ProtectedRoute
  → StaffRouteGuard (redirect client to /client-bibliotheque/textes)
  → Renders BibliothequeReglementaire
```

### Issue 4: Missing Staff/Client Sidebar Route Awareness

In `AppSidebar.tsx`, when the sidebar is built:
- Staff users see: `/bibliotheque/*` routes
- Client users see: `/client-bibliotheque/*` routes

But if a client user manually navigates to `/bibliotheque/textes`:
- The page renders (with CRUD hidden)
- The sidebar won't highlight correctly (route mismatch)
- User experience is confusing

---

## Solution Plan

### Priority 1: Add Route Guards to Staff-Only Routes

Wrap `/bibliotheque/*` routes with `StaffRouteGuard` to redirect client users:

```typescript
// In App.tsx
<Route path="bibliotheque/textes" element={
  <StaffRouteGuard>
    <BibliothequeReglementaire />
  </StaffRouteGuard>
} />
<Route path="bibliotheque/articles" element={
  <StaffRouteGuard>
    <BibliothequeArticles />
  </StaffRouteGuard>
} />
// ... and all other /bibliotheque/* routes except client routes
```

### Priority 2: Add Automatic Redirect for Client Users

Modify `StaffRouteGuard` to redirect client users accessing `/bibliotheque/*` to equivalent `/client-bibliotheque/*`:

```typescript
// Enhanced StaffRouteGuard with smart redirect
if (!isStaff && location.pathname.startsWith('/bibliotheque')) {
  const clientPath = location.pathname.replace('/bibliotheque', '/client-bibliotheque');
  return <Navigate to={clientPath} replace />;
}
```

### Priority 3: Clean Up Database Permissions

Remove inappropriate permissions from client users:
- Client users should NOT have `create`, `edit`, `delete` for `bibliotheque` module
- Only `view` and `export` are appropriate for read-only access

### Priority 4: Seed Test Data for Domains

Configure domains for all sites to enable proper testing:
- Add SST, ENV, SOCIAL domains to all sites with BIBLIOTHEQUE module enabled
- Ensure client users can see content when testing

---

## Files to Modify

| File | Change |
|------|--------|
| `src/App.tsx` | Wrap `/bibliotheque/*` routes with `StaffRouteGuard` |
| `src/components/guards/StaffRouteGuard.tsx` | Add smart redirect for client users to `/client-bibliotheque/*` |
| Database | Clean up client user permissions, add domain authorizations |

---

## Testing Checklist After Implementation

### Staff User Testing (adibkallel2@gmail.com)
- [ ] Login redirects to `/staff/dashboard`
- [ ] Sidebar shows `/bibliotheque/*` routes
- [ ] Can create/edit/delete textes réglementaires
- [ ] Can create/edit/delete articles
- [ ] Access to `/settings/*` works
- [ ] Access to audit logs at `/settings/logs`

### Client User Testing (e.g., nouha@liquide.com)
- [ ] Login redirects to `/dashboard`
- [ ] Sidebar shows `/client-bibliotheque/*` routes
- [ ] Dashboard shows site stats and quick access cards
- [ ] Cannot see Create/Edit/Delete buttons
- [ ] Manually navigating to `/bibliotheque/textes` redirects to `/client-bibliotheque/textes`
- [ ] Content filtered by authorized domains
- [ ] Site switcher works correctly

### Client Admin Testing (is_client_admin = true)
- [ ] Can access `/client-admin/users` to manage users in their client
- [ ] Can assign sites to users
- [ ] Can set permissions per site

---

## Technical Implementation Details

### StaffRouteGuard Enhancement

```typescript
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface StaffRouteGuardProps {
  children: React.ReactNode;
  redirectClientTo?: string; // Optional custom redirect
}

export function StaffRouteGuard({ children, redirectClientTo }: StaffRouteGuardProps) {
  const { loading, hasRole, isClientUser } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isStaff = hasRole('Super Admin') || hasRole('Admin Global');

  if (!isStaff) {
    // Smart redirect for client users accessing staff routes
    if (isClientUser() && location.pathname.startsWith('/bibliotheque')) {
      const clientPath = location.pathname.replace('/bibliotheque', '/client-bibliotheque');
      return <Navigate to={clientPath} replace />;
    }
    
    // Default redirect to dashboard
    return <Navigate to={redirectClientTo || "/dashboard"} replace />;
  }

  return <>{children}</>;
}
```

### Route Updates in App.tsx

Add `StaffRouteGuard` to staff-only bibliotheque routes:

```typescript
{/* Bibliothèque Routes - Staff Only */}
<Route path="bibliotheque" element={
  <StaffRouteGuard>
    <Navigate to="/bibliotheque/textes" replace />
  </StaffRouteGuard>
} />
<Route path="bibliotheque/textes" element={
  <StaffRouteGuard>
    <BibliothequeReglementaire />
  </StaffRouteGuard>
} />
<Route path="bibliotheque/articles" element={
  <StaffRouteGuard>
    <BibliothequeArticles />
  </StaffRouteGuard>
} />
<Route path="bibliotheque/dashboard" element={
  <StaffRouteGuard>
    <BibliothequeTableauDeBord />
  </StaffRouteGuard>
} />
// ... remaining staff-only routes
```

---

## Expected Behavior Summary

| User Type | Navigates To | Result |
|-----------|-------------|--------|
| Staff | `/bibliotheque/textes` | Renders with full CRUD |
| Client | `/bibliotheque/textes` | Redirects to `/client-bibliotheque/textes` |
| Client | `/client-bibliotheque/textes` | Renders read-only list |
| Staff | `/settings/logs` | Renders audit log viewer |
| Client | `/settings/logs` | Redirects to `/dashboard` |
| Client Admin | `/client-admin/users` | Manages own client's users |
