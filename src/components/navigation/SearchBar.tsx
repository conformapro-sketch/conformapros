import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useRef, useEffect } from "react";

interface SearchBarProps {
  searchOpen: boolean;
  onSearchOpenChange: (open: boolean) => void;
}

export function SearchBar({ searchOpen, onSearchOpenChange }: SearchBarProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) {
      window.setTimeout(() => searchInputRef.current?.focus(), 0);
    }
  }, [searchOpen]);

  return (
    <>
      {/* Desktop Search */}
      <div className="hidden w-full max-w-xl md:flex">
        <div className="relative w-full">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Rechercher dans ConformaPro..."
            aria-label="Rechercher dans ConformaPro"
            className="w-full rounded-full border border-slate-200/60 bg-background pl-9 pr-3 text-sm shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-[#2FB200]"
            disabled
          />
        </div>
      </div>

      {/* Mobile Search Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-foreground transition-colors hover:text-[#2FB200] md:hidden"
            aria-label="Ouvrir la recherche"
            onClick={() => onSearchOpenChange(true)}
          >
            <Search className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Recherche globale (À venir)</TooltipContent>
      </Tooltip>

      {/* Mobile Search Dialog */}
      <Dialog open={searchOpen} onOpenChange={onSearchOpenChange}>
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
