# Staff Permission Middleware - Usage Examples

This document provides examples of how to use the staff permission middleware system.

## Backend (Edge Functions)

### Example 1: Protect an Edge Function

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check permission using middleware
    const { data: permissionCheck, error: permError } = await supabaseClient.rpc(
      'check_staff_permission',
      {
        _user_id: user.id,
        _permission_key: 'manage_textes'
      }
    );

    if (permError || !permissionCheck?.authorized) {
      return new Response(
        JSON.stringify({ 
          error: 'Forbidden',
          message: permissionCheck?.message || 'You do not have permission to perform this action'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Permission granted - proceed with action
    // ... your business logic here

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

### Example 2: Check Multiple Permissions

```typescript
// Check multiple permissions at once
const { data: batchCheck } = await supabaseClient.rpc(
  'check_staff_permissions_batch',
  {
    _user_id: user.id,
    _permission_keys: ['manage_textes', 'manage_articles', 'manage_versions']
  }
);

if (!batchCheck?.authorized) {
  return new Response(
    JSON.stringify({ 
      error: 'Forbidden',
      message: 'You do not have the required permissions',
      details: batchCheck
    }),
    { status: 403, headers: corsHeaders }
  );
}

// At least one permission is granted - check which ones
const authorizedPermissions = batchCheck.permissions
  .filter(p => p.authorized)
  .map(p => p.permission);
```

## Frontend (React Components)

### Example 1: Conditional Rendering Based on Permission

```typescript
import { useStaffPermission, STAFF_PERMISSIONS } from '@/lib/staff-permission-middleware';

function TexteManagementPage() {
  const { authorized, loading } = useStaffPermission(STAFF_PERMISSIONS.MANAGE_TEXTES);

  if (loading) {
    return <div>Loading permissions...</div>;
  }

  if (!authorized) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You do not have permission to manage regulatory texts.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div>
      {/* Your management UI */}
      <Button onClick={handleCreateTexte}>Create New Text</Button>
    </div>
  );
}
```

### Example 2: Check Permission Before Action

```typescript
import { staffPermissionMiddleware, STAFF_PERMISSIONS } from '@/lib/staff-permission-middleware';

async function handleDeleteArticle(articleId: string) {
  try {
    // Check permission before proceeding
    const result = await staffPermissionMiddleware.checkPermission(
      STAFF_PERMISSIONS.MANAGE_ARTICLES
    );

    if (!result.authorized) {
      toast.error('Permission denied', {
        description: result.message || 'You cannot delete articles'
      });
      return;
    }

    // Permission granted - proceed with deletion
    await deleteArticle(articleId);
    toast.success('Article deleted successfully');
  } catch (error) {
    toast.error('Failed to delete article');
  }
}
```

### Example 3: Guard Multiple Permissions

```typescript
import { staffPermissionMiddleware, STAFF_PERMISSIONS } from '@/lib/staff-permission-middleware';

async function handleComplexOperation() {
  try {
    // Check multiple permissions
    const result = await staffPermissionMiddleware.checkPermissionsBatch([
      STAFF_PERMISSIONS.MANAGE_TEXTES,
      STAFF_PERMISSIONS.MANAGE_ARTICLES,
      STAFF_PERMISSIONS.MANAGE_VERSIONS
    ]);

    if (!result.authorized) {
      toast.error('Insufficient permissions', {
        description: `You need ${result.total_permissions} permissions but only have ${result.authorized_permissions}`
      });
      return;
    }

    // All required permissions granted
    await performComplexOperation();
  } catch (error) {
    toast.error('Operation failed');
  }
}
```

### Example 4: Show/Hide UI Elements

```typescript
function ToolbarActions() {
  const [canManageTextes, setCanManageTextes] = useState(false);
  const [canManageArticles, setCanManageArticles] = useState(false);

  useEffect(() => {
    const checkPermissions = async () => {
      const result = await staffPermissionMiddleware.checkPermissionsBatch([
        STAFF_PERMISSIONS.MANAGE_TEXTES,
        STAFF_PERMISSIONS.MANAGE_ARTICLES
      ]);

      const perms = result.permissions || [];
      setCanManageTextes(perms.find(p => p.permission === 'manage_textes')?.authorized ?? false);
      setCanManageArticles(perms.find(p => p.permission === 'manage_articles')?.authorized ?? false);
    };

    checkPermissions();
  }, []);

  return (
    <div className="flex gap-2">
      {canManageTextes && (
        <Button onClick={handleCreateTexte}>
          Create Text
        </Button>
      )}
      {canManageArticles && (
        <Button onClick={handleCreateArticle}>
          Create Article
        </Button>
      )}
    </div>
  );
}
```

## Available Permissions

```typescript
STAFF_PERMISSIONS = {
  MANAGE_TEXTES: 'manage_textes',          // Create/edit/delete regulatory texts
  MANAGE_ARTICLES: 'manage_articles',      // Create/edit/delete articles
  MANAGE_VERSIONS: 'manage_versions',      // Create/edit article versions
  MANAGE_CLIENTS: 'manage_clients',        // Manage client accounts
  MANAGE_MODULES: 'manage_modules',        // Configure system modules
  MANAGE_USERS: 'manage_users',            // Manage client users
  MANAGE_SITES: 'manage_sites',            // Manage client sites
  VIEW_ALL_SITES: 'view_all_sites',        // View all client sites
  EDIT_DOMAINS: 'edit_domains',            // Edit regulatory domains
  MANAGE_AUTORITES: 'manage_autorites',    // Manage emitting authorities
  MANAGE_CODES: 'manage_codes',            // Manage legal codes
  MANAGE_TAGS: 'manage_tags',              // Manage regulatory tags
  MANAGE_STAFF: 'manage_staff',            // Manage staff users/roles
}
```

## Best Practices

1. **Always check permissions before destructive actions** (delete, update critical data)
2. **Use batch checks** when checking multiple permissions to reduce RPC calls
3. **Provide clear error messages** when permission is denied
4. **Cache permission checks** where appropriate to improve performance
5. **Log permission denials** for security auditing
6. **Use the guard function** (`requirePermission`) in utility functions that must enforce permissions
