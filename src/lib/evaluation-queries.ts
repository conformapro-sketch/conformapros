import { supabaseAny as supabase } from "@/lib/supabase-any";
import type { Database, Json } from "@/types/db";
import { getCurrentTenantId, logAudit } from "@/lib/multi-tenant-queries";

type SiteArticleStatusRow = Database["public"]["Tables"]["site_article_status"]["Row"];
type SiteArticleStatusInsert = Database["public"]["Tables"]["site_article_status"]["Insert"];
type SiteArticleStatusUpdate = Database["public"]["Tables"]["site_article_status"]["Update"];
type SiteArticleProofRow = any; // Database["public"]["Tables"]["site_article_preuves"]["Row"];
type SiteArticleActionRow = any; // Database["public"]["Tables"]["site_article_actions"]["Row"];
type SavedViewRow = any; // Database["public"]["Tables"]["site_article_saved_views"]["Row"];
type SavedViewInsert = any; // Database["public"]["Tables"]["site_article_saved_views"]["Insert"];
type SavedViewUpdate = any; // Database["public"]["Tables"]["site_article_saved_views"]["Update"];
type RegulatoryArticleRow = any; // Database["public"]["Views"]["regulatory_articles"]["Row"];

export type RegulatoryApplicability = Database["public"]["Enums"]["regulatory_applicability"];
export type RegulatoryNonApplicableReason =
  Database["public"]["Enums"]["regulatory_non_applicable_reason"];
export type RegulatoryProofType = Database["public"]["Enums"]["regulatory_proof_type"];
export type RegulatorySavedViewScope = Database["public"]["Enums"]["regulatory_saved_view_scope"];
export type ConformityState = Database["public"]["Enums"]["etat_conformite"];

type ProofPayload = {
  type: RegulatoryProofType;
  resourceUrl: string;
  storageBucket?: string | null;
  storagePath?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  fileSize?: number | null;
  commentaire?: string | null;
  metadata?: Record<string, unknown>;
};

export interface EvaluationListFilters {
  domaineCode?: string;
  sousDomaineCode?: string;
  applicability?: RegulatoryApplicability;
  motif?: RegulatoryNonApplicableReason;
  state?: ConformityState;
  hasProof?: "with" | "without";
  sourceType?: string;
  updatedWithinDays?: number;
  impactLevel?: string;
}

export interface EvaluationListParams {
  siteId: string;
  page?: number;
  pageSize?: number;
  search?: string;
  filters?: EvaluationListFilters;
}

export interface EvaluationArticleMeta {
  id: string;
  numero: string | null;
  titreCourt: string | null;
  reference: string | null;
  texte?: {
    id: string;
    titre: string | null;
    type: string | null;
    source: string | null;
    statutVigueur: Database["public"]["Enums"]["statut_vigueur"] | null;
    versionAt: string | null;
    referenceOfficielle: string | null;
    updatedAt: string | null;
    domaines: { id: string; code: string; libelle: string }[];
    sousDomaines: { id: string; code: string; libelle: string }[];
  };
}

export interface EvaluationRecord {
  status: SiteArticleStatusRow;
  article: EvaluationArticleMeta | null;
  proofs: SiteArticleProofRow[];
  actions: SiteArticleActionRow[];
}

const EVALUATION_BUCKET = "regulatory_proofs";
const DEFAULT_PAGE_SIZE = 25;
const MAX_FILTERED_ARTICLE_IDS = 2000;

function computePagination(page = 1, pageSize = DEFAULT_PAGE_SIZE) {
  const safePage = Math.max(page, 1);
  const safePageSize = Math.max(Math.min(pageSize, 200), 1);
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;
  return { from, to, page: safePage, pageSize: safePageSize };
}

function buildSearchClause(search?: string) {
  if (!search || search.trim().length === 0) {
    return undefined;
  }
  const normalized = search.trim();
  const like = `%${normalized}%`;
  return `titre.ilike.${like},texte_titre.ilike.${like},article_reference.ilike.${like},reference.ilike.${like}`;
}

