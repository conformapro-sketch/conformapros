import {
  Menu,
  ChevronDown,
  Settings,
  Loader2,
  Building2,
  MapPin,
  Calendar,
  FileText,
  Receipt,
  FileCheck,
  Users,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
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
import { useUserModules } from "@/hooks/useUserModules";
import { buildNavigationFromModules, findActiveModule, type MenuItem } from "@/lib/module-navigation-map";

const administrationItems: MenuItem[] = [
  { title: "Clients", url: "/clients", icon: Building2 },
  { title: "Sites", url: "/sites", icon: MapPin },
  { title: "Utilisateurs client", url: "/all-client-users", icon: Users },
  { title: "Abonnements", url: "/abonnement", icon: Calendar },
  { title: "Devis", url: "/devis", icon: FileText },
  { title: "Factures", url: "/facture", icon: Receipt },
  { title: "Factures d'avoir", url: "/facture/avoir", icon: FileCheck },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [openItems, setOpenItems] = useState<string[]>([]);
  const location = useLocation();
  const { data: modules, isLoading } = useUserModules();
  const { hasPermission, isSuperAdmin } = useAuth();

  const navigationItems = useMemo(() => {
    if (!modules) return [];
    return buildNavigationFromModules(modules);
  }, [modules]);

  // Auto-open the submenu containing the active route
  useEffect(() => {
    const activeModule = findActiveModule(location.pathname, navigationItems);
    
    if (activeModule) {
      // Always replace openItems with only the active module
      setOpenItems([activeModule]);
    } else {
      // If no active module, close all
      setOpenItems([]);
    }
  }, [location.pathname, navigationItems]);

  const toggleItem = (title: string) => {
    setOpenItems((prev) =>
      prev.includes(title) ? [] : [title]
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
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
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
            )}
          </SidebarGroupContent>
        </SidebarGroup>

        {(isSuperAdmin() || hasPermission('CLIENTS', 'view')) && (
          <SidebarGroup>
            <SidebarGroupLabel>
              <Settings className="mr-2 h-4 w-4" />
              {!isCollapsed && "Gestion Client"}
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
        )}
      </SidebarContent>
    </Sidebar>
  );
}
