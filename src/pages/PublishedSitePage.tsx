import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPublishedSiteBySlug } from "@/repositories/publishedSitesRepo";
import { PreviewRenderer } from "@/features/templates/PreviewRenderer";
import { RESERVED_SLUGS } from "@/lib/publish/slug";
import NotFound from "./NotFound";

/**
 * Public published site at /:slug.
 * Resolves slug from published_sites; renders template with snapshot data.
 * Reserved slugs and unknown slugs show 404.
 */
export default function PublishedSitePage() {
  const { slug } = useParams<{ slug: string }>();
  const [status, setStatus] = useState<"loading" | "found" | "not-found">("loading");
  const [site, setSite] = useState<Awaited<ReturnType<typeof getPublishedSiteBySlug>>>(null);

  useEffect(() => {
    const raw = slug?.trim() ?? "";
    if (!raw) {
      setStatus("not-found");
      return;
    }
    const lower = raw.toLowerCase();
    if (RESERVED_SLUGS.has(lower)) {
      setStatus("not-found");
      return;
    }
    setStatus("loading");
    getPublishedSiteBySlug(raw)
      .then((data) => {
        setSite(data);
        setStatus(data ? "found" : "not-found");
      })
      .catch(() => setStatus("not-found"));
  }, [slug]);

  if (status === "not-found") return <NotFound />;
  if (status === "loading" || !site) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  const { site_data, template_id } = site;
  const basics = (site_data?.basics ?? {}) as Record<string, unknown>;
  const blocks = Array.isArray(site_data?.blocks)
    ? site_data.blocks.map((b: { type: string; content?: Record<string, unknown>; sort_order?: number }) => ({
        id: "",
        type: b.type,
        content: b.content ?? {},
        sort_order: b.sort_order ?? 0,
      }))
    : [];

  return (
    <div className="min-h-screen w-full bg-background">
      <PreviewRenderer
        templateId={template_id}
        theme="light"
        basics={basics}
        blocks={blocks}
      />
    </div>
  );
}