async function fetchArticleIdsByFilters(params: {
  domaineCode?: string;
  sousDomaineCode?: string;
  sourceType?: string;
  search?: string;
}): Promise<string[] | null> {
  const { domaineCode, sousDomaineCode, sourceType, search } = params;
  const needsFiltering = Boolean(domaineCode || sousDomaineCode || sourceType || search);
  if (!needsFiltering) {
    return null;
  }

  let query = (supabase as any)
    .from("regulatory_articles")
    .select("id", { head: false })
    .limit(MAX_FILTERED_ARTICLE_IDS);

  if (domaineCode) {
    query = query.contains("domaines", [domaineCode]);
  }

  if (sousDomaineCode) {
    query = query.contains("sous_domaines", [sousDomaineCode]);
  }

  if (sourceType) {
    query = query.eq("source_type", sourceType);
  }

  const orClause = buildSearchClause(search);
  if (orClause) {
    query = query.or(orClause);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Failed to fetch article ids", error);
    throw error;
  }

  return (data ?? []).map((row) => row.id);
}

function normalizeArticle(raw: any): EvaluationArticleMeta | null {
  if (!raw) {
    return null;
  }

  const domaines =
    raw?.textes_reglementaires?.textes_reglementaires_domaines ?? [];
  const sousDomaines =
    raw?.textes_reglementaires?.textes_reglementaires_sous_domaines ?? [];

  return {
    id: raw.id,
    numero: raw.numero ?? null,
    titreCourt: raw.titre_court ?? null,
    reference: raw.reference ?? null,
    texte: raw.textes_reglementaires
      ? {
          id: raw.textes_reglementaires.id,
          titre: raw.textes_reglementaires.titre ?? null,
          type: raw.textes_reglementaires.type ?? null,
          source: raw.textes_reglementaires.source ?? null,
          statutVigueur: raw.textes_reglementaires.statut_vigueur ?? null,
          versionAt: raw.textes_reglementaires.version_at ?? null,
          referenceOfficielle: raw.textes_reglementaires.reference_officielle ?? null,
          updatedAt: raw.textes_reglementaires.updated_at ?? null,
          domaines: domaines
            .map((entry: any) => entry?.domaines_application)
            .filter(Boolean)
            .map((entry: any) => ({
              id: entry.id,
              code: entry.code,
              libelle: entry.libelle,
            })),
          sousDomaines: sousDomaines
            .map((entry: any) => entry?.sous_domaines_application)
            .filter(Boolean)
            .map((entry: any) => ({
              id: entry.id,
              code: entry.code,
              libelle: entry.libelle,
            })),
        }
      : undefined,
  };
}

async function uploadFileToStorage(
  file: File,
  statusId: string
): Promise<{ path: string; bucket: string }> {
  const fileExtension = file.name.split(".").pop() ?? "bin";
  const safeName = file.name.replace(/\s+/g, "_");
  const path = `${statusId}/${Date.now()}_${safeName}`;

  const { error } = await supabase.storage
    .from(EVALUATION_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    });

  if (error) {
    throw error;
  }

  return { path, bucket: EVALUATION_BUCKET };
}

