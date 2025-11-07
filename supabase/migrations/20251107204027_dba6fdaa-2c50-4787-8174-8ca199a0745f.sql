-- 1. Update FK: user_domain_scopes.user_id -> client_users(id)
ALTER TABLE public.user_domain_scopes
  DROP CONSTRAINT IF EXISTS user_domain_scopes_user_id_fkey;

ALTER TABLE public.user_domain_scopes
  ADD CONSTRAINT user_domain_scopes_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.client_users(id) ON DELETE CASCADE;

-- 2. Drop old RLS policies
DROP POLICY IF EXISTS "UserDomainScopes: client admin can manage own client users" ON public.user_domain_scopes;
DROP POLICY IF EXISTS "UserDomainScopes: super_admin can manage all" ON public.user_domain_scopes;
DROP POLICY IF EXISTS "UserDomainScopes: users can view their own" ON public.user_domain_scopes;

-- 3. Create clean RLS policies
CREATE POLICY "UserDomainScopes: super_admin all"
ON public.user_domain_scopes
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "UserDomainScopes: client_admin manage same client"
ON public.user_domain_scopes
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.client_users target
    JOIN public.client_users actor ON actor.id = auth.uid()
    WHERE target.id = user_domain_scopes.user_id
      AND actor.client_id = target.client_id
      AND actor.is_client_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.client_users target
    JOIN public.client_users actor ON actor.id = auth.uid()
    WHERE target.id = user_domain_scopes.user_id
      AND actor.client_id = target.client_id
      AND actor.is_client_admin = true
  )
);

CREATE POLICY "UserDomainScopes: users view own"
ON public.user_domain_scopes
FOR SELECT
USING (user_id = auth.uid());

-- 4. Replace RPC function with client_users authorization
CREATE OR REPLACE FUNCTION public.set_user_domain_scopes(
  target_user_id UUID,
  domaine_ids UUID[]
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _target_client_id UUID;
  _actor_is_admin BOOLEAN;
BEGIN
  -- Find target user's client
  SELECT client_id INTO _target_client_id
  FROM public.client_users
  WHERE id = target_user_id;

  -- Authorization: super_admin or client admin of same client
  SELECT EXISTS (
    SELECT 1 FROM public.client_users
    WHERE id = auth.uid()
      AND client_id = _target_client_id
      AND is_client_admin = true
  ) INTO _actor_is_admin;

  IF NOT (_actor_is_admin OR has_role(auth.uid(), 'super_admin'::app_role)) THEN
    RAISE EXCEPTION 'Not authorized to manage domain scopes for this user';
  END IF;

  -- Atomic replacement of domains
  DELETE FROM public.user_domain_scopes
  WHERE user_id = target_user_id;

  IF domaine_ids IS NOT NULL AND array_length(domaine_ids, 1) > 0 THEN
    INSERT INTO public.user_domain_scopes (user_id, domaine_id, decision)
    SELECT target_user_id, unnest(domaine_ids), 'allow';
  END IF;

  -- Audit log
  INSERT INTO public.role_audit_logs (user_id, action, entity_type, entity_id, changes)
  VALUES (
    auth.uid(),
    'update_domain_scopes',
    'user',
    target_user_id,
    jsonb_build_object('domaine_ids', domaine_ids)
  );
END;
$$;