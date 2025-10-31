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

  const fetchUserAccessContext = async (userId: string) => {
    setLoading(true);
    try {
      // Fetch user roles with full role details and permissions
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
        .eq('user_id', userId);

      if (rolesError) throw rolesError;

      // Extract roles and permissions
      const roles: Role[] = userRolesData?.map((ur: any) => ({
        ...ur.roles,
        user_count: 0,
        created_at: ur.roles.created_at,
        updated_at: ur.roles.updated_at,
      })) || [];

      const allPermissions: RolePermission[] = userRolesData?.flatMap((ur: any) => 
        ur.roles.role_permissions || []
      ) || [];

      // Set primary role (first one, prioritized by type)
      const primary = roles[0] || null;

      // Get tenant_id from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', userId)
        .single();

      // Update state
      setPrimaryRole(primary);
      setAllRoles(roles);
      setPermissions(allPermissions);
      setUserRole(primary?.name || null);
      setUserRoles(roles.map(r => r.name));
      setTenantId(profile?.tenant_id || null);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching user access context:", err);
      setPrimaryRole(null);
      setAllRoles([]);
      setPermissions([]);
      setUserRole(null);
      setUserRoles([]);
      setTenantId(null);
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

  const isTeamUser = (): boolean => {
    return primaryRole?.type === 'team';
  };

  const isClientUser = (): boolean => {
    return primaryRole?.type === 'client';
  };

  const getClientId = (): string | null => {
    return isClientUser() ? tenantId : null;
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
