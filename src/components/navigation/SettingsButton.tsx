import { useNavigate } from "react-router-dom";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export function SettingsButton() {
  const { hasRole } = useAuth();
  const navigate = useNavigate();

  // Only show for staff users
  if (!hasRole("Super Admin") && !hasRole("Admin Global")) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-9 w-9 text-foreground transition-colors hover:text-[#2FB200]"
      aria-label="Accéder aux paramètres"
      onClick={() => navigate("/settings")}
    >
      <Settings className="h-5 w-5" />
    </Button>
  );
}
