import { type CSSProperties, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  Menu as MenuIcon,
  Monitor,
  Moon,
  Search,
  Settings as SettingsIcon,
  Sun,
  SunMoon,
  LogOut,
  User,
  ChevronDown,
  Shield,
  UserCog,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabaseAny as supabase } from "@/lib/supabase-any";

type ThemeMode = "light" | "dark" | "system";

type ThemePrefs = {
  mode: ThemeMode;
};

const THEME_KEY = "cp_theme";

function readPrefs(): ThemePrefs {
  try {
    const raw = localStorage.getItem(THEME_KEY);
    if (!raw) return { mode: "system" };
    const parsed = JSON.parse(raw) as Partial<ThemePrefs> & { mode?: ThemeMode };
    return { mode: parsed.mode ?? "system" };
  } catch {
    return { mode: "system" };
  }
}

function writePrefs(next: ThemePrefs) {
  localStorage.setItem(THEME_KEY, JSON.stringify(next));
}

function applyMode(mode: ThemeMode) {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const dark = mode === "dark" || (mode === "system" && prefersDark);
  const root = document.documentElement;
  root.classList.toggle("dark", dark);
  root.setAttribute("data-theme-mode", mode);
}

export type TopNavBarProps = {
  className?: string;
  notifications?: number;
  user?: {
    name: string;
    role?: string;
    avatarUrl?: string;
  };
  onProfileClick?: () => void;
  onPreferencesClick?: () => void;
  onLogout?: () => void;
};

