-- Create secure function to get ConformaPro team users
CREATE OR REPLACE FUNCTION public.get_conforma_team_users()
RETURNS TABLE (
  id uuid,
  email text,
  nom text,
  prenom text,
  telephone text,
  actif boolean,
  created_at timestamptz,
  updated_at timestamptz,
  roles jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Authorization guard: only Super Admin can access
  IF NOT public.has_role(auth.uid(), 'Super Admin') THEN
    RAISE EXCEPTION 'Not authorized: only Super Admins can view internal users';
  END IF;
  
  -- Return internal ConformaPro users (those without managed_client_id)
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.nom,
    p.prenom,
    p.telephone,
    p.actif,
    p.created_at,
    p.updated_at,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', ur.id,
          'role_uuid', ur.role_uuid,
          'client_id', ur.client_id,
          'roles', jsonb_build_object(
            'id', r.id,
            'name', r.name,
            'description', r.description,
            'type', r.type
          )
        )
      ) FILTER (WHERE ur.id IS NOT NULL),
      '[]'::jsonb
    ) as roles
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON ur.user_id = p.id
  LEFT JOIN public.roles r ON r.id = ur.role_uuid
  WHERE p.managed_client_id IS NULL
  GROUP BY p.id, p.email, p.nom, p.prenom, p.telephone, p.actif, p.created_at, p.updated_at
  ORDER BY p.created_at DESC;
END;
$$;