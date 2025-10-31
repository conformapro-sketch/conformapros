import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.78.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InviteUserRequest {
  email: string
  nom: string
  prenom: string
  telephone?: string
  role_uuid: string
  clientId: string
  siteIds?: string[]
  tenantId?: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('invite-client-user: Function invoked')

    // Create Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the calling user to verify permissions
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader }
        }
      }
    )

    const { data: { user: callingUser }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !callingUser) {
      console.error('invite-client-user: Auth error', authError)
      throw new Error('Unauthorized')
    }

    console.log('invite-client-user: Calling user', callingUser.id)

    // Parse request body
    const body: InviteUserRequest = await req.json()
    const { email, nom, prenom, telephone, role_uuid, clientId, siteIds, tenantId } = body

    console.log('invite-client-user: Request data', { email, nom, prenom, role_uuid, clientId })

    // Validate required fields
    if (!email || !nom || !prenom || !role_uuid || !clientId) {
      throw new Error('Missing required fields: email, nom, prenom, role_uuid, clientId')
    }

    // Validate that the role_uuid exists and is a client role
    const { data: roleCheck, error: roleCheckError } = await supabaseClient
      .from('roles')
      .select('id, name, type')
      .eq('id', role_uuid)
      .eq('type', 'client')
      .single()

    if (roleCheckError || !roleCheck) {
      console.error('invite-client-user: Invalid role_uuid', { role_uuid, error: roleCheckError })
      throw new Error('Invalid role specified')
    }

    // Verify calling user has permission to invite users for this client
    const { data: hasAccess } = await supabaseClient.rpc('has_client_access', {
      _user_id: callingUser.id,
      _client_id: clientId
    })

    if (!hasAccess) {
      console.error('invite-client-user: User does not have access to client', { userId: callingUser.id, clientId })
      throw new Error('You do not have permission to invite users for this client')
    }

    // Get client to retrieve tenant_id
    const { data: client, error: clientError } = await supabaseClient
      .from('clients')
      .select('tenant_id, nom')
      .eq('id', clientId)
      .single()

    if (clientError || !client) {
      console.error('invite-client-user: Failed to get client', clientError)
      throw new Error('Client not found')
    }

    const finalTenantId = tenantId || client.tenant_id
    console.log('invite-client-user: Using tenant_id', finalTenantId)

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabaseAdmin.auth.admin.listUsers()
    const userExists = existingUser?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase())

    let userId: string

    if (userExists) {
      console.log('invite-client-user: User already exists', userExists.id)
      userId = userExists.id

      // Update profile with tenant_id if needed
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ 
          tenant_id: finalTenantId,
          nom,
          prenom,
          telephone: telephone || null
        })
        .eq('id', userId)

      if (profileError) {
        console.error('invite-client-user: Failed to update profile', profileError)
      }
    } else {
      // Create new user with auto-generated password
      const tempPassword = crypto.randomUUID()
      
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          nom,
          prenom,
          telephone: telephone || null
        }
      })

      if (createError || !newUser.user) {
        console.error('invite-client-user: Failed to create user', createError)
        throw new Error(`Failed to create user: ${createError?.message}`)
      }

      userId = newUser.user.id
      console.log('invite-client-user: Created new user', userId)

      // Create profile
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          email,
          nom,
          prenom,
          telephone: telephone || null,
          tenant_id: finalTenantId
        })

      if (profileError) {
        console.error('invite-client-user: Failed to create profile', profileError)
        // Don't throw, user is already created
      }

      // Send password reset email so user can set their own password
      const { error: resetError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email
      })

      if (resetError) {
        console.error('invite-client-user: Failed to send reset email', resetError)
      }
    }

    // Create or update user_role using role_uuid
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .upsert({
        user_id: userId,
        role_uuid: role_uuid,
        client_id: clientId
      }, {
        onConflict: 'user_id,client_id'
      })

    if (roleError) {
      console.error('invite-client-user: Failed to assign role', roleError)
      throw new Error(`Failed to assign role: ${roleError.message}`)
    }

    console.log('invite-client-user: Role assigned', { userId, role_uuid, clientId })

    // Create access_scopes for specified sites
    if (siteIds && siteIds.length > 0) {
      const accessScopes = siteIds.map(siteId => ({
        user_id: userId,
        site_id: siteId,
        tenant_id: finalTenantId,
        created_by: callingUser.id,
        read_only: false
      }))

      const { error: scopeError } = await supabaseAdmin
        .from('access_scopes')
        .upsert(accessScopes, {
          onConflict: 'user_id,site_id'
        })

      if (scopeError) {
        console.error('invite-client-user: Failed to create access scopes', scopeError)
        // Don't throw, user is created
      } else {
        console.log('invite-client-user: Access scopes created', siteIds.length)
      }
    }

    // Log audit trail
    const { error: auditError } = await supabaseAdmin
      .from('audit_logs')
      .insert({
        user_id: callingUser.id,
        action: userExists ? 'user_updated' : 'user_invited',
        entity_type: 'user',
        entity_id: userId,
        changes: {
          email,
          nom,
          prenom,
          role_uuid,
          clientId,
          siteIds: siteIds || [],
          tenantId: finalTenantId
        },
        tenant_id: finalTenantId
      })

    if (auditError) {
      console.error('invite-client-user: Failed to log audit', auditError)
    }

    console.log('invite-client-user: Success', { userId, userExists: !!userExists })

    return new Response(
      JSON.stringify({
        success: true,
        userId,
        action: userExists ? 'updated' : 'created',
        message: userExists 
          ? 'User updated and assigned to client' 
          : 'User invited successfully. They will receive an email to set their password.'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('invite-client-user: Error', error)
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
