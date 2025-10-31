-- Phase 1: Add Client Admin Flag and User Limit
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_client_admin BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS managed_client_id UUID REFERENCES clients(id);

CREATE INDEX IF NOT EXISTS idx_profiles_managed_client ON profiles(managed_client_id);
CREATE INDEX IF NOT EXISTS idx_profiles_client_admin ON profiles(is_client_admin) WHERE is_client_admin = true;

ALTER TABLE clients
ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS max_users_notes TEXT;

COMMENT ON COLUMN clients.max_users IS 'Maximum number of client users allowed for this client';
COMMENT ON COLUMN profiles.managed_client_id IS 'Client ID this user belongs to (for client users only)';
COMMENT ON COLUMN profiles.is_client_admin IS 'Whether this client user is an administrator for their client';

-- Phase 2: Create User Permissions Table
CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  decision permission_decision NOT NULL DEFAULT 'allow',
  scope permission_scope NOT NULL DEFAULT 'tenant',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  
  UNIQUE(user_id, client_id, module, action)
);

CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_client ON user_permissions(client_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_lookup ON user_permissions(user_id, module, action);

-- Phase 3: Create Permission Check Functions
CREATE OR REPLACE FUNCTION has_user_permission(
  _user_id UUID, 
  _module TEXT, 
  _action TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_permissions
    WHERE user_id = _user_id
      AND module = _module
      AND action = _action
      AND decision = 'allow'
  );
$$;

CREATE OR REPLACE FUNCTION can_manage_client_user(
  _actor_id UUID,
  _target_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _actor_is_client_admin BOOLEAN;
  _actor_client_id UUID;
  _target_client_id UUID;
  _target_is_admin BOOLEAN;
BEGIN
  -- Super Admin can manage everyone
  IF has_role(_actor_id, 'super_admin'::app_role) THEN
    RETURN TRUE;
  END IF;
  
  -- Get actor info
  SELECT is_client_admin, managed_client_id 
  INTO _actor_is_client_admin, _actor_client_id
  FROM profiles
  WHERE id = _actor_id;
  
  -- Actor must be a client admin
  IF NOT _actor_is_client_admin THEN
    RETURN FALSE;
  END IF;
  
  -- Get target user info
  SELECT is_client_admin, managed_client_id
  INTO _target_is_admin, _target_client_id
  FROM profiles
  WHERE id = _target_user_id;
  
  -- Must be same client
  IF _actor_client_id != _target_client_id THEN
    RETURN FALSE;
  END IF;
  
  -- Client Admin cannot manage other Client Admins
  IF _target_is_admin THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION get_client_user_count(_client_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM profiles
  WHERE managed_client_id = _client_id
    AND actif = true;
$$;

CREATE OR REPLACE FUNCTION check_client_user_limit(_client_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _current_count INTEGER;
  _max_users INTEGER;
BEGIN
  SELECT max_users INTO _max_users
  FROM clients
  WHERE id = _client_id;
  
  SELECT get_client_user_count(_client_id) INTO _current_count;
  
  RETURN _current_count < _max_users;
END;
$$;

-- Phase 4: RLS Policies for user_permissions
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "UserPermissions: super_admin full access" ON user_permissions;
CREATE POLICY "UserPermissions: super_admin full access"
ON user_permissions
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

DROP POLICY IF EXISTS "UserPermissions: client_admin manage subordinates" ON user_permissions;
CREATE POLICY "UserPermissions: client_admin manage subordinates"
ON user_permissions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
      AND p.is_client_admin = true
      AND p.managed_client_id = user_permissions.client_id
  )
  AND NOT EXISTS (
    SELECT 1 FROM profiles target
    WHERE target.id = user_permissions.user_id
      AND target.is_client_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
      AND p.is_client_admin = true
      AND p.managed_client_id = user_permissions.client_id
  )
  AND NOT EXISTS (
    SELECT 1 FROM profiles target
    WHERE target.id = user_permissions.user_id
      AND target.is_client_admin = true
  )
);

DROP POLICY IF EXISTS "UserPermissions: users view own" ON user_permissions;
CREATE POLICY "UserPermissions: users view own"
ON user_permissions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Phase 5: Archive Client Roles
UPDATE roles
SET archived_at = NOW(),
    updated_at = NOW()
WHERE type = 'client'
  AND archived_at IS NULL;

-- Phase 6: Trigger to Enforce User Limit
CREATE OR REPLACE FUNCTION enforce_client_user_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  _can_add BOOLEAN;
BEGIN
  IF NEW.managed_client_id IS NOT NULL AND NEW.actif = true THEN
    SELECT check_client_user_limit(NEW.managed_client_id) INTO _can_add;
    
    IF NOT _can_add THEN
      RAISE EXCEPTION 'Client user limit reached. Contact ConformaPro to increase limit.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_client_user_limit_trigger ON profiles;
CREATE TRIGGER check_client_user_limit_trigger
BEFORE INSERT ON profiles
FOR EACH ROW
WHEN (NEW.managed_client_id IS NOT NULL AND NEW.actif = true)
EXECUTE FUNCTION enforce_client_user_limit();