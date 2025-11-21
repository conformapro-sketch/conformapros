import { Monitor, Moon, Sun, SunMoon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme, type ThemeMode } from "@/hooks/useTheme";

export function ThemeToggle() {
  const { mode, setMode } = useTheme();
  const ModeIcon = mode === "light" ? Sun : mode === "dark" ? Moon : Monitor;

  return (
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
          value={mode}
          onValueChange={(value) => setMode(value as ThemeMode)}
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
  );
}
