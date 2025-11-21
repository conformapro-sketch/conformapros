import { type CSSProperties, useState } from "react";
import { Link } from "react-router-dom";
import { Menu as MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useUserProfile } from "@/hooks/useUserProfile";
import { SearchBar } from "@/components/navigation/SearchBar";
import { NotificationsButton } from "@/components/navigation/NotificationsButton";
import { ThemeToggle } from "@/components/navigation/ThemeToggle";
import { UserProfileMenu } from "@/components/navigation/UserProfileMenu";
import { StaffSettings } from "@/components/navigation/StaffSettings";

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
  onProfileClick,
  onLogout,
}: TopNavBarProps) {
  const { state, isMobile, toggleSidebar } = useSidebar();
  const [searchOpen, setSearchOpen] = useState(false);
  const { data: userProfile } = useUserProfile();

  const leftOffset = isMobile ? "0px" : state === "collapsed" ? "var(--sidebar-width-icon)" : "var(--sidebar-width)";
  const navStyles: CSSProperties = { left: leftOffset, right: 0 };

  return (
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
        <div className="flex min-w-[170px] items-center gap-3 md:gap-4">
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
            <img 
              src="/src/assets/conforma-pro-logo.png" 
              alt="ConformaPro" 
              className="h-8 w-auto object-contain"
            />
          </Link>
          {userProfile?.clientLogo && (
            <div className="hidden md:flex items-center gap-2">
              <div className="h-6 w-px bg-border" />
              <img 
                src={userProfile.clientLogo} 
                alt={userProfile.clientName || "Logo client"} 
                className="h-6 w-auto max-w-[100px] object-contain opacity-70"
              />
            </div>
          )}
        </div>

        <div className="flex flex-1 items-center justify-center">
          <TooltipProvider>
            <SearchBar searchOpen={searchOpen} onSearchOpenChange={setSearchOpen} />
          </TooltipProvider>
        </div>

        <div className="flex items-center justify-end gap-1 sm:gap-2 md:min-w-[170px]">
          <TooltipProvider>
            <NotificationsButton count={notifications} />
            <ThemeToggle />
            <StaffSettings />
            <UserProfileMenu onProfileClick={onProfileClick} onLogout={onLogout} />
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}