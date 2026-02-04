import {
  Menu,
  ChevronDown,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useState, useEffect, useMemo, useCallback } from "react";
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
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import conformaProLogo from "@/assets/conforma-pro-logo.png";
import { useAuth } from "@/contexts/AuthContext";
import { useUserModules } from "@/hooks/useUserModules";
import { useSiteContext } from "@/hooks/useSiteContext";
import { buildNavigationFromModules, findActiveModule, type MenuItem } from "@/lib/module-navigation-map";
import { canAccessClientManagement } from "@/lib/permission-helpers";

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [openItems, setOpenItems] = useState<string[]>([]);
  const location = useLocation();
  const { hasPermission, isSuperAdmin, hasRole, isClientUser } = useAuth();
  const { currentSite, isLoading: siteLoading } = useSiteContext();

  // Clean pathname without query params for route matching
  const cleanPath = useMemo(() => location.pathname.split('?')[0], [location.pathname]);

  // Helper functions for active state detection
  const isActiveExact = useCallback((url: string) => cleanPath === url, [cleanPath]);
  const isActivePrefix = useCallback((url: string) => 
    cleanPath === url || cleanPath.startsWith(url + "/"), [cleanPath]);

  // Check if a module or any of its subitems is active
  const isModuleActive = useCallback((item: MenuItem): boolean => {
    if (item.url && isActivePrefix(item.url)) return true;
    if (item.subItems) {
      return item.subItems.some(sub => isActivePrefix(sub.url));
    }
    return false;
  }, [isActivePrefix]);
  
  // Fetch user modules (pass siteId for client users only)
  const { data: modules, isLoading: modulesLoading } = useUserModules(
    isClientUser() ? currentSite?.id : null
  );
  
  const isLoading = siteLoading || modulesLoading;

  // Determine if user is staff - memoize to avoid recreation
  const isStaff: boolean = useMemo(() => {
    if (isSuperAdmin) return true;
    return hasRole('Admin Global');
  }, [isSuperAdmin]); // hasRole is a stable function reference

  const navigationItems = useMemo(() => {
    if (!modules) return [];
    return buildNavigationFromModules(modules, isStaff);
  }, [modules, isStaff]);

  const canManageClients = useMemo(() => {
    return canAccessClientManagement(hasPermission, isSuperAdmin);
  }, [hasPermission, isSuperAdmin]);

  // Log warning if client user has no accessible modules
  useEffect(() => {
    if (!isLoading && isClientUser() && (!modules || modules.length === 0)) {
      console.warn('Client user has no accessible modules. Permissions may not be set.');
    }
  }, [modules, isLoading, isClientUser]);

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
    <Sidebar 
      className={`sidebar-transition shadow-strong ${isCollapsed ? "w-16" : "w-64"}`} 
      collapsible="icon"
    >
      <div className="flex items-center justify-between border-b border-sidebar-border p-4 sidebar-transition">
        {!isCollapsed ? (
          <div className="flex items-center gap-2 sidebar-transition">
            <img 
              src={conformaProLogo} 
              alt="Conforma Pro" 
              className="h-8 w-auto sidebar-transition" 
            />
          </div>
        ) : (
          <div className="flex w-full items-center justify-center">
            <img 
              src={conformaProLogo} 
              alt="Conforma Pro" 
              className="h-8 w-8 object-contain sidebar-transition" 
            />
          </div>
        )}
        <SidebarTrigger className={`sidebar-hover ${isCollapsed ? "mx-auto" : ""}`}>
          <Menu className="h-5 w-5" />
        </SidebarTrigger>
      </div>

      <SidebarContent className="sidebar-scrollbar">
        <SidebarGroup>
          <SidebarGroupLabel className="sidebar-transition">
            {!isCollapsed && "Navigation"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : navigationItems.length === 0 && isClientUser() ? (
              <div className="mx-3 rounded-lg border border-warning/20 bg-warning/5 p-4">
                <p className="text-sm font-medium text-foreground">Aucun module accessible</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Votre administrateur doit vous assigner des modules pour accéder à cette plateforme.
                </p>
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
                          {isCollapsed ? (
                            <HoverCard openDelay={100} closeDelay={100}>
                              <HoverCardTrigger asChild>
                                <SidebarMenuButton 
                                  className="sidebar-hover justify-center data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:ring-2 data-[active=true]:ring-primary"
                                  aria-label={item.title}
                                  isActive={isModuleActive(item)}
                                >
                                  <item.icon className="h-6 w-6" />
                                </SidebarMenuButton>
                              </HoverCardTrigger>
                              <HoverCardContent 
                                side="right" 
                                align="start"
                                className="w-56 bg-popover text-popover-foreground border-2 border-sidebar-primary/20 shadow-strong ml-2"
                              >
                                <div className="space-y-1">
                                  <h4 className="font-semibold text-sidebar-primary mb-2 flex items-center gap-2">
                                    <item.icon className="h-4 w-4" />
                                    {item.title}
                                  </h4>
                                  <div className="space-y-1">
                                    {subItems.map((subItem) => {
                                      const subIsActive = isActivePrefix(subItem.url);
                                      return (
                                        <NavLink
                                          key={subItem.url}
                                          to={subItem.url}
                                        className={`block px-3 py-2 text-sm rounded-md sidebar-hover ${
                                            subIsActive
                                              ? "bg-sidebar-accent text-sidebar-accent-foreground font-bold border-l-4 border-primary pl-2"
                                              : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                                          }`}
                                        >
                                          {subItem.title}
                                        </NavLink>
                                      );
                                    })}
                                  </div>
                                </div>
                              </HoverCardContent>
                            </HoverCard>
                          ) : (
                            <>
                              <CollapsibleTrigger asChild>
                                <SidebarMenuButton 
                                  aria-expanded={isOpen}
                                  className="sidebar-hover data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:font-semibold"
                                  isActive={isModuleActive(item)}
                                >
                                  <item.icon className="h-5 w-5" />
                                  <span>{item.title}</span>
                                  <ChevronDown
                                    aria-hidden="true"
                                    className={`ml-auto h-4 w-4 sidebar-transition ${
                                      isOpen ? "rotate-180" : ""
                                    }`}
                                  />
                                </SidebarMenuButton>
                              </CollapsibleTrigger>
                              <CollapsibleContent className="sidebar-transition">
                                <SidebarMenuSub>
                                  {subItems.map((subItem) => {
                                    const subIsActive = isActivePrefix(subItem.url);
                                    return (
                                      <SidebarMenuSubItem key={subItem.url}>
                                        <SidebarMenuSubButton 
                                          asChild
                                          isActive={subIsActive}
                                          className="sidebar-hover transition-all duration-200 rounded-md pl-4 data-[active=true]:border-l-4 data-[active=true]:border-primary data-[active=true]:bg-sidebar-accent data-[active=true]:pl-3 data-[active=true]:font-bold data-[active=true]:text-sidebar-accent-foreground data-[active=true]:shadow-sm"
                                        >
                                          <NavLink to={subItem.url}>
                                            <span>{subItem.title}</span>
                                          </NavLink>
                                        </SidebarMenuSubButton>
                                      </SidebarMenuSubItem>
                                    );
                                  })}
                                </SidebarMenuSub>
                              </CollapsibleContent>
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          {isCollapsed ? (
                            <HoverCard openDelay={100} closeDelay={100}>
                              <HoverCardTrigger asChild>
                                <SidebarMenuButton 
                                  asChild
                                  isActive={isActivePrefix(item.url!)}
                                  className="data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:ring-2 data-[active=true]:ring-primary"
                                >
                                  <NavLink
                                    to={item.url!}
                                    className="sidebar-hover justify-center"
                                  >
                                    <item.icon className="h-6 w-6" />
                                  </NavLink>
                                </SidebarMenuButton>
                              </HoverCardTrigger>
                              <HoverCardContent 
                                side="right" 
                                align="center"
                                className="w-auto bg-popover text-popover-foreground border-2 border-sidebar-primary/20 shadow-medium ml-2 px-3 py-2"
                              >
                                <span className="text-sm font-medium text-sidebar-foreground">
                                  {item.title}
                                </span>
                              </HoverCardContent>
                            </HoverCard>
                          ) : (
                            <SidebarMenuButton 
                              asChild
                              isActive={isActivePrefix(item.url!)}
                              className="sidebar-hover data-[active=true]:border-l-4 data-[active=true]:border-primary data-[active=true]:bg-sidebar-accent data-[active=true]:font-bold data-[active=true]:text-sidebar-accent-foreground data-[active=true]:shadow-sm"
                            >
                              <NavLink to={item.url!}>
                                <item.icon className="h-5 w-5" />
                                <span>{item.title}</span>
                              </NavLink>
                            </SidebarMenuButton>
                          )}
                        </>
                      )}
                    </SidebarMenuItem>
                  </Collapsible>
                  );
                })}
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>

      {/* Bouton flottant pour réouvrir la sidebar en mode collapsed - repositionné pour éviter le chevauchement */}
      {isCollapsed && (
        <button
          onClick={() => toggleSidebar()}
          className="fixed bottom-20 left-2 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground shadow-strong hover:shadow-brand sidebar-hover md:bottom-4 md:left-4 md:h-11 md:w-11 safe-area-pb"
          aria-label="Ouvrir le menu"
        >
          <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
        </button>
      )}
    </Sidebar>
  );
}
