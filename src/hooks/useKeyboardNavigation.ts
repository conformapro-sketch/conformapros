import { useEffect } from "react";

interface UseKeyboardNavigationProps {
  onToggleFilters?: () => void;
  onEscape?: () => void;
  enabled?: boolean;
}

export function useKeyboardNavigation({
  onToggleFilters,
  onEscape,
  enabled = true,
}: UseKeyboardNavigationProps) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore si l'utilisateur est dans un input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        // Autoriser Escape même dans les inputs
        if (e.key === "Escape" && onEscape) {
          onEscape();
        }
        return;
      }

      // f = toggle filters
      if (e.key === "f" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        onToggleFilters?.();
      }

      // Escape = fermer panels/modals
      if (e.key === "Escape" && onEscape) {
        onEscape();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onToggleFilters, onEscape, enabled]);
}
