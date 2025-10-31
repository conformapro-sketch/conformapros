export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      access_scopes: {
        Row: {
          created_at: string | null
          id: string
          read_only: boolean | null
          site_id: string
          updated_at: string | null
          utilisateur_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          read_only?: boolean | null
          site_id: string
          updated_at?: string | null
          utilisateur_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          read_only?: boolean | null
          site_id?: string
          updated_at?: string | null
          utilisateur_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_scopes_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_scopes_utilisateur_id_fkey"
            columns: ["utilisateur_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      actes_annexes: {
        Row: {
          acte_id: string
          created_at: string | null
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          label: string
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          acte_id: string
          created_at?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          label: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          acte_id?: string
          created_at?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          label?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "actes_annexes_acte_id_fkey"
            columns: ["acte_id"]
            isOneToOne: false
            referencedRelation: "actes_reglementaires"
            referencedColumns: ["id"]
          },
        ]
      }
      actes_applicabilite_mapping: {
        Row: {
          acte_id: string
          created_at: string | null
          establishment_type: string
          id: string
          risk_class: string | null
          sector: string | null
        }
        Insert: {
          acte_id: string
          created_at?: string | null
          establishment_type: string
          id?: string
          risk_class?: string | null
          sector?: string | null
        }
        Update: {
          acte_id?: string
          created_at?: string | null
          establishment_type?: string
          id?: string
          risk_class?: string | null
          sector?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "actes_applicabilite_mapping_acte_id_fkey"
            columns: ["acte_id"]
            isOneToOne: false
            referencedRelation: "actes_reglementaires"
            referencedColumns: ["id"]
          },
        ]
      }
      actes_reglementaires: {
        Row: {
          annee: number | null
          applicability: Json | null
          autorite_emettrice: string | null
          content: string | null
          created_at: string | null
          created_by: string | null
          date_entree_vigueur_effective: string | null
          date_publication: string | null
          date_publication_jort: string | null
          date_signature: string | null
          deleted_at: string | null
          domaine: Database["public"]["Enums"]["domaine_reglementaire"]
          domaines: string[] | null
          id: string
          intitule: string | null
          jort_numero: string | null
          jort_page_debut: string | null
          jort_page_fin: string | null
          langue_disponible: string | null
          lien_pdf: string | null
          mots_cles: string[] | null
          notes_editoriales: string | null
          numero_officiel: string | null
          objet_resume: string | null
          previous_version_id: string | null
          reference: string
          reference_officielle: string | null
          resume: string | null
          search_vector: unknown
          source: string | null
          source_url: string | null
          statut: Database["public"]["Enums"]["statut_texte"] | null
          statut_vigueur: Database["public"]["Enums"]["statut_vigueur"]
          tags: string[] | null
          titre: string
          type_acte: Database["public"]["Enums"]["type_acte"]
          updated_at: string | null
          url_pdf_ar: string | null
          url_pdf_fr: string | null
          version: number | null
        }
        Insert: {
          annee?: number | null
          applicability?: Json | null
          autorite_emettrice?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          date_entree_vigueur_effective?: string | null
          date_publication?: string | null
          date_publication_jort?: string | null
          date_signature?: string | null
          deleted_at?: string | null
          domaine: Database["public"]["Enums"]["domaine_reglementaire"]
          domaines?: string[] | null
          id?: string
          intitule?: string | null
          jort_numero?: string | null
          jort_page_debut?: string | null
          jort_page_fin?: string | null
          langue_disponible?: string | null
          lien_pdf?: string | null
          mots_cles?: string[] | null
          notes_editoriales?: string | null
          numero_officiel?: string | null
          objet_resume?: string | null
          previous_version_id?: string | null
          reference: string
          reference_officielle?: string | null
          resume?: string | null
          search_vector?: unknown
          source?: string | null
          source_url?: string | null
          statut?: Database["public"]["Enums"]["statut_texte"] | null
          statut_vigueur?: Database["public"]["Enums"]["statut_vigueur"]
          tags?: string[] | null
          titre: string
          type_acte?: Database["public"]["Enums"]["type_acte"]
          updated_at?: string | null
          url_pdf_ar?: string | null
          url_pdf_fr?: string | null
          version?: number | null
        }
        Update: {
          annee?: number | null
          applicability?: Json | null
          autorite_emettrice?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          date_entree_vigueur_effective?: string | null
          date_publication?: string | null
          date_publication_jort?: string | null
          date_signature?: string | null
          deleted_at?: string | null
          domaine?: Database["public"]["Enums"]["domaine_reglementaire"]
          domaines?: string[] | null
          id?: string
          intitule?: string | null
          jort_numero?: string | null
          jort_page_debut?: string | null
          jort_page_fin?: string | null
          langue_disponible?: string | null
          lien_pdf?: string | null
          mots_cles?: string[] | null
          notes_editoriales?: string | null
          numero_officiel?: string | null
          objet_resume?: string | null
          previous_version_id?: string | null
          reference?: string
          reference_officielle?: string | null
          resume?: string | null
          search_vector?: unknown
          source?: string | null
          source_url?: string | null
          statut?: Database["public"]["Enums"]["statut_texte"] | null
          statut_vigueur?: Database["public"]["Enums"]["statut_vigueur"]
          tags?: string[] | null
          titre?: string
          type_acte?: Database["public"]["Enums"]["type_acte"]
          updated_at?: string | null
          url_pdf_ar?: string | null
          url_pdf_fr?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "actes_reglementaires_previous_version_id_fkey"
            columns: ["previous_version_id"]
            isOneToOne: false
            referencedRelation: "actes_reglementaires"
            referencedColumns: ["id"]
          },
        ]
      }
      actions_correctives: {
        Row: {
          action: string
          conformite_id: string
          cout_estime: number | null
          created_at: string | null
          created_by: string | null
          echeance: string | null
          id: string
          manquement: string
          preuve_cloture_url: string | null
          priorite: Database["public"]["Enums"]["priorite"] | null
          responsable: string | null
          statut: Database["public"]["Enums"]["statut_action"] | null
          updated_at: string | null
        }
        Insert: {
          action: string
          conformite_id: string
          cout_estime?: number | null
          created_at?: string | null
          created_by?: string | null
          echeance?: string | null
          id?: string
          manquement: string
          preuve_cloture_url?: string | null
          priorite?: Database["public"]["Enums"]["priorite"] | null
          responsable?: string | null
          statut?: Database["public"]["Enums"]["statut_action"] | null
          updated_at?: string | null
        }
        Update: {
          action?: string
          conformite_id?: string
          cout_estime?: number | null
          created_at?: string | null
          created_by?: string | null
          echeance?: string | null
          id?: string
          manquement?: string
          preuve_cloture_url?: string | null
          priorite?: Database["public"]["Enums"]["priorite"] | null
          responsable?: string | null
          statut?: Database["public"]["Enums"]["statut_action"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "actions_correctives_conformite_id_fkey"
            columns: ["conformite_id"]
            isOneToOne: false
            referencedRelation: "conformite"
            referencedColumns: ["id"]
          },
        ]
      }
      applicabilite: {
        Row: {
          activite: string | null
          applicable: boolean | null
          article_id: string | null
          client_id: string
          created_at: string | null
          created_by: string | null
          id: string
          justification: string | null
          site_id: string | null
          texte_id: string
          updated_at: string | null
        }
        Insert: {
          activite?: string | null
          applicable?: boolean | null
          article_id?: string | null
          client_id: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          justification?: string | null
          site_id?: string | null
          texte_id: string
          updated_at?: string | null
        }
        Update: {
          activite?: string | null
          applicable?: boolean | null
          article_id?: string | null
          client_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          justification?: string | null
          site_id?: string | null
          texte_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applicabilite_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applicabilite_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applicabilite_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applicabilite_texte_id_fkey"
            columns: ["texte_id"]
            isOneToOne: false
            referencedRelation: "actes_reglementaires"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          acte_id: string
          contenu_ar: string | null
          contenu_fr: string | null
          created_at: string | null
          deleted_at: string | null
          exigences: string[] | null
          id: string
          notes: string | null
          numero: string
          ordre: number | null
          reference_article: string | null
          resume_article: string | null
          titre_court: string | null
          updated_at: string | null
        }
        Insert: {
          acte_id: string
          contenu_ar?: string | null
          contenu_fr?: string | null
          created_at?: string | null
          deleted_at?: string | null
          exigences?: string[] | null
          id?: string
          notes?: string | null
          numero: string
          ordre?: number | null
          reference_article?: string | null
          resume_article?: string | null
          titre_court?: string | null
          updated_at?: string | null
        }
        Update: {
          acte_id?: string
          contenu_ar?: string | null
          contenu_fr?: string | null
          created_at?: string | null
          deleted_at?: string | null
          exigences?: string[] | null
          id?: string
          notes?: string | null
          numero?: string
          ordre?: number | null
          reference_article?: string | null
          resume_article?: string | null
          titre_court?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "articles_texte_id_fkey"
            columns: ["acte_id"]
            isOneToOne: false
            referencedRelation: "actes_reglementaires"
            referencedColumns: ["id"]
          },
        ]
      }
      articles_sous_domaines: {
        Row: {
          article_id: string
          created_at: string | null
          sous_domaine_id: string
        }
        Insert: {
          article_id: string
          created_at?: string | null
          sous_domaine_id: string
        }
        Update: {
          article_id?: string
          created_at?: string | null
          sous_domaine_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "articles_sous_domaines_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_sous_domaines_sous_domaine_id_fkey"
            columns: ["sous_domaine_id"]
            isOneToOne: false
            referencedRelation: "sous_domaines_application"
            referencedColumns: ["id"]
          },
        ]
      }
      articles_versions: {
        Row: {
          article_id: string
          contenu: string
          created_at: string | null
          date_effet: string | null
          deleted_at: string | null
          id: string
          remplace_version_id: string | null
          statut_vigueur: Database["public"]["Enums"]["statut_vigueur"] | null
          updated_at: string | null
          version_label: string
        }
        Insert: {
          article_id: string
          contenu: string
          created_at?: string | null
          date_effet?: string | null
          deleted_at?: string | null
          id?: string
          remplace_version_id?: string | null
          statut_vigueur?: Database["public"]["Enums"]["statut_vigueur"] | null
          updated_at?: string | null
          version_label: string
        }
        Update: {
          article_id?: string
          contenu?: string
          created_at?: string | null
          date_effet?: string | null
          deleted_at?: string | null
          id?: string
          remplace_version_id?: string | null
          statut_vigueur?: Database["public"]["Enums"]["statut_vigueur"] | null
          updated_at?: string | null
          version_label?: string
        }
        Relationships: [
          {
            foreignKeyName: "articles_versions_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_versions_remplace_version_id_fkey"
            columns: ["remplace_version_id"]
            isOneToOne: false
            referencedRelation: "articles_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      changelog_reglementaire: {
        Row: {
          acte_id: string
          created_by: string | null
          date_changement: string | null
          id: string
          resume: string | null
          type_changement: string
        }
        Insert: {
          acte_id: string
          created_by?: string | null
          date_changement?: string | null
          id?: string
          resume?: string | null
          type_changement: string
        }
        Update: {
          acte_id?: string
          created_by?: string | null
          date_changement?: string | null
          id?: string
          resume?: string | null
          type_changement?: string
        }
        Relationships: [
          {
            foreignKeyName: "changelog_reglementaire_texte_id_fkey"
            columns: ["acte_id"]
            isOneToOne: false
            referencedRelation: "actes_reglementaires"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          abonnement_type: string | null
          adresse_siege: string | null
          billing_address: string | null
          billing_email: string | null
          billing_mode: Database["public"]["Enums"]["billing_mode"]
          billing_notes: string | null
          billing_phone: string | null
          code_postal: string | null
          contacts: Json | null
          contrat_sla: string | null
          couleur_primaire: string | null
          couleur_secondaire: string | null
          created_at: string
          currency: string
          delegation: string | null
          email: string | null
          gouvernorat: Database["public"]["Enums"]["gouvernorat"] | null
          id: string
          is_active: boolean
          localite: string | null
          logo_url: string | null
          matricule_fiscal: string | null
          matricule_fiscale: string | null
          name: string
          nature: string | null
          nom_legal: string
          notes: string | null
          payment_terms: string | null
          primary_contact_id: string | null
          rne_rc: string | null
          secteur: string | null
          site_web: string | null
          statut: string | null
          telephone: string | null
          tenant_id: string
          updated_at: string
          ville: string | null
        }
        Insert: {
          abonnement_type?: string | null
          adresse_siege?: string | null
          billing_address?: string | null
          billing_email?: string | null
          billing_mode?: Database["public"]["Enums"]["billing_mode"]
          billing_notes?: string | null
          billing_phone?: string | null
          code_postal?: string | null
          contacts?: Json | null
          contrat_sla?: string | null
          couleur_primaire?: string | null
          couleur_secondaire?: string | null
          created_at?: string
          currency?: string
          delegation?: string | null
          email?: string | null
          gouvernorat?: Database["public"]["Enums"]["gouvernorat"] | null
          id?: string
          is_active?: boolean
          localite?: string | null
          logo_url?: string | null
          matricule_fiscal?: string | null
          matricule_fiscale?: string | null
          name: string
          nature?: string | null
          nom_legal?: string
          notes?: string | null
          payment_terms?: string | null
          primary_contact_id?: string | null
          rne_rc?: string | null
          secteur?: string | null
          site_web?: string | null
          statut?: string | null
          telephone?: string | null
          tenant_id?: string
          updated_at?: string
          ville?: string | null
        }
        Update: {
          abonnement_type?: string | null
          adresse_siege?: string | null
          billing_address?: string | null
          billing_email?: string | null
          billing_mode?: Database["public"]["Enums"]["billing_mode"]
          billing_notes?: string | null
          billing_phone?: string | null
          code_postal?: string | null
          contacts?: Json | null
          contrat_sla?: string | null
          couleur_primaire?: string | null
          couleur_secondaire?: string | null
          created_at?: string
          currency?: string
          delegation?: string | null
          email?: string | null
          gouvernorat?: Database["public"]["Enums"]["gouvernorat"] | null
          id?: string
          is_active?: boolean
          localite?: string | null
          logo_url?: string | null
          matricule_fiscal?: string | null
          matricule_fiscale?: string | null
          name?: string
          nature?: string | null
          nom_legal?: string
          notes?: string | null
          payment_terms?: string | null
          primary_contact_id?: string | null
          rne_rc?: string | null
          secteur?: string | null
          site_web?: string | null
          statut?: string | null
          telephone?: string | null
          tenant_id?: string
          updated_at?: string
          ville?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_primary_contact_id_fkey"
            columns: ["primary_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          client_id: string
          created_at: string
          email: string | null
          id: string
          is_primary: boolean | null
          name: string
          phone: string | null
          role: string | null
          site_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean | null
          name: string
          phone?: string | null
          role?: string | null
          site_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean | null
          name?: string
          phone?: string | null
          role?: string | null
          site_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      codes: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          structure: Json | null
          titre: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          structure?: Json | null
          titre: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          structure?: Json | null
          titre?: string
          updated_at?: string
        }
        Relationships: []
      }
      conformite: {
        Row: {
          applicabilite_id: string
          commentaire: string | null
          created_at: string | null
          derniere_mise_a_jour: string | null
          etat: Database["public"]["Enums"]["etat_conformite"] | null
          id: string
          mise_a_jour_par: string | null
          score: number | null
        }
        Insert: {
          applicabilite_id: string
          commentaire?: string | null
          created_at?: string | null
          derniere_mise_a_jour?: string | null
          etat?: Database["public"]["Enums"]["etat_conformite"] | null
          id?: string
          mise_a_jour_par?: string | null
          score?: number | null
        }
        Update: {
          applicabilite_id?: string
          commentaire?: string | null
          created_at?: string | null
          derniere_mise_a_jour?: string | null
          etat?: Database["public"]["Enums"]["etat_conformite"] | null
          id?: string
          mise_a_jour_par?: string | null
          score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "conformite_applicabilite_id_fkey"
            columns: ["applicabilite_id"]
            isOneToOne: false
            referencedRelation: "applicabilite"
            referencedColumns: ["id"]
          },
        ]
      }
      delegations: {
        Row: {
          code: string
          created_at: string | null
          gouvernorat_id: string
          id: string
          nom: string
        }
        Insert: {
          code: string
          created_at?: string | null
          gouvernorat_id: string
          id?: string
          nom: string
        }
        Update: {
          code?: string
          created_at?: string | null
          gouvernorat_id?: string
          id?: string
          nom?: string
        }
        Relationships: [
          {
            foreignKeyName: "delegations_gouvernorat_id_fkey"
            columns: ["gouvernorat_id"]
            isOneToOne: false
            referencedRelation: "gouvernorats"
            referencedColumns: ["id"]
          },
        ]
      }
      domaines_application: {
        Row: {
          actif: boolean | null
          code: string
          created_at: string | null
          deleted_at: string | null
          description: string | null
          id: string
          libelle: string
          updated_at: string | null
        }
        Insert: {
          actif?: boolean | null
          code: string
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          libelle: string
          updated_at?: string | null
        }
        Update: {
          actif?: boolean | null
          code?: string
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          libelle?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      employes: {
        Row: {
          aptitude_medicale: string | null
          client_id: string
          created_at: string
          date_embauche: string | null
          date_naissance: string | null
          id: string
          matricule: string
          nom: string
          poste: string | null
          prenom: string
          risques_exposition: string[] | null
          site_id: string | null
          statut_emploi: string | null
          updated_at: string
        }
        Insert: {
          aptitude_medicale?: string | null
          client_id: string
          created_at?: string
          date_embauche?: string | null
          date_naissance?: string | null
          id?: string
          matricule: string
          nom: string
          poste?: string | null
          prenom: string
          risques_exposition?: string[] | null
          site_id?: string | null
          statut_emploi?: string | null
          updated_at?: string
        }
        Update: {
          aptitude_medicale?: string | null
          client_id?: string
          created_at?: string
          date_embauche?: string | null
          date_naissance?: string | null
          id?: string
          matricule?: string
          nom?: string
          poste?: string | null
          prenom?: string
          risques_exposition?: string[] | null
          site_id?: string | null
          statut_emploi?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employes_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      equipements_controle: {
        Row: {
          batiment: string | null
          code_identification: string
          created_at: string
          created_by: string | null
          date_dernier_controle: string | null
          date_mise_en_service: string | null
          etage: string | null
          id: string
          localisation: string | null
          marque: string | null
          modele: string | null
          numero_serie: string | null
          observations: string | null
          organisme_controle_id: string | null
          periodicite_mois: number
          prochaine_echeance: string | null
          responsable_hse_id: string | null
          resultat_dernier_controle:
            | Database["public"]["Enums"]["resultat_controle"]
            | null
          site_id: string
          statut_conformite:
            | Database["public"]["Enums"]["statut_conformite"]
            | null
          statut_operationnel:
            | Database["public"]["Enums"]["statut_operationnel"]
            | null
          type_equipement_id: string
          updated_at: string
        }
        Insert: {
          batiment?: string | null
          code_identification: string
          created_at?: string
          created_by?: string | null
          date_dernier_controle?: string | null
          date_mise_en_service?: string | null
          etage?: string | null
          id?: string
          localisation?: string | null
          marque?: string | null
          modele?: string | null
          numero_serie?: string | null
          observations?: string | null
          organisme_controle_id?: string | null
          periodicite_mois?: number
          prochaine_echeance?: string | null
          responsable_hse_id?: string | null
          resultat_dernier_controle?:
            | Database["public"]["Enums"]["resultat_controle"]
            | null
          site_id: string
          statut_conformite?:
            | Database["public"]["Enums"]["statut_conformite"]
            | null
          statut_operationnel?:
            | Database["public"]["Enums"]["statut_operationnel"]
            | null
          type_equipement_id: string
          updated_at?: string
        }
        Update: {
          batiment?: string | null
          code_identification?: string
          created_at?: string
          created_by?: string | null
          date_dernier_controle?: string | null
          date_mise_en_service?: string | null
          etage?: string | null
          id?: string
          localisation?: string | null
          marque?: string | null
          modele?: string | null
          numero_serie?: string | null
          observations?: string | null
          organisme_controle_id?: string | null
          periodicite_mois?: number
          prochaine_echeance?: string | null
          responsable_hse_id?: string | null
          resultat_dernier_controle?:
            | Database["public"]["Enums"]["resultat_controle"]
            | null
          site_id?: string
          statut_conformite?:
            | Database["public"]["Enums"]["statut_conformite"]
            | null
          statut_operationnel?:
            | Database["public"]["Enums"]["statut_operationnel"]
            | null
          type_equipement_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipements_controle_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipements_controle_organisme_controle_id_fkey"
            columns: ["organisme_controle_id"]
            isOneToOne: false
            referencedRelation: "organismes_controle"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipements_controle_responsable_hse_id_fkey"
            columns: ["responsable_hse_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipements_controle_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipements_controle_type_equipement_id_fkey"
            columns: ["type_equipement_id"]
            isOneToOne: false
            referencedRelation: "types_equipement"
            referencedColumns: ["id"]
          },
        ]
      }
      gouvernorats: {
        Row: {
          code: string
          created_at: string | null
          id: string
          nom: string
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          nom: string
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          nom?: string
        }
        Relationships: []
      }
      historique_controles: {
        Row: {
          actions_correctives: string | null
          certificat_numero: string | null
          controleur_nom: string | null
          created_at: string
          created_by: string | null
          date_controle: string
          equipement_id: string
          id: string
          non_conformites: string[] | null
          observations: string | null
          organisme_controle_id: string | null
          prochaine_echeance: string | null
          rapport_url: string | null
          resultat: Database["public"]["Enums"]["resultat_controle"]
        }
        Insert: {
          actions_correctives?: string | null
          certificat_numero?: string | null
          controleur_nom?: string | null
          created_at?: string
          created_by?: string | null
          date_controle: string
          equipement_id: string
          id?: string
          non_conformites?: string[] | null
          observations?: string | null
          organisme_controle_id?: string | null
          prochaine_echeance?: string | null
          rapport_url?: string | null
          resultat: Database["public"]["Enums"]["resultat_controle"]
        }
        Update: {
          actions_correctives?: string | null
          certificat_numero?: string | null
          controleur_nom?: string | null
          created_at?: string
          created_by?: string | null
          date_controle?: string
          equipement_id?: string
          id?: string
          non_conformites?: string[] | null
          observations?: string | null
          organisme_controle_id?: string | null
          prochaine_echeance?: string | null
          rapport_url?: string | null
          resultat?: Database["public"]["Enums"]["resultat_controle"]
        }
        Relationships: [
          {
            foreignKeyName: "historique_controles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historique_controles_equipement_id_fkey"
            columns: ["equipement_id"]
            isOneToOne: false
            referencedRelation: "equipements_controle"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historique_controles_organisme_controle_id_fkey"
            columns: ["organisme_controle_id"]
            isOneToOne: false
            referencedRelation: "organismes_controle"
            referencedColumns: ["id"]
          },
        ]
      }
      lectures_validations: {
        Row: {
          commentaire: string | null
          created_at: string | null
          date_lecture: string | null
          date_validation: string | null
          id: string
          site_id: string | null
          statut: Database["public"]["Enums"]["statut_lecture"] | null
          texte_id: string
          utilisateur_id: string
        }
        Insert: {
          commentaire?: string | null
          created_at?: string | null
          date_lecture?: string | null
          date_validation?: string | null
          id?: string
          site_id?: string | null
          statut?: Database["public"]["Enums"]["statut_lecture"] | null
          texte_id: string
          utilisateur_id: string
        }
        Update: {
          commentaire?: string | null
          created_at?: string | null
          date_lecture?: string | null
          date_validation?: string | null
          id?: string
          site_id?: string | null
          statut?: Database["public"]["Enums"]["statut_lecture"] | null
          texte_id?: string
          utilisateur_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lectures_validations_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lectures_validations_texte_id_fkey"
            columns: ["texte_id"]
            isOneToOne: false
            referencedRelation: "actes_reglementaires"
            referencedColumns: ["id"]
          },
        ]
      }
      liens_module: {
        Row: {
          action_corrective_id: string | null
          created_at: string | null
          id: string
          module: string
          record_id: string
          site_id: string
        }
        Insert: {
          action_corrective_id?: string | null
          created_at?: string | null
          id?: string
          module: string
          record_id: string
          site_id: string
        }
        Update: {
          action_corrective_id?: string | null
          created_at?: string | null
          id?: string
          module?: string
          record_id?: string
          site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "liens_module_action_corrective_id_fkey"
            columns: ["action_corrective_id"]
            isOneToOne: false
            referencedRelation: "actions_correctives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "liens_module_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      localites: {
        Row: {
          code_postal: string | null
          created_at: string | null
          delegation_id: string
          id: string
          nom: string
        }
        Insert: {
          code_postal?: string | null
          created_at?: string | null
          delegation_id: string
          id?: string
          nom: string
        }
        Update: {
          code_postal?: string | null
          created_at?: string | null
          delegation_id?: string
          id?: string
          nom?: string
        }
        Relationships: [
          {
            foreignKeyName: "localites_delegation_id_fkey"
            columns: ["delegation_id"]
            isOneToOne: false
            referencedRelation: "delegations"
            referencedColumns: ["id"]
          },
        ]
      }
      med_documents: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          type_doc: Database["public"]["Enums"]["type_document_medical"]
          uploaded_by: string | null
          valid_until: string | null
          version: number
          visite_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          type_doc: Database["public"]["Enums"]["type_document_medical"]
          uploaded_by?: string | null
          valid_until?: string | null
          version?: number
          visite_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          type_doc?: Database["public"]["Enums"]["type_document_medical"]
          uploaded_by?: string | null
          valid_until?: string | null
          version?: number
          visite_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "med_documents_visite_id_fkey"
            columns: ["visite_id"]
            isOneToOne: false
            referencedRelation: "med_visites"
            referencedColumns: ["id"]
          },
        ]
      }
      med_notes_confidentielles: {
        Row: {
          contre_indications: string | null
          created_at: string
          created_by: string | null
          examens_realises: string | null
          id: string
          observations: string | null
          propositions_amenagement: string | null
          updated_at: string
          updated_by: string | null
          visite_id: string
        }
        Insert: {
          contre_indications?: string | null
          created_at?: string
          created_by?: string | null
          examens_realises?: string | null
          id?: string
          observations?: string | null
          propositions_amenagement?: string | null
          updated_at?: string
          updated_by?: string | null
          visite_id: string
        }
        Update: {
          contre_indications?: string | null
          created_at?: string
          created_by?: string | null
          examens_realises?: string | null
          id?: string
          observations?: string | null
          propositions_amenagement?: string | null
          updated_at?: string
          updated_by?: string | null
          visite_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "med_notes_confidentielles_visite_id_fkey"
            columns: ["visite_id"]
            isOneToOne: false
            referencedRelation: "med_visites"
            referencedColumns: ["id"]
          },
        ]
      }
      med_periodicite_rules: {
        Row: {
          actif: boolean
          created_at: string
          description: string | null
          id: string
          key: string
          libelle: string
          periodicite_mois: number
          updated_at: string
        }
        Insert: {
          actif?: boolean
          created_at?: string
          description?: string | null
          id?: string
          key: string
          libelle: string
          periodicite_mois: number
          updated_at?: string
        }
        Update: {
          actif?: boolean
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          libelle?: string
          periodicite_mois?: number
          updated_at?: string
        }
        Relationships: []
      }
      med_visites: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          date_planifiee: string
          date_realisee: string | null
          employe_id: string
          id: string
          medecin_nom: string | null
          medecin_organisme: string | null
          motif: string | null
          prochaine_echeance: string | null
          restrictions: string | null
          resultat_aptitude:
            | Database["public"]["Enums"]["resultat_aptitude"]
            | null
          site_id: string | null
          sms_flags: string[] | null
          statut_visite: Database["public"]["Enums"]["statut_visite_medicale"]
          type_visite: Database["public"]["Enums"]["type_visite_medicale"]
          updated_at: string
          updated_by: string | null
          validite_jusqua: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          date_planifiee: string
          date_realisee?: string | null
          employe_id: string
          id?: string
          medecin_nom?: string | null
          medecin_organisme?: string | null
          motif?: string | null
          prochaine_echeance?: string | null
          restrictions?: string | null
          resultat_aptitude?:
            | Database["public"]["Enums"]["resultat_aptitude"]
            | null
          site_id?: string | null
          sms_flags?: string[] | null
          statut_visite?: Database["public"]["Enums"]["statut_visite_medicale"]
          type_visite: Database["public"]["Enums"]["type_visite_medicale"]
          updated_at?: string
          updated_by?: string | null
          validite_jusqua?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          date_planifiee?: string
          date_realisee?: string | null
          employe_id?: string
          id?: string
          medecin_nom?: string | null
          medecin_organisme?: string | null
          motif?: string | null
          prochaine_echeance?: string | null
          restrictions?: string | null
          resultat_aptitude?:
            | Database["public"]["Enums"]["resultat_aptitude"]
            | null
          site_id?: string | null
          sms_flags?: string[] | null
          statut_visite?: Database["public"]["Enums"]["statut_visite_medicale"]
          type_visite?: Database["public"]["Enums"]["type_visite_medicale"]
          updated_at?: string
          updated_by?: string | null
          validite_jusqua?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "med_visites_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "med_visites_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "med_visites_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      modules_systeme: {
        Row: {
          actif: boolean | null
          code: string
          created_at: string | null
          description: string | null
          id: string
          libelle: string
          updated_at: string | null
        }
        Insert: {
          actif?: boolean | null
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          libelle: string
          updated_at?: string | null
        }
        Update: {
          actif?: boolean | null
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          libelle?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      organismes_controle: {
        Row: {
          actif: boolean | null
          adresse: string | null
          agrement_numero: string | null
          created_at: string
          email: string | null
          id: string
          nom: string
          specialites: string[] | null
          telephone: string | null
          updated_at: string
        }
        Insert: {
          actif?: boolean | null
          adresse?: string | null
          agrement_numero?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nom: string
          specialites?: string[] | null
          telephone?: string | null
          updated_at?: string
        }
        Update: {
          actif?: boolean | null
          adresse?: string | null
          agrement_numero?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nom?: string
          specialites?: string[] | null
          telephone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      preuves: {
        Row: {
          ajoute_par: string | null
          conformite_id: string
          created_at: string | null
          date: string | null
          empreinte_sha256: string | null
          fichier_url: string | null
          id: string
          notes: string | null
          type: string | null
        }
        Insert: {
          ajoute_par?: string | null
          conformite_id: string
          created_at?: string | null
          date?: string | null
          empreinte_sha256?: string | null
          fichier_url?: string | null
          id?: string
          notes?: string | null
          type?: string | null
        }
        Update: {
          ajoute_par?: string | null
          conformite_id?: string
          created_at?: string | null
          date?: string | null
          empreinte_sha256?: string | null
          fichier_url?: string | null
          id?: string
          notes?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "preuves_conformite_id_fkey"
            columns: ["conformite_id"]
            isOneToOne: false
            referencedRelation: "conformite"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          actif: boolean | null
          avatar_url: string | null
          client_id: string | null
          created_at: string
          email: string | null
          fonction: string | null
          id: string
          nom: string | null
          prenom: string | null
          role_id: string | null
          site_id: string | null
          tenant_id: string
          telephone: string | null
          updated_at: string
        }
        Insert: {
          actif?: boolean | null
          avatar_url?: string | null
          client_id?: string | null
          created_at?: string
          email?: string | null
          fonction?: string | null
          id: string
          nom?: string | null
          prenom?: string | null
          role_id?: string | null
          site_id?: string | null
          tenant_id?: string
          telephone?: string | null
          updated_at?: string
        }
        Update: {
          actif?: boolean | null
          avatar_url?: string | null
          client_id?: string | null
          created_at?: string
          email?: string | null
          fonction?: string | null
          id?: string
          nom?: string | null
          prenom?: string | null
          role_id?: string | null
          site_id?: string | null
          tenant_id?: string
          telephone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      referentiels_secteurs: {
        Row: {
          actifs_concernes: string[] | null
          created_at: string | null
          exigences_types: string[] | null
          id: string
          updated_at: string | null
        }
        Insert: {
          actifs_concernes?: string[] | null
          created_at?: string | null
          exigences_types?: string[] | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          actifs_concernes?: string[] | null
          created_at?: string | null
          exigences_types?: string[] | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      relations_actes: {
        Row: {
          cible_id: string
          created_at: string
          details: string | null
          id: string
          relation: Database["public"]["Enums"]["type_relation"]
          source_id: string
        }
        Insert: {
          cible_id: string
          created_at?: string
          details?: string | null
          id?: string
          relation: Database["public"]["Enums"]["type_relation"]
          source_id: string
        }
        Update: {
          cible_id?: string
          created_at?: string
          details?: string | null
          id?: string
          relation?: Database["public"]["Enums"]["type_relation"]
          source_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "relations_actes_cible_id_fkey"
            columns: ["cible_id"]
            isOneToOne: false
            referencedRelation: "actes_reglementaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relations_actes_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "actes_reglementaires"
            referencedColumns: ["id"]
          },
        ]
      }
      regulatory_applicability_rules: {
        Row: {
          active: boolean
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          label: string
          payload: Json
          tags: string[]
          tenant_id: string | null
          updated_at: string
          updated_by: string | null
          version: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          label: string
          payload?: Json
          tags?: string[]
          tenant_id?: string | null
          updated_at?: string
          updated_by?: string | null
          version?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          label?: string
          payload?: Json
          tags?: string[]
          tenant_id?: string | null
          updated_at?: string
          updated_by?: string | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "regulatory_applicability_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "regulatory_applicability_rules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "regulatory_applicability_rules_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          actif: boolean | null
          created_at: string | null
          description: string | null
          id: string
          nom: string
          permissions: Json
          updated_at: string | null
        }
        Insert: {
          actif?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          nom: string
          permissions?: Json
          updated_at?: string | null
        }
        Update: {
          actif?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          nom?: string
          permissions?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      site_article_actions: {
        Row: {
          article_id: string
          created_at: string
          created_by: string | null
          description: string | null
          echeance: string | null
          id: string
          priorite: Database["public"]["Enums"]["priorite"] | null
          responsable_id: string | null
          responsable_nom: string | null
          site_id: string
          status_id: string
          statut: Database["public"]["Enums"]["statut_action"] | null
          tenant_id: string
          titre: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          article_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          echeance?: string | null
          id?: string
          priorite?: Database["public"]["Enums"]["priorite"] | null
          responsable_id?: string | null
          responsable_nom?: string | null
          site_id?: string
          status_id: string
          statut?: Database["public"]["Enums"]["statut_action"] | null
          tenant_id?: string
          titre: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          article_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          echeance?: string | null
          id?: string
          priorite?: Database["public"]["Enums"]["priorite"] | null
          responsable_id?: string | null
          responsable_nom?: string | null
          site_id?: string
          status_id?: string
          statut?: Database["public"]["Enums"]["statut_action"] | null
          tenant_id?: string
          titre?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_article_actions_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "textes_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_article_actions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_article_actions_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_article_actions_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_article_actions_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "site_article_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_article_actions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_article_actions_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      site_article_proofs: {
        Row: {
          article_id: string
          commentaire: string | null
          created_at: string
          created_by: string | null
          file_name: string | null
          file_size: number | null
          file_type: string | null
          id: string
          metadata: Json
          proof_type: Database["public"]["Enums"]["regulatory_proof_type"]
          resource_url: string
          site_id: string
          status_id: string
          storage_bucket: string | null
          storage_path: string | null
          tenant_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          article_id?: string
          commentaire?: string | null
          created_at?: string
          created_by?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          metadata?: Json
          proof_type: Database["public"]["Enums"]["regulatory_proof_type"]
          resource_url: string
          site_id?: string
          status_id: string
          storage_bucket?: string | null
          storage_path?: string | null
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          article_id?: string
          commentaire?: string | null
          created_at?: string
          created_by?: string | null
          file_name?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          metadata?: Json
          proof_type?: Database["public"]["Enums"]["regulatory_proof_type"]
          resource_url?: string
          site_id?: string
          status_id?: string
          storage_bucket?: string | null
          storage_path?: string | null
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_article_proofs_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "textes_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_article_proofs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_article_proofs_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_article_proofs_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "site_article_status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_article_proofs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_article_proofs_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      site_article_saved_views: {
        Row: {
          created_at: string
          description: string | null
          filters: Json
          id: string
          is_default: boolean
          name: string
          owner_id: string
          scope: Database["public"]["Enums"]["regulatory_saved_view_scope"]
          shared_with: Json
          site_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          filters?: Json
          id?: string
          is_default?: boolean
          name: string
          owner_id: string
          scope?: Database["public"]["Enums"]["regulatory_saved_view_scope"]
          shared_with?: Json
          site_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          filters?: Json
          id?: string
          is_default?: boolean
          name?: string
          owner_id?: string
          scope?: Database["public"]["Enums"]["regulatory_saved_view_scope"]
          shared_with?: Json
          site_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_article_saved_views_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_article_saved_views_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_article_saved_views_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      site_article_status: {
        Row: {
          applicabilite: Database["public"]["Enums"]["regulatory_applicability"]
          article_id: string
          client_id: string
          commentaire: string | null
          created_at: string
          created_by: string | null
          etat: Database["public"]["Enums"]["etat_conformite"]
          external_proof_url: string | null
          id: string
          impact_level: string | null
          impact_score: number | null
          is_locked: boolean
          last_suggestion_id: string | null
          locked_at: string | null
          locked_by: string | null
          motif_commentaire: string | null
          motif_non_applicable: Database["public"]["Enums"]["regulatory_non_applicable_reason"] | null
          preuve_urls: string[]
          preuves_metadata: Json
          site_id: string
          suggestion_payload: Json
          tenant_id: string
          texte_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          applicabilite?: Database["public"]["Enums"]["regulatory_applicability"]
          article_id: string
          client_id?: string
          commentaire?: string | null
          created_at?: string
          created_by?: string | null
          etat?: Database["public"]["Enums"]["etat_conformite"]
          external_proof_url?: string | null
          id?: string
          impact_level?: string | null
          impact_score?: number | null
          is_locked?: boolean
          last_suggestion_id?: string | null
          locked_at?: string | null
          locked_by?: string | null
          motif_commentaire?: string | null
          motif_non_applicable?: Database["public"]["Enums"]["regulatory_non_applicable_reason"] | null
          preuve_urls?: string[]
          preuves_metadata?: Json
          site_id: string
          suggestion_payload?: Json
          tenant_id?: string
          texte_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          applicabilite?: Database["public"]["Enums"]["regulatory_applicability"]
          article_id?: string
          client_id?: string
          commentaire?: string | null
          created_at?: string
          created_by?: string | null
          etat?: Database["public"]["Enums"]["etat_conformite"]
          external_proof_url?: string | null
          id?: string
          impact_level?: string | null
          impact_score?: number | null
          is_locked?: boolean
          last_suggestion_id?: string | null
          locked_at?: string | null
          locked_by?: string | null
          motif_commentaire?: string | null
          motif_non_applicable?: Database["public"]["Enums"]["regulatory_non_applicable_reason"] | null
          preuve_urls?: string[]
          preuves_metadata?: Json
          site_id?: string
          suggestion_payload?: Json
          tenant_id?: string
          texte_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_article_status_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "textes_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_article_status_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_article_status_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_article_status_locked_by_fkey"
            columns: ["locked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_article_status_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_article_status_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_article_status_texte_id_fkey"
            columns: ["texte_id"]
            isOneToOne: false
            referencedRelation: "textes_reglementaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_article_status_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      site_modules: {
        Row: {
          enabled: boolean | null
          enabled_at: string | null
          enabled_by: string | null
          id: string
          module_id: string
          site_id: string
        }
        Insert: {
          enabled?: boolean | null
          enabled_at?: string | null
          enabled_by?: string | null
          id?: string
          module_id: string
          site_id: string
        }
        Update: {
          enabled?: boolean | null
          enabled_at?: string | null
          enabled_by?: string | null
          id?: string
          module_id?: string
          site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_modules_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules_systeme"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_modules_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_veille_domaines: {
        Row: {
          domaine_id: string
          enabled: boolean | null
          id: string
          site_id: string
        }
        Insert: {
          domaine_id: string
          enabled?: boolean | null
          id?: string
          site_id: string
        }
        Update: {
          domaine_id?: string
          enabled?: boolean | null
          id?: string
          site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_veille_domaines_domaine_id_fkey"
            columns: ["domaine_id"]
            isOneToOne: false
            referencedRelation: "domaines_application"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_veille_domaines_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          activite: string | null
          adresse: string | null
          autorite_protection_civile: string | null
          classification: string | null
          client_id: string
          code_postal: string | null
          code_site: string
          coordonnees_gps: unknown
          coordonnees_gps_lat: number | null
          coordonnees_gps_lng: number | null
          created_at: string
          delegation: string | null
          documents: Json | null
          effectif: number | null
          email: string | null
          equipements_critiques: Json | null
          est_siege: boolean | null
          gouvernorat: string | null
          id: string
          is_active: boolean
          is_billable: boolean
          localite: string | null
          matricule_fiscale: string | null
          niveau_risque: Database["public"]["Enums"]["niveau_risque"] | null
          nom_site: string
          name: string
          prestataires_affectes: Json | null
          responsable_site: string | null
          secteur_activite: string | null
          superficie: number | null
          telephone: string | null
          tenant_id: string
          updated_at: string
          ville: string | null
        }
        Insert: {
          activite?: string | null
          adresse?: string | null
          autorite_protection_civile?: string | null
          classification?: string | null
          client_id: string
          code_postal?: string | null
          code_site: string
          coordonnees_gps?: unknown
          coordonnees_gps_lat?: number | null
          coordonnees_gps_lng?: number | null
          created_at?: string
          delegation?: string | null
          documents?: Json | null
          effectif?: number | null
          email?: string | null
          equipements_critiques?: Json | null
          est_siege?: boolean | null
          gouvernorat?: string | null
          id?: string
          is_active?: boolean
          is_billable?: boolean
          localite?: string | null
          matricule_fiscale?: string | null
          niveau_risque?: Database["public"]["Enums"]["niveau_risque"] | null
          nom_site: string
          name: string
          prestataires_affectes?: Json | null
          responsable_site?: string | null
          secteur_activite?: string | null
          superficie?: number | null
          telephone?: string | null
          tenant_id?: string
          updated_at?: string
          ville?: string | null
        }
        Update: {
          activite?: string | null
          adresse?: string | null
          autorite_protection_civile?: string | null
          classification?: string | null
          client_id?: string
          code_postal?: string | null
          code_site?: string
          coordonnees_gps?: unknown
          coordonnees_gps_lat?: number | null
          coordonnees_gps_lng?: number | null
          created_at?: string
          delegation?: string | null
          documents?: Json | null
          effectif?: number | null
          email?: string | null
          equipements_critiques?: Json | null
          est_siege?: boolean | null
          gouvernorat?: string | null
          id?: string
          is_active?: boolean
          is_billable?: boolean
          localite?: string | null
          matricule_fiscale?: string | null
          niveau_risque?: Database["public"]["Enums"]["niveau_risque"] | null
          nom_site?: string
          name?: string
          prestataires_affectes?: Json | null
          responsable_site?: string | null
          secteur_activite?: string | null
          superficie?: number | null
          telephone?: string | null
          tenant_id?: string
          updated_at?: string
          ville?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sites_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sites_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          client_id: string | null
          details: Json
          entity: string
          entity_id: string | null
          id: string
          site_id: string | null
          tenant_id: string
          ts: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          client_id?: string | null
          details?: Json
          entity: string
          entity_id?: string | null
          id?: string
          site_id?: string | null
          tenant_id?: string
          ts?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          client_id?: string | null
          details?: Json
          entity?: string
          entity_id?: string | null
          id?: string
          site_id?: string | null
          tenant_id?: string
          ts?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          description: string | null
          designation: string
          id: string
          invoice_id: string
          metadata: Json | null
          quantity: number
          tax_rate: number
          total_ht: number
          unit_price: number
        }
        Insert: {
          description?: string | null
          designation: string
          id?: string
          invoice_id: string
          metadata?: Json | null
          quantity?: number
          tax_rate?: number
          total_ht?: number
          unit_price?: number
        }
        Update: {
          description?: string | null
          designation?: string
          id?: string
          invoice_id?: string
          metadata?: Json | null
          quantity?: number
          tax_rate?: number
          total_ht?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_links: {
        Row: {
          child_invoice_id: string
          parent_invoice_id: string
        }
        Insert: {
          child_invoice_id: string
          parent_invoice_id: string
        }
        Update: {
          child_invoice_id?: string
          parent_invoice_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_links_child_invoice_id_fkey"
            columns: ["child_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_links_parent_invoice_id_fkey"
            columns: ["parent_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_sequences: {
        Row: {
          last_sequence: number
          tenant_id: string
          year: number
        }
        Insert: {
          last_sequence?: number
          tenant_id: string
          year: number
        }
        Update: {
          last_sequence?: number
          tenant_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_sequences_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          client_id: string
          consolidated_parent_id: string | null
          created_at: string
          currency: string
          due_date: string | null
          id: string
          invoice_date: string
          invoice_no: string
          notes: string | null
          pdf_url: string | null
          site_id: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subscription_id: string | null
          tax_breakdown: Json | null
          tenant_id: string
          total_ht: number
          total_ttc: number
          total_tva: number
          updated_at: string
        }
        Insert: {
          client_id: string
          consolidated_parent_id?: string | null
          created_at?: string
          currency?: string
          due_date?: string | null
          id?: string
          invoice_date?: string
          invoice_no?: string
          notes?: string | null
          pdf_url?: string | null
          site_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subscription_id?: string | null
          tax_breakdown?: Json | null
          tenant_id?: string
          total_ht?: number
          total_ttc?: number
          total_tva?: number
          updated_at?: string
        }
        Update: {
          client_id?: string
          consolidated_parent_id?: string | null
          created_at?: string
          currency?: string
          due_date?: string | null
          id?: string
          invoice_date?: string
          invoice_no?: string
          notes?: string | null
          pdf_url?: string | null
          site_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subscription_id?: string | null
          tax_breakdown?: Json | null
          tenant_id?: string
          total_ht?: number
          total_ttc?: number
          total_tva?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_consolidated_parent_id_fkey"
            columns: ["consolidated_parent_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string
          method: string
          notes: string | null
          paid_at: string
          reference: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          invoice_id: string
          method: string
          notes?: string | null
          paid_at: string
          reference?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string
          method?: string
          notes?: string | null
          paid_at?: string
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          base_price: number
          code: string
          created_at: string
          features: Json
          id: string
          is_active: boolean
          label: string
          periodicity: Database["public"]["Enums"]["plan_periodicity"]
          per_site_price: number | null
          updated_at: string
        }
        Insert: {
          base_price?: number
          code: string
          created_at?: string
          features?: Json
          id?: string
          is_active?: boolean
          label: string
          periodicity: Database["public"]["Enums"]["plan_periodicity"]
          per_site_price?: number | null
          updated_at?: string
        }
        Update: {
          base_price?: number
          code?: string
          created_at?: string
          features?: Json
          id?: string
          is_active?: boolean
          label?: string
          periodicity?: Database["public"]["Enums"]["plan_periodicity"]
          per_site_price?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          client_id: string
          created_at: string
          currency: string | null
          end_date: string | null
          id: string
          next_billing_date: string | null
          notes: string | null
          plan_id: string
          price_override: number | null
          scope: Database["public"]["Enums"]["subscription_scope"]
          site_id: string | null
          start_date: string
          status: Database["public"]["Enums"]["subscription_status"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          currency?: string | null
          end_date?: string | null
          id?: string
          next_billing_date?: string | null
          notes?: string | null
          plan_id: string
          price_override?: number | null
          scope: Database["public"]["Enums"]["subscription_scope"]
          site_id?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["subscription_status"]
          tenant_id?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          currency?: string | null
          end_date?: string | null
          id?: string
          next_billing_date?: string | null
          notes?: string | null
          plan_id?: string
          price_override?: number | null
          scope?: Database["public"]["Enums"]["subscription_scope"]
          site_id?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          default_currency: string
          id: string
          metadata: Json | null
          name: string
          slug: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_currency?: string
          id?: string
          metadata?: Json | null
          name: string
          slug?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_currency?: string
          id?: string
          metadata?: Json | null
          name?: string
          slug?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sous_domaines_application: {
        Row: {
          actif: boolean | null
          code: string
          created_at: string | null
          deleted_at: string | null
          description: string | null
          domaine_id: string
          id: string
          libelle: string
          ordre: number | null
          updated_at: string | null
        }
        Insert: {
          actif?: boolean | null
          code: string
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          domaine_id: string
          id?: string
          libelle: string
          ordre?: number | null
          updated_at?: string | null
        }
        Update: {
          actif?: boolean | null
          code?: string
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          domaine_id?: string
          id?: string
          libelle?: string
          ordre?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sous_domaines_application_domaine_id_fkey"
            columns: ["domaine_id"]
            isOneToOne: false
            referencedRelation: "domaines_application"
            referencedColumns: ["id"]
          },
        ]
      }
      structures_code: {
        Row: {
          acte_id: string
          created_at: string
          id: string
          niveau: Database["public"]["Enums"]["niveau_structure"]
          numero: string
          parent_id: string | null
          titre: string
          updated_at: string
        }
        Insert: {
          acte_id: string
          created_at?: string
          id?: string
          niveau: Database["public"]["Enums"]["niveau_structure"]
          numero: string
          parent_id?: string | null
          titre: string
          updated_at?: string
        }
        Update: {
          acte_id?: string
          created_at?: string
          id?: string
          niveau?: Database["public"]["Enums"]["niveau_structure"]
          numero?: string
          parent_id?: string | null
          titre?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "structures_code_acte_id_fkey"
            columns: ["acte_id"]
            isOneToOne: false
            referencedRelation: "actes_reglementaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "structures_code_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "structures_code"
            referencedColumns: ["id"]
          },
        ]
      }
      textes_articles: {
        Row: {
          contenu: string | null
          created_at: string | null
          id: string
          numero: string
          ordre: number | null
          reference: string | null
          texte_id: string
          titre_court: string | null
          updated_at: string | null
        }
        Insert: {
          contenu?: string | null
          created_at?: string | null
          id?: string
          numero: string
          ordre?: number | null
          reference?: string | null
          texte_id: string
          titre_court?: string | null
          updated_at?: string | null
        }
        Update: {
          contenu?: string | null
          created_at?: string | null
          id?: string
          numero?: string
          ordre?: number | null
          reference?: string | null
          texte_id?: string
          titre_court?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "textes_articles_texte_id_fkey"
            columns: ["texte_id"]
            isOneToOne: false
            referencedRelation: "textes_reglementaires"
            referencedColumns: ["id"]
          },
        ]
      }
      textes_articles_versions: {
        Row: {
          article_id: string
          contenu: string
          created_at: string
          date_effet: string | null
          deleted_at: string | null
          id: string
          remplace_version_id: string | null
          statut_vigueur: Database["public"]["Enums"]["statut_vigueur"]
          updated_at: string
          version_label: string
        }
        Insert: {
          article_id: string
          contenu: string
          created_at?: string
          date_effet?: string | null
          deleted_at?: string | null
          id?: string
          remplace_version_id?: string | null
          statut_vigueur?: Database["public"]["Enums"]["statut_vigueur"]
          updated_at?: string
          version_label: string
        }
        Update: {
          article_id?: string
          contenu?: string
          created_at?: string
          date_effet?: string | null
          deleted_at?: string | null
          id?: string
          remplace_version_id?: string | null
          statut_vigueur?: Database["public"]["Enums"]["statut_vigueur"]
          updated_at?: string
          version_label?: string
        }
        Relationships: [
          {
            foreignKeyName: "textes_articles_versions_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "textes_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "textes_articles_versions_remplace_version_id_fkey"
            columns: ["remplace_version_id"]
            isOneToOne: false
            referencedRelation: "textes_articles_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      textes_domaines: {
        Row: {
          created_at: string | null
          domaine_id: string
          texte_id: string
        }
        Insert: {
          created_at?: string | null
          domaine_id: string
          texte_id: string
        }
        Update: {
          created_at?: string | null
          domaine_id?: string
          texte_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "textes_domaines_domaine_id_fkey"
            columns: ["domaine_id"]
            isOneToOne: false
            referencedRelation: "domaines_application"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "textes_domaines_texte_id_fkey"
            columns: ["texte_id"]
            isOneToOne: false
            referencedRelation: "actes_reglementaires"
            referencedColumns: ["id"]
          },
        ]
      }
      textes_reglementaires: {
        Row: {
          annee: number | null
          autorite: string | null
          code_id: string | null
          created_at: string
          created_by: string | null
          date_publication: string | null
          date_signature: string | null
          deleted_at: string | null
          fichier_pdf_url: string | null
          id: string
          reference_officielle: string
          resume: string | null
          statut_vigueur: Database["public"]["Enums"]["statut_vigueur"]
          titre: string
          type: Database["public"]["Enums"]["type_texte_reglementaire"]
          updated_at: string
        }
        Insert: {
          annee?: number | null
          autorite?: string | null
          code_id?: string | null
          created_at?: string
          created_by?: string | null
          date_publication?: string | null
          date_signature?: string | null
          deleted_at?: string | null
          fichier_pdf_url?: string | null
          id?: string
          reference_officielle: string
          resume?: string | null
          statut_vigueur?: Database["public"]["Enums"]["statut_vigueur"]
          titre: string
          type: Database["public"]["Enums"]["type_texte_reglementaire"]
          updated_at?: string
        }
        Update: {
          annee?: number | null
          autorite?: string | null
          code_id?: string | null
          created_at?: string
          created_by?: string | null
          date_publication?: string | null
          date_signature?: string | null
          deleted_at?: string | null
          fichier_pdf_url?: string | null
          id?: string
          reference_officielle?: string
          resume?: string | null
          statut_vigueur?: Database["public"]["Enums"]["statut_vigueur"]
          titre?: string
          type?: Database["public"]["Enums"]["type_texte_reglementaire"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "textes_reglementaires_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "codes"
            referencedColumns: ["id"]
          },
        ]
      }
      textes_reglementaires_domaines: {
        Row: {
          created_at: string | null
          domaine_id: string
          texte_id: string
        }
        Insert: {
          created_at?: string | null
          domaine_id: string
          texte_id: string
        }
        Update: {
          created_at?: string | null
          domaine_id?: string
          texte_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "textes_reglementaires_domaines_domaine_id_fkey"
            columns: ["domaine_id"]
            isOneToOne: false
            referencedRelation: "domaines_application"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "textes_reglementaires_domaines_texte_id_fkey"
            columns: ["texte_id"]
            isOneToOne: false
            referencedRelation: "textes_reglementaires"
            referencedColumns: ["id"]
          },
        ]
      }
      textes_reglementaires_sous_domaines: {
        Row: {
          created_at: string | null
          sous_domaine_id: string
          texte_id: string
        }
        Insert: {
          created_at?: string | null
          sous_domaine_id: string
          texte_id: string
        }
        Update: {
          created_at?: string | null
          sous_domaine_id?: string
          texte_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "textes_reglementaires_sous_domaines_sous_domaine_id_fkey"
            columns: ["sous_domaine_id"]
            isOneToOne: false
            referencedRelation: "sous_domaines_application"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "textes_reglementaires_sous_domaines_texte_id_fkey"
            columns: ["texte_id"]
            isOneToOne: false
            referencedRelation: "textes_reglementaires"
            referencedColumns: ["id"]
          },
        ]
      }
      textes_sous_domaines: {
        Row: {
          created_at: string | null
          sous_domaine_id: string
          texte_id: string
        }
        Insert: {
          created_at?: string | null
          sous_domaine_id: string
          texte_id: string
        }
        Update: {
          created_at?: string | null
          sous_domaine_id?: string
          texte_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "textes_sous_domaines_sous_domaine_id_fkey"
            columns: ["sous_domaine_id"]
            isOneToOne: false
            referencedRelation: "sous_domaines_application"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "textes_sous_domaines_texte_id_fkey"
            columns: ["texte_id"]
            isOneToOne: false
            referencedRelation: "actes_reglementaires"
            referencedColumns: ["id"]
          },
        ]
      }
      types_acte: {
        Row: {
          code: Database["public"]["Enums"]["type_acte"]
          created_at: string
          id: string
          libelle: string
        }
        Insert: {
          code: Database["public"]["Enums"]["type_acte"]
          created_at?: string
          id?: string
          libelle: string
        }
        Update: {
          code?: Database["public"]["Enums"]["type_acte"]
          created_at?: string
          id?: string
          libelle?: string
        }
        Relationships: []
      }
      types_equipement: {
        Row: {
          actif: boolean | null
          code: string
          created_at: string
          description: string | null
          id: string
          libelle: string
          periodicite_mois: number
          reglementation_reference: string | null
          updated_at: string
        }
        Insert: {
          actif?: boolean | null
          code: string
          created_at?: string
          description?: string | null
          id?: string
          libelle: string
          periodicite_mois?: number
          reglementation_reference?: string | null
          updated_at?: string
        }
        Update: {
          actif?: boolean | null
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          libelle?: string
          periodicite_mois?: number
          reglementation_reference?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      regulatory_articles: {
        Row: {
          article_reference: string | null
          date_publication_jort: string | null
          domaines: string[]
          id: string
          impact: string | null
          mots_cles: string[] | null
          reference: string | null
          reference_officielle: string | null
          source: string | null
          source_type: string | null
          sous_domaines: string[]
          statut_vigueur: Database["public"]["Enums"]["statut_vigueur"] | null
          texte_id: string
          texte_titre: string | null
          texte_updated_at: string | null
          titre: string | null
          version_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      bulk_update_site_article_status: {
        Args: {
          p_changes: Json
          p_status_ids: string[]
        }
        Returns: Database["public"]["Tables"]["site_article_status"]["Row"][]
      }
      create_site_article_action: {
        Args: {
          p_description?: string | null
          p_echeance?: string | null
          p_priorite?: Database["public"]["Enums"]["priorite"]
          p_responsable_id?: string | null
          p_responsable_nom?: string | null
          p_statut?: Database["public"]["Enums"]["statut_action"]
          p_status_id: string
          p_titre: string
        }
        Returns: Database["public"]["Tables"]["site_article_actions"]["Row"]
      }
      fix_duplicate_site_names: {
        Args: never
        Returns: {
          details: Json
          fixed_count: number
        }[]
      }
      fix_orphaned_sites: {
        Args: never
        Returns: {
          details: Json
          fixed_count: number
        }[]
      }
      fix_orphaned_users: {
        Args: never
        Returns: {
          details: Json
          fixed_count: number
        }[]
      }
      ensure_site_article_status_rows: {
        Args: {
          p_site_id: string
        }
        Returns: number
      }
      get_applicable_actes_for_site: {
        Args: { site_id_param: string }
        Returns: {
          acte_id: string
          intitule: string
          match_score: number
          reference_officielle: string
          statut_vigueur: string
        }[]
      }
      get_user_client_id: { Args: { _user_id: string }; Returns: string }
      get_user_site_id: { Args: { _user_id: string }; Returns: string }
      get_user_tenant_id: { Args: { _user_id: string }; Returns: string }
      has_permission: {
        Args: { _action: string; _module: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_any_role: {
        Args: { _roles: Database["public"]["Enums"]["app_role"][]; _user_id: string }
        Returns: boolean
      }
      invite_or_update_client_user: {
        Args: {
          p_client_id: string
          p_email: string
          p_full_name: string
          p_role: Database["public"]["Enums"]["app_role"]
          p_site_ids: string[]
        }
        Returns: Json
      }
      run_integrity_checks: { Args: never; Returns: Json }
      generate_invoice_no: { Args: { p_tenant_id: string }; Returns: string }
      search_actes_reglementaires: {
        Args: { limit_count?: number; search_query: string }
        Returns: {
          id: string
          intitule: string
          rank: number
          reference_officielle: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "admin_global"
        | "admin_client"
        | "billing_manager"
        | "account_manager"
        | "viewer"
        | "gestionnaire_hse"
        | "chef_site"
        | "lecteur"
        | "med_practitioner"
        | "med_admin"
      billing_mode: "client" | "site" | "hybrid"
      domaine_reglementaire:
        | "Incendie"
        | "Sécurité du travail"
        | "Environnement"
        | "RH"
        | "Hygiène"
        | "Autres"
      regulatory_applicability: "APPLICABLE" | "NON_APPLICABLE"
      regulatory_non_applicable_reason:
        | "HORS_ACTIVITE"
        | "NON_PRESENT_SUR_SITE"
        | "VOLUME_SEUIL_NON_ATTEINT"
        | "NON_CLASSE"
        | "PROJET"
        | "AUTRE"
      regulatory_proof_type: "FILE" | "EXTERNAL_LINK"
      regulatory_saved_view_scope: "user" | "team" | "tenant"
      etat_conformite: "Conforme" | "Partiel" | "Non_conforme" | "Non_evalue"
      gouvernorat:
        | "Ariana"
        | "Béja"
        | "Ben Arous"
        | "Bizerte"
        | "Gabès"
        | "Gafsa"
        | "Jendouba"
        | "Kairouan"
        | "Kasserine"
        | "Kébili"
        | "Kef"
        | "Mahdia"
        | "Manouba"
        | "Médenine"
        | "Monastir"
        | "Nabeul"
        | "Sfax"
        | "Sidi Bouzid"
        | "Siliana"
        | "Sousse"
        | "Tataouine"
        | "Tozeur"
        | "Tunis"
        | "Zaghouan"
      niveau_risque: "Faible" | "Moyen" | "Élevé" | "Critique"
      niveau_structure: "livre" | "titre" | "chapitre" | "section"
      plan_periodicity: "monthly" | "quarterly" | "yearly"
      priorite: "Basse" | "Moyenne" | "Haute" | "Critique"
      resultat_aptitude:
        | "APTE"
        | "APTE_RESTRICTIONS"
        | "INAPTE_TEMP"
        | "INAPTE_DEFINITIVE"
        | "AVIS_RESERVE"
        | "EN_ATTENTE"
      resultat_controle:
        | "conforme"
        | "non_conforme"
        | "conforme_avec_reserves"
        | "en_attente"
      subscription_scope: "client" | "site"
      subscription_status: "active" | "paused" | "canceled"
      invoice_status: "draft" | "sent" | "paid" | "overdue" | "canceled"
      statut_action: "A_faire" | "En_cours" | "Termine" | "Bloque"
      statut_conformite: "conforme" | "non_conforme" | "a_controler"
      statut_lecture: "A_lire" | "Lu" | "Valide"
      statut_operationnel: "en_service" | "hors_service" | "arret_technique"
      statut_texte: "en_vigueur" | "abroge" | "modifie"
      statut_vigueur: "en_vigueur" | "modifie" | "abroge" | "suspendu"
      statut_visite_medicale:
        | "PLANIFIEE"
        | "REALISEE"
        | "REPORTEE"
        | "ANNULEE"
        | "NO_SHOW"
type_acte: "loi" | "decret" | "arrete" | "circulaire"
      type_document_medical:
        | "CONVOCATION"
        | "AVIS_APTITUDE"
        | "JUSTIFICATIF"
        | "AUTRE"
      type_preuve: "procedure" | "rapport" | "certificat" | "photo" | "autre"
      type_relation:
        | "modifie"
        | "abroge"
        | "complete"
        | "rend_applicable"
        | "rectifie"
        | "renvoi"
      type_texte_reglementaire: "LOI" | "ARRETE" | "DECRET" | "CIRCULAIRE"
      type_visite_medicale:
        | "EMBAUCHE"
        | "PERIODIQUE"
        | "REPRISE"
        | "CHANGEMENT_POSTE"
        | "SMS"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "super_admin",
        "admin_global",
        "admin_client",
        "billing_manager",
        "account_manager",
        "viewer",
        "gestionnaire_hse",
        "chef_site",
        "lecteur",
        "med_practitioner",
        "med_admin",
      ],
      billing_mode: ["client", "site", "hybrid"],
      domaine_reglementaire: [
        "Incendie",
        "Sécurité du travail",
        "Environnement",
        "RH",
        "Hygiène",
        "Autres",
      ],
      regulatory_applicability: ["APPLICABLE", "NON_APPLICABLE"],
      regulatory_non_applicable_reason: [
        "HORS_ACTIVITE",
        "NON_PRESENT_SUR_SITE",
        "VOLUME_SEUIL_NON_ATTEINT",
        "NON_CLASSE",
        "PROJET",
        "AUTRE",
      ],
      regulatory_proof_type: ["FILE", "EXTERNAL_LINK"],
      regulatory_saved_view_scope: ["user", "team", "tenant"],
      etat_conformite: ["Conforme", "Partiel", "Non_conforme", "Non_evalue"],
      gouvernorat: [
        "Ariana",
        "Béja",
        "Ben Arous",
        "Bizerte",
        "Gabès",
        "Gafsa",
        "Jendouba",
        "Kairouan",
        "Kasserine",
        "Kébili",
        "Kef",
        "Mahdia",
        "Manouba",
        "Médenine",
        "Monastir",
        "Nabeul",
        "Sfax",
        "Sidi Bouzid",
        "Siliana",
        "Sousse",
        "Tataouine",
        "Tozeur",
        "Tunis",
        "Zaghouan",
      ],
      niveau_risque: ["Faible", "Moyen", "Élevé", "Critique"],
      niveau_structure: ["livre", "titre", "chapitre", "section"],
      plan_periodicity: ["monthly", "quarterly", "yearly"],
      priorite: ["Basse", "Moyenne", "Haute", "Critique"],
      resultat_aptitude: [
        "APTE",
        "APTE_RESTRICTIONS",
        "INAPTE_TEMP",
        "INAPTE_DEFINITIVE",
        "AVIS_RESERVE",
        "EN_ATTENTE",
      ],
      resultat_controle: [
        "conforme",
        "non_conforme",
        "conforme_avec_reserves",
        "en_attente",
      ],
      subscription_scope: ["client", "site"],
      subscription_status: ["active", "paused", "canceled"],
      invoice_status: ["draft", "sent", "paid", "overdue", "canceled"],
      statut_action: ["A_faire", "En_cours", "Termine", "Bloque"],
      statut_conformite: ["conforme", "non_conforme", "a_controler"],
      statut_lecture: ["A_lire", "Lu", "Valide"],
      statut_operationnel: ["en_service", "hors_service", "arret_technique"],
      statut_texte: ["en_vigueur", "abroge", "modifie"],
      statut_vigueur: ["en_vigueur", "modifie", "abroge", "suspendu"],
      statut_visite_medicale: [
        "PLANIFIEE",
        "REALISEE",
        "REPORTEE",
        "ANNULEE",
        "NO_SHOW",
      ],
      type_acte: [
        "loi",
        "decret",
        "arrete",
        "circulaire",
      ],
      type_document_medical: [
        "CONVOCATION",
        "AVIS_APTITUDE",
        "JUSTIFICATIF",
        "AUTRE",
      ],
      type_preuve: ["procedure", "rapport", "certificat", "photo", "autre"],
      type_relation: [
        "modifie",
        "abroge",
        "complete",
        "rend_applicable",
        "rectifie",
        "renvoi",
      ],
      type_texte_reglementaire: ["LOI", "ARRETE", "DECRET", "CIRCULAIRE"],
      type_visite_medicale: [
        "EMBAUCHE",
        "PERIODIQUE",
        "REPRISE",
        "CHANGEMENT_POSTE",
        "SMS",
      ],
    },
  },
} as const








