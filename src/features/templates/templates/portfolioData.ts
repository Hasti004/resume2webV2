import type { ResumeBasics, ResumeBlock } from "@/lib/resumeRepo";

export function getBlockByType(blocks: ResumeBlock[], type: string): ResumeBlock | undefined {
  return blocks.find((b) => b.type.toLowerCase() === type.toLowerCase());
}

export function getBlockItems(block: ResumeBlock | undefined): unknown[] {
  if (!block?.content) return [];
  const items = block.content.items;
  return Array.isArray(items) ? items : [];
}

export function getBlockText(block: ResumeBlock | undefined): string | null {
  if (!block?.content) return null;
  const t = block.content.text ?? block.content.content;
  return typeof t === "string" ? t : null;
}

export function getBlockTitle(block: ResumeBlock | undefined): string {
  if (block?.content?.title && typeof block.content.title === "string")
    return block.content.title as string;
  if (!block?.type) return "Section";
  return block.type.charAt(0).toUpperCase() + block.type.slice(1).replace(/_/g, " ");
}

export function getBasicsDisplay(basics: ResumeBasics) {
  const name = [basics.name].filter(Boolean).join(" ") || "Your Name";
  const headline = (basics.headline ?? basics.summary) as string | undefined;
  const contact: string[] = [];
  if (basics.email) contact.push(basics.email as string);
  if (basics.phone) contact.push(basics.phone as string);
  if (basics.location) contact.push(basics.location as string);
  const links = [
    basics.linkedin && { label: "LinkedIn", url: basics.linkedin },
    basics.github && { label: "GitHub", url: basics.github },
    basics.portfolio && { label: "Portfolio", url: basics.portfolio },
  ].filter(Boolean) as { label: string; url: string }[];
  const summary = (basics.summary as string) || null;
  return { name, headline, contact, links, summary };
}

export function isExperienceItem(item: unknown): item is { role?: string; company?: string; dates?: string; description?: string } {
  return typeof item === "object" && item !== null && "role" in item;
}

export function isEducationItem(item: unknown): item is { name?: string; degree?: string; dates?: string } {
  return typeof item === "object" && item !== null && "name" in item && !("role" in item);
}

export function isProjectItem(item: unknown): item is { name?: string; description?: string; url?: string } {
  return typeof item === "object" && item !== null;
}
