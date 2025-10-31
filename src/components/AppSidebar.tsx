import {
  LayoutDashboard,
  FileText,
  ClipboardCheck,
  AlertTriangle,
  ShieldCheck,
  GraduationCap,
  HardHat,
  Users,
  FileCheck,
  Menu,
  Library,
  ChevronDown,
  FolderOpen,
  Settings,
  UserCog,
  Shield,
  Stethoscope,
  Bell,
  BookOpen,
  Search,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useState, useEffect, useMemo, type ComponentType } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import conformaProLogo from "@/assets/conforma-pro-logo.png";
import { useAuth } from "@/contexts/AuthContext";

const BILLING_MANAGER_ROLES = ["super_admin", "admin_global", "billing_manager"];
const CLIENT_MODULE_TITLE = "Gestion des clients";
const BIBLIOTHEQUE_TITLE = "Bibliothèque réglementaire";

interface SubMenuItem {
  title: string;
  url: string;
  allowedRoles?: string[];
}

interface MenuItem {
  title: string;
  url?: string;
  icon: ComponentType<{ className?: string }>;
  subItems?: SubMenuItem[];
}

const menuItems: MenuItem[] = [
  { title: "Tableau de bord", url: "/dashboard", icon: LayoutDashboard },
  {
    title: BIBLIOTHEQUE_TITLE,
    icon: Library,
    subItems: [
      { title: "Tableau de bord", url: "/veille/bibliotheque/dashbord" },
      { title: "Domaines", url: "/veille/bibliotheque/domain" },
      { title: "Textes & articles", url: "/veille/bibliotheque/" },
      { title: "Recherche intelligente", url: "/veille/bibliotheque/recherche" },
    ],
  },
  {
    title: "Veille réglementaire",
    icon: Bell,
    subItems: [
      { title: "Tableau de bord", url: "/veille/dashboard" },
      { title: "Applicabilité", url: "/veille/applicabilite" },
      { title: "Matrice d'applicabilité", url: "/veille/matrice" },
      { title: "Évaluation conformité", url: "/veille/evaluation" },
      { title: "Plan d'action", url: "/veille/actions" },
    ],
  },
  { title: "Dossier réglementaire", url: "/dossier", icon: BookOpen },
  { title: "Contrôles techniques", url: "/controles", icon: ClipboardCheck },
  { title: "Incidents HSE", url: "/incidents", icon: AlertTriangle },
  { title: "Audits & Inspections", url: "/audits", icon: Search },
  { title: "Formations", url: "/formations", icon: GraduationCap },
  { title: "Visites médicales", url: "/visites-medicales", icon: Stethoscope },
  { title: "EPI & Équipements", url: "/epi", icon: HardHat },
  { title: "Prestataires", url: "/prestataires", icon: Users },
  { title: "Permis de travail", url: "/permis", icon: FileCheck },
  {
    title: CLIENT_MODULE_TITLE,
    icon: FolderOpen,
    subItems: [
      { title: "Clients", url: "/clients" },
      { title: "Sites", url: "/sites" },
      { title: "Utilisateurs client", url: "/clients/utilisateurs" },
      { title: "Devis", url: "/devis", allowedRoles: BILLING_MANAGER_ROLES },
      { title: "Facture", url: "/facture", allowedRoles: BILLING_MANAGER_ROLES },
      { title: "Facture avoir", url: "/facture-avoir", allowedRoles: BILLING_MANAGER_ROLES },
      { title: "Abonnement", url: "/abonnement", allowedRoles: BILLING_MANAGER_ROLES },
    ],
  },
];

