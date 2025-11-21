import { useMemo } from "react";
import { ChevronDown, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";

interface UserProfileMenuProps {
  onProfileClick?: () => void;
  onLogout?: () => void;
}

export function UserProfileMenu({ onProfileClick, onLogout }: UserProfileMenuProps) {
  const { user: authUser, primaryRole, userRole, signOut } = useAuth();
  const { data: userProfile } = useUserProfile();

  const userDisplayInfo = useMemo(() => {
    const authMetadata = (authUser?.user_metadata as Record<string, unknown>) ?? {};
    const metaPrenom = typeof authMetadata.prenom === "string" ? authMetadata.prenom : "";
    const metaNom = typeof authMetadata.nom === "string" ? authMetadata.nom : "";
    const metaAvatar = typeof authMetadata.avatar_url === "string" ? authMetadata.avatar_url : undefined;
    const metaFullName = `${metaPrenom} ${metaNom}`.trim();
    
    const fallbackName = authUser?.email ?? "Utilisateur";
    const resolvedName = metaFullName.length > 0 ? metaFullName : fallbackName;
    const resolvedRole = primaryRole?.name ?? userRole ?? undefined;
    const resolvedAvatarUrl = userProfile?.avatarUrl ?? metaAvatar;
    
    const initials = resolvedName
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .filter(Boolean)
      .map((part) => part.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase() || "CP";

    return {
      name: resolvedName,
      role: resolvedRole,
      avatarUrl: resolvedAvatarUrl,
      initials,
      clientName: userProfile?.clientName,
    };
  }, [authUser, userProfile, primaryRole, userRole]);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
      return;
    }
    void signOut();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="h-9 gap-2 rounded-full pl-1 pr-2 text-foreground transition-colors hover:text-[#2FB200]"
          aria-label="Ouvrir le menu utilisateur"
        >
          <Avatar className="h-7 w-7">
            <AvatarImage src={userDisplayInfo.avatarUrl} alt={userDisplayInfo.name} />
            <AvatarFallback className="text-xs">{userDisplayInfo.initials}</AvatarFallback>
          </Avatar>
          <div className="hidden min-w-0 flex-col items-start leading-tight sm:flex">
            <span className="max-w-[10rem] truncate text-left text-sm font-medium">
              {userDisplayInfo.name}
            </span>
            {userDisplayInfo.role && (
              <span className="text-xs text-muted-foreground">{userDisplayInfo.role}</span>
            )}
          </div>
          <ChevronDown className="hidden h-4 w-4 sm:block" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {userDisplayInfo.clientName && (
          <>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-xs text-muted-foreground">Organisation</p>
                <p className="text-sm font-medium leading-none">{userDisplayInfo.clientName}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            onProfileClick?.();
          }}
        >
          <User className="mr-2 h-4 w-4" /> Mon profil
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
  );
}
