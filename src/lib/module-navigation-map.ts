import {
  LayoutDashboard,
  Library,
  Bell,
  BookOpen,
  ClipboardCheck,
  AlertTriangle,
  Wrench,
  Shield,
  Search,
  GraduationCap,
  Stethoscope,
  FileCheck,
  Users,
  Leaf,
  FolderOpen,
  type LucideIcon,
} from "lucide-react";
import type { ModuleSysteme } from "@/hooks/useUserModules";

export interface SubMenuItem {
  title: string;
  url: string;
}

export interface MenuItem {
  title: string;
  url?: string;
  icon: LucideIcon;
  subItems?: SubMenuItem[];
  code?: string;
}

const MODULE_NAV_CONFIG: Record<string, Omit<MenuItem, "title">> = {
  DASHBOARD: {
    icon: LayoutDashboard,
    url: "/dashboard",
  },
  BIBLIOTHEQUE: {
    icon: Library,
    subItems: [
      { title: "Tableau de bord", url: "/veille/bibliotheque/dashbord" },
      { title: "Domaines", url: "/veille/bibliotheque/domain" },
      { title: "Textes & articles", url: "/veille/bibliotheque/" },
      { title: "Recherche intelligente", url: "/veille/bibliotheque/recherche" },
    ],
  },
  VEILLE: {
    icon: Bell,
    subItems: [
      { title: "Tableau de bord", url: "/veille/dashboard" },
      { title: "Applicabilité", url: "/veille/applicabilite" },
      { title: "Matrice d'applicabilité", url: "/veille/matrice" },
      { title: "Évaluation conformité", url: "/veille/evaluation" },
      { title: "Plan d'action", url: "/veille/actions" },
    ],
  },
  DOSSIER: {
    icon: BookOpen,
    url: "/dossier",
  },
  CONTROLES: {
    icon: ClipboardCheck,
    subItems: [
      { title: "Tableau de bord", url: "/controles/dashboard" },
      { title: "Équipements", url: "/controles/equipements" },
      { title: "Planning", url: "/controles/planning" },
      { title: "Historique", url: "/controles/historique" },
    ],
  },
  INCIDENTS: {
    icon: AlertTriangle,
    url: "/incidents",
    subItems: [
      { title: "Tableau de bord", url: "/incidents/dashboard" },
      { title: "Liste des incidents", url: "/incidents" },
      { title: "Analyse & Statistiques", url: "/incidents/analyse" },
      { title: "Incidents récurrents", url: "/incidents/recurrents" },
      { title: "Configuration", url: "/incidents/configuration" },
    ],
  },
  EQUIPEMENTS: {
    icon: Wrench,
    url: "/equipements",
    subItems: [
      { title: "Tableau de bord", url: "/equipements/dashboard" },
      { title: "Inventaire", url: "/equipements/inventaire" },
      { title: "Contrôles techniques", url: "/controles" },
      { title: "Maintenance", url: "/equipements/maintenance" },
      { title: "Prestataires", url: "/equipements/prestataires" },
    ],
  },
  EPI: {
    icon: Shield,
    url: "/epi",
    subItems: [
      { title: "Tableau de bord", url: "/epi/dashboard" },
      { title: "Gestion du stock", url: "/epi/stock" },
      { title: "Dotations employés", url: "/epi/dotations" },
      { title: "Demandes EPI", url: "/epi/demandes" },
      { title: "Base documentaire", url: "/epi/bibliotheque" },
    ],
  },
  AUDITS: {
    icon: Search,
    url: "/audits",
  },
  FORMATIONS: {
    icon: GraduationCap,
    subItems: [
      { title: "Tableau de bord", url: "/formations/dashboard" },
      { title: "Registre des formations", url: "/formations" },
      { title: "Planification", url: "/formations/planning" },
      { title: "Participants", url: "/formations/participants" },
      { title: "Certificats & Documents", url: "/formations/documents" },
    ],
  },
  VISITES_MED: {
    icon: Stethoscope,
    subItems: [
      { title: "Tableau de bord", url: "/visites-medicales/dashboard" },
      { title: "Liste des visites", url: "/visites-medicales" },
      { title: "Planning", url: "/visites-medicales/planning" },
    ],
  },
  PERMIS: {
    icon: FileCheck,
    url: "/permis",
  },
  PRESTATAIRES: {
    icon: Users,
    url: "/prestataires",
  },
  ENVIRONNEMENT: {
    icon: Leaf,
    subItems: [
      { title: "Tableau de bord", url: "/environnement/dashboard" },
      { title: "Surveillance", url: "/environnement/surveillance" },
      { title: "Déchets", url: "/environnement/dechets" },
      { title: "Points limites", url: "/environnement/points-limites" },
      { title: "Prestataires", url: "/environnement/prestataires" },
    ],
  },
  CLIENTS: {
    icon: FolderOpen,
    subItems: [
      { title: "Clients", url: "/clients" },
      { title: "Sites", url: "/sites" },
      { title: "Utilisateurs client", url: "/clients/utilisateurs" },
      { title: "Facture", url: "/facture" },
      { title: "Abonnement", url: "/abonnement" },
    ],
  },
};

// Ordre d'affichage souhaité dans le menu
const MODULE_DISPLAY_ORDER = [
  'DASHBOARD',
  'BIBLIOTHEQUE',
  'VEILLE',
  'DOSSIER',
  'CONTROLES',
  'INCIDENTS',
  'EQUIPEMENTS',
  'EPI',
  'AUDITS',
  'FORMATIONS',
  'VISITES_MED',
  'PERMIS',
  'PRESTATAIRES',
  'ENVIRONNEMENT',
  'CLIENTS',
];

export const buildNavigationFromModules = (modules: ModuleSysteme[]): MenuItem[] => {
  if (!modules || modules.length === 0) return [];

  const navigationItems: MenuItem[] = [];

  modules.forEach((module) => {
    const config = MODULE_NAV_CONFIG[module.code];
    
    if (config) {
      navigationItems.push({
        title: module.libelle,
        code: module.code,
        icon: config.icon,
        url: config.url,
        subItems: config.subItems,
      });
    }
  });

  // Trier les items selon l'ordre défini
  return navigationItems.sort((a, b) => {
    const indexA = MODULE_DISPLAY_ORDER.indexOf(a.code || '');
    const indexB = MODULE_DISPLAY_ORDER.indexOf(b.code || '');
    
    // Si un module n'est pas dans la liste, le mettre à la fin
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    
    return indexA - indexB;
  });
};

// Helper to check if a route matches any subitem
export const findActiveModule = (pathname: string, items: MenuItem[]): string | null => {
  for (const item of items) {
    // Check direct URL match
    if (item.url && pathname === item.url) {
      return item.title;
    }

    // Check if route starts with URL
    if (item.url && pathname.startsWith(item.url + "/")) {
      return item.title;
    }

    // Check subitems
    if (item.subItems) {
      const matchingSubItem = item.subItems.find(
        (sub) => pathname === sub.url || pathname.startsWith(sub.url + "/")
      );
      if (matchingSubItem) {
        return item.title;
      }
    }
  }

  return null;
};
