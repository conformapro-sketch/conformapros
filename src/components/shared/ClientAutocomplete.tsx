import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { clientsQueryService } from "@/lib/clients-query-service";
import { useDebounce } from "@/hooks/useDebounce";

interface ClientAutocompleteProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function ClientAutocomplete({
  value,
  onChange,
  placeholder = "🏢 Rechercher un client...",
  disabled = false,
}: ClientAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const { data: clients, isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: () => clientsQueryService.fetchAll(),
  });

  const selectedClient = clients?.find((c) => c.id === value);

  const filteredClients = clients?.filter((client) => {
    if (!debouncedSearch) return true;
    const searchLower = debouncedSearch.toLowerCase();
    return (
      client.nom.toLowerCase().includes(searchLower) ||
      client.nom_legal?.toLowerCase().includes(searchLower) ||
      client.siret?.toLowerCase().includes(searchLower)
    );
  });

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
          {selectedClient ? (
            <span className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {selectedClient.nom}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Tapez pour rechercher..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {isLoading ? "Chargement..." : "Aucun client trouvé."}
            </CommandEmpty>
            <CommandGroup>
              {filteredClients?.map((client) => (
                <CommandItem
                  key={client.id}
                  value={client.id}
                  onSelect={() => {
                    onChange(client.id);
                    setOpen(false);
                    setSearch("");
                  }}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Check
                    className={cn(
                      "h-4 w-4",
                      value === client.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="font-medium">{client.nom}</span>
                    {client.nom_legal && (
                      <span className="text-xs text-muted-foreground">
                        {client.nom_legal}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
