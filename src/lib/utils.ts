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

/**
 * Check if HTML content is visually empty
 * Handles TipTap/rich text editor output like <p></p>, &nbsp;, etc.
 */
export function isHtmlContentEmpty(html: string | null | undefined): boolean {
  if (!html) return true;
  const textContent = html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
    .trim();
  return textContent.length === 0;
}
