import { supabaseAny as supabase } from "@/lib/supabase-any";
import type { Database } from "@/types/db";
import type { PermissionScope } from "@/types/roles";

type Json = Database["public"]["Tables"]["audit_logs"]["Insert"]["details"];

let cachedTenantId: string | null = null;
let tenantIdPromise: Promise<string> | null = null;

const resetTenantCache = () => {
  cachedTenantId = null;
  tenantIdPromise = null;
};

supabase.auth.onAuthStateChange(() => {
  resetTenantCache();
});

export const getCurrentTenantId = async (): Promise<string> => {
  if (cachedTenantId) {
    return cachedTenantId;
  }

  if (!tenantIdPromise) {
    tenantIdPromise = (async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        resetTenantCache();
        throw userError;
      }

      if (!user) {
        resetTenantCache();
        throw new Error("Utilisateur non authentifié");
      }

      const { data, error } = await (supabase as any).rpc("get_user_tenant_id", {
        _user_id: user.id,
      });

      if (error || !data) {
        resetTenantCache();
        throw error ?? new Error("Impossible de récupérer le tenant courant");
      }

      cachedTenantId = data as string;
      return data as string;
    })();
  }

  return tenantIdPromise;
};

const getCurrentUserId = async (): Promise<string | null> => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error("Unable to resolve current user id", error);
    return null;
  }

  return user?.id ?? null;
};

const withTenantGuard = <T extends Record<string, unknown>>(payload: T): T => {
  if ("tenant_id" in payload) {
    const clone = { ...payload } as Record<string, unknown>;
    delete clone.tenant_id;
    return clone as T;
  }
  return payload;
};

// ==================== CLIENTS ====================

type ClientRow = Database["public"]["Tables"]["clients"]["Row"];
type ClientInsert = Database["public"]["Tables"]["clients"]["Insert"];
type ClientUpdate = Database["public"]["Tables"]["clients"]["Update"];

export const fetchClients = async () => {
  const tenantId = await getCurrentTenantId();

  const { data, error } = await (supabase as any)
    .from("clients")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("nom_legal");
  
  if (error) throw error;
  return data;
};

export const fetchClientById = async (clientId: string) => {
  const tenantId = await getCurrentTenantId();

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .eq("tenant_id", tenantId)
    .single();
  
  if (error) throw error;
  return data;
};

export const createClient = async (client: ClientInsert) => {
  const tenantId = await getCurrentTenantId();

  const payload: ClientInsert = {
    ...client,
    tenant_id: tenantId,
    nom: client.nom ?? client.nom_legal ?? `Client ${new Date().getTime()}`,
    nom_legal: client.nom_legal ?? client.nom ?? "",
    billing_mode: client.billing_mode ?? "client",
    currency: client.currency ?? "TND",
    is_active: client.is_active ?? true,
  };

  const { data, error } = await supabase
    .from("clients")
    .insert(payload)
    .select()
    .single();

  if (error || !data) throw error;

  const actorId = await getCurrentUserId();
  await logAudit(actorId, data.id, "client_created", {
    client_id: data.id,
    nom_legal: data.nom_legal,
    billing_mode: data.billing_mode,
  });

  return data;
};

export const updateClient = async (
  clientId: string,
  updates: ClientUpdate
) => {
  const safeUpdates = withTenantGuard(updates);
  
  // Keep nom and nom_legal in sync
  if (safeUpdates.nom_legal && !safeUpdates.nom) {
    safeUpdates.nom = safeUpdates.nom_legal;
  } else if (safeUpdates.nom && !safeUpdates.nom_legal) {
    safeUpdates.nom_legal = safeUpdates.nom;
  }

  const { data, error } = await supabase
    .from("clients")
    .update(safeUpdates)
    .eq("id", clientId)
    .select()
    .single();

  if (error || !data) throw error;

  const actorId = await getCurrentUserId();
  const sanitizedUpdates = JSON.parse(
    JSON.stringify(safeUpdates ?? {}),
  ) as Json;
  await logAudit(actorId, clientId, "client_updated", {
    client_id: clientId,
    changes: sanitizedUpdates,
  });

  return data;
};

export const deleteClient = async (clientId: string) => {
  const { error } = await supabase
    .from("clients")
    .delete()
    .eq("id", clientId);
  
  if (error) throw error;

  const actorId = await getCurrentUserId();
  await logAudit(actorId, clientId, "client_deleted", { client_id: clientId });
};

// ==================== SITES ====================

type SiteRow = Database["public"]["Tables"]["sites"]["Row"];
type SiteInsert = Database["public"]["Tables"]["sites"]["Insert"];
type SiteUpdate = Database["public"]["Tables"]["sites"]["Update"];

export const fetchSites = async () => {
  const { data, error } = await supabase
    .from("sites")
    .select("*, clients!inner(nom_legal, tenant_id)")
    .order("nom_site");
  
  if (error) throw error;
  return data;
};

export const fetchSitesByClient = async (clientId: string) => {
  const { data, error } = await supabase
    .from("sites")
    .select("*")
    .eq("client_id", clientId)
    .order("nom_site");
  
  if (error) throw error;
  return data;
};

export const fetchSiteById = async (siteId: string) => {
  const { data, error } = await supabase
    .from("sites")
    .select("*, clients(nom_legal)")
    .eq("id", siteId)
    .single();
  
  if (error) throw error;
  return data;
};

export const createSite = async (site: SiteInsert) => {
  // Fetch client's tenant_id for multi-tenant isolation
  const { data: client } = await supabase
    .from("clients")
    .select("tenant_id")
    .eq("id", site.client_id)
    .single();

  const payload: SiteInsert = {
    ...site,
    nom: site.nom_site ?? site.nom ?? "",
    nom_site: site.nom_site ?? site.nom ?? "",
    
    tenant_id: client?.tenant_id ?? null,
  };

  const { data, error } = await supabase
    .from("sites")
    .insert(payload)
    .select()
    .single();

  if (error || !data) throw error;

  const actorId = await getCurrentUserId();
  await logAudit(actorId, data.client_id, "site_created", {
    site_id: data.id,
    nom_site: data.nom_site,
    client_id: data.client_id,
  }, { siteId: data.id, entity: "site", entityId: data.id });

  return data;
};

