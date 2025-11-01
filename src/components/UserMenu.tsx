import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, User as UserIcon, KeyRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";

export function UserMenu() {
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  if (!user) return null;

  const getInitials = () => {
    const email = user.email || "";
    return email.substring(0, 2).toUpperCase();
  };

  const getRoleLabel = (role: string | null) => {
    const roleLabels: Record<string, string> = {
      admin_global: "Admin Global",
      admin_client: "Admin Client",
      gestionnaire_hse: "Gestionnaire HSE",
      chef_site: "Chef de Site",
    };
    return role ? roleLabels[role] || role : "Utilisateur";
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.email}</p>
            {userRole && (
              <Badge variant="secondary" className="w-fit mt-1">
                {getRoleLabel(userRole)}
              </Badge>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/profile")}>
          <UserIcon className="mr-2 h-4 w-4" />
          <span>Mon profil</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setPasswordDialogOpen(true)}>
          <KeyRound className="mr-2 h-4 w-4" />
          <span>Changer le mot de passe</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Déconnexion</span>
        </DropdownMenuItem>
      </DropdownMenuContent>

      <ChangePasswordDialog
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
      />
    </DropdownMenu>
  );
}
