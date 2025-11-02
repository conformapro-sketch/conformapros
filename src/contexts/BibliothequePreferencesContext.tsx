import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type ViewMode = "table" | "grid";
export type DensityMode = "compact" | "comfortable" | "large";

interface BibliothequePreferences {
  view: ViewMode;
  pageSize: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
  density: DensityMode;
  filtersOpen: boolean;
  sidebarOpen: boolean;
  favoriteTextes: string[];
}

interface BibliothequePreferencesContextType {
  preferences: BibliothequePreferences;
  setView: (view: ViewMode) => void;
  setPageSize: (size: number) => void;
  setSortBy: (sortBy: string) => void;
  setSortOrder: (order: "asc" | "desc") => void;
  setDensity: (density: DensityMode) => void;
  setFiltersOpen: (open: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleFavorite: (texteId: string) => void;
  isFavorite: (texteId: string) => boolean;
}

const BibliothequePreferencesContext = createContext<BibliothequePreferencesContextType | undefined>(undefined);

const STORAGE_KEY = "bibliotheque-preferences";

const defaultPreferences: BibliothequePreferences = {
  view: "table",
  pageSize: 25,
  sortBy: "date_publication",
  sortOrder: "desc",
  density: "comfortable",
  filtersOpen: true,
  sidebarOpen: false,
  favoriteTextes: [],
};

export function BibliothequePreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<BibliothequePreferences>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? { ...defaultPreferences, ...JSON.parse(stored) } : defaultPreferences;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  const setView = (view: ViewMode) => {
    setPreferences((prev) => ({ ...prev, view }));
  };

  const setPageSize = (pageSize: number) => {
    setPreferences((prev) => ({ ...prev, pageSize }));
  };

  const setSortBy = (sortBy: string) => {
    setPreferences((prev) => ({ ...prev, sortBy }));
  };

  const setSortOrder = (sortOrder: "asc" | "desc") => {
    setPreferences((prev) => ({ ...prev, sortOrder }));
  };

  const setDensity = (density: DensityMode) => {
    setPreferences((prev) => ({ ...prev, density }));
  };

  const setFiltersOpen = (filtersOpen: boolean) => {
    setPreferences((prev) => ({ ...prev, filtersOpen }));
  };

  const setSidebarOpen = (sidebarOpen: boolean) => {
    setPreferences((prev) => ({ ...prev, sidebarOpen }));
  };

  const toggleFavorite = (texteId: string) => {
    setPreferences((prev) => ({
      ...prev,
      favoriteTextes: prev.favoriteTextes.includes(texteId)
        ? prev.favoriteTextes.filter((id) => id !== texteId)
        : [...prev.favoriteTextes, texteId],
    }));
  };

  const isFavorite = (texteId: string) => {
    return preferences.favoriteTextes.includes(texteId);
  };

  return (
    <BibliothequePreferencesContext.Provider
      value={{
        preferences,
        setView,
        setPageSize,
        setSortBy,
        setSortOrder,
        setDensity,
        setFiltersOpen,
        setSidebarOpen,
        toggleFavorite,
        isFavorite,
      }}
    >
      {children}
    </BibliothequePreferencesContext.Provider>
  );
}

export function useBibliothequePreferences() {
  const context = useContext(BibliothequePreferencesContext);
  if (!context) {
    throw new Error("useBibliothequePreferences must be used within BibliothequePreferencesProvider");
  }
  return context;
}
