import { useState, useEffect } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { textesReglementairesQueries } from "@/lib/textes-queries";

interface TexteAutocompleteProps {
  value?: string;
  onChange: (texte: any | undefined) => void;
  placeholder?: string;
}

const TYPE_LABELS = {
  loi: "Loi",
  decret: "Décret",
  arrete: "Arrêté",
  circulaire: "Circulaire",
};

export function TexteAutocomplete({ value, onChange, placeholder = "Rechercher un texte..." }: TexteAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: textes } = useQuery({
    queryKey: ['textes-search', search],
    queryFn: () => textesReglementairesQueries.getAll({
      page: 1,
      pageSize: 50,
      searchTerm: search,
    }),
    enabled: open,
  });

  const selectedTexte = value 
    ? textes?.data?.find((t: any) => t.id === value)
    : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedTexte ? (
            <span className="flex items-center gap-2 truncate">
              <FileText className="h-4 w-4 shrink-0" />
              <span className="truncate">{selectedTexte.reference_officielle}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Rechercher par référence ou titre..." 
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>Aucun texte trouvé.</CommandEmpty>
            <CommandGroup>
              {textes?.data?.map((texte: any) => (
                <CommandItem
                  key={texte.id}
                  value={texte.id}
                  onSelect={(currentValue) => {
                    const selected = textes?.data?.find((t: any) => t.id === currentValue);
                    onChange(selected || undefined);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === texte.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        {TYPE_LABELS[texte.type_acte as keyof typeof TYPE_LABELS] || texte.type_acte}
                      </span>
                      <span className="font-medium">{texte.reference_officielle}</span>
                    </div>
                    <span className="text-xs text-muted-foreground line-clamp-1">
                      {texte.intitule}
                    </span>
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