export const updateSite = async (siteId: string, updates: SiteUpdate) => {
  const safeUpdates = withTenantGuard(updates);
  
  // Sync nom with nom_site if either changes
  if (safeUpdates.nom_site && !safeUpdates.nom) {
    safeUpdates.nom = safeUpdates.nom_site;
  } else if (safeUpdates.nom && !safeUpdates.nom_site) {
    safeUpdates.nom_site = safeUpdates.nom;
  }

  const { data, error } = await supabase
    .from("sites")
    .update(safeUpdates)
    .eq("id", siteId)
    .select()
    .single();
  
  if (error || !data) throw error;

  const actorId = await getCurrentUserId();
  const sanitizedUpdates = JSON.parse(
    JSON.stringify(safeUpdates ?? {}),
  ) as Json;

  await logAudit(actorId, data.client_id, "site_updated", {
    site_id: data.id,
    client_id: data.client_id,
    changes: sanitizedUpdates,
  }, { siteId: data.id, entity: "site", entityId: data.id });

  return data;
};

export const deleteSite = async (siteId: string) => {
  const tenantId = await getCurrentTenantId();

  const { data, error } = await supabase
    .from("sites")
    .select("client_id")
    .eq("id", siteId)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error) throw error;

  const { error: deleteError } = await supabase
    .from("sites")
    .delete()
    .eq("id", siteId)
    .eq("tenant_id", tenantId);
  
  if (deleteError) throw deleteError;

  const actorId = await getCurrentUserId();
  await logAudit(actorId, data?.client_id ?? null, "site_deleted", {
    site_id: siteId,
  }, { siteId: siteId, entity: "site", entityId: siteId });
};

// ==================== AUDIT LOGS ====================

type AuditLogInsert = Database["public"]["Tables"]["audit_logs"]["Insert"];

export const logAudit = async (
  actorId: string | null,
  clientId: string | null,
  action: string,
  details: Record<string, unknown> = {},
  options: {
    siteId?: string | null;
    entity?: string;
    entityId?: string | null;
  } = {},
) => {
  try {
    const tenantId = await getCurrentTenantId();
    const resolvedSiteId = options.siteId ?? null;
    const resolvedEntity =
      options.entity ??
      (resolvedSiteId ? "site" : clientId ? "client" : "system");
    const resolvedEntityId =
      options.entityId ?? resolvedSiteId ?? clientId ?? null;

    const safeDetails = JSON.parse(
      JSON.stringify(details ?? {}),
    ) as Json;

    const payload: AuditLogInsert = {
      tenant_id: tenantId,
      action,
      actor_id: actorId,
      client_id: clientId,
      site_id: resolvedSiteId,
      entity: resolvedEntity,
      entity_id: resolvedEntityId,
      details: safeDetails,
    };

    const { error } = await supabase.from("audit_logs").insert(payload);

    if (error) {
      console.error("Failed to persist audit log", error);
    }
  } catch (error) {
    console.error("Audit log skipped", error);
  }
};

// ==================== UTILISATEURS CLIENTS (PROFILES) ====================

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export const fetchUtilisateurs = async () => {
  const { data, error } = await supabase
    .from("profiles")
    .select(`
      *,
      clients(nom_legal),
      sites(nom_site),
      user_roles!left(
        role_uuid,
        roles(name, id, type)
      )
    `)
    .order("nom");
  
  if (error) throw error;
  return data;
};

export const fetchUtilisateursByClient = async (clientId: string) => {
  const { data, error } = await supabase
    .from("profiles")
    .select(`
      *,
      sites(nom_site),
      user_roles!left(
        role_uuid,
        roles(name, id, type)
      )
    `)
    .eq("client_id", clientId)
    .order("nom");
  
  if (error) throw error;
  return data;
};

export const fetchAllClientUsers = async (filters?: {
  search?: string;
  clientId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}) => {
  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 20;

  const { data, error } = await supabase.rpc("get_all_client_users", {
    search_term: filters?.search || null,
    filter_client_id: filters?.clientId || null,
    filter_status: filters?.status || null,
    page_num: page,
    page_size: pageSize,
  });

  if (error) throw error;

  const results = data || [];
  const totalCount = results[0]?.total_count || 0;

  return {
    data: results.map((row: any) => ({
      ...row,
      clients: row.client_data,
      user_roles: row.roles_data,
      access_scopes: row.sites_data,
    })),
    count: totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize),
  };
};

export const fetchUtilisateurById = async (utilisateurId: string) => {
  const { data, error } = await supabase
    .from("profiles")
    .select(`
      *,
      clients(nom_legal),
      sites(nom_site),
      user_roles!left(
        role_uuid,
        roles(name, id, type)
      )
    `)
    .eq("id", utilisateurId)
    .single();
  
  if (error) throw error;
  return data;
};

