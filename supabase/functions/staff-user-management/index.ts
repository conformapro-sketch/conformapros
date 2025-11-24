import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StaffUserManagementRequest {
  action: 'list' | 'get' | 'create' | 'update' | 'delete' | 'assign_sites' | 'set_permissions' | 'audit_log';
  userId?: string;
  clientId?: string;
  siteId?: string;
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  userData?: {
    email?: string;
    nom?: string;
    prenom?: string;
    telephone?: string;
    actif?: boolean;
    is_client_admin?: boolean;
    client_id?: string;
  };
  siteIds?: string[];
  permissions?: Array<{
    module: string;
    action: string;
    decision: 'allow' | 'deny' | 'inherit';
    scope: 'global' | 'tenant' | 'site';
  }>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify user is staff (Super Admin or Admin Global)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Authentication failed');
    }

    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role:roles(name, type)')
      .eq('user_id', user.id);

    if (rolesError) throw rolesError;

    const isStaff = roles?.some((r: any) => 
      r.role?.type === 'team' && 
      (r.role?.name === 'Super Admin' || r.role?.name === 'Admin Global')
    );

    if (!isStaff) {
      return new Response(
        JSON.stringify({ error: 'Access denied: staff only' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const request: StaffUserManagementRequest = await req.json();
    let result;

    switch (request.action) {
      case 'list': {
        const { data, error } = await supabase.rpc('staff_get_user_overview', {
          p_search: request.search || null,
          p_client_id: request.clientId || null,
          p_status: request.status || null,
          p_page: request.page || 1,
          p_page_size: request.pageSize || 20,
        });

        if (error) throw error;
        result = { users: data };
        break;
      }

      case 'get': {
        if (!request.userId) {
          throw new Error('userId required');
        }

        const { data: user, error: userErr } = await supabase
          .from('client_users')
          .select(`
            *,
            client:clients(*),
            roles:user_roles(role:roles(*)),
            sites:access_scopes(site:sites(*), read_only),
            permissions:user_permissions(*)
          `)
          .eq('id', request.userId)
          .single();

        if (userErr) throw userErr;
        result = { user };
        break;
      }

      case 'create': {
        if (!request.userData?.email || !request.userData?.client_id) {
          throw new Error('email and client_id required');
        }

        // Call invite edge function
        const { data, error } = await supabase.functions.invoke('invite-client-user', {
          body: request.userData,
        });

        if (error) throw error;
        
        // Log audit
        await supabase.rpc('log_user_management_action', {
          p_action_type: 'create',
          p_target_user_id: data.user_id,
          p_client_id: request.userData.client_id,
          p_after_state: request.userData,
        });

        result = { user: data };
        break;
      }

      case 'update': {
        if (!request.userId || !request.userData) {
          throw new Error('userId and userData required');
        }

        // Get before state
        const { data: beforeState } = await supabase
          .from('client_users')
          .select('*')
          .eq('id', request.userId)
          .single();

        const { data, error } = await supabase
          .from('client_users')
          .update(request.userData)
          .eq('id', request.userId)
          .select()
          .single();

        if (error) throw error;

        // Log audit
        await supabase.rpc('log_user_management_action', {
          p_action_type: 'update',
          p_target_user_id: request.userId,
          p_client_id: data.client_id,
          p_before_state: beforeState,
          p_after_state: request.userData,
        });

        result = { user: data };
        break;
      }

      case 'delete': {
        if (!request.userId) {
          throw new Error('userId required');
        }

        // Get user data before deletion
        const { data: userData } = await supabase
          .from('client_users')
          .select('*')
          .eq('id', request.userId)
          .single();

        const { error } = await supabase.functions.invoke('delete-user', {
          body: { userId: request.userId },
        });

        if (error) throw error;

        // Log audit
        if (userData) {
          await supabase.rpc('log_user_management_action', {
            p_action_type: 'delete',
            p_target_user_id: request.userId,
            p_client_id: userData.client_id,
            p_before_state: userData,
          });
        }

        result = { success: true };
        break;
      }

      case 'assign_sites': {
        if (!request.userId || !request.siteIds) {
          throw new Error('userId and siteIds required');
        }

        // Get user's client_id
        const { data: userData, error: userError } = await supabase
          .from('client_users')
          .select('client_id')
          .eq('id', request.userId)
          .single();

        if (userError || !userData) {
          throw new Error('User not found');
        }

        // CRITICAL SECURITY FIX: Validate all sites belong to user's client
        if (request.siteIds.length > 0) {
          const { data: validSites, error: sitesError } = await supabase
            .from('sites')
            .select('id')
            .eq('client_id', userData.client_id)
            .in('id', request.siteIds);

          if (sitesError) throw sitesError;

          const validSiteIds = validSites?.map(s => s.id) || [];
          const invalidSites = request.siteIds.filter(id => !validSiteIds.includes(id));

          if (invalidSites.length > 0) {
            throw new Error(`Invalid sites: Cannot assign sites from different clients. Invalid site IDs: ${invalidSites.join(', ')}`);
          }
        }

        // Get before state
        const { data: beforeSites } = await supabase
          .from('access_scopes')
          .select('site_id')
          .eq('user_id', request.userId);

        // Delete existing
        await supabase
          .from('access_scopes')
          .delete()
          .eq('user_id', request.userId);

        // Insert new
        if (request.siteIds.length > 0) {
          const accessScopes = request.siteIds.map(siteId => ({
            user_id: request.userId,
            site_id: siteId,
            created_by: user.id,
          }));

          const { error } = await supabase
            .from('access_scopes')
            .insert(accessScopes);

          if (error) throw error;
        }

        // Log audit
        await supabase.rpc('log_user_management_action', {
          p_action_type: 'site_assignment',
          p_target_user_id: request.userId,
          p_client_id: userData.client_id,
          p_before_state: { sites: beforeSites },
          p_after_state: { sites: request.siteIds },
        });

        result = { success: true };
        break;
      }

      case 'set_permissions': {
        if (!request.userId || !request.siteId || !request.permissions) {
          throw new Error('userId, siteId, and permissions required');
        }

        const { data: userData } = await supabase
          .from('client_users')
          .select('client_id')
          .eq('id', request.userId)
          .single();

        if (!userData) throw new Error('User not found');

        const { error } = await supabase.rpc('save_site_permissions', {
          p_user_id: request.userId,
          p_site_id: request.siteId,
          p_client_id: userData.client_id,
          p_permissions: request.permissions,
        });

        if (error) throw error;
        result = { success: true };
        break;
      }

      case 'audit_log': {
        const { data, error } = await supabase
          .from('user_management_audit')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) throw error;
        result = { logs: data };
        break;
      }

      default:
        throw new Error(`Unknown action: ${request.action}`);
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Staff user management error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
