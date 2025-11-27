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
          className="h-9 justify-between gap-2 text-sm font-medium"
        >
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="hidden sm:inline">{currentSite.nom}</span>
            <span className="sm:hidden">{currentSite.code_site || currentSite.nom}</span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-2 bg-popover z-50" align="start">
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
