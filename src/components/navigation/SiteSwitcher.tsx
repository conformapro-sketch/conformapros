import { Building2, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useSiteContext } from "@/hooks/useSiteContext";
import { Skeleton } from "@/components/ui/skeleton";

export function SiteSwitcher() {
  const { currentSite, availableSites, isLoading, setSite } = useSiteContext();

  if (isLoading) {
    return <Skeleton className="h-9 w-40" />;
  }

  if (!currentSite || availableSites.length === 0) {
    return null;
  }

  // Don't show switcher if user only has one site
  if (availableSites.length === 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
        <Building2 className="h-4 w-4" />
        <span className="hidden sm:inline font-medium">{currentSite.nom}</span>
      </div>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="h-8 sm:h-9 justify-between gap-1 sm:gap-2 text-xs sm:text-sm font-medium max-w-[140px] sm:max-w-[200px] md:max-w-none"
        >
          <div className="flex items-center gap-1 sm:gap-2 min-w-0">
            <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
            <span className="hidden md:inline truncate">{currentSite.nom}</span>
            <span className="md:hidden truncate">{currentSite.code_site || currentSite.nom.slice(0, 10)}</span>
          </div>
          <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 opacity-50 flex-shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] sm:w-[280px] p-2 bg-popover z-50" align="start">
        <div className="space-y-1">
          {availableSites.map((site) => (
            <button
              key={site.id}
              onClick={() => setSite(site.id)}
              className={cn(
                "w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors text-left",
                currentSite.id === site.id && "bg-accent"
              )}
            >
              <Check
                className={cn(
                  "h-4 w-4 shrink-0",
                  currentSite.id === site.id ? "opacity-100" : "opacity-0"
                )}
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{site.nom}</div>
                {(site.code_site || site.gouvernorat) && (
                  <div className="text-xs text-muted-foreground truncate">
                    {[site.code_site, site.gouvernorat].filter(Boolean).join(" • ")}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
