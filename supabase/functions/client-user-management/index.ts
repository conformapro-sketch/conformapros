import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ClientAdminUserManagementRequest {
  action: 'list' | 'get' | 'invite' | 'update' | 'assign_sites' | 'set_permissions' | 'audit_log';
  userId?: string;
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

    // Verify user is client admin
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Authentication failed');
    }

    const { data: clientUser, error: clientUserError } = await supabase
      .from('client_users')
      .select('client_id, is_client_admin')
      .eq('id', user.id)
      .single();

    if (clientUserError || !clientUser?.is_client_admin) {
      return new Response(
        JSON.stringify({ error: 'Access denied: client admin only' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const adminClientId = clientUser.client_id;
    const request: ClientAdminUserManagementRequest = await req.json();
    let result;

    switch (request.action) {
      case 'list': {
        const { data, error } = await supabase.rpc('client_admin_get_user_overview', {
          p_search: request.search || null,
          p_site_id: request.siteId || null,
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

        // Verify user belongs to admin's client
        const { data: targetUser, error: targetUserErr } = await supabase
          .from('client_users')
          .select(`
            *,
            roles:user_roles(role:roles(id, name)),
            sites:access_scopes(site:sites(id, nom), read_only),
            permissions:user_permissions(*)
          `)
          .eq('id', request.userId)
          .eq('client_id', adminClientId)
          .single();

        if (targetUserErr) throw targetUserErr;
        if (!targetUser) {
          throw new Error('User not found or access denied');
        }

        result = { user: targetUser };
        break;
      }

      case 'invite': {
        if (!request.userData?.email) {
          throw new Error('email required');
        }

        // Force client_id to admin's client
        const inviteData = {
          ...request.userData,
          client_id: adminClientId,
        };

        // Call invite edge function
        const { data, error } = await supabase.functions.invoke('invite-client-user', {
          body: inviteData,
        });

        if (error) throw error;

        // Log audit
        await supabase.rpc('log_user_management_action', {
          p_action_type: 'create',
          p_target_user_id: data.user_id,
          p_client_id: adminClientId,
          p_after_state: inviteData,
        });

        result = { user: data };
        break;
      }

      case 'update': {
        if (!request.userId || !request.userData) {
          throw new Error('userId and userData required');
        }

        // Verify user belongs to admin's client
        const { data: existingUser } = await supabase
          .from('client_users')
          .select('*')
          .eq('id', request.userId)
          .eq('client_id', adminClientId)
          .single();

        if (!existingUser) {
          throw new Error('User not found or access denied');
        }

        // Prevent changing is_client_admin and client_id
        const updateData: any = { ...request.userData };
        delete updateData.is_client_admin;

        const { data, error } = await supabase
          .from('client_users')
          .update(updateData)
          .eq('id', request.userId)
          .eq('client_id', adminClientId)
          .select()
          .single();

        if (error) throw error;

        // Log audit
        await supabase.rpc('log_user_management_action', {
          p_action_type: 'update',
          p_target_user_id: request.userId,
          p_client_id: adminClientId,
          p_before_state: existingUser,
          p_after_state: updateData,
        });

        result = { user: data };
        break;
      }

      case 'assign_sites': {
        if (!request.userId || !request.siteIds) {
          throw new Error('userId and siteIds required');
        }

        // Verify user belongs to admin's client
        const { data: targetUser } = await supabase
          .from('client_users')
          .select('client_id')
          .eq('id', request.userId)
          .single();

        if (targetUser?.client_id !== adminClientId) {
          throw new Error('Access denied: user not in your client');
        }

        // Validate all sites belong to admin's client
        if (request.siteIds.length > 0) {
          const { data: validSites } = await supabase
            .from('sites')
            .select('id')
            .eq('client_id', adminClientId)
            .in('id', request.siteIds);

          const validSiteIds = validSites?.map(s => s.id) || [];
          const invalidSites = request.siteIds.filter(id => !validSiteIds.includes(id));

          if (invalidSites.length > 0) {
            throw new Error('Invalid sites: some sites do not belong to your client');
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
          const { error } = await supabase
            .from('access_scopes')
            .insert(
              request.siteIds.map(siteId => ({
                user_id: request.userId,
                site_id: siteId,
                created_by: adminClientId,
              }))
            );

          if (error) throw error;
        }

        // Log audit
        await supabase.rpc('log_user_management_action', {
          p_action_type: 'site_assignment',
          p_target_user_id: request.userId,
          p_client_id: adminClientId,
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

        // Verify user and site belong to admin's client
        const { data: targetUser } = await supabase
          .from('client_users')
          .select('client_id')
          .eq('id', request.userId)
          .single();

        const { data: targetSite } = await supabase
          .from('sites')
          .select('client_id')
          .eq('id', request.siteId)
          .single();

        if (targetUser?.client_id !== adminClientId || targetSite?.client_id !== adminClientId) {
          throw new Error('Access denied: user or site not in your client');
        }

        // save_site_permissions now includes hierarchy validation internally
        const { error } = await supabase.rpc('save_site_permissions', {
          p_user_id: request.userId,
          p_site_id: request.siteId,
          p_client_id: adminClientId,
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
          .eq('client_id', adminClientId)
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
    console.error('Client admin user management error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
