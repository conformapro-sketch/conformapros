import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/types/db";

type EtatConformite = Database['public']['Enums']['etat_conformite'];

export const conformiteQueries = {
  // Get all applicabilities with related data
  getMatrice: async (filters?: {
    domaineId?: string;
    sousDomaineId?: string;
    typeTexte?: string;
    statutTexte?: string;
    etatConformite?: string;
    siteId?: string;
  }) => {
    let query = supabase
      .from('applicabilite')
      .select(`
        id,
        applicable,
        justification,
        activite,
        texte_id,
        article_id,
        site_id,
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
            fichier_url,
            type,
            notes,
            date
          )
        )
      `);

    if (filters?.siteId && filters.siteId !== 'all') {
      query = query.eq('site_id', filters.siteId);
    }

    const { data: applicabilites, error } = await query;
    
    if (error) throw error;

    // Fetch related textes and articles separately
    const texteIds = [...new Set(applicabilites?.map(a => a.texte_id))];
    const articleIds = [...new Set(applicabilites?.map(a => a.article_id).filter(Boolean))];

    const { data: textes } = await supabase
      .from('textes_reglementaires')
      .select(`
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
      `)
      .in('id', texteIds);

    const { data: articles } = await supabase
      .from('textes_articles')
      .select('id, numero, titre_court, reference, contenu')
      .in('id', articleIds);

    // Combine data
    const enrichedData = applicabilites?.map(appl => ({
      ...appl,
      textes_reglementaires: textes?.find(t => t.id === appl.texte_id),
      textes_articles: articles?.find(a => a.id === appl.article_id),
    }));

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
        item.textes_reglementaires?.textes_reglementaires_domaines?.some(
          (d: any) => d.domaine_id === filters.domaineId
        )
      );
    }
    
    if (filters?.sousDomaineId && filters.sousDomaineId !== 'all') {
      filteredData = filteredData?.filter(item => 
        item.textes_reglementaires?.textes_reglementaires_sous_domaines?.some(
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
    applicabilite_id: string;
    etat: EtatConformite;
    commentaire?: string;
    score?: number;
  }) => {
    const { data: existing } = await supabase
      .from('conformite')
      .select('id')
      .eq('applicabilite_id', data.applicabilite_id)
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
          applicabilite_id: data.applicabilite_id,
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
  createActionCorrective: async (conformiteId: string, applicabiliteId: string) => {
    const { data: applicabilite } = await supabase
      .from('applicabilite')
      .select('article_id, texte_id')
      .eq('id', applicabiliteId)
      .single();

    if (!applicabilite) throw new Error('Applicabilité non trouvée');

    const { data: article } = await supabase
      .from('textes_articles')
      .select('numero_article, titre')
      .eq('id', applicabilite.article_id)
      .maybeSingle();

    const { data: texte } = await supabase
      .from('textes_reglementaires')
      .select('numero')
      .eq('id', applicabilite.texte_id)
      .maybeSingle();

    const userId = (await supabase.auth.getUser()).data.user?.id;

    const { data: action, error } = await supabase
      .from('actions_correctives')
      .insert([{
        conformite_id: conformiteId,
        manquement: `Non-conformité détectée sur ${texte?.numero || 'texte'} - Article ${article?.numero_article || 'N/A'}`,
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
