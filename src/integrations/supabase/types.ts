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
      abonnements: {
        Row: {
          client_id: string
          created_at: string
          date_debut: string
          date_fin: string | null
          id: string
          mode_facturation: Database["public"]["Enums"]["billing_mode"]
          plan_id: string
          statut: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          date_debut: string
          date_fin?: string | null
          id?: string
          mode_facturation?: Database["public"]["Enums"]["billing_mode"]
          plan_id: string
          statut?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          date_debut?: string
          date_fin?: string | null
          id?: string
          mode_facturation?: Database["public"]["Enums"]["billing_mode"]
          plan_id?: string
          statut?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "abonnements_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "abonnements_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      article_versions: {
        Row: {
          article_id: string
          contenu: string
          created_at: string
          created_by: string | null
          date_version: string
          id: string
          is_active: boolean | null
          raison_modification: string | null
          version_numero: number
        }
        Insert: {
          article_id: string
          contenu: string
          created_at?: string
          created_by?: string | null
          date_version: string
          id?: string
          is_active?: boolean | null
          raison_modification?: string | null
          version_numero: number
        }
        Update: {
          article_id?: string
          contenu?: string
          created_at?: string
          created_by?: string | null
          date_version?: string
          id?: string
          is_active?: boolean | null
          raison_modification?: string | null
          version_numero?: number
        }
        Relationships: [
          {
            foreignKeyName: "article_versions_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "textes_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      articles_sous_domaines: {
        Row: {
          article_id: string
          created_at: string
          id: string
          sous_domaine_id: string
        }
        Insert: {
          article_id: string
          created_at?: string
          id?: string
          sous_domaine_id: string
        }
        Update: {
          article_id?: string
          created_at?: string
          id?: string
          sous_domaine_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "articles_sous_domaines_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "textes_articles"
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
      changelog: {
        Row: {
          created_at: string
          date_publication: string
          description: string
          id: string
          titre: string
          version: string
        }
        Insert: {
          created_at?: string
          date_publication: string
          description: string
          id?: string
          titre: string
          version: string
        }
        Update: {
          created_at?: string
          date_publication?: string
          description?: string
          id?: string
          titre?: string
          version?: string
        }
        Relationships: []
      }
      client_users: {
        Row: {
          actif: boolean
          avatar_url: string | null
          client_id: string
          created_at: string
          email: string
          id: string
          is_client_admin: boolean
          nom: string | null
          prenom: string | null
          telephone: string | null
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          actif?: boolean
          avatar_url?: string | null
          client_id: string
          created_at?: string
          email: string
          id: string
          is_client_admin?: boolean
          nom?: string | null
          prenom?: string | null
          telephone?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          actif?: boolean
          avatar_url?: string | null
          client_id?: string
          created_at?: string
          email?: string
          id?: string
          is_client_admin?: boolean
          nom?: string | null
          prenom?: string | null
          telephone?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_users_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          adresse: string | null
          code_postal: string | null
          created_at: string
          email: string | null
          id: string
          logo_url: string | null
          nom: string
          pays: string | null
          siret: string | null
          telephone: string | null
          updated_at: string
          ville: string | null
        }
        Insert: {
          adresse?: string | null
          code_postal?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          nom: string
          pays?: string | null
          siret?: string | null
          telephone?: string | null
          updated_at?: string
          ville?: string | null
        }
        Update: {
          adresse?: string | null
          code_postal?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          nom?: string
          pays?: string | null
          siret?: string | null
          telephone?: string | null
          updated_at?: string
          ville?: string | null
        }
        Relationships: []
      }
      codes_domaines: {
        Row: {
          code_id: string
          created_at: string
          domaine_id: string
          id: string
        }
        Insert: {
          code_id: string
          created_at?: string
          domaine_id: string
          id?: string
        }
        Update: {
          code_id?: string
          created_at?: string
          domaine_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "codes_domaines_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "codes_juridiques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "codes_domaines_domaine_id_fkey"
            columns: ["domaine_id"]
            isOneToOne: false
            referencedRelation: "domaines_reglementaires"
            referencedColumns: ["id"]
          },
        ]
      }
      codes_juridiques: {
        Row: {
          abreviation: string | null
          code: string
          created_at: string | null
          description: string | null
          id: string
          nom_officiel: string | null
          titre: string
          updated_at: string | null
        }
        Insert: {
          abreviation?: string | null
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          nom_officiel?: string | null
          titre: string
          updated_at?: string | null
        }
        Update: {
          abreviation?: string | null
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          nom_officiel?: string | null
          titre?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      dechets: {
        Row: {
          client_id: string
          created_at: string | null
          date_collecte: string | null
          id: string
          prestataire: string | null
          quantite: number | null
          site_id: string | null
          type_dechet: string
          unite: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          date_collecte?: string | null
          id?: string
          prestataire?: string | null
          quantite?: number | null
          site_id?: string | null
          type_dechet: string
          unite?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          date_collecte?: string | null
          id?: string
          prestataire?: string | null
          quantite?: number | null
          site_id?: string | null
          type_dechet?: string
          unite?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dechets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dechets_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      domaines_reglementaires: {
        Row: {
          code: string
          couleur: string | null
          created_at: string
          description: string | null
          icone: string | null
          id: string
          libelle: string
        }
        Insert: {
          code: string
          couleur?: string | null
          created_at?: string
          description?: string | null
          icone?: string | null
          id?: string
          libelle: string
        }
        Update: {
          code?: string
          couleur?: string | null
          created_at?: string
          description?: string | null
          icone?: string | null
          id?: string
          libelle?: string
        }
        Relationships: []
      }
      employes: {
        Row: {
          client_id: string
          created_at: string
          date_embauche: string | null
          email: string | null
          id: string
          matricule: string | null
          nom: string
          numero_securite_sociale: string | null
          poste: string | null
          prenom: string
          site_id: string | null
          telephone: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          date_embauche?: string | null
          email?: string | null
          id?: string
          matricule?: string | null
          nom: string
          numero_securite_sociale?: string | null
          poste?: string | null
          prenom: string
          site_id?: string | null
          telephone?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          date_embauche?: string | null
          email?: string | null
          id?: string
          matricule?: string | null
          nom?: string
          numero_securite_sociale?: string | null
          poste?: string | null
          prenom?: string
          site_id?: string | null
          telephone?: string | null
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
      epi_articles: {
        Row: {
          client_id: string
          created_at: string | null
          date_achat: string | null
          epi_type_id: string | null
          id: string
          reference: string
          site_id: string | null
          statut: string | null
          taille: string | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          date_achat?: string | null
          epi_type_id?: string | null
          id?: string
          reference: string
          site_id?: string | null
          statut?: string | null
          taille?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          date_achat?: string | null
          epi_type_id?: string | null
          id?: string
          reference?: string
          site_id?: string | null
          statut?: string | null
          taille?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "epi_articles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "epi_articles_epi_type_id_fkey"
            columns: ["epi_type_id"]
            isOneToOne: false
            referencedRelation: "epi_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "epi_articles_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      epi_demandes: {
        Row: {
          created_at: string | null
          date_demande: string | null
          date_traitement: string | null
          employe_id: string
          epi_type_id: string
          id: string
          quantite: number | null
          statut: string | null
        }
        Insert: {
          created_at?: string | null
          date_demande?: string | null
          date_traitement?: string | null
          employe_id: string
          epi_type_id: string
          id?: string
          quantite?: number | null
          statut?: string | null
        }
        Update: {
          created_at?: string | null
          date_demande?: string | null
          date_traitement?: string | null
          employe_id?: string
          epi_type_id?: string
          id?: string
          quantite?: number | null
          statut?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "epi_demandes_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "epi_demandes_epi_type_id_fkey"
            columns: ["epi_type_id"]
            isOneToOne: false
            referencedRelation: "epi_types"
            referencedColumns: ["id"]
          },
        ]
      }
      epi_dotations: {
        Row: {
          created_at: string | null
          date_attribution: string
          date_retour: string | null
          employe_id: string
          epi_article_id: string
          id: string
          statut: string | null
        }
        Insert: {
          created_at?: string | null
          date_attribution: string
          date_retour?: string | null
          employe_id: string
          epi_article_id: string
          id?: string
          statut?: string | null
        }
        Update: {
          created_at?: string | null
          date_attribution?: string
          date_retour?: string | null
          employe_id?: string
          epi_article_id?: string
          id?: string
          statut?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "epi_dotations_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "epi_dotations_epi_article_id_fkey"
            columns: ["epi_article_id"]
            isOneToOne: false
            referencedRelation: "epi_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      epi_mouvements: {
        Row: {
          created_at: string
          date_mouvement: string
          employe_id: string
          epi_article_id: string
          id: string
          quantite: number
          remarque: string | null
          type_mouvement: string
        }
        Insert: {
          created_at?: string
          date_mouvement?: string
          employe_id: string
          epi_article_id: string
          id?: string
          quantite?: number
          remarque?: string | null
          type_mouvement: string
        }
        Update: {
          created_at?: string
          date_mouvement?: string
          employe_id?: string
          epi_article_id?: string
          id?: string
          quantite?: number
          remarque?: string | null
          type_mouvement?: string
        }
        Relationships: [
          {
            foreignKeyName: "epi_mouvements_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "epi_mouvements_epi_article_id_fkey"
            columns: ["epi_article_id"]
            isOneToOne: false
            referencedRelation: "epi_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      epi_types: {
        Row: {
          created_at: string | null
          description: string | null
          duree_vie_mois: number | null
          id: string
          nom: string
          norme: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duree_vie_mois?: number | null
          id?: string
          nom: string
          norme?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duree_vie_mois?: number | null
          id?: string
          nom?: string
          norme?: string | null
        }
        Relationships: []
      }
      equipements: {
        Row: {
          client_id: string
          created_at: string | null
          date_mise_service: string | null
          equipement_type_id: string | null
          id: string
          nom: string
          numero_serie: string | null
          site_id: string | null
          statut: string | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          date_mise_service?: string | null
          equipement_type_id?: string | null
          id?: string
          nom: string
          numero_serie?: string | null
          site_id?: string | null
          statut?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          date_mise_service?: string | null
          equipement_type_id?: string | null
          id?: string
          nom?: string
          numero_serie?: string | null
          site_id?: string | null
          statut?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipements_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipements_equipement_type_id_fkey"
            columns: ["equipement_type_id"]
            isOneToOne: false
            referencedRelation: "equipements_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipements_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      equipements_controles: {
        Row: {
          created_at: string | null
          date_controle: string
          date_prochain_controle: string | null
          equipement_id: string
          id: string
          organisme_controle: string | null
          resultat: string | null
          type_controle: string
        }
        Insert: {
          created_at?: string | null
          date_controle: string
          date_prochain_controle?: string | null
          equipement_id: string
          id?: string
          organisme_controle?: string | null
          resultat?: string | null
          type_controle: string
        }
        Update: {
          created_at?: string | null
          date_controle?: string
          date_prochain_controle?: string | null
          equipement_id?: string
          id?: string
          organisme_controle?: string | null
          resultat?: string | null
          type_controle?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipements_controles_equipement_id_fkey"
            columns: ["equipement_id"]
            isOneToOne: false
            referencedRelation: "equipements"
            referencedColumns: ["id"]
          },
        ]
      }
      equipements_maintenance: {
        Row: {
          cout: number | null
          created_at: string | null
          date_maintenance: string
          description: string | null
          equipement_id: string
          id: string
          type_maintenance: string
        }
        Insert: {
          cout?: number | null
          created_at?: string | null
          date_maintenance: string
          description?: string | null
          equipement_id: string
          id?: string
          type_maintenance: string
        }
        Update: {
          cout?: number | null
          created_at?: string | null
          date_maintenance?: string
          description?: string | null
          equipement_id?: string
          id?: string
          type_maintenance?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipements_maintenance_equipement_id_fkey"
            columns: ["equipement_id"]
            isOneToOne: false
            referencedRelation: "equipements"
            referencedColumns: ["id"]
          },
        ]
      }
      equipements_types: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          nom: string
          periodicite_controle_mois: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          nom: string
          periodicite_controle_mois?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          nom?: string
          periodicite_controle_mois?: number | null
        }
        Relationships: []
      }
      factures: {
        Row: {
          abonnement_id: string
          created_at: string
          date_echeance: string
          date_emission: string
          date_paiement: string | null
          id: string
          montant_ht: number
          montant_ttc: number
          montant_tva: number
          numero_facture: string
          statut: string
        }
        Insert: {
          abonnement_id: string
          created_at?: string
          date_echeance: string
          date_emission: string
          date_paiement?: string | null
          id?: string
          montant_ht: number
          montant_ttc: number
          montant_tva: number
          numero_facture: string
          statut?: string
        }
        Update: {
          abonnement_id?: string
          created_at?: string
          date_echeance?: string
          date_emission?: string
          date_paiement?: string | null
          id?: string
          montant_ht?: number
          montant_ttc?: number
          montant_tva?: number
          numero_facture?: string
          statut?: string
        }
        Relationships: [
          {
            foreignKeyName: "factures_abonnement_id_fkey"
            columns: ["abonnement_id"]
            isOneToOne: false
            referencedRelation: "abonnements"
            referencedColumns: ["id"]
          },
        ]
      }
      formations: {
        Row: {
          client_id: string
          created_at: string | null
          description: string | null
          duree_heures: number | null
          id: string
          organisme: string | null
          titre: string
          validite_mois: number | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          description?: string | null
          duree_heures?: number | null
          id?: string
          organisme?: string | null
          titre: string
          validite_mois?: number | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          description?: string | null
          duree_heures?: number | null
          id?: string
          organisme?: string | null
          titre?: string
          validite_mois?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "formations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      formations_participants: {
        Row: {
          created_at: string | null
          date_certificat: string | null
          employe_id: string
          id: string
          presence: boolean | null
          resultat: string | null
          session_id: string
        }
        Insert: {
          created_at?: string | null
          date_certificat?: string | null
          employe_id: string
          id?: string
          presence?: boolean | null
          resultat?: string | null
          session_id: string
        }
        Update: {
          created_at?: string | null
          date_certificat?: string | null
          employe_id?: string
          id?: string
          presence?: boolean | null
          resultat?: string | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "formations_participants_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "formations_participants_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "formations_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      formations_sessions: {
        Row: {
          created_at: string | null
          date_debut: string
          date_fin: string
          formateur: string | null
          formation_id: string
          id: string
          lieu: string | null
          site_id: string | null
          statut: string | null
        }
        Insert: {
          created_at?: string | null
          date_debut: string
          date_fin: string
          formateur?: string | null
          formation_id: string
          id?: string
          lieu?: string | null
          site_id?: string | null
          statut?: string | null
        }
        Update: {
          created_at?: string | null
          date_debut?: string
          date_fin?: string
          formateur?: string | null
          formation_id?: string
          id?: string
          lieu?: string | null
          site_id?: string | null
          statut?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "formations_sessions_formation_id_fkey"
            columns: ["formation_id"]
            isOneToOne: false
            referencedRelation: "formations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "formations_sessions_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          client_id: string
          created_at: string | null
          date_incident: string
          description: string | null
          gravite: string | null
          id: string
          incident_type_id: string | null
          site_id: string | null
          statut: string | null
          titre: string
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          date_incident: string
          description?: string | null
          gravite?: string | null
          id?: string
          incident_type_id?: string | null
          site_id?: string | null
          statut?: string | null
          titre: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          date_incident?: string
          description?: string | null
          gravite?: string | null
          id?: string
          incident_type_id?: string | null
          site_id?: string | null
          statut?: string | null
          titre?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incidents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_incident_type_id_fkey"
            columns: ["incident_type_id"]
            isOneToOne: false
            referencedRelation: "incidents_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents_analyses: {
        Row: {
          actions_correctives: string | null
          actions_preventives: string | null
          causes: string | null
          created_at: string | null
          date_analyse: string | null
          id: string
          incident_id: string
        }
        Insert: {
          actions_correctives?: string | null
          actions_preventives?: string | null
          causes?: string | null
          created_at?: string | null
          date_analyse?: string | null
          id?: string
          incident_id: string
        }
        Update: {
          actions_correctives?: string | null
          actions_preventives?: string | null
          causes?: string | null
          created_at?: string | null
          date_analyse?: string | null
          id?: string
          incident_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidents_analyses_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents_types: {
        Row: {
          couleur: string | null
          created_at: string | null
          description: string | null
          id: string
          nom: string
        }
        Insert: {
          couleur?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          nom: string
        }
        Update: {
          couleur?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          nom?: string
        }
        Relationships: []
      }
      mesures_environnementales: {
        Row: {
          commentaire: string | null
          conforme: boolean | null
          created_at: string | null
          date_mesure: string
          id: string
          point_id: string
          unite: string | null
          valeur: number | null
        }
        Insert: {
          commentaire?: string | null
          conforme?: boolean | null
          created_at?: string | null
          date_mesure: string
          id?: string
          point_id: string
          unite?: string | null
          valeur?: number | null
        }
        Update: {
          commentaire?: string | null
          conforme?: boolean | null
          created_at?: string | null
          date_mesure?: string
          id?: string
          point_id?: string
          unite?: string | null
          valeur?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mesures_environnementales_point_id_fkey"
            columns: ["point_id"]
            isOneToOne: false
            referencedRelation: "points_surveillance"
            referencedColumns: ["id"]
          },
        ]
      }
      module_features: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
          module_id: string | null
          name: string
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          module_id?: string | null
          name: string
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          module_id?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_features_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules_systeme"
            referencedColumns: ["id"]
          },
        ]
      }
      modules_systeme: {
        Row: {
          actif: boolean | null
          code: string
          couleur: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          libelle: string
          nom: string
          ordre: number | null
          updated_at: string | null
        }
        Insert: {
          actif?: boolean | null
          code: string
          couleur?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          libelle: string
          nom: string
          ordre?: number | null
          updated_at?: string | null
        }
        Update: {
          actif?: boolean | null
          code?: string
          couleur?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          libelle?: string
          nom?: string
          ordre?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      permission_actions: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          nom: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          nom: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          nom?: string
        }
        Relationships: []
      }
      plans_action: {
        Row: {
          article_id: string | null
          cout_estime: number | null
          created_at: string
          created_by: string | null
          date_echeance: string | null
          description: string | null
          id: string
          priorite: Database["public"]["Enums"]["priorite"]
          responsable_id: string | null
          site_id: string
          statut: Database["public"]["Enums"]["statut_action"]
          titre: string
          updated_at: string
        }
        Insert: {
          article_id?: string | null
          cout_estime?: number | null
          created_at?: string
          created_by?: string | null
          date_echeance?: string | null
          description?: string | null
          id?: string
          priorite?: Database["public"]["Enums"]["priorite"]
          responsable_id?: string | null
          site_id: string
          statut?: Database["public"]["Enums"]["statut_action"]
          titre: string
          updated_at?: string
        }
        Update: {
          article_id?: string | null
          cout_estime?: number | null
          created_at?: string
          created_by?: string | null
          date_echeance?: string | null
          description?: string | null
          id?: string
          priorite?: Database["public"]["Enums"]["priorite"]
          responsable_id?: string | null
          site_id?: string
          statut?: Database["public"]["Enums"]["statut_action"]
          titre?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plans_action_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "textes_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plans_action_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      points_surveillance: {
        Row: {
          client_id: string
          created_at: string | null
          frequence: string | null
          id: string
          nom: string
          site_id: string | null
          type_surveillance: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          frequence?: string | null
          id?: string
          nom: string
          site_id?: string | null
          type_surveillance: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          frequence?: string | null
          id?: string
          nom?: string
          site_id?: string | null
          type_surveillance?: string
        }
        Relationships: [
          {
            foreignKeyName: "points_surveillance_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "points_surveillance_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      prestataires: {
        Row: {
          adresse: string | null
          client_id: string
          code_postal: string | null
          created_at: string
          email: string | null
          id: string
          nom: string
          siret: string | null
          telephone: string | null
          type_prestation: string
          updated_at: string
          ville: string | null
        }
        Insert: {
          adresse?: string | null
          client_id: string
          code_postal?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nom: string
          siret?: string | null
          telephone?: string | null
          type_prestation: string
          updated_at?: string
          ville?: string | null
        }
        Update: {
          adresse?: string | null
          client_id?: string
          code_postal?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nom?: string
          siret?: string | null
          telephone?: string | null
          type_prestation?: string
          updated_at?: string
          ville?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prestataires_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          nom: string | null
          prenom: string | null
          telephone: string | null
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          nom?: string | null
          prenom?: string | null
          telephone?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          nom?: string | null
          prenom?: string | null
          telephone?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      role_audit_logs: {
        Row: {
          action: string
          changes: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          changes?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          changes?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "role_audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          action: string
          action_id: string | null
          created_at: string
          decision: Database["public"]["Enums"]["permission_decision"]
          feature_id: string | null
          id: string
          module: string
          module_id: string | null
          role_id: string
          scope: Database["public"]["Enums"]["permission_scope"]
          updated_at: string
        }
        Insert: {
          action: string
          action_id?: string | null
          created_at?: string
          decision?: Database["public"]["Enums"]["permission_decision"]
          feature_id?: string | null
          id?: string
          module: string
          module_id?: string | null
          role_id: string
          scope?: Database["public"]["Enums"]["permission_scope"]
          updated_at?: string
        }
        Update: {
          action?: string
          action_id?: string | null
          created_at?: string
          decision?: Database["public"]["Enums"]["permission_decision"]
          feature_id?: string | null
          id?: string
          module?: string
          module_id?: string | null
          role_id?: string
          scope?: Database["public"]["Enums"]["permission_scope"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "permission_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "module_features"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules_systeme"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          archived_at: string | null
          created_at: string
          description: string | null
          id: string
          is_system: boolean | null
          name: string
          tenant_id: string | null
          type: Database["public"]["Enums"]["role_type"]
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean | null
          name: string
          tenant_id?: string | null
          type: Database["public"]["Enums"]["role_type"]
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
          tenant_id?: string | null
          type?: Database["public"]["Enums"]["role_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      site_article_preuves: {
        Row: {
          created_at: string
          date_document: string | null
          description: string | null
          id: string
          site_article_status_id: string
          titre: string
          type_document: string | null
          uploaded_by: string | null
          url_document: string
        }
        Insert: {
          created_at?: string
          date_document?: string | null
          description?: string | null
          id?: string
          site_article_status_id: string
          titre: string
          type_document?: string | null
          uploaded_by?: string | null
          url_document: string
        }
        Update: {
          created_at?: string
          date_document?: string | null
          description?: string | null
          id?: string
          site_article_status_id?: string
          titre?: string
          type_document?: string | null
          uploaded_by?: string | null
          url_document?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_article_preuves_site_article_status_id_fkey"
            columns: ["site_article_status_id"]
            isOneToOne: false
            referencedRelation: "site_article_status"
            referencedColumns: ["id"]
          },
        ]
      }
      site_article_status: {
        Row: {
          applicabilite: Database["public"]["Enums"]["applicabilite_reglementaire"]
          article_id: string
          commentaire: string | null
          commentaire_non_applicable: string | null
          created_at: string
          date_derniere_evaluation: string | null
          etat_conformite: Database["public"]["Enums"]["etat_conformite"]
          evaluateur_id: string | null
          id: string
          motif_non_applicable:
            | Database["public"]["Enums"]["motif_non_applicable"]
            | null
          site_id: string
          updated_at: string
        }
        Insert: {
          applicabilite?: Database["public"]["Enums"]["applicabilite_reglementaire"]
          article_id: string
          commentaire?: string | null
          commentaire_non_applicable?: string | null
          created_at?: string
          date_derniere_evaluation?: string | null
          etat_conformite?: Database["public"]["Enums"]["etat_conformite"]
          evaluateur_id?: string | null
          id?: string
          motif_non_applicable?:
            | Database["public"]["Enums"]["motif_non_applicable"]
            | null
          site_id: string
          updated_at?: string
        }
        Update: {
          applicabilite?: Database["public"]["Enums"]["applicabilite_reglementaire"]
          article_id?: string
          commentaire?: string | null
          commentaire_non_applicable?: string | null
          created_at?: string
          date_derniere_evaluation?: string | null
          etat_conformite?: Database["public"]["Enums"]["etat_conformite"]
          evaluateur_id?: string | null
          id?: string
          motif_non_applicable?:
            | Database["public"]["Enums"]["motif_non_applicable"]
            | null
          site_id?: string
          updated_at?: string
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
            foreignKeyName: "site_article_status_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_modules: {
        Row: {
          actif: boolean | null
          created_at: string | null
          id: string
          module_id: string
          site_id: string
        }
        Insert: {
          actif?: boolean | null
          created_at?: string | null
          id?: string
          module_id: string
          site_id: string
        }
        Update: {
          actif?: boolean | null
          created_at?: string | null
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
      sites: {
        Row: {
          adresse: string
          client_id: string
          code_postal: string
          created_at: string
          email: string | null
          id: string
          latitude: number | null
          longitude: number | null
          nom: string
          nombre_employes: number | null
          pays: string | null
          surface: number | null
          telephone: string | null
          updated_at: string
          ville: string
        }
        Insert: {
          adresse: string
          client_id: string
          code_postal: string
          created_at?: string
          email?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          nom: string
          nombre_employes?: number | null
          pays?: string | null
          surface?: number | null
          telephone?: string | null
          updated_at?: string
          ville: string
        }
        Update: {
          adresse?: string
          client_id?: string
          code_postal?: string
          created_at?: string
          email?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          nom?: string
          nombre_employes?: number | null
          pays?: string | null
          surface?: number | null
          telephone?: string | null
          updated_at?: string
          ville?: string
        }
        Relationships: [
          {
            foreignKeyName: "sites_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      sous_domaines_application: {
        Row: {
          code: string
          created_at: string
          description: string | null
          domaine_id: string
          id: string
          libelle: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          domaine_id: string
          id?: string
          libelle: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          domaine_id?: string
          id?: string
          libelle?: string
        }
        Relationships: [
          {
            foreignKeyName: "sous_domaines_application_domaine_id_fkey"
            columns: ["domaine_id"]
            isOneToOne: false
            referencedRelation: "domaines_reglementaires"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          description: string | null
          fonctionnalites: Json | null
          id: string
          max_sites: number | null
          max_utilisateurs: number | null
          nom: string
          prix_mensuel: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          fonctionnalites?: Json | null
          id?: string
          max_sites?: number | null
          max_utilisateurs?: number | null
          nom: string
          prix_mensuel: number
        }
        Update: {
          created_at?: string
          description?: string | null
          fonctionnalites?: Json | null
          id?: string
          max_sites?: number | null
          max_utilisateurs?: number | null
          nom?: string
          prix_mensuel?: number
        }
        Relationships: []
      }
      textes_articles: {
        Row: {
          contenu: string
          created_at: string
          id: string
          numero_article: string
          ordre: number | null
          parent_article_id: string | null
          texte_id: string
          titre: string | null
          updated_at: string
          version_active: string | null
        }
        Insert: {
          contenu: string
          created_at?: string
          id?: string
          numero_article: string
          ordre?: number | null
          parent_article_id?: string | null
          texte_id: string
          titre?: string | null
          updated_at?: string
          version_active?: string | null
        }
        Update: {
          contenu?: string
          created_at?: string
          id?: string
          numero_article?: string
          ordre?: number | null
          parent_article_id?: string | null
          texte_id?: string
          titre?: string | null
          updated_at?: string
          version_active?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "textes_articles_parent_article_id_fkey"
            columns: ["parent_article_id"]
            isOneToOne: false
            referencedRelation: "textes_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "textes_articles_texte_id_fkey"
            columns: ["texte_id"]
            isOneToOne: false
            referencedRelation: "textes_reglementaires"
            referencedColumns: ["id"]
          },
        ]
      }
      textes_codes: {
        Row: {
          code_id: string
          created_at: string
          id: string
          texte_id: string
          type_relation: string | null
        }
        Insert: {
          code_id: string
          created_at?: string
          id?: string
          texte_id: string
          type_relation?: string | null
        }
        Update: {
          code_id?: string
          created_at?: string
          id?: string
          texte_id?: string
          type_relation?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "textes_codes_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "codes_juridiques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "textes_codes_texte_id_fkey"
            columns: ["texte_id"]
            isOneToOne: false
            referencedRelation: "textes_reglementaires"
            referencedColumns: ["id"]
          },
        ]
      }
      textes_reglementaires: {
        Row: {
          created_at: string
          date_abrogation: string | null
          date_entree_vigueur: string | null
          date_publication: string
          id: string
          lien_officiel: string | null
          numero: string
          resume: string | null
          statut: string
          titre: string
          type_texte: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_abrogation?: string | null
          date_entree_vigueur?: string | null
          date_publication: string
          id?: string
          lien_officiel?: string | null
          numero: string
          resume?: string | null
          statut?: string
          titre: string
          type_texte: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_abrogation?: string | null
          date_entree_vigueur?: string | null
          date_publication?: string
          id?: string
          lien_officiel?: string | null
          numero?: string
          resume?: string | null
          statut?: string
          titre?: string
          type_texte?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          action: string
          client_id: string
          created_at: string
          decision: Database["public"]["Enums"]["permission_decision"]
          id: string
          module: string
          scope: Database["public"]["Enums"]["permission_scope"]
          updated_at: string
          user_id: string
        }
        Insert: {
          action: string
          client_id: string
          created_at?: string
          decision?: Database["public"]["Enums"]["permission_decision"]
          id?: string
          module: string
          scope?: Database["public"]["Enums"]["permission_scope"]
          updated_at?: string
          user_id: string
        }
        Update: {
          action?: string
          client_id?: string
          created_at?: string
          decision?: Database["public"]["Enums"]["permission_decision"]
          id?: string
          module?: string
          scope?: Database["public"]["Enums"]["permission_scope"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          client_id: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"] | null
          role_uuid: string | null
          site_scope: string[] | null
          user_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"] | null
          role_uuid?: string | null
          site_scope?: string[] | null
          user_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"] | null
          role_uuid?: string | null
          site_scope?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_role_uuid_fkey"
            columns: ["role_uuid"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      visites_medicales: {
        Row: {
          commentaires: string | null
          created_at: string
          date_prochaine_visite: string | null
          date_visite: string
          employe_id: string
          id: string
          medecin_travail: string | null
          resultat: string | null
          statut: Database["public"]["Enums"]["statut_visite"]
          type_document:
            | Database["public"]["Enums"]["type_document_medical"]
            | null
          type_visite: string
          updated_at: string
        }
        Insert: {
          commentaires?: string | null
          created_at?: string
          date_prochaine_visite?: string | null
          date_visite: string
          employe_id: string
          id?: string
          medecin_travail?: string | null
          resultat?: string | null
          statut?: Database["public"]["Enums"]["statut_visite"]
          type_document?:
            | Database["public"]["Enums"]["type_document_medical"]
            | null
          type_visite: string
          updated_at?: string
        }
        Update: {
          commentaires?: string | null
          created_at?: string
          date_prochaine_visite?: string | null
          date_visite?: string
          employe_id?: string
          id?: string
          medecin_travail?: string | null
          resultat?: string | null
          statut?: Database["public"]["Enums"]["statut_visite"]
          type_document?:
            | Database["public"]["Enums"]["type_document_medical"]
            | null
          type_visite?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "visites_medicales_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
        ]
      }
      visites_medicales_documents: {
        Row: {
          created_at: string
          date_document: string | null
          id: string
          titre: string
          type_document: string
          uploaded_by: string | null
          url_document: string
          visite_id: string
        }
        Insert: {
          created_at?: string
          date_document?: string | null
          id?: string
          titre: string
          type_document: string
          uploaded_by?: string | null
          url_document: string
          visite_id: string
        }
        Update: {
          created_at?: string
          date_document?: string | null
          id?: string
          titre?: string
          type_document?: string
          uploaded_by?: string | null
          url_document?: string
          visite_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visites_medicales_documents_visite_id_fkey"
            columns: ["visite_id"]
            isOneToOne: false
            referencedRelation: "visites_medicales"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      equipements_controle: {
        Row: {
          created_at: string | null
          date_controle: string | null
          date_prochain_controle: string | null
          equipement_id: string | null
          id: string | null
          organisme_controle: string | null
          resultat: string | null
          type_controle: string | null
        }
        Insert: {
          created_at?: string | null
          date_controle?: string | null
          date_prochain_controle?: string | null
          equipement_id?: string | null
          id?: string | null
          organisme_controle?: string | null
          resultat?: string | null
          type_controle?: string | null
        }
        Update: {
          created_at?: string | null
          date_controle?: string | null
          date_prochain_controle?: string | null
          equipement_id?: string | null
          id?: string | null
          organisme_controle?: string | null
          resultat?: string | null
          type_controle?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipements_controles_equipement_id_fkey"
            columns: ["equipement_id"]
            isOneToOne: false
            referencedRelation: "equipements"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      has_client_access: {
        Args: { _client_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: { Args: { _role: string; _user_id: string }; Returns: boolean }
      has_site_access: {
        Args: { _site_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "gestionnaire" | "consultant" | "user"
      applicabilite_reglementaire:
        | "obligatoire"
        | "recommande"
        | "non_applicable"
      billing_mode: "par_site" | "par_nombre_employes" | "forfait_global"
      domaine_reglementaire:
        | "incendie"
        | "electrique"
        | "machines"
        | "levage"
        | "aeraulique"
        | "sanitaire"
        | "risques_chimiques"
        | "environnement"
        | "accessibilite"
        | "securite_generale"
        | "autre"
      etat_conformite:
        | "conforme"
        | "non_conforme"
        | "en_attente"
        | "non_applicable"
      motif_non_applicable:
        | "effectif_insuffisant"
        | "activite_non_concernee"
        | "configuration_batiment"
        | "dispense_reglementaire"
        | "autre"
      permission_decision: "allow" | "deny" | "inherit"
      permission_scope: "global" | "tenant" | "site"
      priorite: "haute" | "moyenne" | "basse"
      role_type: "team" | "client"
      statut_action: "a_faire" | "en_cours" | "terminee" | "annulee"
      statut_visite: "programmee" | "effectuee" | "annulee" | "reportee"
      type_document_medical: "aptitude" | "inaptitude" | "restriction" | "autre"
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
      app_role: ["super_admin", "admin", "gestionnaire", "consultant", "user"],
      applicabilite_reglementaire: [
        "obligatoire",
        "recommande",
        "non_applicable",
      ],
      billing_mode: ["par_site", "par_nombre_employes", "forfait_global"],
      domaine_reglementaire: [
        "incendie",
        "electrique",
        "machines",
        "levage",
        "aeraulique",
        "sanitaire",
        "risques_chimiques",
        "environnement",
        "accessibilite",
        "securite_generale",
        "autre",
      ],
      etat_conformite: [
        "conforme",
        "non_conforme",
        "en_attente",
        "non_applicable",
      ],
      motif_non_applicable: [
        "effectif_insuffisant",
        "activite_non_concernee",
        "configuration_batiment",
        "dispense_reglementaire",
        "autre",
      ],
      permission_decision: ["allow", "deny", "inherit"],
      permission_scope: ["global", "tenant", "site"],
      priorite: ["haute", "moyenne", "basse"],
      role_type: ["team", "client"],
      statut_action: ["a_faire", "en_cours", "terminee", "annulee"],
      statut_visite: ["programmee", "effectuee", "annulee", "reportee"],
      type_document_medical: ["aptitude", "inaptitude", "restriction", "autre"],
    },
  },
} as const
