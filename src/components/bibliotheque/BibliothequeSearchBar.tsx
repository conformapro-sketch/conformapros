import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface BibliothequeSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  isLoading?: boolean;
  resultCount?: number;
  className?: string;
}

const SEARCH_HISTORY_KEY = "bibliotheque-search-history";
const MAX_HISTORY = 5;

export function BibliothequeSearchBar({
  value,
  onChange,
  onSearch,
  isLoading = false,
  resultCount,
  className,
}: BibliothequeSearchBarProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (stored) {
      setSearchHistory(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const addToHistory = (term: string) => {
    if (!term.trim()) return;
    
    const newHistory = [
      term,
      ...searchHistory.filter((h) => h !== term),
    ].slice(0, MAX_HISTORY);
    
    setSearchHistory(newHistory);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
  };

  const handleSearch = (searchTerm: string) => {
    onChange(searchTerm);
    if (onSearch) {
      onSearch(searchTerm);
    }
    if (searchTerm.trim()) {
      addToHistory(searchTerm);
    }
    setShowHistory(false);
  };

  const handleClear = () => {
    onChange("");
    setShowHistory(false);
  };

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder="Rechercher par titre, référence, autorité... (Ctrl+K)"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setShowHistory(true)}
          onBlur={() => setTimeout(() => setShowHistory(false), 200)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch(value);
            }
          }}
          className="pl-12 pr-32 h-12 text-base border-2 focus:border-accent focus:ring-accent"
        />
        <div className="absolute right-2 top-2 flex items-center gap-1">
          {isLoading && (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          )}
          {resultCount !== undefined && value && !isLoading && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              {resultCount} résultat{resultCount > 1 ? "s" : ""}
            </span>
          )}
          {value && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Search History Dropdown */}
      {showHistory && searchHistory.length > 0 && !value && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg animate-in fade-in-0 zoom-in-95">
          <div className="p-2">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-2 py-1">
              Recherches récentes
            </div>
            {searchHistory.map((term, index) => (
              <button
                key={index}
                onClick={() => handleSearch(term)}
                className="w-full text-left px-3 py-2 rounded-sm hover:bg-accent/50 transition-colors flex items-center gap-2 text-sm"
              >
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{term}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
