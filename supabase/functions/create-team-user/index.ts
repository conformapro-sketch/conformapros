import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify the caller's JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !caller) {
      throw new Error('Unauthorized');
    }

    // Check if caller is Super Admin
    const { data: callerRoles, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('roles!inner(name)')
      .eq('user_id', caller.id)
      .eq('roles.name', 'Super Admin');

    if (roleError || !callerRoles || callerRoles.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Only Super Admins can create team users' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { email, password, nom, prenom, role_uuid, telephone } = await req.json();

    if (!email || !password || !role_uuid) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, password, role_uuid' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Creating team user:', { email, nom, prenom, role_uuid });

    // Create auth user using admin API (does NOT affect caller's session)
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        nom,
        prenom,
      },
    });

    if (createError) {
      console.error('Error creating auth user:', createError);
      throw createError;
    }

    if (!newUser.user) {
      throw new Error('User creation failed - no user returned');
    }

    console.log('Auth user created:', newUser.user.id);

    // Update profile with additional info
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        nom,
        prenom,
        telephone,
      })
      .eq('id', newUser.user.id);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      throw profileError;
    }

    console.log('Profile updated');

    // Assign role
    const { error: roleAssignError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: newUser.user.id,
        role_uuid,
      });

    if (roleAssignError) {
      console.error('Error assigning role:', roleAssignError);
      throw roleAssignError;
    }

    console.log('Role assigned');

    // Send password reset email so user can set their own password
    const { error: resetError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email);
    
    if (resetError) {
      console.warn('Warning: Could not send invite email:', resetError);
      // Don't fail the whole operation if email fails
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: newUser.user,
        message: 'User created successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in create-team-user function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
