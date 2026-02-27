import { useState } from "react";
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
import { Plus, Trash2, ChevronDown } from "lucide-react";

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
    "bg-white border border-[hsl(var(--border))] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:border-[hsl(var(--ring))] placeholder:text-gray-400";
  const labelClass = "text-sm font-medium text-gray-700";
  const sectionHeadingClass = "font-semibold text-foreground text-sm mt-[10px] mb-[8px] first:mt-0";
  const fieldGroupClass = "space-y-[6px]";
  const [openBlocks, setOpenBlocks] = useState<Record<string, boolean>>({});

  return (
    <div className="space-y-[16px]">
      {templateId === "minimal-monochrome" && (
        <div className="space-y-2 border-b border-[hsl(var(--border))] pb-4">
          <h3 className={sectionHeadingClass}>Appearance</h3>
          <Label className={labelClass}>Color theme</Label>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as EditorTheme)}
            className="flex h-9 w-full rounded-md border border-[hsl(var(--border))] bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
          >
            <option value="dark">Dark (black)</option>
            <option value="light">Light</option>
          </select>
        </div>
      )}
      <h3 className={sectionHeadingClass}>Contact & summary</h3>
      <div className={fieldGroupClass}>
        <Label className={labelClass}>Name</Label>
        <Input
          className={inputClass}
          value={(basics.name as string) ?? ""}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Full name"
        />
      </div>
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
      <div className={fieldGroupClass}>
        <Label className={labelClass}>Location</Label>
        <Input
          className={inputClass}
          value={(basics.location as string) ?? ""}
          onChange={(e) => set("location", e.target.value)}
          placeholder="City, Country"
        />
      </div>
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
          className={inputClass}
          value={(basics.summary as string) ?? ""}
          onChange={(e) => set("summary", e.target.value)}
          placeholder="Brief professional summary"
          rows={3}
          className={"resize-none " + inputClass}
        />
      </div>
      <div className={fieldGroupClass}>
        <Label className={labelClass}>LinkedIn</Label>
        <Input
          className={inputClass}
          value={(basics.linkedin as string) ?? ""}
          onChange={(e) => set("linkedin", e.target.value)}
          placeholder="https://linkedin.com/in/..."
        />
      </div>
      <div className={fieldGroupClass}>
        <Label className={labelClass}>GitHub</Label>
        <Input
          className={inputClass}
          value={(basics.github as string) ?? ""}
          onChange={(e) => set("github", e.target.value)}
          placeholder="https://github.com/..."
        />
      </div>
      <div className={fieldGroupClass}>
        <Label className={labelClass}>Portfolio</Label>
        <Input
          className={inputClass}
          value={(basics.portfolio as string) ?? ""}
          onChange={(e) => set("portfolio", e.target.value)}
          placeholder="https://..."
        />
      </div>
      <div className={fieldGroupClass}>
        <Label className={labelClass}>Hero image (optional)</Label>
        <Input
          className={inputClass}
          value={(basics.heroImage as string) ?? ""}
          onChange={(e) => set("heroImage", e.target.value)}
          placeholder="URL to image or GIF for hero"
        />
        <p className="text-xs text-gray-500">Shown in the hero section. Use a square image or GIF for best results.</p>
      </div>

      {/* Full resume content (experience, projects, skills — from Gemini) */}
      {blocks.length > 0 && (
        <>
          <h3 className={sectionHeadingClass}>Resume content (experience, projects, skills)</h3>
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

            return (
              <div
                key={blockId}
                className="rounded-lg border border-[hsl(var(--border))] bg-gray-50/50 p-3 space-y-3"
              >
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-2 text-left"
                  onClick={() =>
                    setOpenBlocks((prev) => ({ ...prev, [blockId]: !isOpen }))
                  }
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">
                      {title}
                    </span>
                    {items.length > 0 && (
                      <span className="text-xs text-gray-500">
                        {items.length} item{items.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <ChevronDown
                    className={
                      "h-4 w-4 text-gray-500 transition-transform " +
                      (isOpen ? "rotate-180" : "")
                    }
                  />
                </button>

                {isOpen && (
                  <div className="space-y-3 pt-3">
                    <div className={fieldGroupClass}>
                      <Label className={labelClass}>Section title</Label>
                      <Input
                        className={inputClass}
                        value={title}
                        onChange={(e) =>
                          block.id &&
                          updateBlock(block.id, {
                            content: { ...block.content, title: e.target.value },
                          })
                        }
                        placeholder={blockTypeLabel(block.type)}
                      />
                    </div>
                    {items.length > 0 ? (
                      <ul className="space-y-3">
                    {items.map((item, idx) => {
                      const itemObj =
                        typeof item === "object" && item !== null
                          ? (item as Record<string, unknown>)
                          : { text: String(item) };
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
                      return (
                        <li key={idx} className="rounded border border-[hsl(var(--border))] bg-white p-3 space-y-2">
                          <div className={fieldGroupClass}>
                            <Label className={labelClass}>Title</Label>
                            <Input
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
                              <Label className={labelClass}>Subtitle / date</Label>
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
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className={fieldGroupClass}>
                    <Label className={labelClass}>Content</Label>
                    <Textarea
                      className={inputClass + " resize-none"}
                      rows={2}
                      value={(block.content?.text as string) ?? ""}
                      onChange={(e) =>
                        block.id &&
                        updateBlock(block.id, {
                          content: { ...block.content, text: e.target.value },
                        })
                      }
                      placeholder="Add content for this section"
                    />
                  </div>
                )}
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}

      {/* Custom sections (extra basics fields) */}
      {customKeys.map((key) => (
        <div key={key} className="flex items-end gap-2">
          <div className="flex-1 space-y-[6px]">
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

      {/* Add section button */}
      <div className="border-t border-[hsl(var(--border))] pt-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setAddSectionOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Add section
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
