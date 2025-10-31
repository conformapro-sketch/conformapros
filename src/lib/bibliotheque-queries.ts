// Extended queries for Bibliothèque Réglementaire module
import { supabase } from "@/integrations/supabase/client";
import type { ActeAnnexe, ApplicabiliteMapping } from "@/types/actes";

// Annexes queries
export const annexesQueries = {
  async getByActeId(acteId: string) {
    const { data, error } = await supabase
      .from("actes_annexes")
      .select("*")
      .eq("acte_id", acteId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as ActeAnnexe[];
  },

  async create(annexe: Omit<ActeAnnexe, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from("actes_annexes")
      .insert([annexe])
      .select()
      .single();
    if (error) throw error;
    return data as ActeAnnexe;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from("actes_annexes")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },

  async uploadFile(file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('actes_annexes')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('actes_annexes')
      .getPublicUrl(filePath);

    return publicUrl;
  },

  async deleteFile(fileUrl: string) {
    // Extract path from URL
    const pathMatch = fileUrl.match(/actes_annexes\/(.+)$/);
    if (!pathMatch) return;

    const filePath = pathMatch[1];
    const { error } = await supabase.storage
      .from('actes_annexes')
      .remove([filePath]);

    if (error) throw error;
  }
};

// Applicabilité mapping queries
export const applicabiliteMappingQueries = {
  async getByActeId(acteId: string) {
    const { data, error } = await supabase
      .from("actes_applicabilite_mapping")
      .select("*")
      .eq("acte_id", acteId);
    if (error) throw error;
    return data as ApplicabiliteMapping[];
  },

  async createBulk(acteId: string, mappings: Array<Omit<ApplicabiliteMapping, 'id' | 'acte_id' | 'created_at'>>) {
    const records = mappings.map(m => ({
      acte_id: acteId,
      ...m
    }));

    const { error } = await supabase
      .from("actes_applicabilite_mapping")
      .insert(records);
    
    if (error) throw error;
  },

  async deleteByActeId(acteId: string) {
    const { error } = await supabase
      .from("actes_applicabilite_mapping")
      .delete()
      .eq("acte_id", acteId);
    if (error) throw error;
  }
};

// Full-text search query
export const searchQueries = {
  async fullTextSearch(searchTerm: string, limit: number = 50) {
    const { data, error } = await supabase
      .rpc('search_actes_reglementaires', {
        search_term: searchTerm,
        result_limit: limit
      });
    
    if (error) throw error;
    return data;
  }
};

// Applicable actes for site query
export const applicableActesQueries = {
  async getApplicableActesForSite(siteId: string) {
    const { data, error } = await supabase
      .rpc('get_applicable_actes_for_site', {
        p_site_id: siteId
      });
    
    if (error) throw error;
    return data;
  }
};

// CSV Import helpers
export const importHelpers = {
  async importActesFromCSV(records: any[]) {
    const results = {
      success: 0,
      errors: [] as Array<{ line: number; error: string; data: any }>
    };

    for (let i = 0; i < records.length; i++) {
      try {
        const record = records[i];
        
        // Validate required fields
        if (!record.intitule || !record.reference_officielle || !record.type_acte) {
          throw new Error("Champs requis manquants: intitule, reference_officielle, type_acte");
        }

        // Create acte
        const acteData: any = {
          type_acte: record.type_acte,
          reference_officielle: record.reference_officielle,
          intitule: record.intitule,
          autorite_emettrice: record.autorite_emettrice || null,
          date_signature: record.date_signature || null,
          date_publication_jort: record.date_publication_jort || null,
          statut_vigueur: record.statut_vigueur || 'en_vigueur',
          objet_resume: record.objet_resume || null,
          tags: record.tags ? record.tags.split(';').map((t: string) => t.trim()) : [],
          content: record.content || null,
          source_url: record.source_url || null
        };

        const { data, error } = await supabase
          .from('actes_reglementaires')
          .insert([acteData])
          .select()
          .single();

        if (error) throw error;

        results.success++;
      } catch (error: any) {
        results.errors.push({
          line: i + 2, // +2 for header row and 0-index
          error: error.message,
          data: records[i]
        });
      }
    }

    return results;
  }
};

// Versioning helpers
export const versioningHelpers = {
  async createNewVersion(acteId: string, changeReason: string) {
    // Get current acte
    const { data: currentActe, error: fetchError } = await supabase
      .from('actes_reglementaires')
      .select('*')
      .eq('id', acteId)
      .single();

    if (fetchError) throw fetchError;

    const newVersion = (currentActe.version || 1) + 1;

    // Update acte with new version
    const { error: updateError } = await supabase
      .from('actes_reglementaires')
      .update({
        version: newVersion,
        previous_version_id: acteId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', acteId);

    if (updateError) throw updateError;

    // Log in changelog
    const { error: logError } = await supabase
      .from('changelog_reglementaire')
      .insert([{
        acte_id: acteId,
        type_changement: 'version_update',
        date_changement: new Date().toISOString(),
        version_anterieure: currentActe.version || 1,
        nouvelle_version: newVersion,
        resume: changeReason,
      }]);

    if (logError) throw logError;

    return newVersion;
  }
};

// Export helpers
export const exportHelpers = {
  async generateActePDF(acteId: string) {
    // Fetch full acte data with relations
    const { data: acte, error: acteError } = await supabase
      .from('actes_reglementaires')
      .select(`
        *,
        articles(*)
      `)
      .eq('id', acteId)
      .single();

    if (acteError) throw acteError;

    const { data: annexes } = await supabase
      .from('actes_annexes')
      .select('*')
      .eq('acte_id', acteId);

    const { data: changelog } = await supabase
      .from('changelog_reglementaire')
      .select('*')
      .eq('acte_id', acteId)
      .order('date_changement', { ascending: false });

    return {
      acte,
      annexes: annexes || [],
      changelog: changelog || []
    };
  }
};
