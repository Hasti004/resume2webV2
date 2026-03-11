/**
 * Publish URL config: path-based debug mode now; subdomain later.
 * Published links always use the canonical production URL so "View Published Site" leads to resume2web.byteosaurus.com/<slug>.
 */

/** Canonical base URL for published sites. "View Published Site" and stored URLs use this. */
const PUBLISHED_SITE_BASE = "https://resume2web.byteosaurus.com";

/** Base URL for published sites (canonical production). Override with VITE_PUBLISHED_SITE_BASE_URL if needed. */
export function getPublishedSiteBaseUrl(): string {
  return (import.meta.env?.VITE_PUBLISHED_SITE_BASE_URL as string) || PUBLISHED_SITE_BASE;
}

/** Full URL for a published site by slug (e.g. https://resume2web.byteosaurus.com/hastivakani). */
export function getPublishedSiteUrl(slug: string): string {
  const base = getPublishedSiteBaseUrl().replace(/\/$/, "");
  return `${base}/${encodeURIComponent(slug)}`;
}
