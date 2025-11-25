import { useState } from "react";
import { Check, ChevronsUpDown, Landmark, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";
import { autoritesQueries } from "@/lib/autorites-queries";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuth } from "@/contexts/AuthContext";

interface AutoriteAutocompleteProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  onAddNew?: () => void;
}

export function AutoriteAutocomplete({
  value,
  onChange,
  placeholder = "Sélectionner une autorité...",
  disabled = false,
  onAddNew,
}: AutoriteAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const { hasRole } = useAuth();
  const isStaff = hasRole('Super Admin') || hasRole('Admin Global');

  const { data: autorites = [] } = useQuery({
    queryKey: ['autorites', debouncedSearch],
    queryFn: () => 
      debouncedSearch 
        ? autoritesQueries.search(debouncedSearch)
        : autoritesQueries.fetchAll(),
  });

  const selectedAutorite = autorites.find((a) => a.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedAutorite ? (
            <span className="flex items-center gap-2">
              <Landmark className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">
                {selectedAutorite.nom}
                {selectedAutorite.nom_court && (
                  <span className="text-muted-foreground ml-1">
                    ({selectedAutorite.nom_court})
                  </span>
                )}
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Rechercher une autorité..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandEmpty>
            Aucune autorité trouvée.
            {isStaff && onAddNew && (
              <Button
                variant="ghost"
                className="w-full justify-start mt-2"
                onClick={() => {
                  setOpen(false);
                  onAddNew();
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Ajouter "{search}"
              </Button>
            )}
          </CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {autorites.map((autorite) => (
              <CommandItem
                key={autorite.id}
                value={autorite.id}
                onSelect={() => {
                  onChange(autorite.id);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === autorite.id ? "opacity-100" : "opacity-0"
                  )}
                />
                <Landmark className="mr-2 h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col">
                  <span>{autorite.nom}</span>
                  {autorite.nom_court && (
                    <span className="text-xs text-muted-foreground">
                      {autorite.nom_court}
                    </span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
