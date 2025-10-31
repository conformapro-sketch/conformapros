import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabaseAny as supabase } from "@/lib/supabase-any";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: string | null;
  userRoles: string[];
  tenantId: string | null;
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
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [tenantId, setTenantId] = useState<string | null>(null);

  const fetchUserAccessContext = async (userId: string) => {
    try {
      const [rolesResponse, profileResponse] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", userId),
        supabase
          .from("profiles")
          .select("tenant_id")
          .eq("id", userId)
          .maybeSingle(),
      ]);

      const { data: roleData, error: roleError } = rolesResponse;
      const { data: profileData, error: profileError } = profileResponse;

      if (roleError) {
        console.error("Error fetching user role:", roleError);
        setUserRole(null);
        setUserRoles([]);
      } else {
        const roles = (roleData ?? [])
          .map((entry) => entry.role as string)
          .filter((r) => !!r);
        setUserRoles(roles as string[]);
        setUserRole((roles as string[])[0] ?? null);
      }

      if (profileError) {
        console.error("Error fetching tenant context:", profileError);
        setTenantId(null);
      } else {
        setTenantId(profileData?.tenant_id ?? null);
      }
    } catch (err) {
      console.error("Error fetching user access context:", err);
      setUserRole(null);
      setUserRoles([]);
      setTenantId(null);
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
        setUserRole(null);
        setUserRoles([]);
        setTenantId(null);
      }

      setLoading(false);
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
    setUserRole(null);
    setUserRoles([]);
    setTenantId(null);
    toast.success("Deconnexion reussie");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        userRole,
        userRoles,
        tenantId,
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