export default function TopNavBar({
  className,
  notifications = 0,
  user,
  onProfileClick,
  onPreferencesClick,
  onLogout,
}: TopNavBarProps) {
  const [prefs, setPrefs] = useState<ThemePrefs>(() => readPrefs());
  const { state, isMobile, toggleSidebar } = useSidebar();
  const { user: authUser, userRole, primaryRole, signOut, isTeamUser } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch current user's client info (for client users)
  const { data: userProfile } = useQuery({
    queryKey: ["user-profile", authUser?.id],
    queryFn: async () => {
      if (!authUser?.id) return null;
      const { data, error } = await supabase
        .from("client_users")
        .select("client_id, avatar_url, clients!client_users_client_id_fkey(logo_url, nom)")
        .eq("id", authUser.id)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!authUser?.id,
  });

  // Fetch avatar from profiles table (for team users)
  const { data: teamProfile } = useQuery({
    queryKey: ["team-profile-avatar", authUser?.id],
    queryFn: async () => {
      if (!authUser?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", authUser.id)
        .maybeSingle();
      if (error) return null;
      return data;
    },
    enabled: !!authUser?.id,
  });

  useEffect(() => {
    applyMode(prefs.mode);
    writePrefs(prefs);
  }, [prefs]);

  useEffect(() => {
    if (searchOpen) {
      window.setTimeout(() => searchInputRef.current?.focus(), 0);
    }
  }, [searchOpen]);

  const ModeIcon = prefs.mode === "light" ? Sun : prefs.mode === "dark" ? Moon : Monitor;
  const authMetadata = (authUser?.user_metadata as Record<string, unknown>) ?? {};
  const metaPrenom = typeof authMetadata.prenom === "string" ? authMetadata.prenom : "";
  const metaNom = typeof authMetadata.nom === "string" ? authMetadata.nom : "";
  const metaAvatar = typeof authMetadata.avatar_url === "string" ? authMetadata.avatar_url : undefined;
  const metaFullName = `${metaPrenom} ${metaNom}`.trim();
  const primaryName = user?.name ?? (metaFullName.length > 0 ? metaFullName : undefined);
  const fallbackName = authUser?.email ?? "Utilisateur";
  const resolvedName = (primaryName && primaryName.trim().length > 0 ? primaryName : fallbackName).trim();
  const resolvedRole = user?.role ?? primaryRole?.name ?? userRole ?? undefined;
  
  // Priority: props → client DB → team DB → auth metadata
  const clientAvatar = userProfile?.avatar_url;
  const teamAvatar = teamProfile?.avatar_url;
  const resolvedAvatarUrl = user?.avatarUrl ?? clientAvatar ?? teamAvatar ?? metaAvatar;
  const initials = resolvedName
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase() || "CP";

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
      return;
    }
    void signOut();
  };

  const handlePreferences = () => {
    if (onPreferencesClick) {
      onPreferencesClick();
    }
  };

  const leftOffset = isMobile ? "0px" : state === "collapsed" ? "var(--sidebar-width-icon)" : "var(--sidebar-width)";
  const navStyles: CSSProperties = { left: leftOffset, right: 0 };

  return (
    <>
      <div
        className={cn(
          "fixed top-0 z-50 h-16 border-b border-slate-200/60 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-slate-700/60 dark:bg-[#0B2540]/80 shadow-soft transition-[left,width] duration-200 ease-in-out",
          className,
        )}
        style={navStyles}
        role="navigation"
        aria-label="Barre de navigation principale"
      >
        <div className="mx-auto flex h-full w-full max-w-screen-2xl items-center gap-2 md:gap-3 px-4 md:px-6">
          <div className="flex min-w-[170px] items-center gap-2 md:gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-foreground transition-colors hover:text-[#2FB200] md:hidden"
              aria-label="Ouvrir la navigation"
              onClick={toggleSidebar}
            >
              <MenuIcon className="h-5 w-5" />
            </Button>
            <Link
              to="/"
              className="group flex items-center gap-2 rounded-md p-1 transition-colors hover:text-[#2FB200]"
            >
              {userProfile?.clients?.logo_url ? (
                <img 
                  src={userProfile.clients.logo_url} 
                  alt={userProfile.clients.nom || "Client logo"} 
                  className="h-8 w-auto max-w-[120px] object-contain"
                />
              ) : null}
            </Link>
          </div>

          <div className="flex flex-1 items-center justify-center">
            <div className="hidden w-full max-w-xl md:flex">
              <div className="relative w-full">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Rechercher dans ConformaPro..."
                  aria-label="Rechercher dans ConformaPro"
                  className="w-full rounded-full border border-slate-200/60 bg-background pl-9 pr-3 text-sm shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-[#2FB200]"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-1 sm:gap-2 md:min-w-[170px]">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-foreground transition-colors hover:text-[#2FB200] md:hidden"
              aria-label="Ouvrir la recherche"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-5 w-5" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 text-foreground transition-colors hover:text-[#2FB200]"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {notifications > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
                  {notifications > 99 ? "99+" : notifications}
                </span>
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Changer de theme"
                  className="h-9 w-9 text-foreground transition-colors hover:text-[#2FB200]"
                >
                  <ModeIcon className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel className="flex items-center gap-2">
                  <SunMoon className="h-4 w-4" /> Theme
                </DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={prefs.mode}
                  onValueChange={(value) => setPrefs({ mode: value as ThemeMode })}
                >
                  <DropdownMenuRadioItem value="light">
                    <span className="flex items-center gap-2"><Sun className="h-4 w-4" /> Clair</span>
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="dark">
                    <span className="flex items-center gap-2"><Moon className="h-4 w-4" /> Sombre</span>
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="system">
                    <span className="flex items-center gap-2"><Monitor className="h-4 w-4" /> Systeme</span>
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Settings - Visible uniquement pour le staff Conforma */}
            {isTeamUser() && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-foreground transition-colors hover:text-[#2FB200]"
                    aria-label="Gestion du staff Conforma"
                  >
                    <SettingsIcon className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="flex items-center gap-2">
                    <Shield className="h-4 w-4" /> Conforma Pro
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/utilisateurs" className="cursor-pointer">
                      <UserCog className="mr-2 h-4 w-4" />
                      Gestion du staff
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/roles" className="cursor-pointer">
                      <Shield className="mr-2 h-4 w-4" />
                      Gestion des rôles
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-9 gap-2 rounded-full pl-1 pr-2 text-foreground transition-colors hover:text-[#2FB200]"
                  aria-label="Ouvrir le menu utilisateur"
                >
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={resolvedAvatarUrl} alt={resolvedName} />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="hidden min-w-0 flex-col items-start leading-tight sm:flex">
                    <span className="max-w-[10rem] truncate text-left text-sm font-medium">{resolvedName}</span>
                    {resolvedRole && <span className="text-xs text-muted-foreground">{resolvedRole}</span>}
                  </div>
                  <ChevronDown className="hidden h-4 w-4 sm:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onSelect={(event) => { event.preventDefault(); onProfileClick?.(); }}>
                  <User className="mr-2 h-4 w-4" /> Mon profil
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={(event) => { event.preventDefault(); handlePreferences(); }}>
                  <SettingsIcon className="mr-2 h-4 w-4" /> Preferences
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={(event) => {
                    event.preventDefault();
                    handleLogout();
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" /> Se deconnecter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Recherche</DialogTitle>
            <DialogDescription>Rechercher dans ConformaPro.</DialogDescription>
          </DialogHeader>
          <div className="relative mt-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              type="search"
              placeholder="Tapez votre recherche..."
              aria-label="Recherche"
              className="w-full rounded-full border border-slate-200/60 bg-background pl-9 pr-3 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-[#2FB200]"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
