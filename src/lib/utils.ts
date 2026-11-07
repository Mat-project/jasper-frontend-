import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS class names with clsx + tailwind-merge.
 * This is the standard shadcn/ui utility.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format a date string to a readable format.
 */
export function formatDate(
  date: string | Date,
  options?: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  }).format(new Date(date));
}

/**
 * Truncate a string to a maximum length, adding "..." if needed.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}...`;
}

/**
 * Get user initials from a name string.
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Cleans a raw email recipient string:
 * - Strips display names, angles, and brackets (e.g. "Name <user@domain.com>" -> "user@domain.com").
 * - Supports comma, semicolon, space, or newline delimiters.
 * - Deduplicates case-insensitively while preserving original order.
 * - Filters out any addresses present in `excludeSet`.
 */
export function cleanAndDedupeEmails(raw: string, excludeSet?: Set<string>): string {
  if (!raw || !raw.trim()) return "";
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  const matches = raw.match(emailRegex);
  if (!matches) {
    return raw.trim();
  }

  const seen = new Set<string>();
  const unique: string[] = [];
  for (const m of matches) {
    const cleaned = m.trim().toLowerCase();
    if (!seen.has(cleaned) && (!excludeSet || !excludeSet.has(cleaned))) {
      seen.add(cleaned);
      unique.push(cleaned);
    }
  }
  return unique.join(", ");
}

/**
 * Cross-cleans To, Cc, and Bcc fields so no duplicate email exists across the 3 lists.
 */
export function cleanRecipientFields(to: string, cc: string = "", bcc: string = "") {
  const cleanTo = cleanAndDedupeEmails(to);
  const toSet = new Set(cleanTo ? cleanTo.split(", ").map(e => e.trim().toLowerCase()) : []);

  const cleanCc = cleanAndDedupeEmails(cc, toSet);
  const toAndCcSet = new Set([...toSet, ...(cleanCc ? cleanCc.split(", ").map(e => e.trim().toLowerCase()) : [])]);

  const cleanBcc = cleanAndDedupeEmails(bcc, toAndCcSet);

  return { cleanTo, cleanCc, cleanBcc };
}
