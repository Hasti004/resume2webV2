/**
 * Published sites: slug availability, publish, and resolve by slug.
 * Uses public.published_sites table; RLS allows public read by slug when is_published.
 */

import { supabase } from "@/integrations/supabase/client";
import { normalizeSlug, validateSlug } from "@/lib/publish/slug";
import { getPublishedSiteUrl } from "@/lib/publish/config";

const TABLE = "published_sites";

export interface PublishedSiteRow {
  id: string;
  resume_id: string;
  user_id: string;
  site_slug: string;
  subdomain: string | null;
  is_published: boolean;
  published_at: string;
  published_url: string | null;
  template_id: string | null;
  site_data: Record<string, unknown>;
  updated_at: string;
}

export interface PublishedSitePublic {
  id: string;
  resume_id: string;
  site_slug: string;
  published_url: string;
  template_id: string | null;
  site_data: { basics: Record<string, unknown>; blocks: Array<{ type: string; content: Record<string, unknown>; sort_order: number }> };
}

/** Check if a slug is available (not taken by another published site). Does not validate format. */
export async function checkSlugAvailability(slug: string): Promise<{ available: boolean; takenByResumeId?: string }> {
  const normalized = normalizeSlug(slug);
  if (!normalized) return { available: false };

  const { data, error } = await supabase
    .from(TABLE)
    .select("id, resume_id")
    .eq("site_slug", normalized)
    .eq("is_published", true)
    .maybeSingle();

  if (error) throw error;
  if (data) return { available: false, takenByResumeId: (data as { resume_id: string }).resume_id };
  return { available: true };
}

/** Get published site by slug (public read). Returns null if not found or not published. */
export async function getPublishedSiteBySlug(slug: string): Promise<PublishedSitePublic | null> {
  const normalized = normalizeSlug(slug);
  if (!normalized) return null;

  const { data, error } = await supabase
    .from(TABLE)
    .select("id, resume_id, site_slug, published_url, template_id, site_data")
    .eq("site_slug", normalized)
    .eq("is_published", true)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as PublishedSiteRow;
  const siteData = (row.site_data ?? {}) as Record<string, unknown>;
  const basics = (siteData.basics ?? {}) as Record<string, unknown>;
  const blocks = Array.isArray(siteData.blocks) ? siteData.blocks : [];

  return {
    id: row.id,
    resume_id: row.resume_id,
    site_slug: row.site_slug,
    published_url: row.published_url ?? getPublishedSiteUrl(row.site_slug),
    template_id: row.template_id,
    site_data: { basics, blocks },
  };
}

/** Get published site by resume id (for current user's resume). */
export async function getPublishedSiteByResumeId(resumeId: string): Promise<PublishedSiteRow | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("resume_id", resumeId)
    .eq("is_published", true)
    .maybeSingle();

  if (error) throw error;
  return data as PublishedSiteRow | null;
}

/** Publish a resume to a slug. Snapshot is taken from provided siteData. */
export async function publishResumeSite(params: {
  resumeId: string;
  userId: string;
  slug: string;
  templateId: string | null;
  siteData: { basics: Record<string, unknown>; blocks: Array<{ type: string; content: Record<string, unknown>; sort_order?: number }> };
}): Promise<PublishedSiteRow> {
  const normalized = normalizeSlug(params.slug);
  if (!normalized) throw new Error("Invalid slug");

  const validation = validateSlug(normalized);
  if (!validation.valid) throw new Error("error" in validation ? validation.error : "Invalid slug");

  const { available } = await checkSlugAvailability(normalized);
  if (!available) throw new Error("This URL name is already taken. Try another.");

  const publishedUrl = getPublishedSiteUrl(normalized);
  const snapshot = {
    basics: params.siteData.basics ?? {},
    blocks: (params.siteData.blocks ?? []).map((b) => ({
      type: b.type,
      content: b.content ?? {},
      sort_order: b.sort_order ?? 0,
    })),
  };

  const { data: existing } = await supabase
    .from(TABLE)
    .select("id")
    .eq("resume_id", params.resumeId)
    .maybeSingle();

  const row = {
    resume_id: params.resumeId,
    user_id: params.userId,
    site_slug: normalized,
    subdomain: null,
    is_published: true,
    published_at: new Date().toISOString(),
    published_url: publishedUrl,
    template_id: params.templateId,
    site_data: snapshot,
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    const { data: updated, error } = await supabase
      .from(TABLE)
      .update(row)
      .eq("id", (existing as { id: string }).id)
      .select()
      .single();
    if (error) throw error;
    return updated as PublishedSiteRow;
  }

  const { data: inserted, error } = await supabase.from(TABLE).insert(row).select().single();
  if (error) throw error;
  return inserted as PublishedSiteRow;
}

/** Unpublish a resume (set is_published = false). */
export async function unpublishResumeSite(resumeId: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .update({ is_published: false, updated_at: new Date().toISOString() })
    .eq("resume_id", resumeId);
  if (error) throw error;
}
