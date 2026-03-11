/**
 * Publish URL config: path-based debug mode now; subdomain later.
 * Used for building published site URLs and for routing.
 */

const isDev = typeof import.meta !== "undefined" && import.meta.env?.DEV;

/** Base URL for published sites. Debug mode: path-based (e.g. /hastivakani). */
export function getPublishedSiteBaseUrl(): string {
  if (typeof window !== "undefined") {
    const origin = window.location.origin;
    return origin;
  }
  // SSR or build: use env or default
  const base = import.meta.env?.VITE_APP_URL ?? (isDev ? "http://localhost:5173" : "https://resume2web.byteosaurus.com");
  return base;
}

/** Full URL for a published site by slug (path-based for now). */
export function getPublishedSiteUrl(slug: string): string {
  const base = getPublishedSiteBaseUrl().replace(/\/$/, "");
  return `${base}/${encodeURIComponent(slug)}`;
}
