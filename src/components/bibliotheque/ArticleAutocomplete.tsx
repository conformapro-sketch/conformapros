import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
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
import { useQuery } from "@tanstack/react-query";
import { textesArticlesQueries } from "@/lib/textes-queries";

interface ArticleAutocompleteProps {
  texteId: string;
  value?: any;
  onChange: (article: any) => void;
  placeholder?: string;
}

export function ArticleAutocomplete({
  texteId,
  value,
  onChange,
  placeholder = "Rechercher un article...",
}: ArticleAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["texte-articles", texteId],
    queryFn: () => textesArticlesQueries.getByTexteId(texteId),
    enabled: !!texteId,
  });

  const filteredArticles = articles.filter((article: any) =>
    `${article.numero_article} ${article.titre_court || ""}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value ? (
            <span className="truncate">
              {value.numero_article}
              {value.titre_court && ` - ${value.titre_court}`}
            </span>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput
            placeholder="Rechercher un article..."
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            <CommandEmpty>
              {isLoading ? "Chargement..." : "Aucun article trouvé"}
            </CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {filteredArticles.map((article: any) => (
                <CommandItem
                  key={article.id}
                  onSelect={() => {
                    onChange(article);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value?.id === article.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{article.numero_article}</div>
                    {article.titre_court && (
                      <div className="text-xs text-muted-foreground">
                        {article.titre_court}
                      </div>
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
