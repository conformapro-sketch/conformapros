-- PHASE 1: Assign sites to existing client users
INSERT INTO access_scopes (user_id, site_id, tenant_id, read_only, created_by)
VALUES 
  -- Assign nouha@liquide.com to all 3 sites
  ('51610544-c557-43d8-9f7e-68f3164a0904', 'e8349df8-98aa-497e-8482-8ac6575d9867', '00000000-0000-0000-0000-000000000001', false, '51610544-c557-43d8-9f7e-68f3164a0904'),
  ('51610544-c557-43d8-9f7e-68f3164a0904', 'b7ec1df1-5d5b-4e13-b570-d604f56526ca', '00000000-0000-0000-0000-000000000001', false, '51610544-c557-43d8-9f7e-68f3164a0904'),
  ('51610544-c557-43d8-9f7e-68f3164a0904', '64912bf4-8899-43d0-988b-74abb411947c', '00000000-0000-0000-0000-000000000001', false, '51610544-c557-43d8-9f7e-68f3164a0904'),
  -- Assign ali@liquide.com (client admin) to all 3 sites
  ('6d34f22a-e988-41dc-b3f0-5ab69fd7ec25', 'e8349df8-98aa-497e-8482-8ac6575d9867', '00000000-0000-0000-0000-000000000001', false, '6d34f22a-e988-41dc-b3f0-5ab69fd7ec25'),
  ('6d34f22a-e988-41dc-b3f0-5ab69fd7ec25', 'b7ec1df1-5d5b-4e13-b570-d604f56526ca', '00000000-0000-0000-0000-000000000001', false, '6d34f22a-e988-41dc-b3f0-5ab69fd7ec25'),
  ('6d34f22a-e988-41dc-b3f0-5ab69fd7ec25', '64912bf4-8899-43d0-988b-74abb411947c', '00000000-0000-0000-0000-000000000001', false, '6d34f22a-e988-41dc-b3f0-5ab69fd7ec25')
ON CONFLICT (user_id, site_id) DO NOTHING;

-- PHASE 2: Add unique constraint to access_scopes (if not already there)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'access_scopes_user_site_unique'
  ) THEN
    ALTER TABLE access_scopes 
    ADD CONSTRAINT access_scopes_user_site_unique 
    UNIQUE (user_id, site_id);
  END IF;
END $$;

-- PHASE 2: Add RLS policies for access_scopes INSERT operations
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'access_scopes' 
    AND policyname = 'AccessScopes: super_admin can insert'
  ) THEN
    CREATE POLICY "AccessScopes: super_admin can insert"
    ON access_scopes
    FOR INSERT
    TO authenticated
    WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'access_scopes' 
    AND policyname = 'AccessScopes: client_admin can insert own tenant'
  ) THEN
    CREATE POLICY "AccessScopes: client_admin can insert own tenant"
    ON access_scopes
    FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM client_users cu
        WHERE cu.id = auth.uid()
          AND cu.tenant_id = access_scopes.tenant_id
          AND cu.is_client_admin = true
      )
    );
  END IF;
END $$;

-- PHASE 5: Add RLS policies for user_permissions table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_permissions' 
    AND policyname = 'UserPermissions: super_admin full access'
  ) THEN
    CREATE POLICY "UserPermissions: super_admin full access"
    ON user_permissions
    FOR ALL
    TO authenticated
    USING (has_role(auth.uid(), 'super_admin'::app_role))
    WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_permissions' 
    AND policyname = 'UserPermissions: client_admin can manage own tenant'
  ) THEN
    CREATE POLICY "UserPermissions: client_admin can manage own tenant"
    ON user_permissions
    FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM client_users cu
        WHERE cu.id = auth.uid()
          AND cu.client_id = user_permissions.client_id
          AND cu.is_client_admin = true
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM client_users cu
        WHERE cu.id = auth.uid()
          AND cu.client_id = user_permissions.client_id
          AND cu.is_client_admin = true
      )
    );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_permissions' 
    AND policyname = 'UserPermissions: users can view own'
  ) THEN
    CREATE POLICY "UserPermissions: users can view own"
    ON user_permissions
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());
  END IF;
END $$;