const administrationItems: MenuItem[] = [
  { title: "Gestion des utilisateurs", url: "/utilisateurs", icon: UserCog },
  { title: "Gestion des rôles", url: "/roles", icon: Shield },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [openItems, setOpenItems] = useState<string[]>([]);
  const location = useLocation();
  const { userRoles, userRole } = useAuth();

  const effectiveRoles = userRoles.length > 0 ? userRoles : userRole ? [userRole] : [];

  const navigationItems = useMemo(() => {
    return menuItems.map((item) => {
      if (!item.subItems) {
        return item;
      }

      const filteredSubItems = item.subItems.filter((subItem) => {
        if (!subItem.allowedRoles || subItem.allowedRoles.length === 0) {
          return true;
        }
        return effectiveRoles.some((role) => subItem.allowedRoles?.includes(role));
      });

      return { ...item, subItems: filteredSubItems };
    });
  }, [effectiveRoles]);

  useEffect(() => {
    if (location.pathname.startsWith("/veille/bibliotheque")) {
      setOpenItems((prev) =>
        prev.includes(BIBLIOTHEQUE_TITLE) ? prev : [...prev, BIBLIOTHEQUE_TITLE],
      );
    }
    
    // Open Veille réglementaire submenu when on veille routes
    if (location.pathname.startsWith("/veille") && !location.pathname.startsWith("/veille/bibliotheque")) {
      setOpenItems((prev) =>
        prev.includes("Veille réglementaire") ? prev : [...prev, "Veille réglementaire"],
      );
    }
  }, [location.pathname]);

  useEffect(() => {
    const clientModule = navigationItems.find(
      (item) => item.title === CLIENT_MODULE_TITLE && item.subItems && item.subItems.length > 0,
    );

    if (!clientModule?.subItems) {
      return;
    }

    const matchesClientRoute = clientModule.subItems.some((subItem) => {
      const base = subItem.url;
      return location.pathname === base || location.pathname.startsWith(`${base}/`);
    });

    if (matchesClientRoute) {
      setOpenItems((prev) =>
        prev.includes(CLIENT_MODULE_TITLE) ? prev : [...prev, CLIENT_MODULE_TITLE],
      );
    }
  }, [location.pathname, navigationItems]);

  const toggleItem = (title: string) => {
    setOpenItems((prev) =>
      prev.includes(title) ? prev.filter((entry) => entry !== title) : [...prev, title],
    );
  };

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-64"} collapsible="icon">
      <div className="flex items-center justify-between border-b border-sidebar-border p-4">
        {!isCollapsed ? (
          <div className="flex items-center gap-2">
            <img src={conformaProLogo} alt="Conforma Pro" className="h-8 w-auto" />
          </div>
        ) : (
          <div className="flex w-full items-center justify-center">
            <img src={conformaProLogo} alt="Conforma Pro" className="h-6 w-6 object-contain" />
          </div>
        )}
        {!isCollapsed && (
          <SidebarTrigger>
            <Menu className="h-5 w-5" />
          </SidebarTrigger>
        )}
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const subItems = item.subItems ?? [];
                const hasSubItems = item.subItems !== undefined;
                const isOpen = openItems.includes(item.title);

                return (
                  <Collapsible
                    key={item.title}
                    open={isOpen}
                    onOpenChange={() => toggleItem(item.title)}
                  >
                    <SidebarMenuItem>
                      {hasSubItems ? (
                        <>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton aria-expanded={isOpen}>
                              <item.icon className="h-4 w-4" />
                              {!isCollapsed && (
                                <>
                                  <span>{item.title}</span>
                                  <ChevronDown
                                    aria-hidden="true"
                                    className={`ml-auto h-4 w-4 transition-transform ${
                                      isOpen ? "rotate-180" : ""
                                    }`}
                                  />
                                </>
                              )}
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          {!isCollapsed && (
                            <CollapsibleContent>
                              <SidebarMenuSub>
                                {subItems.map((subItem) => (
                                  <SidebarMenuSubItem key={subItem.url}>
                                    <SidebarMenuSubButton asChild>
                                      <NavLink
                                        to={subItem.url}
                                        className={({ isActive }) =>
                                          isActive
                                            ? "border-l-2 border-primary bg-sidebar-accent pl-2 font-medium text-sidebar-primary"
                                            : "hover:bg-sidebar-accent/50"
                                        }
                                      >
                                        <span>{subItem.title}</span>
                                      </NavLink>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                ))}
                              </SidebarMenuSub>
                            </CollapsibleContent>
                          )}
                        </>
                      ) : (
                        <SidebarMenuButton asChild>
                          <NavLink
                            to={item.url!}
                            end
                            className={({ isActive }) =>
                              isActive
                                ? "bg-sidebar-accent font-medium text-sidebar-primary"
                                : "hover:bg-sidebar-accent/50"
                            }
                          >
                            <item.icon className="h-4 w-4" />
                            {!isCollapsed && <span>{item.title}</span>}
                          </NavLink>
                        </SidebarMenuButton>
                      )}
                    </SidebarMenuItem>
                  </Collapsible>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>
            <Settings className="mr-2 h-4 w-4" />
            {!isCollapsed && "Administration"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {administrationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url!}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-sidebar-accent font-medium text-sidebar-primary"
                          : "hover:bg-sidebar-accent/50"
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
