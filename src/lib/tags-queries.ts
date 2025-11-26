import { supabase } from "@/integrations/supabase/client";

export interface ReglementaireTag {
  id: string;
  label: string;
  couleur?: string;
  created_at: string;
  created_by?: string;
  updated_at: string;
}

export interface TexteTag {
  id: string;
  texte_id: string;
  tag_id: string;
  created_at: string;
  created_by?: string;
  reglementaire_tags?: ReglementaireTag;
}

export interface ArticleTag {
  id: string;
  article_id: string;
  tag_id: string;
  created_at: string;
  created_by?: string;
  reglementaire_tags?: ReglementaireTag;
}

// ============================================
// TAGS CRUD
// ============================================

export const tagsQueries = {
  async getAll(): Promise<ReglementaireTag[]> {
    const { data, error } = await supabase
      .from("reglementaire_tags")
      .select("*")
      .order("label");

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<ReglementaireTag | null> {
    const { data, error } = await supabase
      .from("reglementaire_tags")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(tag: { label: string; couleur?: string }): Promise<ReglementaireTag> {
    const { data, error } = await supabase
      .from("reglementaire_tags")
      .insert({
        label: tag.label,
        couleur: tag.couleur,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: { label?: string; couleur?: string }): Promise<ReglementaireTag> {
    const { data, error } = await supabase
      .from("reglementaire_tags")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("reglementaire_tags")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  async search(query: string): Promise<ReglementaireTag[]> {
    const { data, error } = await supabase
      .from("reglementaire_tags")
      .select("*")
      .ilike("label", `%${query}%`)
      .order("label")
      .limit(20);

    if (error) throw error;
    return data || [];
  },
};

// ============================================
// TEXTE TAGS
// ============================================

export const texteTagsQueries = {
  async getByTexteId(texteId: string): Promise<TexteTag[]> {
    const { data, error } = await supabase
      .from("texte_tags")
      .select("*, reglementaire_tags(*)")
      .eq("texte_id", texteId);

    if (error) throw error;
    return data || [];
  },

  async addTag(texteId: string, tagId: string): Promise<TexteTag> {
    const { data, error } = await supabase
      .from("texte_tags")
      .insert({
        texte_id: texteId,
        tag_id: tagId,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      })
      .select("*, reglementaire_tags(*)")
      .single();

    if (error) throw error;
    return data;
  },

  async removeTag(texteId: string, tagId: string): Promise<void> {
    const { error } = await supabase
      .from("texte_tags")
      .delete()
      .eq("texte_id", texteId)
      .eq("tag_id", tagId);

    if (error) throw error;
  },
};

// ============================================
// ARTICLE TAGS
// ============================================

export const articleTagsQueries = {
  async getByArticleId(articleId: string): Promise<ArticleTag[]> {
    const { data, error } = await supabase
      .from("article_tags")
      .select("*, reglementaire_tags(*)")
      .eq("article_id", articleId);

    if (error) throw error;
    return data || [];
  },

  async addTag(articleId: string, tagId: string): Promise<ArticleTag> {
    const { data, error } = await supabase
      .from("article_tags")
      .insert({
        article_id: articleId,
        tag_id: tagId,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      })
      .select("*, reglementaire_tags(*)")
      .single();

    if (error) throw error;
    return data;
  },

  async removeTag(articleId: string, tagId: string): Promise<void> {
    const { error } = await supabase
      .from("article_tags")
      .delete()
      .eq("article_id", articleId)
      .eq("tag_id", tagId);

    if (error) throw error;
  },
};
