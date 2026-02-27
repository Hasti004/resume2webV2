import { useEffect, useMemo, useState } from "react";
import type React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover } from "@/components/ui/Popover";
import { getAllTemplates } from "./templateRegistry";
import type { TemplateManifest } from "./templateManifests";
import { setTemplateId as setTemplateIdRepo } from "@/lib/resumeRepo";
import { useResumeDocStore } from "@/features/editor/resumeDocStore";
import { toast } from "sonner";

export interface TemplatePickerPopoverProps {
  resumeId?: string;
  open: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
}

const PROFESSION_OPTIONS = ["All", "Tech", "Design", "Business", "Students", "Other"] as const;

function getProfessions(manifest: TemplateManifest): string[] {
  const tags = manifest.personaTags ?? [];
  const profs = new Set<string>();
  if (tags.includes("tech")) profs.add("Tech");
  if (tags.includes("creative") || tags.includes("designer")) profs.add("Design");
  if (tags.includes("business")) profs.add("Business");
  if (tags.includes("student") || tags.includes("students")) profs.add("Students");
  if (profs.size === 0) profs.add("Other");
  return Array.from(profs);
}

export function TemplatePickerPopover({
  resumeId,
  open,
  anchorRef,
  onClose,
}: TemplatePickerPopoverProps) {
  const currentTemplateId = useResumeDocStore((s) => s.templateId);
  const previewTemplateId = useResumeDocStore((s) => s.previewTemplateId);
  const originalTemplateId = useResumeDocStore((s) => s.originalTemplateId);
  const setTemplateIdStore = useResumeDocStore((s) => s.setTemplateId);
  const setOriginalTemplateId = useResumeDocStore((s) => s.setOriginalTemplateId);
  const setPreviewTemplateId = useResumeDocStore((s) => s.setPreviewTemplateId);
  const blocks = useResumeDocStore((s) => s.blocks);
  const [search, setSearch] = useState("");
  const [professionFilter, setProfessionFilter] = useState<(typeof PROFESSION_OPTIONS)[number]>("All");
  const [styleFilter, setStyleFilter] = useState<string>("All");
  const [savingId, setSavingId] = useState<string | null>(null);

  const templates = useMemo(() => getAllTemplates(), []);
  const styleOptions = useMemo(
    () => ["All", ...Array.from(new Set(templates.map((t) => t.styleTag)))],
    [templates]
  );

  const blockTypes = useMemo(
    () => Array.from(new Set(blocks.map((b) => b.type))),
    [blocks]
  );

  const filteredTemplates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return templates.filter((t) => {
      const matchesSearch =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.styleTag.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      const profs = getProfessions(t);
      const matchesProfession =
        professionFilter === "All" || profs.includes(professionFilter);

      const matchesStyle =
        styleFilter === "All" || t.styleTag.toLowerCase() === styleFilter.toLowerCase();

      return matchesProfession && matchesStyle;
    });
  }, [templates, search, professionFilter, styleFilter]);

  // Initialize snapshot when popover opens
  useEffect(() => {
    if (open) {
      setOriginalTemplateId(currentTemplateId ?? null);
      setPreviewTemplateId(null);
    }
  }, [open, currentTemplateId, setOriginalTemplateId, setPreviewTemplateId]);

  const handleSafeClose = () => {
    const state = useResumeDocStore.getState();
    const orig = state.originalTemplateId;
    const preview = state.previewTemplateId;
    if (preview && preview !== orig) {
      setTemplateIdStore(orig ?? null);
    }
    setPreviewTemplateId(null);
    setOriginalTemplateId(null);
    onClose();
  };

  const handleApply = async (templateId: string) => {
    if (!resumeId) return;
    const state = useResumeDocStore.getState();
    const orig =
      state.originalTemplateId !== null
        ? state.originalTemplateId
        : state.templateId;
    setSavingId(templateId);
    // optimistic update
    setTemplateIdStore(templateId);
    setPreviewTemplateId(null);
    try {
      await setTemplateIdRepo(resumeId, templateId);
      setOriginalTemplateId(templateId);
      setSavingId(null);
      onClose();
    } catch (err) {
      setTemplateIdStore(orig ?? null);
      setSavingId(null);
      const message =
        err instanceof Error ? err.message : "Failed to apply template.";
      toast.error(message);
    }
  };

  return (
    <Popover
      open={open}
      anchorRef={anchorRef}
      onClose={handleSafeClose}
      position="right-edge"
      className="w-[420px] max-w-[90vw] sm:w-[520px]"
    >
      <div className="rounded-[24px] border border-[hsl(var(--border))] bg-white shadow-2xl">
        <div className="sticky top-0 z-10 rounded-t-[24px] border-b border-[hsl(var(--border))] bg-white px-4 pt-3 pb-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-foreground">Templates</h2>
            {currentTemplateId && (
              <span className="rounded-2xl bg-gray-100 px-3 py-1 text-[11px] font-medium text-gray-700">
                Current: {currentTemplateId}
              </span>
            )}
          </div>
          <div className="mt-2">
            <Input
              placeholder="Search templates…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 rounded-xl border-[hsl(var(--border))] text-xs"
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <select
              value={professionFilter}
              onChange={(e) =>
                setProfessionFilter(e.target.value as (typeof PROFESSION_OPTIONS)[number])
              }
              className="h-8 rounded-xl border border-[hsl(var(--border))] bg-white px-3 text-xs"
            >
              {PROFESSION_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt === "All" ? "All professions" : opt}
                </option>
              ))}
            </select>
            <select
              value={styleFilter}
              onChange={(e) => setStyleFilter(e.target.value)}
              className="h-8 rounded-xl border border-[hsl(var(--border))] bg-white px-3 text-xs"
            >
              {styleOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt === "All" ? "All styles" : opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        <ScrollArea className="h-[420px] px-3 py-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {filteredTemplates.map((t) => {
              const isCurrent = currentTemplateId === t.id;
              const isHoverPreview = previewTemplateId === t.id;
              const hiddenTypes = blockTypes.filter(
                (bt) => !t.supportedBlocks.includes(bt)
              );
              return (
                <div
                  key={t.id}
                  className={
                    "group flex flex-col rounded-2xl border px-3 py-3 text-left text-xs transition-all duration-150 ease-out " +
                    (isCurrent
                      ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5"
                      : "border-[hsl(var(--border))] bg-white hover:border-[hsl(var(--primary))]/60 hover:bg-[hsl(var(--primary))]/3")
                  }
                  onMouseEnter={() => setPreviewTemplateId(t.id)}
                  onMouseLeave={() => setPreviewTemplateId(null)}
                >
                  <div
                    className="mb-2 h-24 w-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-900"
                  >
                    <div
                      className="h-full w-full rounded-2xl transition-transform duration-150 ease-out group-hover:scale-[1.02]"
                      style={
                        t.preview.kind === "gradient"
                          ? { backgroundImage: t.preview.value }
                          : undefined
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate text-[13px] font-semibold text-foreground">
                      {t.name}
                    </span>
                    {isCurrent && (
                      <span className="rounded-2xl bg-[hsl(var(--primary))]/10 px-2 py-0.5 text-[10px] font-medium text-[hsl(var(--primary))]">
                        Current template
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-[11px] text-gray-600">
                    {t.description}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <span className="rounded-xl bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">
                      {t.styleTag}
                    </span>
                    {getProfessions(t).map((p) => (
                      <span
                        key={p}
                        className="rounded-xl bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                  {hiddenTypes.length > 0 && (
                    <p className="mt-1 text-[10px] text-amber-700">
                      Hides:{" "}
                      {hiddenTypes
                        .slice(0, 3)
                        .map(
                          (ht) =>
                            ht.charAt(0).toUpperCase() +
                            ht.slice(1).replace(/_/g, " ")
                        )
                        .join(", ")}
                      {hiddenTypes.length > 3 ? "…" : ""}
                    </p>
                  )}
                  <div className="mt-2 flex items-center justify-between gap-2">
                    {isHoverPreview && (
                      <span className="text-[10px] text-[hsl(var(--primary))]">
                        Previewing in editor
                      </span>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      className="ml-auto h-7 rounded-xl px-3 text-[11px]"
                      disabled={isCurrent || savingId === t.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApply(t.id);
                      }}
                    >
                      {isCurrent ? "Applied" : "Apply"}
                    </Button>
                  </div>
                </div>
              );
            })}

            {filteredTemplates.length === 0 && (
              <div className="col-span-2 py-6 text-center text-xs text-gray-500">
                No templates match that search. Try clearing filters.
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </Popover>
  );
}

