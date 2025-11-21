import { Link } from "react-router-dom";
import { Settings as SettingsIcon, Shield, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";

export function StaffSettings() {
  const { isTeamUser } = useAuth();

  if (!isTeamUser()) {
    return null;
  }

  return (
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
  );
}
