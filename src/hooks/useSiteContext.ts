import { useContext } from "react";
import { SiteContext } from "@/contexts/SiteContext";

export function useSiteContext() {
  const context = useContext(SiteContext);
  
  if (!context) {
    throw new Error("useSiteContext must be used within a SiteProvider");
  }
  
  return context;
}
