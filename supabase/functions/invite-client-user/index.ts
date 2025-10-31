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
  clientId: string
  siteIds?: string[]
  tenantId?: string
  is_client_admin?: boolean
  password?: string
  send_reset?: boolean
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
    const { email, nom, prenom, telephone, clientId, siteIds, tenantId, is_client_admin, password, send_reset } = body

    console.log('invite-client-user: Request data', { email, nom, prenom, clientId, is_client_admin, hasPassword: !!password })

    // Validate required fields
    if (!email || !nom || !prenom || !clientId) {
      throw new Error('Missing required fields: email, nom, prenom, clientId')
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

      // Update password if provided
      if (password) {
        const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          { password }
        )
        if (passwordError) {
          console.error('invite-client-user: Failed to update password', passwordError)
        }
      }

      // Upsert client_users to handle case where auth user exists but profile doesn't
      const { error: profileError } = await supabaseAdmin
        .from('client_users')
        .upsert({ 
          id: userId,
          email,
          tenant_id: finalTenantId,
          client_id: clientId,
          is_client_admin: is_client_admin || false,
          nom,
          prenom,
          telephone: telephone || null,
          actif: true
        }, {
          onConflict: 'id'
        })

      if (profileError) {
        console.error('invite-client-user: Failed to upsert profile', profileError)
      }
    } else {
      // Create new user with provided or auto-generated password
      const userPassword = password || crypto.randomUUID()
      
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: userPassword,
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

      // Create client_users entry
      const { error: profileError } = await supabaseAdmin
        .from('client_users')
        .insert({
          id: userId,
          email,
          nom,
          prenom,
          telephone: telephone || null,
          tenant_id: finalTenantId,
          client_id: clientId,
          is_client_admin: is_client_admin || false,
          actif: true
        })

      if (profileError) {
        console.error('invite-client-user: Failed to create profile', profileError)
        // Don't throw, user is already created
      }

      // Send password reset email if no password was set or if explicitly requested
      if (!password || send_reset) {
        const { error: resetError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email
        })

        if (resetError) {
          console.error('invite-client-user: Failed to send reset email', resetError)
        }
      }
    }

    // Client users no longer use user_roles - they use individual permissions
    // Skip role assignment for client users
    console.log('invite-client-user: Client user created/updated', { userId, clientId, is_client_admin })

    // Delete existing access_scopes for this user to handle updates
    if (userExists) {
      console.log('invite-client-user: Deleting existing access scopes for user', userId)
      const { error: deleteError } = await supabaseAdmin
        .from('access_scopes')
        .delete()
        .eq('user_id', userId)
      
      if (deleteError) {
        console.error('invite-client-user: Failed to delete existing access scopes', deleteError)
        // Continue anyway, insert will handle conflicts
      }
    }

    // Create access_scopes for specified sites
    if (siteIds && siteIds.length > 0) {
      console.log('invite-client-user: Creating access scopes', { userId, siteIds, tenantId: finalTenantId })
      
      const accessScopes = siteIds.map(siteId => ({
        user_id: userId,
        site_id: siteId,
        tenant_id: finalTenantId,
        created_by: callingUser.id,
        read_only: false
      }))

      const { data: scopeData, error: scopeError } = await supabaseAdmin
        .from('access_scopes')
        .insert(accessScopes)
        .select()

      if (scopeError) {
        console.error('invite-client-user: FAILED to create access scopes', {
          error: scopeError,
          message: scopeError.message,
          details: scopeError.details,
          hint: scopeError.hint,
          code: scopeError.code
        })
        throw new Error(`Failed to assign sites: ${scopeError.message}`)
      } else {
        console.log('invite-client-user: Access scopes created successfully', {
          count: scopeData?.length,
          scopes: scopeData
        })
      }
    } else {
      console.log('invite-client-user: No sites to assign')
    }

    // Log audit trail to role_audit_logs
    const { error: auditError } = await supabaseAdmin
      .from('role_audit_logs')
      .insert({
        user_id: callingUser.id,
        action: userExists ? 'user_updated' : 'user_invited',
        entity_type: 'user',
        entity_id: userId,
        changes: {
          email,
          nom,
          prenom,
          clientId,
          is_client_admin: is_client_admin || false,
          siteIds: siteIds || [],
          tenantId: finalTenantId,
          passwordSet: !!password
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
        message: password
          ? 'Utilisateur créé avec succès. Il peut se connecter avec le mot de passe défini.'
          : userExists 
            ? 'Utilisateur mis à jour et assigné au client' 
            : 'Utilisateur invité avec succès. Il recevra un email pour définir son mot de passe.'
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