async function createProofRecord(statusId: string, payload: ProofPayload) {
  const { data, error } = await (supabase as any)
    .from("site_article_proofs")
    .insert({
      status_id: statusId,
      proof_type: payload.type,
      resource_url: payload.resourceUrl,
      storage_bucket: payload.storageBucket ?? null,
      storage_path: payload.storagePath ?? null,
      file_name: payload.fileName ?? null,
      file_type: payload.fileType ?? null,
      file_size: payload.fileSize ?? null,
      commentaire: payload.commentaire ?? null,
      metadata: payload.metadata ?? {},
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function buildSignedUrl(path: string) {
  const { data, error } = await supabase.storage
    .from(EVALUATION_BUCKET)
    .createSignedUrl(path, 60 * 60); // 1 hour

  if (error) {
    throw error;
  }

  return data?.signedUrl ?? null;
}

export const evaluationQueries = {
  async ensureSeedForSite(siteId: string) {
    const { data, error } = await (supabase as any).rpc("ensure_site_article_status_rows", {
      p_site_id: siteId,
    });
    if (error) {
      throw error;
    }
    return data ?? 0;
  },

  async fetchArticleMetadata(articleId: string) {
    const { data, error } = await (supabase as any)
      .from("regulatory_articles")
      .select("*")
      .eq("id", articleId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return (data as RegulatoryArticleRow) ?? null;
  },

  async list(params: EvaluationListParams) {
    const { siteId, page = 1, pageSize = DEFAULT_PAGE_SIZE, search, filters } = params;
    await evaluationQueries.ensureSeedForSite(siteId);

    const matchingArticleIds = await fetchArticleIdsByFilters({
      domaineCode: filters?.domaineCode,
      sousDomaineCode: filters?.sousDomaineCode,
      sourceType: filters?.sourceType,
      search,
    });

    if (matchingArticleIds && matchingArticleIds.length === 0) {
      return { data: [] as EvaluationRecord[], count: 0 };
    }

    const { from, to } = computePagination(page, pageSize);

    let query = supabase
      .from("site_article_status")
      .select(
        `
          *,
          site:site_id ( id, nom_site, code_site ),
          article:article_id (
            id,
            numero,
            titre_court,
            reference,
            textes_reglementaires:texte_id (
              id,
              titre,
              type,
              source,
              statut_vigueur,
              version_at,
              reference_officielle,
              updated_at,
              textes_reglementaires_domaines (
                domaines_application (
                  id,
                  libelle,
                  code
                )
              ),
              textes_reglementaires_sous_domaines (
                sous_domaines_application (
                  id,
                  libelle,
                  code
                )
              )
            )
          ),
          proofs:site_article_preuves!site_article_preuves_site_article_status_id_fkey (
            id,
            titre,
            url_document,
            type_document,
            description,
            date_document,
            uploaded_by,
            created_at
          ),
          actions:plans_action!plans_action_site_id_fkey (
            id,
            titre,
            description,
            responsable_id,
            date_echeance,
            priorite,
            statut,
            created_at,
            created_by,
            updated_at
          )
        `,
        { count: "exact" }
      )
      .eq("site_id", siteId)
      .order("updated_at", { ascending: false })
      .range(from, to);

    if (matchingArticleIds) {
      query = query.in("article_id", matchingArticleIds);
    }

    if (filters?.applicability) {
      query = (query as any).eq("applicabilite", filters.applicability);
    }

    if (filters?.motif) {
      query = (query as any).eq("motif_non_applicable", filters.motif);
    }

    if (filters?.state) {
      query = (query as any).eq("etat", filters.state);
    }

    if (filters?.impactLevel) {
      query = (query as any).eq("impact_level", filters.impactLevel);
    }

    // Skip proof filtering for now - needs proper implementation
    // if (filters?.hasProof === "with") {
    //   query = query.not("preuve_urls", "eq", "{}");
    // } else if (filters?.hasProof === "without") {
    //   query = query.eq("preuve_urls", "{}");
    // }

    if (filters?.updatedWithinDays && filters.updatedWithinDays > 0) {
      const threshold = new Date();
      threshold.setDate(threshold.getDate() - filters.updatedWithinDays);
      query = query.gte("updated_at", threshold.toISOString());
    }

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    const records: EvaluationRecord[] =
      data?.map((row: any) => ({
        status: row as SiteArticleStatusRow,
        article: normalizeArticle(row.article),
        proofs: (row.proofs ?? []) as SiteArticleProofRow[],
        actions: (row.actions ?? []) as SiteArticleActionRow[],
      })) ?? [];

    return {
      data: records,
      count: count ?? records.length,
    };
  },

  async updateStatus(statusId: string, changes: Partial<SiteArticleStatusUpdate>) {
    const payload: Partial<SiteArticleStatusInsert> = {
      ...changes,
    };

    const { data, error } = await supabase
      .from("site_article_status")
      .update(payload)
      .eq("id", statusId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (data) {
      // audit
      try {
        await logAudit(null, (data as any).client_id ?? null, "site_article_status_updated", { id: statusId, changes }, { siteId: data.site_id ?? undefined, entity: "site_article_status", entityId: statusId });
      } catch (e) {
        // ignore
      }
    }

    return data;
  },

  async bulkUpdate(statusIds: string[], changes: Partial<SiteArticleStatusUpdate>) {
    const compactChanges: Record<string, unknown> = {};
    if (changes.applicabilite) {
      compactChanges.applicabilite = changes.applicabilite;
    }
    if (changes.motif_non_applicable) {
      compactChanges.motif_non_applicable = changes.motif_non_applicable;
    }
    if (typeof changes.motif_commentaire !== "undefined") {
      compactChanges.motif_commentaire = changes.motif_commentaire;
    }
    if (changes.etat) {
      compactChanges.etat = changes.etat;
    }
    if (typeof changes.commentaire !== "undefined") {
      compactChanges.commentaire = changes.commentaire;
    }

    const { data, error } = await (supabase as any).rpc("bulk_update_site_article_status", {
      p_status_ids: statusIds,
      p_changes: compactChanges,
    });

    if (error) {
      throw error;
    }

    // audit
    try {
      await logAudit(null, null, "site_article_status_bulk_update", { statusIds, changes });
    } catch (e) {
      // ignore audit errors
    }

    return data ?? [];
  },

  async createAction(payload: {
    statusId: string;
    titre: string;
    description?: string;
    responsableId?: string;
    responsableNom?: string;
    echeance?: string;
    priorite?: Database["public"]["Enums"]["priorite"];
    statut?: Database["public"]["Enums"]["statut_action"];
  }) {
    const { data, error } = await (supabase as any).rpc("create_site_article_action", {
      p_status_id: payload.statusId,
      p_titre: payload.titre,
      p_description: payload.description ?? null,
      p_responsable_id: payload.responsableId ?? null,
      p_responsable_nom: payload.responsableNom ?? null,
      p_echeance: payload.echeance ?? null,
      p_priorite: payload.priorite ?? null,
      p_statut: payload.statut ?? null,
    });

    if (error) {
      throw error;
    }

    if (data) {
      try {
        await logAudit(null, (data as any).client_id ?? null, "site_article_action_created", { action: data }, { siteId: (data as any).site_id ?? undefined, entity: "site_article_action", entityId: (data as any).id });
      } catch (e) {}
    }

    return data;
  },

  async deleteAction(actionId: string) {
    const { error } = await (supabase as any)
      .from("site_article_actions")
      .delete()
      .eq("id", actionId);

    if (error) {
      throw error;
    }
  },

  async uploadProofFiles(statusId: string, files: File[]) {
    const uploaded: SiteArticleProofRow[] = [];

    for (const file of files) {
      const { path } = await uploadFileToStorage(file, statusId);
      const record = await createProofRecord(statusId, {
        type: "FILE",
        resourceUrl: path,
        storageBucket: EVALUATION_BUCKET,
        storagePath: path,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      });
      uploaded.push(record);
    }

    // audit
    try {
      await logAudit(null, null, "site_article_proofs_uploaded", { statusId, count: uploaded.length });
    } catch (e) {}

    return uploaded;
  },

  async addExternalProof(statusId: string, url: string, commentaire?: string) {
    const record = await createProofRecord(statusId, {
      type: "EXTERNAL_LINK",
      resourceUrl: url,
      commentaire: commentaire ?? null,
    });

    try {
      await logAudit(null, null, "site_article_proof_added", { statusId, url });
    } catch (e) {
      // ignore
    }

    return record;
  },

  async deleteProof(proofId: string) {
    const { data, error } = await (supabase as any)
      .from("site_article_proofs")
      .delete()
      .eq("id", proofId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if ((data as any)?.storage_bucket && (data as any).storage_path) {
      await supabase.storage.from((data as any).storage_bucket).remove([(data as any).storage_path]);
    }

    try {
      await logAudit(null, (data as any)?.client_id ?? null, "site_article_proof_deleted", { proofId, storage: { bucket: (data as any)?.storage_bucket, path: (data as any)?.storage_path } }, { siteId: (data as any)?.site_id ?? undefined });
    } catch (e) {
      // ignore
    }

    return data;
  },

  async getSignedProofUrl(storagePath: string | null) {
    if (!storagePath) {
      return null;
    }
    return buildSignedUrl(storagePath);
  },

  async listSavedViews(siteId?: string) {
    let query = (supabase as any)
      .from("site_article_saved_views")
      .select("*")
      .order("created_at", { ascending: false });

    if (siteId) {
      query = query.eq("site_id", siteId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data ?? [];
  },

  async createSavedView(payload: SavedViewInsert) {
    const { data, error } = await (supabase as any)
      .from("site_article_saved_views")
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  async updateSavedView(id: string, payload: SavedViewUpdate) {
    const { data, error } = await (supabase as any)
      .from("site_article_saved_views")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  async deleteSavedView(id: string) {
    const { error } = await (supabase as any)
      .from("site_article_saved_views")
      .delete()
      .eq("id", id);

    if (error) {
      throw error;
    }
  },

  async refreshSuggestions(statusId: string, payload: Json) {
    const { data, error } = await supabase
      .from("site_article_status")
      .update({ suggestion_payload: payload } as any)
      .eq("id", statusId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  async hasBulkEditPermission() {
    const tenantId = await getCurrentTenantId();
    return Boolean(tenantId);
  },
};

export type EvaluationQueries = typeof evaluationQueries;
