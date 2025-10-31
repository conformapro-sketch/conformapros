import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalize a role name to a slug format for comparison
 * E.g., "Super Admin" -> "super_admin"
 */
export function slugifyRole(role: string): string {
  return role
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/\s+/g, '_'); // Replace spaces with underscores
}
