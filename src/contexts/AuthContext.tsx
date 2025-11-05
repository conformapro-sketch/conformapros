import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabaseAny as supabase } from "@/lib/supabase-any";
import { toast } from "sonner";
import { Role, RolePermission } from "@/types/roles";
import { slugifyRole } from "@/lib/utils";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  
  // New role system
  primaryRole: Role | null;
  allRoles: Role[];
  permissions: RolePermission[];
  
  // Backward compatibility
  userRole: string | null;
  userRoles: string[];
  tenantId: string | null;
  
  // Helper functions
  hasPermission: (module: string, action: string) => boolean;
  hasRole: (roleName: string) => boolean;
  isSuperAdmin: () => boolean;
  isTeamUser: () => boolean;
  isClientUser: () => boolean;
  getClientId: () => string | null;
  
  // Auth functions
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (
    email: string,
    password: string,
    metadata: { nom: string; prenom: string },
  ) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [primaryRole, setPrimaryRole] = useState<Role | null>(null);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);

  const fetchUserAccessContext = async (userId: string) => {
    setLoading(true);
    try {
      console.log('Fetching access context for user:', userId);

      // PRIORITY 1: Check for team roles FIRST (ConformaPro staff users)
      const { data: userRolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select(`
          role_uuid,
          client_id,
          site_scope,
          roles!inner(
            id,
            name,
            description,
            type,
            is_system,
            tenant_id,
            role_permissions(
              id,
              module,
              action,
              decision,
              scope
            )
          )
        `)
        .eq('user_id', userId)
        .eq('roles.type', 'team');

      if (rolesError && rolesError.code !== 'PGRST116') {
        console.error('Error fetching team roles:', rolesError);
      }

      // If user has team role(s), treat them as ConformaPro staff
      if (userRolesData && userRolesData.length > 0) {
        console.log('✓ User is ConformaPro staff with team role(s)');
        
        const roles: Role[] = userRolesData.map((ur: any) => ({
          ...ur.roles,
          user_count: 0,
          created_at: ur.roles.created_at,
          updated_at: ur.roles.updated_at,
        }));

        const allPermissions: RolePermission[] = userRolesData.flatMap((ur: any) => 
          ur.roles.role_permissions || []
        );

        const primary = roles[0] || null;

        // Get tenant_id from profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('tenant_id')
          .eq('id', userId)
          .maybeSingle();

        setPrimaryRole(primary);
        setAllRoles(roles);
        setPermissions(allPermissions);
        setUserRole(primary?.name || null);
        setUserRoles(roles.map(r => r.name));
        setTenantId(profile?.tenant_id || null);
        setClientId(null); // Team users don't have client_id
        setLoading(false);
        
        console.info(`✓ Staff identity: ${primary?.name} with ${roles.length} role(s)`);
        return;
      }

      // PRIORITY 2: Check if user is a client user (only if no team roles)
      const { data: clientUser, error: clientError } = await supabase
        .from('client_users')
        .select('id, client_id, is_client_admin, tenant_id')
        .eq('id', userId)
        .maybeSingle();

      if (clientError && clientError.code !== 'PGRST116') {
        throw clientError;
      }

      // If client user, create synthetic role and fetch individual permissions
      if (clientUser) {
        console.log('✓ User is a client user');
        
        const syntheticRole: Role = {
          id: clientUser.is_client_admin ? 'client_admin_synthetic' : 'client_user_synthetic',
          type: 'client',
          name: clientUser.is_client_admin ? 'Administrateur Client' : 'Utilisateur Client',
          description: clientUser.is_client_admin 
            ? 'Administrateur avec accès complet aux données du client'
            : 'Utilisateur avec accès limité aux données du client',
          is_system: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_count: 0,
        };

        // Fetch individual user permissions for client users
        const { data: userPermissions } = await supabase
          .from('user_permissions')
          .select('*')
          .eq('user_id', userId)
          .eq('client_id', clientUser.client_id);

        const individualPermissions: RolePermission[] = (userPermissions || []).map((p: any) => ({
          id: p.id,
          role_id: syntheticRole.id,
          module: p.module,
          action: p.action,
          decision: p.decision,
          scope: p.scope,
          created_at: p.created_at,
          updated_at: p.updated_at,
        }));

        setPrimaryRole(syntheticRole);
        setAllRoles([syntheticRole]);
        setPermissions(individualPermissions);
        setUserRole(syntheticRole.name);
        setUserRoles([syntheticRole.name]);
        setTenantId(clientUser.tenant_id || null);
        setClientId(clientUser.client_id);
        setLoading(false);
        
        console.info(`✓ Client identity: ${syntheticRole.name} for client ${clientUser.client_id} with ${individualPermissions.length} permissions`);
        return;
      }

      // PRIORITY 3: No team roles and no client user - fetch all roles (fallback)
      const { data: allUserRoles, error: allRolesError } = await supabase
        .from('user_roles')
        .select(`
          role_uuid,
          client_id,
          site_scope,
          roles!inner(
            id,
            name,
            description,
            type,
            is_system,
            tenant_id,
            role_permissions(
              id,
              module,
              action,
              decision,
              scope
            )
          )
        `)
        .eq('user_id', userId);

      if (allRolesError) throw allRolesError;

      // Extract roles and permissions
      const roles: Role[] = allUserRoles?.map((ur: any) => ({
        ...ur.roles,
        user_count: 0,
        created_at: ur.roles.created_at,
        updated_at: ur.roles.updated_at,
      })) || [];

      const allPermissions: RolePermission[] = allUserRoles?.flatMap((ur: any) => 
        ur.roles.role_permissions || []
      ) || [];

      // Set primary role (first one, prioritized by type)
      const primary = roles[0] || null;

      // Get tenant_id from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', userId)
        .maybeSingle();

      // Update state
      setPrimaryRole(primary);
      setAllRoles(roles);
      setPermissions(allPermissions);
      setUserRole(primary?.name || null);
      setUserRoles(roles.map(r => r.name));
      setTenantId(profile?.tenant_id || null);
      setClientId(null);
      setLoading(false);
      
      console.info(`✓ User identity resolved: ${primary?.name || 'No role'}`);
    } catch (err) {
      console.error("Error fetching user access context:", err);
      setPrimaryRole(null);
      setAllRoles([]);
      setPermissions([]);
      setUserRole(null);
      setUserRoles([]);
      setTenantId(null);
      setClientId(null);
      setLoading(false);
    }
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (nextSession?.user) {
        setTimeout(() => {
          fetchUserAccessContext(nextSession.user.id);
        }, 0);
      } else {
        setPrimaryRole(null);
        setAllRoles([]);
        setPermissions([]);
        setUserRole(null);
        setUserRoles([]);
        setTenantId(null);
        setClientId(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);

      if (initialSession?.user) {
        fetchUserAccessContext(initialSession.user.id);
      } else {
        setPrimaryRole(null);
        setAllRoles([]);
        setPermissions([]);
        setUserRole(null);
        setUserRoles([]);
        setTenantId(null);
        setClientId(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error("Erreur de connexion", {
        description: error.message,
      });
    }

    return { error };
  };

  const signUp = async (
    email: string,
    password: string,
    metadata: { nom: string; prenom: string },
  ) => {
    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: metadata,
      },
    });

    if (error) {
      toast.error("Erreur d'inscription", {
        description: error.message,
      });
    }

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setPrimaryRole(null);
    setAllRoles([]);
    setPermissions([]);
    setUserRole(null);
    setUserRoles([]);
    setTenantId(null);
    setClientId(null);
    toast.success("Deconnexion reussie");
  };

  const hasPermission = (module: string, action: string): boolean => {
    return permissions.some(
      p => p.module === module && p.action === action && p.decision === 'allow'
    );
  };

  const hasRole = (roleName: string): boolean => {
    if (loading) return false; // Prevent checks during loading
    const target = slugifyRole(roleName);
    const names = allRoles.map(r => r.name);
    const result = names.some(n => n === roleName || slugifyRole(n) === target);
    console.log('[hasRole]', { roleName, target, allRoles: names, result });
    return result;
  };

  const isSuperAdmin = (): boolean => {
    if (loading) return false;
    return primaryRole?.name === 'Super Admin';
  };

  const isTeamUser = (): boolean => {
    return primaryRole?.type === 'team';
  };

  const isClientUser = (): boolean => {
    return primaryRole?.type === 'client';
  };

  const getClientId = (): string | null => {
    return clientId;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        primaryRole,
        allRoles,
        permissions,
        userRole,
        userRoles,
        tenantId,
        hasPermission,
        hasRole,
        isSuperAdmin,
        isTeamUser,
        isClientUser,
        getClientId,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
