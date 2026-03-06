import { useState, useRef, useEffect } from "react";
import { useResumeDocStore } from "./resumeDocStore";
import type { EditorTheme } from "./resumeDocStore";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Minus, Trash2, ChevronDown, GripVertical, Sparkles, ImageIcon } from "lucide-react";
import { TEMPLATE_MANIFESTS } from "@/features/templates/templateManifests";

// ── Image input: paste URL or pick from device ────────────────────────────────
function ImageInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="flex gap-1.5">
      <Input
        className={className}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Paste URL or browse…"}
      />
      <button
        type="button"
        title="Choose image from device"
        onClick={() => fileRef.current?.click()}
        className="shrink-0 flex items-center justify-center h-10 w-10 rounded-xl border border-[hsl(var(--border))] bg-white hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ImageIcon className="h-4 w-4" />
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}

const STANDARD_KEYS = [
  "name",
  "email",
  "phone",
  "location",
  "headline",
  "summary",
  "linkedin",
  "github",
  "portfolio",
  "heroImage",
  "heroBgImage",
  "instagram",
  "behance",
  // template-specific keys that get dedicated UI (shouldn't appear as "custom fields")
  "birthYear",
  "introLine",
  "tagline",
  "studioName",
  "artistQuote",
];

function toKey(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "") || "custom";
}

function blockTypeLabel(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, " ");
}

const DEGREE_TYPES = ["Bachelor's", "B.Tech", "B.E.", "Master's", "M.Tech", "M.E.", "MBA", "Diploma", "PhD", "Other"] as const;
const DEGREE_DURATION_YEARS: Record<string, number> = {
  "Bachelor's": 4, "B.Tech": 4, "B.E.": 4,
  "Master's": 2, "M.Tech": 2, "M.E.": 2, "MBA": 2,
  "Diploma": 2, "PhD": 5, "Other": 4,
};

function parseDatesToYears(dates: string | undefined): { fromYear: string; toYear: string } {
  if (!dates || typeof dates !== "string") return { fromYear: "", toYear: "" };
  const parts = dates.split(/\s*[-–—]\s*/).map((p) => p.trim());
  return { fromYear: parts[0] ?? "", toYear: parts[1] ?? "" };
}

function getEducationItemFields(item: Record<string, unknown>) {
  const { fromYear: fromDates, toYear: toDates } = parseDatesToYears(item.dates as string);
  return {
    name: (item.name as string) ?? (item.title as string) ?? "",
    degreeType: (item.degreeType as string) ?? "",
    degreeName: (item.degreeName as string) ?? (item.role as string) ?? "",
    fromYear: (item.fromYear as string) ?? fromDates,
    toYear: (item.toYear as string) ?? toDates,
    text: (item.text as string) ?? (item.description as string) ?? "",
  };
}

function educationItemToTemplate(item: Record<string, unknown>) {
  const { name, degreeType, degreeName, fromYear, toYear, text } = getEducationItemFields(item);
  const degree = [degreeType, degreeName].filter(Boolean).join(" ").trim() || undefined;
  const dates = [fromYear, toYear].filter(Boolean).join(" – ") || undefined;
  return { ...item, name: name || undefined, degree, dates, text: text || undefined, degreeType, degreeName, fromYear, toYear };
}

