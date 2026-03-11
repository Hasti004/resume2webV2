/**
 * Slug utilities for published site URLs.
 * Used for path-based debug URLs now; structured for wildcard subdomains later.
 */

export const SLUG_MIN_LENGTH = 3;
export const SLUG_MAX_LENGTH = 40;

/** Slugs that must not be used (app routes, reserved words). */
export const RESERVED_SLUGS = new Set([
  "dashboard",
  "login",
  "signup",
  "auth",
  "editor",
  "publish",
  "api",
  "admin",
  "app",
  "assets",
  "static",
  "settings",
  "templates",
  "pricing",
  "about",
  "contact",
  "privacy",
  "terms",
  "www",
  "u",
  "portfolio",
  "create",
  "sync",
  "upgrade",
  "scanning",
  "intake",
  "templates-redirect",
  "index",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
]);

/**
 * Normalize user input to a valid slug: lowercase, letters/numbers/hyphens only.
 * Spaces and underscores → hyphens; collapse repeated hyphens; trim.
 */
export function normalizeSlug(input: string): string {
  if (typeof input !== "string") return "";
  return input
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Validate slug: length, charset, no leading/trailing hyphen.
 * Returns { valid: true } or { valid: false, error: string }.
 */
export function validateSlug(slug: string): { valid: true } | { valid: false; error: string } {
  const normalized = normalizeSlug(slug);
  if (normalized.length === 0) return { valid: false, error: "Enter a URL name." };
  if (normalized.length < SLUG_MIN_LENGTH)
    return { valid: false, error: `Use at least ${SLUG_MIN_LENGTH} characters.` };
  if (normalized.length > SLUG_MAX_LENGTH)
    return { valid: false, error: `Use at most ${SLUG_MAX_LENGTH} characters.` };
  if (/^-/.test(normalized) || /-$/.test(normalized))
    return { valid: false, error: "Slug cannot start or end with a hyphen." };
  if (!/^[a-z0-9-]+$/.test(normalized))
    return { valid: false, error: "Only letters, numbers, and hyphens allowed." };
  if (isReservedSlug(normalized))
    return { valid: false, error: "This URL name is reserved." };
  return { valid: true };
}

export function isReservedSlug(slug: string): boolean {
  const normalized = normalizeSlug(slug);
  return RESERVED_SLUGS.has(normalized);
}

/**
 * Suggest alternative slugs when the requested one is taken.
 * e.g. hastivakani → hastivakani-2, hastivakani-3
 */
export function suggestAlternativeSlugs(base: string, count = 3): string[] {
  const normalized = normalizeSlug(base);
  if (!normalized) return [];
  const suggestions: string[] = [];
  for (let i = 2; i < 2 + count; i++) {
    const candidate = `${normalized}-${i}`;
    if (candidate.length <= SLUG_MAX_LENGTH) suggestions.push(candidate);
  }
  return suggestions;
}
