import { useState, useEffect, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { normalizeSlug, validateSlug, suggestAlternativeSlugs } from "@/lib/publish/slug";
import { getPublishedSiteUrl } from "@/lib/publish/config";
import {
  checkSlugAvailability,
  publishResumeSite,
  getPublishedSiteByResumeId,
  type PublishedSiteRow,
} from "@/repositories/publishedSitesRepo";
import { Loader2, Check, Copy, ExternalLink, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const DEBOUNCE_MS = 400;

export interface PublishDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resumeId: string | null;
  userId: string | null;
  /** Current doc snapshot for publishing */
  basics: Record<string, unknown>;
  blocks: Array<{ type: string; content: Record<string, unknown>; sort_order?: number }>;
  templateId: string | null;
  /** Suggested slug from name/resume title */
  suggestedSlug?: string;
  onPublished: (url: string, slug: string) => void;
}

export function PublishDrawer({
  open,
  onOpenChange,
  resumeId,
  userId,
  basics,
  blocks,
  templateId,
  suggestedSlug = "",
  onPublished,
}: PublishDrawerProps) {
  const [slugInput, setSlugInput] = useState("");
  const [slug, setSlug] = useState("");
  const [availability, setAvailability] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [availabilityError, setAvailabilityError] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState<PublishedSiteRow | null>(null);
  const [existingSite, setExistingSite] = useState<PublishedSiteRow | null>(null);

  const normalizedInput = normalizeSlug(slugInput || suggestedSlug);

  const checkAvailability = useCallback(async (value: string) => {
    const norm = normalizeSlug(value);
    if (!norm) {
      setAvailability("idle");
      setAvailabilityError("");
      return;
    }
    const validation = validateSlug(norm);
    if (!validation.valid) {
      setAvailability("invalid");
      setAvailabilityError("error" in validation ? validation.error : "Invalid");
      return;
    }
    setAvailability("checking");
    setAvailabilityError("");
    try {
      const { available } = await checkSlugAvailability(norm);
      setAvailability(available ? "available" : "taken");
      if (!available) setAvailabilityError("This URL name is already taken.");
    } catch {
      setAvailability("idle");
      setAvailabilityError("Could not check availability.");
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setSlugInput("");
    setPublished(null);
    setAvailability("idle");
    setAvailabilityError("");
    getPublishedSiteByResumeId(resumeId ?? "").then((site) => {
      setExistingSite(site);
      if (site) {
        setSlugInput(site.site_slug);
        setSlug(site.site_slug);
      } else if (suggestedSlug) {
        setSlugInput(suggestedSlug);
        setSlug(normalizeSlug(suggestedSlug));
      }
    });
  }, [open, resumeId, suggestedSlug]);

  useEffect(() => {
    if (!open || !slugInput.trim()) {
      setAvailability("idle");
      return;
    }
    const t = setTimeout(() => checkAvailability(slugInput), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [open, slugInput, checkAvailability]);

  useEffect(() => {
    setSlug(normalizedInput);
  }, [normalizedInput]);

  const handlePublish = async () => {
    if (!resumeId || !userId || !slug) return;
    const validation = validateSlug(slug);
    if (!validation.valid) {
      toast.error("error" in validation ? validation.error : "Invalid slug");
      return;
    }
    if (availability === "taken" || availability === "invalid") {
      toast.error(availabilityError || "Fix the URL name and try again.");
      return;
    }
    setPublishing(true);
    try {
      const row = await publishResumeSite({
        resumeId,
        userId,
        slug,
        templateId,
        siteData: { basics, blocks },
      });
      setPublished(row);
      const url = row.published_url ?? getPublishedSiteUrl(row.site_slug);
      onPublished(url, row.site_slug);
      toast.success("Site published! You can copy or open the link below.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Publish failed.";
      toast.error(msg);
    } finally {
      setPublishing(false);
    }
  };

  const handleCopyUrl = () => {
    const url = published?.published_url ?? getPublishedSiteUrl(slug);
    navigator.clipboard.writeText(url).then(
      () => toast.success("URL copied to clipboard"),
      () => toast.error("Could not copy")
    );
  };

  const handleOpenUrl = () => {
    const url = published?.published_url ?? getPublishedSiteUrl(slug);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const isOwnSlug = existingSite && normalizedInput === existingSite.site_slug;
  const canPublish =
    resumeId &&
    userId &&
    slug.length >= 3 &&
    (availability === "available" || (availability === "taken" && isOwnSlug));
  const displayUrl = getPublishedSiteUrl(slug || "yourslug");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Publish Resume Website</SheetTitle>
          <SheetDescription>
            Choose a public URL and publish. Your site will be live at the link below.
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="space-y-6">
          {published ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/30">
                <p className="flex items-center gap-2 font-medium text-green-800 dark:text-green-200">
                  <Check className="h-4 w-4" /> Published successfully
                </p>
                <p className="mt-2 text-sm text-green-700 dark:text-green-300">
                  Your resume site is live at:
                </p>
                <p className="mt-1 break-all font-mono text-sm text-foreground">
                  {published.published_url ?? getPublishedSiteUrl(published.site_slug)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleCopyUrl} variant="outline" size="sm" className="gap-1.5">
                  <Copy className="h-3.5 w-3.5" /> Copy URL
                </Button>
                <Button onClick={handleOpenUrl} size="sm" className="gap-1.5">
                  <ExternalLink className="h-3.5 w-3.5" /> Open site
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => {
                  setPublished(null);
                  setAvailability("idle");
                }}
              >
                Publish again or change URL
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="publish-slug">Public URL name</Label>
                <Input
                  id="publish-slug"
                  value={slugInput}
                  onChange={(e) => setSlugInput(e.target.value)}
                  placeholder={suggestedSlug || "e.g. jane-doe"}
                  className="font-mono"
                />
                {slug && (
                  <p className="text-xs text-muted-foreground">
                    Preview: <span className="font-mono">{displayUrl}</span>
                  </p>
                )}
              </div>

              <div className="min-h-[2rem]">
                {availability === "checking" && (
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking availability…
                  </p>
                )}
                {availability === "available" && (
                  <p className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                    <Check className="h-3.5 w-3.5" /> This URL is available
                  </p>
                )}
                {availability === "taken" && (
                  <div className="space-y-1">
                    {isOwnSlug ? (
                      <p className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="h-3.5 w-3.5" /> This is your current URL. You can update the published site.
                      </p>
                    ) : (
                      <>
                        <p className="flex items-center gap-2 text-sm text-destructive">
                          <AlertCircle className="h-3.5 w-3.5" /> {availabilityError}
                        </p>
                        {suggestAlternativeSlugs(slugInput).length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Try: {suggestAlternativeSlugs(slugInput).join(", ")}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}
                {availability === "invalid" && availabilityError && (
                  <p className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-3.5 w-3.5" /> {availabilityError}
                  </p>
                )}
              </div>
            </>
          )}
        </SheetBody>

        {!published && (
          <SheetFooter>
            <Button
              onClick={handlePublish}
              disabled={!canPublish || publishing}
              className="gap-2"
            >
              {publishing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Publishing…
                </>
              ) : existingSite ? (
                "Update published site"
              ) : (
                "Publish site"
              )}
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