export function EditorBasicsPanel() {
  const basics = useResumeDocStore((s) => s.basics);
  const blocks = useResumeDocStore((s) => s.blocks);
  const theme = useResumeDocStore((s) => s.theme);
  const setTheme = useResumeDocStore((s) => s.setTheme);
  const templateId = useResumeDocStore((s) => s.templateId);
  const updateBasics = useResumeDocStore((s) => s.updateBasics);
  const updateBlock = useResumeDocStore((s) => s.updateBlock);
  const removeBasicKey = useResumeDocStore((s) => s.removeBasicKey);
  const [addSectionOpen, setAddSectionOpen] = useState(false);
  const [newSectionLabel, setNewSectionLabel] = useState("");
  const [newSectionValue, setNewSectionValue] = useState("");

  const set = (key: string, value: string) => updateBasics({ [key]: value || undefined });

  const customKeys = Object.keys(basics).filter((k) => !STANDARD_KEYS.includes(k));

  const handleAddSection = () => {
    const key = toKey(newSectionLabel);
    if (!key) return;
    updateBasics({ [key]: newSectionValue.trim() || "" });
    setNewSectionLabel("");
    setNewSectionValue("");
    setAddSectionOpen(false);
  };

  const inputClass =
    "rounded-xl bg-white border border-[hsl(var(--border))] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:border-[hsl(var(--ring))] placeholder:text-gray-400 text-sm";
  const labelClass = "text-xs font-medium text-gray-500";
  const sectionTitleClass = "text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3 first:mt-0";
  const fieldGroupClass = "space-y-1";
  const [openBlocks, setOpenBlocks] = useState<Record<string, boolean>>({});
  const [focusNewItemBlockId, setFocusNewItemBlockId] = useState<string | null>(null);
  const newItemInputRef = useRef<HTMLInputElement>(null);
  const [dragState, setDragState] = useState<{ blockId: string; fromIdx: number } | null>(null);
  const [dropState, setDropState] = useState<{ blockId: string; toIdx: number; position: "before" | "after" } | null>(null);

  useEffect(() => {
    if (!focusNewItemBlockId) return;
    const t = requestAnimationFrame(() => {
      newItemInputRef.current?.focus();
      setFocusNewItemBlockId(null);
    });
    return () => cancelAnimationFrame(t);
  }, [focusNewItemBlockId]);

  // ── Template-specific extra fields ─────────────────────────────────────────
  const currentManifest = TEMPLATE_MANIFESTS.find((m) => m.id === templateId);
  const extraFields = currentManifest?.extraBasicsFields ?? [];
  // Fields that are already rendered elsewhere in the panel (don't double-render)
  const alreadyInPanel = new Set(["heroBgImage", "instagram", "behance", "heroImage"]);
  // Fields that need a dedicated UI in the template section (not already shown)
  const dedicatedExtraFields = extraFields.filter((f) => !alreadyInPanel.has(f.key));
  // Unfilled fields across ALL extra fields (for the banner count)
  const unfilledExtraFields = extraFields.filter(
    (f) => !basics[f.key] || String(basics[f.key]).trim() === ""
  );

  return (
    <div className="space-y-8">

      {/* ── Template fields banner ──────────────────────────────────────── */}
      {extraFields.length > 0 && unfilledExtraFields.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-amber-800">
              {currentManifest?.name} needs {unfilledExtraFields.length} more field{unfilledExtraFields.length > 1 ? "s" : ""}
            </p>
            <p className="mt-0.5 text-xs text-amber-700 leading-relaxed">
              {unfilledExtraFields.map((f) => f.label).join(", ")} — fill them in below for the best result.
            </p>
          </div>
        </div>
      )}

      {/* ── Dedicated template-specific fields ──────────────────────────── */}
      {dedicatedExtraFields.length > 0 && (
        <section className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 space-y-3">
          <h3 className={sectionTitleClass + " flex items-center gap-1.5 !mb-0"}>
            <Sparkles className="h-3 w-3 text-amber-500" />
            {currentManifest?.name} fields
          </h3>
          {dedicatedExtraFields.map((field) => {
            const isEmpty = !basics[field.key] || String(basics[field.key]).trim() === "";
            return (
              <div key={field.key} className={fieldGroupClass}>
                <div className="flex items-center justify-between">
                  <Label className={labelClass}>{field.label}</Label>
                  {isEmpty && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200">
                      New
                    </span>
                  )}
                </div>
                <Input
                  className={
                    inputClass.replace(
                      "focus-visible:ring-[hsl(var(--ring))] focus-visible:border-[hsl(var(--ring))]",
                      "focus-visible:ring-amber-400 focus-visible:border-amber-400"
                    ) +
                    (isEmpty ? " border-amber-300 ring-1 ring-amber-200" : " border-amber-200")
                  }
                  type={field.type === "number" ? "text" : field.type ?? "text"}
                  value={(basics[field.key] as string) ?? ""}
                  onChange={(e) => set(field.key, e.target.value)}
                  placeholder={field.placeholder}
                />
                <p className="text-[11px] text-amber-700/60 leading-relaxed mt-1">{field.description}</p>
              </div>
            );
          })}
        </section>
      )}

      {templateId === "minimal-monochrome" && (
        <div className="space-y-2 border-b border-[hsl(var(--border))] pb-6">
          <h3 className={sectionTitleClass}>Appearance</h3>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as EditorTheme)}
            className="flex h-9 w-full rounded-xl border border-[hsl(var(--border))] bg-white px-3 py-1 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
          >
            <option value="dark">Dark (black)</option>
            <option value="light">Light</option>
          </select>
        </div>
      )}

      <section>
        <h3 className={sectionTitleClass}>Contact</h3>
        <div className="space-y-3">
          <div className={fieldGroupClass}>
            <Label className={labelClass}>Name</Label>
            <Input
              className={inputClass}
              value={(basics.name as string) ?? ""}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Full name"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className={fieldGroupClass}>
              <Label className={labelClass}>Email</Label>
              <Input
                className={inputClass}
                type="email"
                value={(basics.email as string) ?? ""}
                onChange={(e) => set("email", e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className={fieldGroupClass}>
              <Label className={labelClass}>Phone</Label>
              <Input
                className={inputClass}
                value={(basics.phone as string) ?? ""}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+1 234 567 8900"
              />
            </div>
          </div>
          <div className={fieldGroupClass}>
            <Label className={labelClass}>Location</Label>
            <Input
              className={inputClass}
              value={(basics.location as string) ?? ""}
              onChange={(e) => set("location", e.target.value)}
              placeholder="City, Country"
            />
          </div>
        </div>
      </section>

      <section>
        <h3 className={sectionTitleClass}>About</h3>
        <div className="space-y-3">
          <div className={fieldGroupClass}>
            <Label className={labelClass}>Headline</Label>
            <Input
              className={inputClass}
              value={(basics.headline as string) ?? ""}
              onChange={(e) => set("headline", e.target.value)}
              placeholder="e.g. Senior Frontend Developer"
            />
          </div>
          <div className={fieldGroupClass}>
            <Label className={labelClass}>Summary</Label>
            <Textarea
              className={inputClass + " resize-none"}
              value={(basics.summary as string) ?? ""}
              onChange={(e) => set("summary", e.target.value)}
              placeholder="Brief professional summary"
              rows={3}
            />
          </div>
        </div>
      </section>

      <section>
        <h3 className={sectionTitleClass}>Links</h3>
        <div className="space-y-3">
          <div className={fieldGroupClass}>
            <Label className={labelClass}>LinkedIn</Label>
            <Input
              className={inputClass}
              value={(basics.linkedin as string) ?? ""}
              onChange={(e) => set("linkedin", e.target.value)}
              placeholder="linkedin.com/in/..."
            />
          </div>
          <div className={fieldGroupClass}>
            <Label className={labelClass}>GitHub</Label>
            <Input
              className={inputClass}
              value={(basics.github as string) ?? ""}
              onChange={(e) => set("github", e.target.value)}
              placeholder="github.com/..."
            />
          </div>
          <div className={fieldGroupClass}>
            <Label className={labelClass}>Portfolio</Label>
            <Input
              className={inputClass}
              value={(basics.portfolio as string) ?? ""}
              onChange={(e) => set("portfolio", e.target.value)}
              placeholder="your-site.com"
            />
          </div>
          <div className={fieldGroupClass}>
            <Label className={labelClass}>Portrait / Hero image</Label>
            <ImageInput
              className={inputClass}
              value={(basics.heroImage as string) ?? ""}
              onChange={(val) => set("heroImage", val)}
              placeholder="Paste URL or browse…"
            />
          </div>
          <div className={fieldGroupClass}>
            <Label className={labelClass}>Background image</Label>
            <ImageInput
              className={inputClass}
              value={(basics.heroBgImage as string) ?? ""}
              onChange={(val) => set("heroBgImage", val)}
              placeholder="Paste URL or browse…"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className={fieldGroupClass}>
              <Label className={labelClass}>Instagram</Label>
              <Input
                className={inputClass}
                value={(basics.instagram as string) ?? ""}
                onChange={(e) => set("instagram", e.target.value)}
                placeholder="instagram.com/..."
              />
            </div>
            <div className={fieldGroupClass}>
              <Label className={labelClass}>Behance</Label>
              <Input
                className={inputClass}
                value={(basics.behance as string) ?? ""}
                onChange={(e) => set("behance", e.target.value)}
                placeholder="behance.net/..."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Resume content blocks (experience, projects, skills) */}
      {blocks.length > 0 && (
        <section>
          <h3 className={sectionTitleClass}>Resume content</h3>
          <div className="space-y-3">
          {blocks.map((block, blockIndex) => {
            const title =
              (block.content?.title as string) ||
              blockTypeLabel(block.type);
            const items = Array.isArray(block.content?.items)
              ? (block.content.items as Record<string, unknown>[])
              : block.content?.text
                ? [{ text: block.content.text as string }]
                : [];
            const blockId = block.id ?? `block-${blockIndex}`;
            const isOpen = openBlocks[blockId] ?? true;

            const addBlankItem = (e: React.MouseEvent) => {
              e.stopPropagation();
              if (!block.id) return;
              const blankItem: Record<string, unknown> =
                block.type === "education"
                  ? { name: "", degreeType: "", degreeName: "", fromYear: "", toYear: "", text: "" }
                  : { title: "", subtitle: "", text: "" };
              if (Array.isArray(block.content?.items)) {
                const currentItems = block.content.items as Record<string, unknown>[];
                updateBlock(block.id, {
                  content: { ...block.content, items: [blankItem, ...currentItems] },
                });
              } else {
                const existingText = block.content?.text ? [{ text: block.content.text as string }] : [];
                updateBlock(block.id, {
                  content: { ...block.content, items: [blankItem, ...existingText], text: undefined },
                });
              }
              setFocusNewItemBlockId(block.id);
            };

            return (
              <div
                key={blockId}
                className="rounded-xl border border-[hsl(var(--border))] bg-gray-50/50 p-3 space-y-3"
              >
                <div className="flex w-full items-center gap-2">
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left"
                    onClick={() =>
                      setOpenBlocks((prev) => ({ ...prev, [blockId]: !isOpen }))
                    }
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-sm font-medium text-foreground">
                        {title}
                      </span>
                      {items.length > 0 && (
                        <span className="text-[11px] text-gray-400 shrink-0">
                          {items.length} item{items.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={addBlankItem}
                        className="p-1 text-green-600 transition-colors hover:text-green-700"
                        title="Add item"
                        aria-label="Add item to section"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                      <ChevronDown
                        className={
                          "h-4 w-4 text-gray-500 transition-transform " +
                          (isOpen ? "rotate-180" : "")
                        }
                      />
                    </div>
                  </button>
                </div>

                {isOpen && (
                  <div className="space-y-3 pt-3 border-t border-[hsl(var(--border))] mt-3">
                    {items.length > 0 ? (
                      <ul className="space-y-3">
                    {items.map((item, idx) => {
                      const itemObj =
                        typeof item === "object" && item !== null
                          ? (item as Record<string, unknown>)
                          : { text: String(item) };
                      const isEducation = block.type === "education";
                      const educationFields = isEducation ? getEducationItemFields(itemObj) : null;
                      const itemTitle =
                        (itemObj.title as string) ??
                        (itemObj.role as string) ??
                        (itemObj.name as string) ??
                        "";
                      const itemSubtitle =
                        (itemObj.subtitle as string) ??
                        (itemObj.company as string) ??
                        (itemObj.degree as string) ??
                        (itemObj.dates as string) ??
                        "";
                      const itemText =
                        (itemObj.text as string) ??
                        (itemObj.description as string) ??
                        "";
                      const removeItem = () => {
                        if (!block.id) return;
                        const next = items.filter((_, i) => i !== idx);
                        updateBlock(block.id, {
                          content: { ...block.content, items: next.length > 0 ? next : [] },
                        });
                      };

                      const isDragging = dragState != null && dragState.blockId === block.id && dragState.fromIdx === idx;
                      const isDropBefore = dropState != null && dropState.blockId === block.id && dropState.toIdx === idx && dropState.position === "before";
                      const isDropAfter = dropState != null && dropState.blockId === block.id && dropState.toIdx === idx && dropState.position === "after";

                      const handleDragStart = (e: React.DragEvent) => {
                        const target = e.target as HTMLElement;
                        if (target.closest("input, textarea, select")) { e.preventDefault(); return; }
                        e.dataTransfer.setData("application/json", JSON.stringify({ blockId: block.id, itemIndex: idx }));
                        e.dataTransfer.effectAllowed = "move";
                        setDragState({ blockId: block.id!, fromIdx: idx });
                      };
                      const handleDragOver = (e: React.DragEvent) => {
                        e.preventDefault();
                        if (!dragState || dragState.blockId !== block.id) return;
                        e.dataTransfer.dropEffect = "move";
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        const midY = rect.top + rect.height / 2;
                        const position = e.clientY < midY ? "before" : "after";
                        setDropState({ blockId: block.id!, toIdx: idx, position });
                      };
                      const handleDragLeave = (e: React.DragEvent) => {
                        if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
                          setDropState(null);
                        }
                      };
                      const handleDrop = (e: React.DragEvent) => {
                        e.preventDefault();
                        if (!block.id) return;
                        const raw = e.dataTransfer.getData("application/json");
                        if (!raw) return;
                        const { blockId, itemIndex: fromIndex } = JSON.parse(raw) as { blockId: string; itemIndex: number };
                        if (blockId !== block.id) return;
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        const midY = rect.top + rect.height / 2;
                        const insertAfter = e.clientY >= midY;
                        let toIndex = insertAfter ? idx + 1 : idx;
                        if (fromIndex < toIndex) toIndex -= 1;
                        if (fromIndex !== toIndex) {
                          const newItems = [...items];
                          const [removed] = newItems.splice(fromIndex, 1);
                          newItems.splice(toIndex, 0, removed);
                          updateBlock(block.id, { content: { ...block.content, items: newItems } });
                        }
                        setDragState(null);
                        setDropState(null);
                      };
                      const handleDragEnd = () => {
                        setDragState(null);
                        setDropState(null);
                      };

                      return (
                        <li key={idx} className="relative">
                          {isDropBefore && (
                            <div className="absolute -top-[2px] left-0 right-0 h-[3px] rounded-full bg-[hsl(var(--ring))] z-10 pointer-events-none" />
                          )}
                        <div
                          draggable
                          onDragStart={handleDragStart}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          onDragEnd={handleDragEnd}
                          style={{ transition: "opacity 150ms, transform 150ms, box-shadow 150ms" }}
                          className={[
                            "flex gap-2 rounded-xl border border-[hsl(var(--border))] bg-white p-3",
                            isDragging ? "opacity-40 scale-[0.98] shadow-lg cursor-grabbing" : "cursor-grab",
                            !isDragging && dragState?.blockId === block.id ? "cursor-copy" : "",
                          ].join(" ")}
                        >
                          <div className="shrink-0 self-center text-gray-400" title="Drag to reorder">
                            <GripVertical className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1 space-y-2">
                          {isEducation && educationFields ? (
                            <>
                              <div className={fieldGroupClass}>
                                <Label className={labelClass}>Institution</Label>
                                <Input
                                  ref={focusNewItemBlockId === block.id && idx === 0 ? newItemInputRef : undefined}
                                  className={inputClass}
                                  value={educationFields.name}
                                  onChange={(e) => {
                                    if (!block.id) return;
                                    const next = [...items];
                                    const updated = { ...itemObj, name: e.target.value };
                                    next[idx] = educationItemToTemplate(updated);
                                    updateBlock(block.id, { content: { ...block.content, items: next } });
                                  }}
                                  placeholder="e.g. University name"
                                />
                              </div>
                              <div className={fieldGroupClass}>
                                <Label className={labelClass}>Degree type</Label>
                                <select
                                  className={inputClass + " w-full h-10 px-3 py-2 appearance-none"}
                                  value={educationFields.degreeType || ""}
                                  onChange={(e) => {
                                    if (!block.id) return;
                                    const next = [...items];
                                    const val = e.target.value;
                                    const updated: Record<string, unknown> = { ...itemObj, degreeType: val };
                                    const fromY = (itemObj.fromYear as string) || "";
                                    const toY = (itemObj.toYear as string) || "";
                                    if (fromY && !toY && val) {
                                      const years = DEGREE_DURATION_YEARS[val] ?? 4;
                                      const end = parseInt(fromY, 10) + years;
                                      if (!isNaN(end)) updated.toYear = String(end);
                                    }
                                    next[idx] = educationItemToTemplate(updated);
                                    updateBlock(block.id, { content: { ...block.content, items: next } });
                                  }}
                                >
                                  <option value="">Select</option>
                                  {DEGREE_TYPES.map((t) => (
                                    <option key={t} value={t}>{t}</option>
                                  ))}
                                </select>
                              </div>
                              <div className={fieldGroupClass}>
                                <Label className={labelClass}>Degree name</Label>
                                <Input
                                  className={inputClass}
                                  value={educationFields.degreeName}
                                  onChange={(e) => {
                                    if (!block.id) return;
                                    const next = [...items];
                                    next[idx] = educationItemToTemplate({ ...itemObj, degreeName: e.target.value });
                                    updateBlock(block.id, { content: { ...block.content, items: next } });
                                  }}
                                  placeholder="e.g. Computer Science and Engineering"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div className={fieldGroupClass}>
                                  <Label className={labelClass}>From year</Label>
                                  <Input
                                    className={inputClass}
                                    value={educationFields.fromYear}
                                    onChange={(e) => {
                                      if (!block.id) return;
                                      const next = [...items];
                                      const val = e.target.value;
                                      const updated: Record<string, unknown> = { ...itemObj, fromYear: val };
                                      const toY = (itemObj.toYear as string) || "";
                                      const degType = (itemObj.degreeType as string) || "";
                                      if (val && !toY && degType) {
                                        const years = DEGREE_DURATION_YEARS[degType] ?? 4;
                                        const end = parseInt(val, 10) + years;
                                        if (!isNaN(end)) updated.toYear = String(end);
                                      }
                                      next[idx] = educationItemToTemplate(updated);
                                      updateBlock(block.id, { content: { ...block.content, items: next } });
                                    }}
                                    placeholder="e.g. 2020"
                                  />
                                </div>
                                <div className={fieldGroupClass}>
                                  <Label className={labelClass}>To year</Label>
                                  <Input
                                    className={inputClass}
                                    value={educationFields.toYear}
                                    onChange={(e) => {
                                      if (!block.id) return;
                                      const next = [...items];
                                      next[idx] = educationItemToTemplate({ ...itemObj, toYear: e.target.value });
                                      updateBlock(block.id, { content: { ...block.content, items: next } });
                                    }}
                                    placeholder="e.g. 2024"
                                  />
                                </div>
                              </div>
                              <div className={fieldGroupClass}>
                                <Label className={labelClass}>Description</Label>
                                <Textarea
                                  className={inputClass + " resize-none"}
                                  rows={2}
                                  value={educationFields.text}
                                  onChange={(e) => {
                                    if (!block.id) return;
                                    const next = [...items];
                                    next[idx] = educationItemToTemplate({ ...itemObj, text: e.target.value });
                                    updateBlock(block.id, { content: { ...block.content, items: next } });
                                  }}
                                  placeholder="Bullets or paragraph"
                                />
                              </div>
                            </>
                          ) : (
                            <>
                          <div className={fieldGroupClass}>
                            <Label className={labelClass}>Role / Title</Label>
                            <Input
                              ref={!isEducation && focusNewItemBlockId === block.id && idx === 0 ? newItemInputRef : undefined}
                              className={inputClass}
                              value={itemTitle}
                              onChange={(e) => {
                                if (!block.id) return;
                                const next = [...items];
                                next[idx] = { ...itemObj, title: e.target.value };
                                updateBlock(block.id, { content: { ...block.content, items: next } });
                              }}
                              placeholder="e.g. Job title, degree, project name"
                            />
                          </div>
                          {block.type !== "skills" && (
                            <div className={fieldGroupClass}>
                              <Label className={labelClass}>Company / Date</Label>
                              <Input
                                className={inputClass}
                                value={itemSubtitle}
                                onChange={(e) => {
                                  if (!block.id) return;
                                  const next = [...items];
                                  next[idx] = { ...itemObj, subtitle: e.target.value };
                                  updateBlock(block.id, { content: { ...block.content, items: next } });
                                }}
                                placeholder="e.g. Company, date range"
                              />
                            </div>
                          )}
                          <div className={fieldGroupClass}>
                            <Label className={labelClass}>Description</Label>
                            <Textarea
                              className={inputClass + " resize-none"}
                              rows={2}
                              value={itemText}
                              onChange={(e) => {
                                if (!block.id) return;
                                const next = [...items];
                                next[idx] = { ...itemObj, text: e.target.value };
                                updateBlock(block.id, { content: { ...block.content, items: next } });
                              }}
                              placeholder="Bullets or paragraph"
                            />
                          </div>
                          {(block.type === "experience" || block.type === "projects" || block.type === "work") && (
                            <div className="space-y-2">
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                                Artwork / Photos
                              </p>
                              <div className={fieldGroupClass}>
                                <Label className={labelClass}>Image 1</Label>
                                <ImageInput
                                  className={inputClass}
                                  value={(itemObj.image as string) ?? ""}
                                  onChange={(val) => {
                                    if (!block.id) return;
                                    const next = [...items];
                                    next[idx] = { ...itemObj, image: val || undefined };
                                    updateBlock(block.id, { content: { ...block.content, items: next } });
                                  }}
                                />
                              </div>
                              <div className={fieldGroupClass}>
                                <Label className={labelClass}>Image 2</Label>
                                <ImageInput
                                  className={inputClass}
                                  value={(itemObj.image2 as string) ?? ""}
                                  onChange={(val) => {
                                    if (!block.id) return;
                                    const next = [...items];
                                    next[idx] = { ...itemObj, image2: val || undefined };
                                    updateBlock(block.id, { content: { ...block.content, items: next } });
                                  }}
                                />
                              </div>
                            </div>
                          )}
                            </>
                          )}
                          </div>
                          <button
                            type="button"
                            onClick={removeItem}
                            className="shrink-0 self-start p-1 text-red-500 transition-colors hover:text-red-600"
                            title="Remove this item"
                            aria-label="Remove item"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                          {isDropAfter && (
                            <div className="absolute -bottom-[2px] left-0 right-0 h-[3px] rounded-full bg-[hsl(var(--ring))] z-10 pointer-events-none" />
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
                  </div>
                )}
              </div>
            );
          })}
          </div>
        </section>
      )}

      {/* Custom sections (extra basics fields) */}
      {customKeys.length > 0 && (
        <section>
          <h3 className={sectionTitleClass}>Custom</h3>
          <div className="space-y-3">
      {customKeys.map((key) => (
        <div key={key} className="flex items-end gap-2">
          <div className="flex-1 space-y-1">
            <Label className={labelClass + " capitalize"}>{key.replace(/_/g, " ")}</Label>
            <Input
              className={inputClass}
              value={String(basics[key] ?? "")}
              onChange={(e) => set(key, e.target.value)}
              placeholder={`Enter ${key.replace(/_/g, " ")}`}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => removeBasicKey(key)}
            title="Remove section"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
          </div>
        </section>
      )}

      {/* Add section button */}
      <div className="border-t border-[hsl(var(--border))] pt-6">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-2 text-xs text-gray-500 hover:text-gray-700"
          onClick={() => setAddSectionOpen(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          Add custom field
        </Button>
      </div>

      <Dialog open={addSectionOpen} onOpenChange={setAddSectionOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add section</DialogTitle>
            <DialogDescription>
              Add a custom field to your basic info (e.g. Twitter, Website, Certifications).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-[6px]">
              <Label className={labelClass}>Section name</Label>
              <Input
                className={inputClass}
                placeholder="e.g. Twitter"
                value={newSectionLabel}
                onChange={(e) => setNewSectionLabel(e.target.value)}
              />
            </div>
            <div className="space-y-[6px]">
              <Label className={labelClass}>Value</Label>
              <Input
                className={inputClass}
                placeholder="Value for this field"
                value={newSectionValue}
                onChange={(e) => setNewSectionValue(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddSectionOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSection} disabled={!newSectionLabel.trim()}>
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
