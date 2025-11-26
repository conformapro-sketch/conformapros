import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Settings as SettingsIcon, ArrowLeft, Shield, Users, Building2, Layers, Globe, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const settingsNavSections = [
  {
    id: "personal",
    items: [
      {
        id: "account",
        label: "Account",
        icon: User,
        path: "/settings/account",
      },
    ],
  },
  {
    id: "staff",
    label: "Staff",
    items: [
      {
        id: "staff-users",
        label: "Staff users",
        icon: Users,
        path: "/settings/staff",
      },
      {
        id: "staff-roles",
        label: "Staff roles",
        icon: Shield,
        path: "/settings/staffroles",
      },
    ],
  },
  {
    id: "clients",
    label: "Clients",
    items: [
      {
        id: "clients",
        label: "Clients",
        icon: Building2,
        path: "/settings/clients",
      },
      {
        id: "sites",
        label: "Sites",
        icon: Building2,
        path: "/settings/sites",
      },
      {
        id: "client-users",
        label: "Client users",
        icon: Users,
        path: "/settings/clientusers",
      },
      {
        id: "modules",
        label: "Modules",
        icon: Layers,
        path: "/settings/modules",
      },
      {
        id: "domains",
        label: "Domains",
        icon: Globe,
        path: "/settings/domains",
      },
      {
        id: "logs",
        label: "Logs",
        icon: SettingsIcon,
        path: "/settings/logs",
      },
    ],
  },
];

function SettingsSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useSidebar();

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar className={state === "collapsed" ? "w-16" : "w-64"} collapsible="icon">
      <SidebarContent>
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5 text-primary" />
            {state !== "collapsed" && (
              <h2 className="text-lg font-semibold">Settings</h2>
            )}
          </div>
        </div>

        {settingsNavSections.map((section) => (
          <SidebarGroup key={section.id}>
            {section.label && state !== "collapsed" && (
              <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => navigate(item.path)}
                      className={cn(
                        "w-full cursor-pointer",
                        isActive(item.path) && "bg-accent text-accent-foreground font-medium"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {state !== "collapsed" && <span>{item.label}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}

export function SettingsLayout() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleBackToApp = () => {
    navigate("/dashboard");
  };

  const getInitials = () => {
    if (!user?.email) return "U";
    return user.email.substring(0, 2).toUpperCase();
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <SettingsSidebar />

        <div className="flex-1 flex flex-col">
          {/* Top Header */}
          <header className="h-16 border-b bg-card flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackToApp}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour à l'application
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium">{user?.email}</p>
                <p className="text-xs text-muted-foreground">Staff ConformaPro</p>
              </div>
              <Avatar>
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
            </div>
          </header>

          {/* Content Area */}
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