export const updateUtilisateur = async (utilisateurId: string, updates: ProfileUpdate) => {
  const { data, error } = await supabase
    .from("profiles")
    .update(withTenantGuard(updates))
    .eq("id", utilisateurId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const toggleUtilisateurActif = async (utilisateurId: string, actif: boolean) => {
  const { data, error } = await supabase
    .from("client_users")
    .update({ actif })
    .eq("id", utilisateurId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};


// ==================== ACCESS SCOPES ====================

type AccessScopeRow = Database["public"]["Tables"]["access_scopes"]["Row"];
type AccessScopeInsert = Database["public"]["Tables"]["access_scopes"]["Insert"];
type AccessScopeUpdate = Database["public"]["Tables"]["access_scopes"]["Update"];

export const fetchAccessScopes = async () => {
  const { data, error } = await supabase
    .from("access_scopes")
    .select(`
      *,
      profiles(nom, prenom, email),
      sites(nom_site, clients(nom_legal))
    `)
    .order("created_at", { ascending: false });
  
  if (error) throw error;
  return data;
};

export const fetchAccessScopesByUser = async (utilisateurId: string) => {
  const { data, error } = await supabase
    .from("access_scopes")
    .select(`
      *,
      sites(nom_site, client_id, clients(nom_legal))
    `)
    .eq("utilisateur_id", utilisateurId);
  
  if (error) throw error;
  return data;
};

export const fetchAccessScopesBySite = async (siteId: string) => {
  const { data, error } = await supabase
    .from("access_scopes")
    .select(`
      *,
      profiles(nom, prenom, email, fonction)
    `)
    .eq("site_id", siteId);
  
  if (error) throw error;
  return data;
};

export const createAccessScope = async (scope: AccessScopeInsert) => {
  const { data, error } = await supabase
    .from("access_scopes")
    .insert(withTenantGuard(scope))
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateAccessScope = async (scopeId: string, updates: AccessScopeUpdate) => {
  const { data, error } = await supabase
    .from("access_scopes")
    .update(updates)
    .eq("id", scopeId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteAccessScope = async (scopeId: string) => {
  const { error } = await supabase
    .from("access_scopes")
    .delete()
    .eq("id", scopeId);
  
  if (error) throw error;
};

export const grantSiteAccess = async (utilisateurId: string, siteId: string, readOnly: boolean = false) => {
  return createAccessScope({
    utilisateur_id: utilisateurId,
    site_id: siteId,
    read_only: readOnly,
  });
};

export const revokeSiteAccess = async (utilisateurId: string, siteId: string) => {
  const { error } = await supabase
    .from("access_scopes")
    .delete()
    .eq("utilisateur_id", utilisateurId)
    .eq("site_id", siteId);
  
  if (error) throw error;
};

// ==================== INTEGRITY CHECKS ====================

export const runIntegrityChecks = async () => {
  const { data, error } = await supabase.rpc('run_integrity_checks');
  
  if (error) throw error;
  return data;
};

// ==================== MODULES SYSTEM ====================

type ModuleSystemeRow = Database["public"]["Tables"]["modules_systeme"]["Row"];
type SiteModuleRow = Database["public"]["Tables"]["site_modules"]["Row"];
type SiteModuleInsert = Database["public"]["Tables"]["site_modules"]["Insert"];
type SiteVeilleDomaineRow = Database["public"]["Tables"]["site_veille_domaines"]["Row"];
type SiteVeilleDomaineInsert = Database["public"]["Tables"]["site_veille_domaines"]["Insert"];

export const listModulesSysteme = async () => {
  const { data, error } = await supabase
    .from("modules_systeme")
    .select("*")
    .eq("actif", true)
    .order("libelle");
  
  if (error) throw error;
  return data;
};

export const listSiteModules = async (siteId: string) => {
  const { data, error } = await supabase
    .from("site_modules")
    .select(`
      *,
      modules_systeme(code, libelle, description)
    `)
    .eq("site_id", siteId);
  
  if (error) throw error;
  return data;
};

export const toggleSiteModule = async (
  siteId: string, 
  moduleCode: string, 
  enabled: boolean,
  userId?: string
) => {
  // First, get the module_id by code
  const { data: module, error: moduleError } = await supabase
    .from("modules_systeme")
    .select("id")
    .eq("code", moduleCode)
    .single();
  
  if (moduleError) throw moduleError;
  if (!module) throw new Error(`Module ${moduleCode} not found`);

  // Upsert site_modules
  const { data, error } = await supabase
    .from("site_modules")
    .upsert({
      site_id: siteId,
      module_id: module.id,
      enabled,
      enabled_by: userId,
      enabled_at: new Date().toISOString(),
    }, {
      onConflict: "site_id,module_id"
    })
    .select()
    .single();
  
  if (error) throw error;

  // If disabling VEILLE module, disable all veille domains
  if (moduleCode === 'VEILLE' && !enabled) {
    const { error: disableError } = await supabase
      .from("site_veille_domaines")
      .update({ enabled: false })
      .eq("site_id", siteId);
    
    if (disableError) throw disableError;
  }

  return data;
};

export const listDomaines = async () => {
  const { data, error } = await supabase
    .from("domaines_reglementaires")
    .select("*")
    .eq("actif", true)
    .is("deleted_at", null)
    .order("libelle");
  
  if (error) throw error;
  return data;
};

export const listSiteVeilleDomaines = async (siteId: string) => {
  const { data, error } = await supabase
    .from("site_veille_domaines")
    .select(`
      *,
      domaines_reglementaires(code, libelle, description)
    `)
    .eq("site_id", siteId);
  
  if (error) throw error;
  return data;
};

export const toggleSiteVeilleDomaine = async (
  siteId: string, 
  domaineId: string, 
  enabled: boolean
) => {
  const { data, error } = await supabase
    .from("site_veille_domaines")
    .upsert({
      site_id: siteId,
      domaine_id: domaineId,
      enabled,
    }, {
      onConflict: "site_id,domaine_id"
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// ==================== ADDRESS REFERENCE DATA ====================

export const listGouvernorats = async () => {
  const { data, error } = await supabase
    .from("gouvernorats")
    .select("*")
    .order("nom");
  
  if (error) throw error;
  return data;
};

export const listDelegationsByGouvernorat = async (gouvernoratId: string) => {
  const { data, error } = await supabase
    .from("delegations")
    .select("*")
    .eq("gouvernorat_id", gouvernoratId)
    .order("nom");
  
  if (error) throw error;
  return data;
};

export const listLocalitesByDelegation = async (delegationId: string) => {
  const { data, error } = await supabase
    .from("localites")
    .select("*")
    .eq("delegation_id", delegationId)
    .order("nom");
  
  if (error) throw error;
  return data;
};

// ==================== VEILLE / EVALUATION (site_article_status) ====================

type SiteArticleStatusRow = Database["public"]["Tables"]["site_article_status"]["Row"];
type SiteArticleStatusInsert = Database["public"]["Tables"]["site_article_status"]["Insert"];
type SiteArticleStatusUpdate = Database["public"]["Tables"]["site_article_status"]["Update"];

export const fetchEvaluation = async (params: {
  siteId: string;
  domaine?: string | null;
  sousDomaine?: string | null;
  status?: string | null;
  applicability?: string | null;
  search?: string | null;
  page?: number;
  pageSize?: number;
  updatedWithinDays?: number | null;
}) => {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 50;

  // Base query: join articles with site status
  let query = supabase
    .from("regulatory_articles")
    .select(
      `regulatory_articles(*, site_status:site_article_status(*))`,
    )
    .order("code", { ascending: true })
    .range((page - 1) * pageSize, page * pageSize - 1);

  // Apply search
  if (params.search) {
    const q = params.search.trim();
    // Use ilike on title/code - fallback for broader search
    query = query.or(`code.ilike.%${q}%,titre.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Post-process: fetch site statuses for returned articles and attach the status for the site
  const articleIds = (data ?? []).map((r: any) => r.id);

  if (!articleIds.length) return { items: [], total: 0 };

  const { data: statuses, error: statusError } = await supabase
    .from("site_article_status")
    .select("*")
    .in("article_id", articleIds)
    .eq("site_id", params.siteId);

  if (statusError) throw statusError;

  // Merge
  const items = (data as any[]).map((article: any) => {
    const st = (statuses ?? []).find((s: any) => s.article_id === article.id) ?? null;
    return {
      ...article,
      site_status: st,
    };
  });

  // Total count: simple count query
  const { count } = await supabase
    .from("regulatory_articles")
    .select("id", { count: "exact", head: false });

  return { items, total: (count as number) || items.length };
};

export const upsertSiteArticleStatus = async (
  payload: SiteArticleStatusInsert | (SiteArticleStatusInsert & { id?: string }),
) => {
  const tenantId = await getCurrentTenantId();
  const safePayload = withTenantGuard({ ...payload, tenant_id: tenantId } as any);

  const { data, error } = await supabase
    .from("site_article_status")
    .upsert(safePayload, { onConflict: "site_id,article_id" })
    .select()
    .single();

  if (error) throw error;

  // log audit
  await logAudit(
    null,
    data.client_id ?? null,
    "site_article_status_upsert",
    { site_article_status: data },
    { siteId: data.site_id ?? undefined, entity: "site_article_status", entityId: data.id },
  );

  return data as SiteArticleStatusRow;
};

export const bulkUpdateSiteArticleStatus = async (updates: Array<SiteArticleStatusUpdate & { article_id: string; site_id: string }>) => {
  if (!updates.length) return [];
  const tenantId = await getCurrentTenantId();

  // Add tenant_id to each
  const payload = updates.map((u) => ({ ...u, tenant_id: tenantId }));

  const { data, error } = await supabase
    .from("site_article_status")
    .upsert(payload, { onConflict: "site_id,article_id" })
    .select();

  if (error) throw error;

  // Audit single bulk action
  await logAudit(null, null, "site_article_status_bulk_update", { count: (data ?? []).length });

  return data as SiteArticleStatusRow[];
};

export const createActionFromArticle = async (action: any) => {
  const tenantId = await getCurrentTenantId();
  const payload = withTenantGuard({ ...action, tenant_id: tenantId } as any);

  const { data, error } = await supabase
    .from("actions")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;

  await logAudit(null, data.client_id ?? null, "action_created", { action: data }, { siteId: data.site_id ?? undefined, entity: "action", entityId: data.id });

  return data;
};

export const uploadProof = async (siteId: string, file: File, destinationPath?: string) => {
  // store under tenant/site/regulatory_proofs/<filename>
  const tenantId = await getCurrentTenantId();
  const bucket = "uploads";
  const filePath = destinationPath ?? `${tenantId}/sites/${siteId}/regulatory_proofs/${Date.now()}_${file.name}`;

  const { data, error } = await supabase.storage.from(bucket).upload(filePath, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);

  // log audit
  await logAudit(null, null, "proof_uploaded", { siteId, url: publicUrl });

  return publicUrl;
};


// ==================== CLIENT USERS MANAGEMENT ====================

export const inviteClientUser = async (
  email: string,
  fullName: string,
  siteIds: string[],
  clientId: string,
  isClientAdmin: boolean = false,
  password?: string,
  sendReset?: boolean
) => {
  try {
    // Parse name into nom and prenom
    const nameParts = fullName.trim().split(' ');
    const prenom = nameParts[0] || '';
    const nom = nameParts.slice(1).join(' ') || prenom;

    // Call the Edge Function to handle user creation securely
    const { data: result, error } = await supabase.functions.invoke('invite-client-user', {
      body: {
        email: email.trim().toLowerCase(),
        nom,
        prenom,
        telephone: null,
        clientId,
        siteIds: siteIds || [],
        is_client_admin: isClientAdmin,
        password: password || undefined,
        send_reset: sendReset
      }
    });

    if (error) {
      console.error('Error invoking invite-client-user function:', error);
      throw error;
    }

    if (!result.success) {
      throw new Error(result.error || 'Failed to invite user');
    }

    return { 
      data: { 
        userId: result.userId, 
        action: result.action,
        message: result.message 
      }, 
      error: null 
    };
  } catch (error: any) {
    console.error('Error in inviteClientUser:', error);
    return { data: null, error };
  }
};

// Toggle client admin status (Super Admin only)
export const toggleClientAdmin = async (userId: string, isAdmin: boolean) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ is_client_admin: isAdmin })
    .eq('id', userId)
    .select()
    .single();
  
  if (error) throw error;
  
  const actorId = await getCurrentUserId();
  await logAudit(actorId, null, 'client_admin_toggled', {
    user_id: userId,
    is_admin: isAdmin,
  });
  
  return data;
};

// Check if current user can manage target user
export const canManageUser = async (targetUserId: string): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  
  const { data, error } = await supabase.rpc('can_manage_client_user', {
    _actor_id: user.id,
    _target_user_id: targetUserId,
  });
  
  if (error) {
    console.error('Error checking user management permission:', error);
    return false;
  }
  
  return data === true;
};

// Fetch user permissions for a specific user
export const fetchUserPermissions = async (userId: string, clientId: string) => {
  const { data, error } = await supabase
    .from('user_permissions')
    .select('*')
    .eq('user_id', userId)
    .eq('client_id', clientId)
    .order('module');
  
  if (error) throw error;
  return data || [];
};

// Save user permissions
export const saveUserPermissions = async (
  userId: string,
  clientId: string,
  permissions: Array<{
    module: string;
    action: string;
    decision: 'allow' | 'deny';
    scope: 'global' | 'tenant' | 'site';
  }>
) => {
  const actorId = await getCurrentUserId();
  
  // Delete existing permissions for this user
  const { error: deleteError } = await supabase
    .from('user_permissions')
    .delete()
    .eq('user_id', userId)
    .eq('client_id', clientId);
  
  if (deleteError) throw deleteError;
  
  // Insert new permissions
  if (permissions.length > 0) {
    const permissionsToInsert = permissions.map(p => ({
      user_id: userId,
      client_id: clientId,
      module: p.module,
      action: p.action,
      decision: p.decision,
      scope: p.scope,
      created_by: actorId,
    }));
    
    const { error: insertError } = await supabase
      .from('user_permissions')
      .insert(permissionsToInsert);
    
    if (insertError) throw insertError;
  }
  
  await logAudit(actorId, clientId, 'user_permissions_updated', {
    user_id: userId,
    permissions_count: permissions.length,
  });
};

// Get client user count and limit
export const getClientUserStats = async (clientId: string) => {
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('max_users')
    .eq('id', clientId)
    .single();
  
  if (clientError) throw clientError;
  
  const { data: count, error: countError } = await supabase
    .rpc('get_client_user_count', { _client_id: clientId });
  
  if (countError) throw countError;
  
  return {
    current: count || 0,
    max: client.max_users || 10,
    canAdd: count < client.max_users,
  };
};

export const createUserProfile = async (
  userId: string,
  email: string,
  fullName: string,
  roleUuid: string,
  clientId: string,
  siteIds: string[]
) => {
  // Create profile
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({
      id: userId,
      email,
      nom: fullName.split(' ')[0] || fullName,
      prenom: fullName.split(' ').slice(1).join(' ') || '',
      client_id: clientId,
    });

  if (profileError) throw profileError;

  // Delete existing roles
  await supabase
    .from("user_roles")
    .delete()
    .eq("user_id", userId);

  // Insert new role using role_uuid
  const { error: roleError } = await supabase
    .from("user_roles")
    .insert([{ user_id: userId, role_uuid: roleUuid, client_id: clientId }]);

  if (roleError) throw roleError;

  // Create access scopes
  const scopes = siteIds.map(siteId => ({
    user_id: userId,
    site_id: siteId,
    read_only: false,
  }));

  const { error: scopesError } = await supabase
    .from("access_scopes")
    .insert(scopes);

  if (scopesError) throw scopesError;
};

export const updateClientUserAccess = async (
  userId: string,
  roleUuid: string,
  clientId: string,
  siteIds: string[]
) => {
  // Update user role - delete and re-insert
  await supabase
    .from("user_roles")
    .delete()
    .eq("user_id", userId)
    .eq("client_id", clientId);

  // Insert new role using role_uuid
  const { error: roleError } = await supabase
    .from("user_roles")
    .insert([{ user_id: userId, role_uuid: roleUuid, client_id: clientId }]);

  if (roleError) throw roleError;

  // Delete existing access scopes for this client's sites
  const { data: clientSites } = await supabase
    .from("sites")
    .select("id")
    .eq("client_id", clientId);

  if (clientSites) {
    const siteIdsList = clientSites.map(s => s.id);
    await supabase
      .from("access_scopes")
      .delete()
      .eq("user_id", userId)
      .in("site_id", siteIdsList);
  }

  // Create new access scopes
  const scopes = siteIds.map(siteId => ({
    user_id: userId,
    site_id: siteId,
    read_only: false,
  }));

  await supabase
    .from("access_scopes")
    .upsert(scopes);
};

export const fetchAllClients = async () => {
  const { data, error } = await supabase
    .from("clients")
    .select("id, nom, nom_legal, is_active")
    .eq("is_active", true)
    .order("nom");
  
  if (error) throw error;
  return data;
};

export const fetchClientUsers = async (clientId: string) => {
  const { data, error } = await supabase
    .from("client_users")
    .select(`
      *,
      access_scopes(
        site_id,
        read_only,
        sites(nom_site)
      )
    `)
    .eq("client_id", clientId)
    .order("nom");

  if (error) throw error;
  return data;
};


type ClientUserFilters = {
  search?: string;
  role?: Database["public"]["Enums"]["app_role"];
  site?: string;
  status?: "active" | "inactive";
  page?: number;
  pageSize?: number;
};

export const fetchClientUsersPaginated = async (
  clientId: string,
  filters: ClientUserFilters = {},
) => {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(Math.max(filters.pageSize ?? 10, 1), 100);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("client_users")
    .select(
      `
        *,
        access_scopes(
          site_id,
          read_only,
          sites(nom_site)
        )
      `,
      { count: "exact" },
    )
    .eq("client_id", clientId);

  const searchTerm = filters.search?.trim();
  if (searchTerm) {
    const sanitized = searchTerm.replace(/[%]/g, "").replace(/,/g, "");
    const pattern = `%${sanitized}%`;
    query = query.or(
      `nom.ilike.${pattern},prenom.ilike.${pattern},email.ilike.${pattern}`,
    );
  }

  if (filters.role) {
    query = query.eq("user_roles.role", filters.role);
  }

  if (filters.site) {
    query = query.eq("access_scopes.site_id", filters.site);
  }

  if (filters.status === "active") {
    query = query.eq("actif", true);
  } else if (filters.status === "inactive") {
    query = query.eq("actif", false);
  }

  const { data, error, count } = await query
    .order("nom", { ascending: true })
    .range(from, to);

  if (error) throw error;

  return {
    data: data ?? [],
    count: count ?? 0,
    page,
    pageSize,
    totalPages: count ? Math.max(Math.ceil(count / pageSize), 1) : 0,
  };
};

export const resendInvite = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/`,
  });

  if (error) throw error;
};

export const resetClientUserPassword = async (email: string) => {
  const trimmedEmail = email.trim();
  if (!trimmedEmail) {
    throw new Error("Adresse email invalide");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
    redirectTo: `${window.location.origin}/`,
  });

  if (error) throw error;
};

export const deactivateClientUser = async (userId: string) => {
  if (!userId) {
    throw new Error("Identifiant utilisateur manquant");
  }
  return toggleUtilisateurActif(userId, false);
};

export const activateClientUser = async (userId: string) => {
  if (!userId) {
    throw new Error("Identifiant utilisateur manquant");
  }
  return toggleUtilisateurActif(userId, true);
};

// ==================== PLANS & SUBSCRIPTIONS ====================

type PlanRow = Database["public"]["Tables"]["plans"]["Row"];
type SubscriptionRow = Database["public"]["Tables"]["subscriptions"]["Row"];
type SubscriptionInsert = Database["public"]["Tables"]["subscriptions"]["Insert"];
type SubscriptionUpdate = Database["public"]["Tables"]["subscriptions"]["Update"];

export const fetchPlans = async () => {
  const { data, error } = await supabase
    .from("plans")
    .select("*")
    .eq("is_active", true)
    .order("label");

  if (error) throw error;
  return data as PlanRow[];
};

export const fetchSubscriptions = async (filters: {
  clientId?: string;
  siteId?: string | null;
  status?: Database["public"]["Enums"]["subscription_status"];
  scope?: Database["public"]["Enums"]["subscription_scope"];
} = {}) => {
  let query = supabase
    .from("subscriptions")
    .select(
      `
        *,
        clients (
          id,
          name,
          nom_legal,
          matricule_fiscale,
          billing_mode,
          currency
        ),
        sites (
          id,
          name,
          nom_site,
          matricule_fiscale
        ),
        plans (*)
      `,
    )
    .order("start_date", { ascending: false });

  if (filters.clientId) {
    query = query.eq("client_id", filters.clientId);
  }

  if (filters.siteId !== undefined) {
    if (filters.siteId === null) {
      query = query.is("site_id", null);
    } else {
      query = query.eq("site_id", filters.siteId);
    }
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.scope) {
    query = query.eq("scope", filters.scope);
  }

  const tenantId = await getCurrentTenantId();
  query = query.eq("tenant_id", tenantId);

  const { data, error } = await query;

  if (error) throw error;
  return data as (SubscriptionRow & {
    clients: ClientRow;
    sites: SiteRow | null;
    plans: PlanRow;
  })[];
};

export const createSubscription = async (subscription: SubscriptionInsert) => {
  const tenantId = await getCurrentTenantId();

  const normalizedScope =
    subscription.scope ?? ("client" as Database["public"]["Enums"]["subscription_scope"]);

  const payload: SubscriptionInsert = {
    ...subscription,
    tenant_id: tenantId,
    scope: normalizedScope,
    site_id: normalizedScope === "client" ? null : subscription.site_id ?? null,
    status: subscription.status ?? "active",
    start_date: subscription.start_date ?? new Date().toISOString().slice(0, 10),
  };

  const { data, error } = await supabase
    .from("subscriptions")
    .insert(payload)
    .select()
    .single();

  if (error || !data) throw error;

  const actorId = await getCurrentUserId();
  await logAudit(actorId, data.client_id, "subscription_created", {
    subscription_id: data.id,
    plan_id: data.plan_id,
    scope: data.scope,
    site_id: data.site_id,
    status: data.status,
  }, { siteId: data.site_id ?? undefined, entity: "subscription", entityId: data.id });

  return data as SubscriptionRow;
};

export const updateSubscription = async (
  subscriptionId: string,
  updates: SubscriptionUpdate,
) => {
  const safeUpdates = withTenantGuard(updates);
  const resolvedScope =
    safeUpdates.scope ?? undefined;

  if (resolvedScope === "client") {
    safeUpdates.site_id = null;
  }

  const { data, error } = await supabase
    .from("subscriptions")
    .update(safeUpdates)
    .eq("id", subscriptionId)
    .select()
    .single();

  if (error || !data) throw error;

  const actorId = await getCurrentUserId();
  const sanitizedUpdates = JSON.parse(
    JSON.stringify(safeUpdates ?? {}),
  ) as Json;

  await logAudit(actorId, data.client_id, "subscription_updated", {
    subscription_id: data.id,
    changes: sanitizedUpdates,
  }, { siteId: data.site_id ?? undefined, entity: "subscription", entityId: data.id });

  return data as SubscriptionRow;
};

export const changeSubscriptionStatus = async (
  subscriptionId: string,
  status: Database["public"]["Enums"]["subscription_status"],
) => {
  const updated = await updateSubscription(subscriptionId, {
    status,
    end_date:
      status === "canceled"
        ? new Date().toISOString().slice(0, 10)
        : undefined,
  });

  const actorId = await getCurrentUserId();
  await logAudit(actorId, updated.client_id, "subscription_status_updated", {
    subscription_id: updated.id,
    status,
  }, { siteId: updated.site_id ?? undefined, entity: "subscription", entityId: updated.id });

  return updated;
};

// ==================== INVOICES & PAYMENTS ====================

type InvoiceRow = Database["public"]["Tables"]["invoices"]["Row"];
type InvoiceInsert = Database["public"]["Tables"]["invoices"]["Insert"];
type InvoiceUpdate = Database["public"]["Tables"]["invoices"]["Update"];
type InvoiceItemRow = Database["public"]["Tables"]["invoice_items"]["Row"];
type InvoiceItemInsert = Database["public"]["Tables"]["invoice_items"]["Insert"];
type PaymentInsert = Database["public"]["Tables"]["payments"]["Insert"];

export interface InvoiceItemInput {
  designation: string;
  unit_price: number;
  quantity?: number;
  tax_rate?: number;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateInvoicePayload {
  clientId: string;
  siteId?: string | null;
  subscriptionId?: string | null;
  currency?: string;
  invoiceDate?: string;
  dueDate?: string | null;
  notes?: string | null;
  status?: Database["public"]["Enums"]["invoice_status"];
  items: InvoiceItemInput[];
}

const roundToCents = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export const fetchInvoices = async (filters: {
  clientId?: string;
  siteId?: string | null;
  status?: Database["public"]["Enums"]["invoice_status"];
} = {}) => {
  let query = supabase
    .from("invoices")
    .select(
      `
        *,
        clients (
          id,
          name,
          nom_legal,
          matricule_fiscale,
          billing_mode,
          billing_email,
          billing_phone
        ),
        sites (
          id,
          name,
          nom_site,
          matricule_fiscale
        ),
        subscriptions (
          id,
          plan_id,
          scope,
          status
        ),
        invoice_items (*),
        payments (*)
      `,
    )
    .order("invoice_date", { ascending: false });

  if (filters.clientId) {
    query = query.eq("client_id", filters.clientId);
  }

  if (filters.siteId !== undefined) {
    if (filters.siteId === null) {
      query = query.is("site_id", null);
    } else {
      query = query.eq("site_id", filters.siteId);
    }
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  const tenantId = await getCurrentTenantId();
  query = query.eq("tenant_id", tenantId);

  const { data, error } = await query;
  if (error) throw error;

  return data as (InvoiceRow & {
    clients: ClientRow;
    sites: SiteRow | null;
    subscriptions: SubscriptionRow | null;
    invoice_items: InvoiceItemRow[];
    payments: Database["public"]["Tables"]["payments"]["Row"][];
  })[];
};

const buildTaxIdentity = (
  client: ClientRow,
  site: SiteRow | null,
): { type: "client" | "site"; name: string; matricule?: string | null } => {
  if (site) {
    return {
      type: "site",
      name: site.nom_site ?? site.name,
      matricule: site.matricule_fiscale ?? client.matricule_fiscale,
    };
  }

  return {
    type: "client",
    name: client.nom_legal ?? client.name,
    matricule: client.matricule_fiscale,
  };
};

export const createInvoice = async ({
  clientId,
  siteId = null,
  subscriptionId = null,
  currency,
  invoiceDate,
  dueDate,
  notes,
  status = "draft",
  items,
}: CreateInvoicePayload) => {
  if (!items.length) {
    throw new Error("Une facture doit comporter au moins une ligne");
  }

  const tenantId = await getCurrentTenantId();

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .single();

  if (clientError || !client) throw clientError ?? new Error("Client introuvable");

  let site: SiteRow | null = null;

  if (siteId) {
    const { data: siteData, error: siteError } = await supabase
      .from("sites")
      .select("*")
      .eq("id", siteId)
      .single();

    if (siteError) throw siteError;
    site = siteData;
  }

  const computedItems = items.map((item) => {
    const quantity = item.quantity ?? 1;
    const taxRate = item.tax_rate ?? 0;
    const totalHt = roundToCents(quantity * item.unit_price);
    const metadata =
      item.metadata ? JSON.parse(JSON.stringify(item.metadata)) : null;
    return {
      designation: item.designation,
      description: item.description ?? null,
      quantity,
      unit_price: roundToCents(item.unit_price),
      tax_rate: taxRate,
      total_ht: totalHt,
      metadata,
    };
  });

  const totalHt = roundToCents(
    computedItems.reduce((acc, item) => acc + (item.total_ht ?? 0), 0),
  );
  const totalTva = roundToCents(
    computedItems.reduce(
      (acc, item) => acc + (item.total_ht ?? 0) * (item.tax_rate ?? 0),
      0,
    ),
  );
  const totalTtc = roundToCents(totalHt + totalTva);

  const taxIdentity = buildTaxIdentity(client as ClientRow, site);

  const { data: invoiceNo, error: seqError } = await supabase.rpc(
    "generate_invoice_no",
    { p_tenant_id: tenantId },
  );

  if (seqError || !invoiceNo) {
    throw seqError ?? new Error("Impossible de générer le numéro de facture");
  }

  const invoicePayload: InvoiceInsert = {
    tenant_id: tenantId,
    client_id: clientId,
    site_id: siteId ?? null,
    subscription_id: subscriptionId ?? null,
    currency: currency ?? client.currency ?? "TND",
    invoice_date: invoiceDate ?? new Date().toISOString().slice(0, 10),
    due_date: dueDate ?? null,
    notes: notes ?? null,
    status,
    invoice_no: invoiceNo,
    total_ht: totalHt,
    total_tva: totalTva,
    total_ttc: totalTtc,
    tax_breakdown: {
      identity: taxIdentity,
      totals: {
        ht: totalHt,
        tva: totalTva,
        ttc: totalTtc,
      },
    } as Json,
  };

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .insert(invoicePayload)
    .select()
    .single();

  if (invoiceError || !invoice) {
    throw invoiceError ?? new Error("Impossible de créer la facture");
  }

  const itemPayload: InvoiceItemInsert[] = computedItems.map((item) => ({
    ...item,
    invoice_id: invoice.id,
  }));

  const { error: itemError } = await supabase
    .from("invoice_items")
    .insert(itemPayload);

  if (itemError) {
    // Attempt rollback
    await supabase.from("invoices").delete().eq("id", invoice.id);
    throw itemError;
  }

  await logAudit(
    null,
    clientId,
    "invoice_created",
    {
      invoice_id: invoice.id,
      invoice_no: invoice.invoice_no,
      total_ttc: totalTtc,
    },
    { siteId: siteId ?? undefined, entity: "invoice", entityId: invoice.id },
  );

  return invoice as InvoiceRow;
};

export const updateInvoice = async (
  invoiceId: string,
  updates: InvoiceUpdate,
) => {
  const tenantId = await getCurrentTenantId();
  const safeUpdates = withTenantGuard(updates);

  const { data, error } = await supabase
    .from("invoices")
    .update(safeUpdates)
    .eq("id", invoiceId)
    .eq("tenant_id", tenantId)
    .select()
    .single();

  if (error || !data) throw error;

  const actorId = await getCurrentUserId();
  const sanitizedUpdates = JSON.parse(
    JSON.stringify(safeUpdates ?? {}),
  ) as Json;

  await logAudit(
    actorId,
    data.client_id,
    "invoice_updated",
    { invoice_id: data.id, changes: sanitizedUpdates },
    { siteId: data.site_id ?? undefined, entity: "invoice", entityId: data.id },
  );

  return data as InvoiceRow;
};

export const recordPayment = async (payment: PaymentInsert) => {
  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", payment.invoice_id)
    .single();

  if (invoiceError || !invoice) {
    throw invoiceError ?? new Error("Facture introuvable");
  }

  const payload: PaymentInsert = {
    ...payment,
    method: payment.method ?? "transfer",
    notes: payment.notes ?? null,
    paid_at: payment.paid_at ?? new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("payments")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;

  const { data: paymentHistory, error: paymentsError } = await supabase
    .from("payments")
    .select("amount")
    .eq("invoice_id", invoice.id);

  if (paymentsError) throw paymentsError;

  const totalPaid = (paymentHistory ?? []).reduce(
    (acc, current) => acc + (current.amount ?? 0),
    0,
  );

  if (totalPaid >= invoice.total_ttc) {
    await updateInvoice(invoice.id, { status: "paid" });
  }

  await logAudit(
    null,
    invoice.client_id,
    "invoice_payment_recorded",
    {
      invoice_id: invoice.id,
      payment_amount: payload.amount,
    },
    { entity: "invoice", entityId: invoice.id, siteId: invoice.site_id ?? undefined },
  );

  return data;
};

export const updateInvoiceStatus = async (
  invoiceId: string,
  status: Database["public"]["Enums"]["invoice_status"],
) => {
  const invoice = await updateInvoice(invoiceId, { status });
  await logAudit(
    null,
    invoice.client_id,
    "invoice_status_updated",
    { invoice_id: invoiceId, status },
    { siteId: invoice.site_id ?? undefined, entity: "invoice", entityId: invoiceId },
  );
  return invoice;
};

// ==================== SITE-SPECIFIC PERMISSIONS ====================

export const fetchUserSitesWithPermissions = async (userId: string) => {
  const { data, error } = await supabase.rpc("get_user_sites_with_permissions", {
    p_user_id: userId,
  });
  if (error) throw error;
  return data || [];
};

// Fetch enabled module codes for a specific site (staff-authorized modules)
export const listEnabledModuleCodesForSite = async (siteId: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from("site_modules")
    .select("modules_systeme!inner(code)")
    .eq("site_id", siteId)
    .eq("enabled", true);

  if (error) throw error;
  
  // Extract and normalize module codes to lowercase
  return (data || []).map((row: any) => 
    row.modules_systeme?.code?.toLowerCase() || ''
  ).filter(Boolean);
};

// Fetch enabled domain IDs for multiple sites (staff-authorized domains)
export const listEnabledDomainIdsForSites = async (siteIds: string[]): Promise<string[]> => {
  if (!siteIds || siteIds.length === 0) return [];

  const { data, error } = await supabase
    .from("site_veille_domaines")
    .select("domaine_id")
    .in("site_id", siteIds)
    .eq("enabled", true);

  if (error) throw error;
  
  // Return unique domain IDs with proper type
  const domainIds = (data || [])
    .map((row: any) => row.domaine_id)
    .filter((id): id is string => typeof id === 'string' && id.length > 0);
  return Array.from(new Set(domainIds));
};

export const fetchSitePermissions = async (userId: string, siteId: string) => {
  const { data, error } = await supabase
    .from("user_permissions")
    .select("*")
    .eq("user_id", userId)
    .eq("site_id", siteId);
  if (error) throw error;
  return data || [];
};

export const saveSitePermissions = async (
  userId: string,
  siteId: string,
  clientId: string,
  permissions: Array<{ module: string; action: string; decision: 'allow' | 'deny'; scope: PermissionScope }>
) => {
  // Filter out 'full' action - it's UI-only and all real actions are already included
  const permissionsToSave = permissions.filter(p => p.action !== 'full');
  
  // Use secure RPC function to save permissions with proper authorization
  const { error } = await supabase.rpc('set_user_site_permissions', {
    target_user_id: userId,
    target_client_id: clientId,
    target_site_id: siteId,
    permissions: permissionsToSave
  });
  
  if (error) throw error;

  // Log audit trail
  const actorId = await getCurrentUserId();
  await logAudit(
    actorId,
    clientId,
    "user_site_permissions_updated",
    { user_id: userId, site_id: siteId, permission_count: permissionsToSave.length },
    { siteId, entity: "user_permissions", entityId: userId }
  );
};
