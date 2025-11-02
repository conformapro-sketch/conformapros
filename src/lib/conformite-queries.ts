import { supabaseAny as supabase } from "@/lib/supabase-any";
import type { Database } from "@/types/db";

type EtatConformite = Database['public']['Enums']['etat_conformite'];

export const conformiteQueries = {
  // Get all applicable articles with conformity data
  getMatrice: async (filters?: {
    domaineId?: string;
    sousDomaineId?: string;
    typeTexte?: string;
    statutTexte?: string;
    etatConformite?: string;
    siteId?: string;
  }) => {
    // Get applicable articles from site_article_status
    let statusQuery = supabase
      .from('site_article_status')
      .select(`
        id,
        site_id,
        article_id,
        applicabilite,
        etat_conformite,
        sites (
          id,
          nom_site,
          code_site,
          client_id
        ),
        conformite (
          id,
          etat,
          commentaire,
          score,
          derniere_mise_a_jour,
          preuves (
            id,
            url_document,
            type_document,
            description,
            date
          )
        )
      `)
      .eq('applicabilite', 'obligatoire');

    if (filters?.siteId && filters.siteId !== 'all') {
      statusQuery = statusQuery.eq('site_id', filters.siteId);
    }

    const { data: statusData, error: statusError } = await statusQuery;
    
    if (statusError) throw statusError;
    if (!statusData || statusData.length === 0) {
      return [];
    }

    // Get unique article IDs to fetch article and text data
    const articleIds = [...new Set(statusData.map(s => s.article_id))];

    const { data: articles } = await supabase
      .from('textes_articles')
      .select(`
        id,
        numero,
        titre_court,
        reference,
        contenu,
        texte_id,
        textes_reglementaires (
          id,
          titre,
          type,
          statut_vigueur,
          reference_officielle,
          textes_reglementaires_domaines (
            domaine_id,
            domaines_application (
              id,
              libelle,
              code
            )
          ),
          textes_reglementaires_sous_domaines (
            sous_domaine_id,
            sous_domaines_application (
              id,
              libelle,
              code
            )
          )
        )
      `)
      .in('id', articleIds);

    // Combine data
    const enrichedData = statusData.map(status => {
      const article = articles?.find(a => a.id === status.article_id);
      return {
        id: status.id,
        site_id: status.site_id,
        article_id: status.article_id,
        applicabilite: status.applicabilite,
        etat_conformite: status.etat_conformite,
        sites: status.sites,
        conformite: status.conformite,
        textes_articles: article ? {
          id: article.id,
          numero: article.numero,
          titre_court: article.titre_court,
          reference: article.reference,
          contenu: article.contenu,
        } : null,
        textes_reglementaires: article?.textes_reglementaires,
      };
    });

    // Apply filters
    let filteredData = enrichedData;

    if (filters?.typeTexte && filters.typeTexte !== 'all') {
      filteredData = filteredData?.filter(item => 
        item.textes_reglementaires?.type === filters.typeTexte
      );
    }

    if (filters?.statutTexte && filters.statutTexte !== 'all') {
      filteredData = filteredData?.filter(item => 
        item.textes_reglementaires?.statut_vigueur === filters.statutTexte
      );
    }

    if (filters?.domaineId && filters.domaineId !== 'all') {
      filteredData = filteredData?.filter(item => 
        Array.isArray((item.textes_reglementaires as any)?.textes_reglementaires_domaines) &&
        (item.textes_reglementaires as any).textes_reglementaires_domaines.some(
          (d: any) => d.domaine_id === filters.domaineId
        )
      );
    }
    
    if (filters?.sousDomaineId && filters.sousDomaineId !== 'all') {
      filteredData = filteredData?.filter(item => 
        Array.isArray((item.textes_reglementaires as any)?.textes_reglementaires_sous_domaines) &&
        (item.textes_reglementaires as any).textes_reglementaires_sous_domaines.some(
          (sd: any) => sd.sous_domaine_id === filters.sousDomaineId
        )
      );
    }
    
    if (filters?.etatConformite && filters.etatConformite !== 'all') {
      filteredData = filteredData?.filter(item => 
        item.conformite?.[0]?.etat === filters.etatConformite
      );
    }
    
    return filteredData;
  },

  // Update or create conformite
  upsertConformite: async (data: {
    status_id: string;
    etat: EtatConformite;
    commentaire?: string;
    score?: number;
  }) => {
    const { data: existing } = await supabase
      .from('conformite')
      .select('id')
      .eq('status_id', data.status_id)
      .maybeSingle();

    const userId = (await supabase.auth.getUser()).data.user?.id;

    if (existing) {
      const { data: updated, error } = await supabase
        .from('conformite')
        .update({
          etat: data.etat,
          commentaire: data.commentaire,
          score: data.score,
          derniere_mise_a_jour: new Date().toISOString(),
          mise_a_jour_par: userId,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    } else {
      const { data: created, error } = await supabase
        .from('conformite')
        .insert([{
          status_id: data.status_id,
          etat: data.etat,
          commentaire: data.commentaire,
          score: data.score,
          mise_a_jour_par: userId,
        }])
        .select()
        .single();

      if (error) throw error;
      return created;
    }
  },

  // Add preuve
  addPreuve: async (data: {
    conformite_id: string;
    fichier_url: string;
    type: string;
    notes?: string;
  }) => {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    
    const { data: preuve, error } = await supabase
      .from('preuves')
      .insert([{
        conformite_id: data.conformite_id,
        url_document: data.fichier_url,
        type_document: data.type,
        description: data.notes,
        titre: data.type || 'Document',
        uploaded_by: userId,
      }])
      .select()
      .single();

    if (error) throw error;
    return preuve;
  },

  // Create action corrective automatically
  createActionCorrective: async (conformiteId: string, statusId: string) => {
    const { data: status } = await supabase
      .from('site_article_status')
      .select('article_id')
      .eq('id', statusId)
      .single();

    if (!status) throw new Error('Status non trouvé');

    const { data: article } = await supabase
      .from('textes_articles')
      .select('numero, titre_court, texte_id')
      .eq('id', status.article_id)
      .maybeSingle();

    const { data: texte } = await supabase
      .from('textes_reglementaires')
      .select('reference_officielle')
      .eq('id', article?.texte_id)
      .maybeSingle();

    const userId = (await supabase.auth.getUser()).data.user?.id;

    const { data: action, error } = await supabase
      .from('actions_correctives')
      .insert([{
        conformite_id: conformiteId,
        manquement: `Non-conformité détectée sur ${texte?.reference_officielle || 'texte'} - Article ${article?.numero || 'N/A'}`,
        titre: 'Action corrective à définir',
        statut: 'a_faire',
        priorite: 'moyenne',
        created_by: userId,
      }])
      .select()
      .single();

    if (error) throw error;
    return action;
  },
};
